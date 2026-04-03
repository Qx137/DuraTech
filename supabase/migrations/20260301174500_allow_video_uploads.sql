-- Allow videos in product-media bucket
DROP POLICY IF EXISTS "Sellers can upload product media" ON storage.objects;

CREATE POLICY "Sellers can upload product media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-media'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'seller')
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov')
);
