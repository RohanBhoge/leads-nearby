export const SERVICE_TYPES = [
    { value: 'rent_agreement', label: 'Rent Agreement' },
    { value: 'Leads Near By_work', label: 'Leads Near By Work' },
    { value: 'income_certificate', label: 'Income Certificate' },
    { value: 'aadhar_work', label: 'Aadhar Work' },
    { value: 'maha_e_seva_work', label: 'Maharashtra E Seva Work' },
    { value: 'other', label: 'Other' },
] as const;

export type ServiceTypeValue = typeof SERVICE_TYPES[number]['value'];

export const DEFAULT_SERVICE_TYPE = 'rent_agreement';

export const getServiceLabel = (value: string): string => {
    const service = SERVICE_TYPES.find(s => s.value === value);
    return service ? service.label : 'Other';
};
