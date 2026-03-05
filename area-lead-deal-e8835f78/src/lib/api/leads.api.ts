import { supabase } from '@/integrations/supabase/client';

export interface NearbyLead {
    id: string;
    title?: string;
    description?: string;
    amount?: number;
    status: string;
    created_at: string;
    created_by: string;
    location_lat: number;
    location_long: number;
    location_address: string;
    customer_name: string;
    customer_phone: string;
    images?: string[];
    category_name?: string;
    sub_category_name?: string;
    distance_km: number;

    // Mapping to old Lead structure for compatibility
    categories?: { name: string } | null;
    sub_categories?: { name: string } | null;
}

/**
 * Repository for Leads-related database operations.
 * This separates UI logic from business logic (System Design Pattern).
 */
export const LeadsRepository = {

    /**
     * Fetches leads within a specific radius using the PostGIS RPC function.
     * This pushes the heavy distance calculation to the database layer.
     */
    async getNearbyLeads(
        lat: number,
        lng: number,
        radiusKm: number,
        filters: { search?: string, categoryId?: string, subCategoryId?: string } = {}
    ): Promise<{ data: NearbyLead[] | null; error: any }> {

        // Cast to any because the new RPC function isn't in our generated database types yet
        const { data, error } = await (supabase as any).rpc('get_nearby_leads', {
            p_lat: lat,
            p_long: lng,
            p_radius_km: radiusKm,
            p_search_text: filters.search || null,
            p_category_id: filters.categoryId || null,
            p_sub_category_id: filters.subCategoryId || null
        });

        if (error) {
            console.error('Error in LeadsRepository.getNearbyLeads:', error);
            return { data: null, error };
        }

        // Map the flat RPC response back to nested objects to avoid breaking existing UI components
        const mappedData = data?.map((lead: any) => ({
            ...lead,
            distance: lead.distance_km, // For UI compatibility
            categories: lead.category_name ? { name: lead.category_name } : null,
            sub_categories: lead.sub_category_name ? { name: lead.sub_category_name } : null,
        })) as NearbyLead[];

        return { data: mappedData, error: null };
    }
};
