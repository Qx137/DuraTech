-- Update the handle_new_user trigger to also populate user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, name, email, user_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'buyer')
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data ->> 'user_type')::app_role, 'buyer'::app_role)
  );
  
  RETURN new;
END;
$$;