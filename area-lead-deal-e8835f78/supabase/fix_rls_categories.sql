-- Force enable RLS (idempotent)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "SubCategories are viewable by everyone" ON public.sub_categories;

-- Re-create policies allowing public read access
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "SubCategories are viewable by everyone" 
ON public.sub_categories FOR SELECT 
TO anon, authenticated 
USING (true);

-- Reload config one last time
NOTIFY pgrst, 'reload config';
