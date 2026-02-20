import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Star, MapPin, Phone, Mail, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MapPreview from '@/components/MapPreview';
import SubscriptionTimer from '@/components/SubscriptionTimer';
import { supabase } from '@/integrations/supabase/client';
import LocationPicker from '@/components/LocationPicker';
import RadiusSlider from '@/components/RadiusSlider';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Save, X, User as UserIcon } from 'lucide-react';
import EditProfileDialog from '@/components/EditProfileDialog';

const Profile: React.FC = () => {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { t, tc } = useLanguage();

  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLong, setEditLong] = useState<number | null>(null);
  const [editRadius, setEditRadius] = useState<number>(50);
  const [saving, setSaving] = useState(false);

  const [categoryName, setCategoryName] = useState<string>('');
  const [subCategoryName, setSubCategoryName] = useState<string>('');

  // Fetch category and subcategory names
  useEffect(() => {
    const fetchCategoryNames = async () => {
      if (profile?.category_id) {
        const { data } = await supabase
          .from('categories')
          .select('name')
          .eq('id', profile.category_id)
          .single();

        if (data) setCategoryName(data.name);
      }

      if (profile?.sub_category_id) {
        const { data } = await supabase
          .from('sub_categories')
          .select('name')
          .eq('id', profile.sub_category_id)
          .single();

        if (data) setSubCategoryName(data.name);
      }
    };

    fetchCategoryNames();
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveLocation = async () => {
    if (!user || !editLat || !editLong) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          location_lat: editLat,
          location_long: editLong,
          service_radius_km: editRadius
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Location Updated",
        description: "Your location has been successfully updated.",
      });

      setIsEditingLocation(false);
      // Refresh user profile logic handled by AuthContext but might need manual re-fetch if not reactive
      window.location.reload(); // Simple way to ensure context updates for now
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update location. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:ml-60 md:pb-6">
      <Header title={t('profile')} />

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* User Info Card */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center animate-slide-up">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-primary/20">
            {profile?.profile_image ? (
              <img
                src={profile.profile_image}
                alt={profile.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={40} className="text-primary" />
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{profile?.name || profile?.user_name || 'User'}</h2>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>

          <div className="flex items-center justify-center gap-4 mt-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${profile?.is_subscribed ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
              }`}>
              <Star size={16} className={profile?.is_subscribed ? 'fill-primary' : ''} />
              <span>{profile?.is_subscribed ? t('premiumPlan') : t('freePlan')}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700">
              <Briefcase size={16} />
              <span>{profile?.credit_balance || 0} Credits</span>
            </div>
          </div>

          {profile?.referral_code && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between gap-2 border border-border">
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Referral Code</p>
                <p className="font-mono text-lg font-bold text-primary">{profile.referral_code}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(profile.referral_code || '');
                  toast({ title: 'Copied', description: 'Referral code copied to clipboard!' });
                }}
              >
                Copy
              </Button>
            </div>
          )}

          {/* Subscription Timer */}
          <div className="mt-4">
            <SubscriptionTimer
              expiresAt={profile?.subscription_expires_at || null}
              isSubscribed={profile?.is_subscribed || false}
            />
          </div>

          {/* Subscribe/Renew Button */}
          <Button
            variant={profile?.is_subscribed ? "outline" : "hero"}
            size="sm"
            className="mt-4"
            onClick={() => navigate('/subscribe')}
          >
            {profile?.is_subscribed ? 'Renew Subscription' : 'Subscribe Now'}
          </Button>
        </div>


        {/* User Details Card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Account Details</h3>

          {/* Phone */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <Phone size={20} className="text-primary" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Phone Number</p>
              <p className="text-sm font-medium text-foreground">
                {profile?.phone || <span className="text-muted-foreground italic">Not provided</span>}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <Mail size={20} className="text-primary" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
            <Briefcase size={20} className="text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">Service Category</p>
              {categoryName || subCategoryName ? (
                <div className="flex flex-wrap gap-2">
                  {categoryName && (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {tc(categoryName)}
                    </span>
                  )}
                  {subCategoryName && (
                    <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                      {tc(subCategoryName)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No category selected</p>
              )}
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Registered Location</h3>
            </div>
            {!isEditingLocation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditLat(profile?.location_lat || 18.5204);
                  setEditLong(profile?.location_long || 73.8567);
                  setEditRadius(profile?.service_radius_km || 10);
                  setIsEditingLocation(true);
                }}
              >
                <Edit2 size={16} />
              </Button>
            )}
          </div>

          {isEditingLocation ? (
            <div className="space-y-4">
              <div className="h-64 rounded-xl overflow-hidden border border-border">
                <LocationPicker
                  latitude={editLat || 18.5204}
                  longitude={editLong || 73.8567}
                  onLocationChange={(lat, lng) => {
                    setEditLat(lat);
                    setEditLong(lng);
                  }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Service Radius: {editRadius} km</p>
                <RadiusSlider
                  value={editRadius}
                  onChange={setEditRadius}
                  max={100}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditingLocation(false)}
                  disabled={saving}
                >
                  <X size={16} className="mr-2" /> Cancel
                </Button>
                <Button
                  variant="default" // Changed from "hero" to "default" as "hero" might not be defined in Button variants yet or for safety
                  className="flex-1 bg-primary text-primary-foreground"
                  onClick={handleSaveLocation}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} className="mr-2" /> Save Location</>}
                </Button>
              </div>
            </div>
          ) : (
            profile?.location_lat && profile?.location_long ? (
              <>
                <MapPreview
                  latitude={profile.location_lat}
                  longitude={profile.location_long}
                  onLocationChange={() => { }} // No-op, read-only
                  draggable={false}
                />

                <p className="text-xs text-muted-foreground text-center mt-2">
                  {profile.location_lat.toFixed(6)}, {profile.location_long.toFixed(6)}
                  <br />
                  Radius: {profile.service_radius_km} km
                </p>
              </>
            ) : (
              <div className="bg-muted/30 rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setEditLat(18.5204);
                  setEditLong(73.8567);
                  setIsEditingLocation(true);
                }}
              >
                <MapPin size={48} className="text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">No location registered</p>
                <p className="text-xs text-primary font-medium mt-1">Tap to set location</p>
              </div>
            )
          )}
        </div>


        {/* Logout Button */}
        <div className="pt-4 animate-slide-up space-y-3" style={{ animationDelay: '0.3s' }}>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowEditProfile(true)}
          >
            <UserIcon size={18} className="mr-2" />
            <span>Edit Profile</span>
          </Button>

          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </Button>
        </div>
      </main>

      <EditProfileDialog
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />

      <BottomNav />
    </div>
  );
};

export default Profile;
