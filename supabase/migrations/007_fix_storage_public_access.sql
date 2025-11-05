-- Fix storage policies to allow public read access
-- The bucket is public but policies were blocking anonymous access

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view gallery photos" ON storage.objects;

-- Create a new policy that allows public read access
CREATE POLICY "Public read access to gallery photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

-- Keep the authenticated policies for INSERT and DELETE
-- (These are already correct and don't need changes)
