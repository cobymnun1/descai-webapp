import { readFile } from 'fs/promises';
import { join } from 'path';
import OpenAI from 'openai';
import { downloadFile, deleteFile } from '../lib/storage';
import { pushReviewToDatabase } from '../lib/database';

/**
 * Validate score value - must be numeric and between 0 and 1
 */
function validateScore(score, fieldName) {
  if (score === null || score === undefined) {
    return { isValid: true, value: null, error: null };
  }
  
  const numScore = Number(score);
  
  if (isNaN(numScore)) {
    return { 
      isValid: false, 
      value: null, 
      error: `${fieldName} is not a valid number: ${score}` 
    };
  }
  
  if (numScore < 0 || numScore > 1) {
    return { 
      isValid: false, 
      value: numScore, 
      error: `${fieldName} out of range [0,1]: ${numScore}` 
    };
  }
  
  return { isValid: true, value: numScore, error: null };
}

/**
 * Validate individual review section structure
 */
function validateReviewSection(section, sectionName, requiredFields = []) {
  const errors = [];
  
  if (!section || typeof section !== 'object') {
    errors.push(`${sectionName} is missing or not an object`);
    return { isValid: false, errors };
  }
  
  // Check for required fields
  for (const field of requiredFields) {
    if (!(field in section)) {
      errors.push(`${sectionName}.${field} is missing`);
    }
  }
  
  // Validate it's a valid JSON structure
  try {
    JSON.stringify(section);
  } catch (e) {
    errors.push(`${sectionName} cannot be serialized to JSON: ${e.message}`);
  }
  
  return { 
    isValid: errors.length === 0, 
    errors 
  };
}

/**
 * Comprehensive validation of AI-generated review data
 */
function validateReviewData(parsedResult) {
  const errors = [];
  const warnings = [];
  const scoreValidations = {};
  
  // 1. Validate title
  if (!parsedResult.title || typeof parsedResult.title !== 'string') {
    errors.push('title is missing or not a string');
  } else if (parsedResult.title.trim().length === 0) {
    errors.push('title is empty');
  }
  
  // 2. Validate originality_review section
  const originalityValidation = validateReviewSection(
    parsedResult.originality_review,
    'originality_review',
    ['originality_score', 'rationale', 'review_statement']
  );
  errors.push(...originalityValidation.errors);
  
  // 3. Validate clarity_review section
  const clarityValidation = validateReviewSection(
    parsedResult.clarity_review,
    'clarity_review',
    ['clarity_score', 'field_familiarity_score', 'rationale', 'review_statement']
  );
  errors.push(...clarityValidation.errors);
  
  // 4. Validate rigor_reproducibility_review section
  const rigorValidation = validateReviewSection(
    parsedResult.rigor_reproducibility_review,
    'rigor_reproducibility_review',
    ['rigor_score', 'reproducibility_score', 'rationale', 'review_statement']
  );
  errors.push(...rigorValidation.errors);
  
  // 5. Validate data_transparency_review section
  const transparencyValidation = validateReviewSection(
    parsedResult.data_transparency_review,
    'data_transparency_review',
    ['data_transparency_score', 'rationale', 'review_statement']
  );
  errors.push(...transparencyValidation.errors);
  
  // 6. Validate interpretation_ethics_review section
  const interpretationValidation = validateReviewSection(
    parsedResult.interpretation_ethics_review,
    'interpretation_ethics_review',
    ['interpretation_congruence_score', 'rationale', 'review_statement']
  );
  errors.push(...interpretationValidation.errors);
  
  // 7. Validate all scores
  const scoresToValidate = [
    { value: parsedResult.originality_review?.originality_score, name: 'originality_score' },
    { value: parsedResult.clarity_review?.clarity_score, name: 'clarity_score' },
    { value: parsedResult.rigor_reproducibility_review?.rigor_score, name: 'rigor_score' },
    { value: parsedResult.rigor_reproducibility_review?.reproducibility_score, name: 'reproducibility_score' },
    { value: parsedResult.data_transparency_review?.data_transparency_score, name: 'data_transparency_score' },
    { value: parsedResult.interpretation_ethics_review?.interpretation_congruence_score, name: 'interpretation_congruence_score' },
    { value: parsedResult.clarity_review?.field_familiarity_score, name: 'field_familiarity_score' },
  ];
  
  for (const score of scoresToValidate) {
    const validation = validateScore(score.value, score.name);
    scoreValidations[score.name] = validation;
    
    if (!validation.isValid) {
      if (score.value === null || score.value === undefined) {
        warnings.push(validation.error || `${score.name} is null or undefined`);
      } else {
        errors.push(validation.error);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    scoreValidations
  };
}


export async function POST(request) {
  try {
    // Parse JSON body
    const body = await request.json();
    const { textFilename } = body;

    // Validate filename
    if (!textFilename) {
      return Response.json(
        { error: 'No text filename provided' },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Download the text file from Supabase Storage
    let textBuffer;
    try {
      textBuffer = await downloadFile('uploads', textFilename);
    } catch (error) {
      return Response.json(
        { error: 'Text file not found in storage' },
        { status: 404 }
      );
    }

    // Convert buffer to text content
    const textContent = textBuffer.toString('utf-8');

    // Read the system prompt
    const promptPath = join(process.cwd(), 'app', 'api', 'analyze', 'prompt.md');
    const systemPrompt = await readFile(promptPath, 'utf-8');

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Best balance: cheap, fast, excellent JSON consistency
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: textContent
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent JSON output
      response_format: { type: 'json_object' } // Ensure JSON response
    });

    // Extract the response
    const analysisResult = completion.choices[0].message.content;

    // Parse JSON to validate it
    let parsedResult;
    try {
      parsedResult = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      return Response.json(
        { 
          error: 'Failed to parse OpenAI response as JSON', 
          parseError: parseError.message,
          raw: analysisResult 
        },
        { status: 500 }
      );
    }

    // Validate the AI-generated review structure
    const validation = validateReviewData(parsedResult);
    
    // Log validation results
    if (validation.warnings.length > 0) {
      console.warn('Review validation warnings:', validation.warnings);
    }
    
    if (!validation.isValid) {
      console.error('Review validation failed:', validation.errors);
      return Response.json(
        { 
          error: 'AI-generated review failed validation',
          validationErrors: validation.errors,
          validationWarnings: validation.warnings,
          analysis: parsedResult
        },
        { status: 422 } // 422 Unprocessable Entity
      );
    }

    // Generate review filename for database reference
    const baseFilename = textFilename.replace('.txt', '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reviewFilename = `${baseFilename}_review_${timestamp}.json`;

    // Push review to database via push-review API
    const dbResult = await pushReviewToDatabase(reviewFilename, parsedResult);
    
    // Log database operation result
    if (dbResult.success) {
      console.log(`Review successfully pushed to database with ID: ${dbResult.recordId}`);
      
      // Clean up: Delete the text file from Storage after successful analysis
      try {
        await deleteFile('uploads', textFilename);
        console.log(`Cleaned up text file from storage: ${textFilename}`);
      } catch (cleanupError) {
        console.warn(`Failed to clean up text file: ${cleanupError.message}`);
        // Don't fail the request if cleanup fails
      }
    } else {
      console.warn(`Failed to push review to database: ${dbResult.error}`);
      // Note: We don't delete the file if DB push failed, in case retry is needed
    }

    // Return comprehensive response
    return Response.json({
      success: true,
      reviewFilename: reviewFilename,
      analysis: parsedResult,
      tokensUsed: completion.usage.total_tokens,
      validation: {
        passed: validation.isValid,
        warnings: validation.warnings,
        errors: validation.errors
      },
      database: {
        saved: dbResult.success,
        recordId: dbResult.recordId,
        error: dbResult.error,
        details: dbResult.details
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

