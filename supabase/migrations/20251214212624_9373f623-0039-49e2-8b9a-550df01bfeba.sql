-- Create RLS policies for logos storage bucket

-- Allow authenticated users to upload logos for their company
CREATE POLICY "Users can upload logos for their company"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (
    -- Super admins can upload any logo
    is_super_admin(auth.uid()) = true OR
    -- Users can upload logos for their company (folder name = company_id)
    (storage.foldername(name))[1] = (SELECT company_id::text FROM profiles WHERE user_id = auth.uid())
  )
);

-- Allow users to update logos for their company
CREATE POLICY "Users can update logos for their company"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (
    is_super_admin(auth.uid()) = true OR
    (storage.foldername(name))[1] = (SELECT company_id::text FROM profiles WHERE user_id = auth.uid())
  )
);

-- Allow users to delete logos for their company
CREATE POLICY "Users can delete logos for their company"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (
    is_super_admin(auth.uid()) = true OR
    (storage.foldername(name))[1] = (SELECT company_id::text FROM profiles WHERE user_id = auth.uid())
  )
);