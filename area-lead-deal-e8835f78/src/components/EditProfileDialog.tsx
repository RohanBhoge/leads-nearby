import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, User, Phone, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EditProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ isOpen, onClose }) => {
    const { user, profile, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        user_name: '',
        bio: '',
        phone: '',
        category_id: '',
        sub_category_id: '',
        profile_image: '',
    });

    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [subCategories, setSubCategories] = useState<{ id: string, name: string, category_id: string }[]>([]);

    useEffect(() => {
        if (profile) {
            setFormData({
                user_name: profile.user_name || '',
                bio: profile.bio || '',
                phone: profile.phone || '',
                category_id: profile.category_id || '',
                sub_category_id: profile.sub_category_id || '',
                profile_image: profile.profile_image || '',
            });
        }
    }, [profile, isOpen]);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data: cats } = await supabase.from('categories').select('id, name').order('name');
            if (cats) setCategories(cats);

            const { data: subCats } = await supabase.from('sub_categories').select('id, name, category_id').order('name');
            if (subCats) setSubCategories(subCats as any);
        };
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [name]: value };
            if (name === 'category_id') {
                updates.sub_category_id = ''; // Reset subcategory when category changes
            }
            return updates;
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, profile_image: data.publicUrl }));

            toast({
                title: "Image uploaded",
                description: "Profile image uploaded successfully. Don't forget to save changes.",
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error.message,
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const updates = {
                user_name: formData.user_name,
                bio: formData.bio || null,
                phone: formData.phone || null,
                category_id: formData.category_id || null,
                sub_category_id: formData.sub_category_id || null,
                profile_image: formData.profile_image || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile(); // Refresh context

            toast({
                title: 'Profile Updated',
                description: 'Your profile has been successfully updated.',
            });
            onClose();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update profile details.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information visible to others.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Profile Image */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-2 border-primary">
                                <AvatarImage src={formData.profile_image} />
                                <AvatarFallback className="text-2xl">{formData.user_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <Label
                                htmlFor="image-upload"
                                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                            >
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">Tap camera icon to change photo</p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="user_name" className="flex items-center gap-2">
                                <User size={16} /> Name
                            </Label>
                            <Input
                                id="user_name"
                                name="user_name"
                                value={formData.user_name}
                                onChange={handleChange}
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone size={16} /> Phone
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone Number"
                            />
                        </div>

                        {/* Category & Subcategory */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category_id">Category</Label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
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
                                    onChange={handleChange}
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
                            <Label htmlFor="bio" className="flex items-center gap-2">
                                <FileText size={16} /> Bio
                            </Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us a bit about yourself or your services..."
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading || uploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading || uploading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditProfileDialog;
