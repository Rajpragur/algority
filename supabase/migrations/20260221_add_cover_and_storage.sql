-- Add cover_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;

-- Create storage buckets for avatars and covers if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up RLS for storage.objects
-- Note: RLS should be enabled for the storage.objects table via the Supabase Dashboard 
-- if it is not already enabled. Standard SQL roles often lack permissions to ALTER this table.
-- This allows anyone to view public buckets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'covers'));
    END IF;
END
$$;

-- Since the path used in ProfileClient.tsx is `${profile.id}/${fileName}`, 
-- we check if the first part of the path matches the user ID.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can upload their own files'
    ) THEN
        CREATE POLICY "Users can upload their own files" ON storage.objects FOR INSERT 
        WITH CHECK (
          auth.role() = 'authenticated' AND 
          (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can update their own files'
    ) THEN
        CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE
        USING (
          auth.role() = 'authenticated' AND 
          (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can delete their own files'
    ) THEN
        CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE
        USING (
          auth.role() = 'authenticated' AND 
          (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END
$$;
