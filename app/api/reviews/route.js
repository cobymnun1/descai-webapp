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
 * GET endpoint - Fetch all reviews from Supabase database
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Fetch reviews from database, ordered by created_at descending (newest first)
    const { data: reviews, error: dbError } = await supabase
      .from('reviews')
      .select('id, created_at, title, paper_id')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Supabase fetch error:', {
        message: dbError.message,
        code: dbError.code,
        hint: dbError.hint,
        details: dbError.details
      });

      return Response.json(
        { 
          error: 'Failed to fetch reviews from database',
          message: dbError.message,
          code: dbError.code,
          hint: dbError.hint
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      reviews: reviews || [],
      count: reviews?.length || 0
    });

  } catch (error) {
    console.error('Fetch reviews error:', error);
    return Response.json(
      { 
        error: error.message || 'Failed to fetch reviews',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

