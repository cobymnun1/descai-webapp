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
 * GET endpoint - Fetch a single review by ID with all details
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return Response.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    // Fetch complete review data from database
    const { data: review, error: dbError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      console.error('Supabase fetch error:', {
        message: dbError.message,
        code: dbError.code,
        hint: dbError.hint,
        details: dbError.details
      });

      return Response.json(
        { 
          error: 'Failed to fetch review from database',
          message: dbError.message,
          code: dbError.code,
          hint: dbError.hint
        },
        { status: dbError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    if (!review) {
      return Response.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields that are stored as strings
    const parseJsonField = (field) => {
      if (!field) return null;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.error(`Failed to parse field:`, e);
          return field;
        }
      }
      return field;
    };

    // Parse all JSONB fields
    const parsedReview = {
      ...review,
      originality_review: parseJsonField(review.originality_review),
      clarity_review: parseJsonField(review.clarity_review),
      rigor_reproducibility_review: parseJsonField(review.rigor_reproducibility_review),
      data_transparency_review: parseJsonField(review.data_transparency_review),
      interpretation_ethics_review: parseJsonField(review.interpretation_ethics_review)
    };

    return Response.json({
      success: true,
      review: parsedReview
    });

  } catch (error) {
    console.error('Fetch review error:', error);
    return Response.json(
      { 
        error: error.message || 'Failed to fetch review',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

