-- Allow users to update their own role in user_roles table
CREATE POLICY "Users can update their own role"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role IN ('buyer', 'seller'));

-- Allow updating profile user_type to match
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);