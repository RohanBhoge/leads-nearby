// Temporary helper file to assist with service type to category migration
// This file provides stubs for old service type functions to prevent compile errors
// TODO: Remove this file once all components are migrated to use categories

export const getServiceLabel = (serviceType: string | null): string => {
    if (!serviceType) return 'General Service';
    // Convert snake_case to Title Case
    return serviceType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Temporary: Empty array to prevent errors
// Components should fetch categories from database instead
export const SERVICE_TYPES: { value: string; label: string }[] = [];

export const DEFAULT_SERVICE_TYPE = '';

export type ServiceTypeValue = string;
