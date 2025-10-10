import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client with proper error handling
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Extract paper ID from review filename
 */
function extractPaperIdFromReviewFilename(reviewFilename) {
  // Remove _review_timestamp.json to get paper_id
  return reviewFilename.replace(/_review_.*\.json$/, '');
}

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
 * Prepare database payload from review data
 */
function prepareReviewPayload(parsedReview, paperId) {
  const scoreValidations = {
    originality_score: validateScore(parsedReview.originality_review?.originality_score, 'originality_score'),
    clarity_score: validateScore(parsedReview.clarity_review?.clarity_score, 'clarity_score'),
    rigor_score: validateScore(parsedReview.rigor_reproducibility_review?.rigor_score, 'rigor_score'),
    reproducibility_score: validateScore(parsedReview.rigor_reproducibility_review?.reproducibility_score, 'reproducibility_score'),
    data_transparency_score: validateScore(parsedReview.data_transparency_review?.data_transparency_score, 'data_transparency_score'),
    interpretation_congruence_score: validateScore(parsedReview.interpretation_ethics_review?.interpretation_congruence_score, 'interpretation_congruence_score'),
    field_familiarity_score: validateScore(parsedReview.clarity_review?.field_familiarity_score, 'field_familiarity_score'),
  };

  const payload = {
    paper_id: paperId,
    title: parsedReview.title || null,
    
    // Store complete review objects as JSONB
    originality_review: parsedReview.originality_review || null,
    clarity_review: parsedReview.clarity_review || null,
    rigor_reproducibility_review: parsedReview.rigor_reproducibility_review || null,
    data_transparency_review: parsedReview.data_transparency_review || null,
    interpretation_ethics_review: parsedReview.interpretation_ethics_review || null,
    
    // Extract individual scores
    originality_score: scoreValidations.originality_score?.value ?? null,
    clarity_score: scoreValidations.clarity_score?.value ?? null,
    rigor_score: scoreValidations.rigor_score?.value ?? null,
    reproducibility_score: scoreValidations.reproducibility_score?.value ?? null,
    data_transparency_score: scoreValidations.data_transparency_score?.value ?? null,
    interpretation_congruence_score: scoreValidations.interpretation_congruence_score?.value ?? null,
    field_familiarity_score: scoreValidations.field_familiarity_score?.value ?? null,
  };
  
  return payload;
}


/**
 * POST endpoint - Push review data directly to Supabase
 * Accepts review data and filename in request body
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { reviewFilename, reviewData } = body;

    if (!reviewFilename) {
      return Response.json(
        { error: 'No review filename provided' },
        { status: 400 }
      );
    }

    if (!reviewData) {
      return Response.json(
        { error: 'No review data provided' },
        { status: 400 }
      );
    }

    // Validate review data is an object
    if (typeof reviewData !== 'object' || reviewData === null) {
      return Response.json(
        { error: 'Invalid review data format' },
        { status: 400 }
      );
    }

    // Extract paper ID from filename
    const paperId = extractPaperIdFromReviewFilename(reviewFilename);

    // Prepare payload
    const reviewPayload = prepareReviewPayload(reviewData, paperId);

    // Insert into Supabase
    const supabase = getSupabaseClient();
    
    const { data: insertedReview, error: dbError } = await supabase
      .from('reviews')
      .insert(reviewPayload)
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insertion error:', {
        message: dbError.message,
        code: dbError.code,
        hint: dbError.hint,
        details: dbError.details
      });

      return Response.json(
        { 
          error: 'Failed to insert review into database',
          message: dbError.message,
          code: dbError.code,
          hint: dbError.hint,
          details: dbError.details
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Review successfully pushed to database',
      recordId: insertedReview?.id,
      paperId: paperId,
      title: reviewData.title
    });

  } catch (error) {
    console.error('Push review error:', error);
    return Response.json(
      { 
        error: error.message || 'Failed to push review',
        details: error.stack
      },
      { status: 500 }
    );
  }
}


