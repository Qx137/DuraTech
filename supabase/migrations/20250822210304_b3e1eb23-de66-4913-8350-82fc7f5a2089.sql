-- Create storage bucket for product media
INSERT INTO storage.buckets (id, name, public) VALUES ('product-media', 'product-media', true);

-- Create storage policies for product media
CREATE POLICY "Anyone can view product media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-media');

CREATE POLICY "Authenticated users can upload product media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own product media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-media' AND auth.uid()::text = (storage.foldername(name))[1]);