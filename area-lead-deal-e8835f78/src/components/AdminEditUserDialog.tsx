import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker'; // Adjust path if needed

interface UserProfile {
    id: string;
    user_name: string;
    phone: string | null;
    location_lat: number | null;
    location_long: number | null;
    service_radius_km?: number | null;
    is_subscribed: boolean | null;
    subscription_expires_at: string | null;
    category_id: string | null;
    sub_category_id: string | null;
    categories: { name: string, id: string } | null;
    sub_categories: { name: string, id: string } | null;
}

interface AdminEditUserDialogProps {
    user: UserProfile | null;
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: () => void;
}

const AdminEditUserDialog: React.FC<AdminEditUserDialogProps> = ({ user, isOpen, onClose, onUserUpdated }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [subCategories, setSubCategories] = useState<{ id: string, name: string, category_id: string }[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location_lat: 0,
        location_long: 0,
        service_radius_km: 50,
        is_subscribed: false,
        subscription_expires_at: '',
        category_id: '',
        sub_category_id: '',
    });

    useEffect(() => {
        const fetchCategories = async () => {
            const { data: cats } = await supabase.from('categories').select('id, name');
            if (cats) setCategories(cats);

            const { data: subCats } = await supabase.from('sub_categories').select('id, name, category_id');
            if (subCats) setSubCategories(subCats);
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.user_name || '',
                phone: user.phone || '',
                location_lat: user.location_lat || 0,
                location_long: user.location_long || 0,
                service_radius_km: user.service_radius_km || 50,
                is_subscribed: user.is_subscribed || false,
                subscription_expires_at: user.subscription_expires_at ? new Date(user.subscription_expires_at).toISOString().split('T')[0] : '',
                category_id: user.category_id || '',
                sub_category_id: user.sub_category_id || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updates = { ...prev, [name]: value };
            if (name === 'category_id') {
                updates.sub_category_id = ''; // Reset subcategory when category changes
            }
            return updates;
        });
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_subscribed: checked }));
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, location_lat: lat, location_long: lng }));
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const updates: any = {
                user_name: formData.name,
                phone: formData.phone,
                location_lat: formData.location_lat || null,
                location_long: formData.location_long || null,
                service_radius_km: formData.service_radius_km,
                is_subscribed: formData.is_subscribed,
                subscription_expires_at: formData.subscription_expires_at ? new Date(formData.subscription_expires_at).toISOString() : null,
                category_id: formData.category_id || null,
                sub_category_id: formData.sub_category_id || null,
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            toast({
                title: 'User Updated',
                description: 'User details have been successfully updated.',
            });
            onUserUpdated();
            onClose();
        } catch (error: any) {
            console.error('Error updating user:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update user details.',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit User: {user.user_name}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category_id">Category</Label>
                            <select
                                id="category_id"
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleSelectChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sub_category_id">Subcategory</Label>
                            <select
                                id="sub_category_id"
                                name="sub_category_id"
                                value={formData.sub_category_id}
                                onChange={handleSelectChange}
                                disabled={!formData.category_id}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select Subcategory</option>
                                {subCategories
                                    .filter((sc) => sc.category_id === formData.category_id)
                                    .map((sc) => (
                                        <option key={sc.id} value={sc.id}>
                                            {sc.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Location (Lat, Long)</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                name="location_lat"
                                type="number"
                                placeholder="Latitude"
                                value={formData.location_lat}
                                onChange={handleChange}
                            />
                            <Input
                                name="location_long"
                                type="number"
                                placeholder="Longitude"
                                value={formData.location_long}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="h-[200px] w-full rounded-md border overflow-hidden">
                            <LocationPicker
                                initialLat={formData.location_lat || 20.5937}
                                initialLng={formData.location_long || 78.9629}
                                onLocationSelect={handleLocationSelect}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="service_radius_km">Service Radius (km)</Label>
                        <Input
                            id="service_radius_km"
                            name="service_radius_km"
                            type="number"
                            value={formData.service_radius_km}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h3 className="font-semibold mb-4">Subscription Details</h3>
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_subscribed">Active Subscription</Label>
                                <Switch
                                    id="is_subscribed"
                                    checked={formData.is_subscribed}
                                    onCheckedChange={handleSwitchChange}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="subscription_expires_at">Expiry Date</Label>
                                <Input
                                    id="subscription_expires_at"
                                    name="subscription_expires_at"
                                    type="date"
                                    value={formData.subscription_expires_at}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AdminEditUserDialog;
