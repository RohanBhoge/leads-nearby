import { supabase } from '@/integrations/supabase/client';

export interface Category {
    id: string;
    name: string;
}

export interface SubCategory {
    id: string;
    name: string;
    category_id: string | null;
}

export const fetchCategoriesAndSubCategories = async (): Promise<{ categories: Category[], subCategories: SubCategory[] }> => {
    try {
        const { data: edgeData, error } = await supabase.functions.invoke('get-categories');

        if (error) {
            console.error('Error invoking get-categories edge function:', error);
            throw error;
        }

        // The edge function returns { data: { categories: [], subCategories: [] }, source: 'cache' | 'database' }
        if (edgeData && edgeData.data) {
            console.log(`Categories loaded from ${edgeData.source}`);
            return {
                categories: edgeData.data.categories || [],
                subCategories: edgeData.data.subCategories || []
            };
        }

        return { categories: [], subCategories: [] };
    } catch (err) {
        console.error('Failed to fetch categories via Edge Function, falling back to direct DB connection:', err);

        // Fallback: If edge function fails, try direct DB query as backup
        const [catsResponse, subCatsResponse] = await Promise.all([
            supabase.from("categories").select("id, name").order("name"),
            supabase.from("sub_categories").select("id, name, category_id").order("name")
        ]);

        return {
            categories: catsResponse.data || [],
            subCategories: subCatsResponse.data || []
        };
    }
};
