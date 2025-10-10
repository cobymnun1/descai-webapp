-- ============================================
-- FIX RLS POLICY FOR REVIEWS TABLE
-- ============================================

-- Step 1: Drop the existing policy if it exists
DROP POLICY IF EXISTS "push-reviews" ON public.reviews;

-- Step 2: Create the correct policy for INSERT operations
-- This allows both anon and authenticated roles to insert reviews
CREATE POLICY "Allow insert reviews"
ON public.reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Step 3: (Optional) Add SELECT policy if you need to read reviews
CREATE POLICY "Allow select reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (true);

-- Step 4: (Optional) Add UPDATE policy if you need to modify reviews
CREATE POLICY "Allow update reviews"
ON public.reviews
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Step 5: (Optional) Add DELETE policy if you need to delete reviews
CREATE POLICY "Allow delete reviews"
ON public.reviews
FOR DELETE
TO anon, authenticated
USING (true);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================
-- Run this to check if RLS is enabled on the reviews table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reviews';

-- ============================================
-- VIEW ALL POLICIES
-- ============================================
-- Run this to see all policies on the reviews table
SELECT * 
FROM pg_policies 
WHERE tablename = 'reviews';


