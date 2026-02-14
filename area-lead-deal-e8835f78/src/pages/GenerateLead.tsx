
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, FileText, Loader2, CheckCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import LocationPicker from '@/components/LocationPicker';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit phone number');

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  category_id: string;
}

const GenerateLead: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // AI Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ score: number; reason: string } | null>(null);
  const [bypassVerification, setBypassVerification] = useState(false);

  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (data) setCategories(data);
    };

    const fetchSubCategories = async () => {
      const { data } = await supabase
        .from('sub_categories')
        .select('id, name, category_id')
        .order('name');
      if (data) setSubCategories(data as any);
    };

    fetchCategories();
    fetchSubCategories();
  }, []);

  // Filter subcategories by selected category
  const filteredSubCategories = selectedCategoryId
    ? subCategories.filter(sc => sc.category_id === selectedCategoryId)
    : [];

  const handleLocationChange = (lat: number, lng: number, addr?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addr) setAddress(addr);
  };

  const validatePhone = (phone: string) => {
    try {
      phoneSchema.parse(phone);
      setPhoneError('');
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setPhoneError(e.errors[0].message);
      }
      return false;
    }
  };

  const verifyLead = async (): Promise<boolean> => {
    // Skip if already bypassed or no description to check
    if (bypassVerification || !notes || notes.length < 5) return true;

    setIsVerifying(true);
    try {
      const categoryName = categories.find(c => c.id === selectedCategoryId)?.name || 'Unknown';
      const subCategoryName = subCategories.find(sc => sc.id === selectedSubCategoryId)?.name || 'Unknown';

      const { data, error } = await supabase.functions.invoke('verify-lead-content', {
        body: {
          description: notes,
          category: categoryName,
          sub_category: subCategoryName,
          location: address || `${latitude}, ${longitude}`,
          price: price
        },
        headers: {
          // Explicitly use Anon Key to avoid 401s from User Token issues during PoC
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (error) {
        console.error('Verification failed:', error);
        return true; // Fail open (allow post if tech error)
      }

      console.log('Verification result:', data);

      if (data && !data.is_matches) {
        setVerificationResult({ score: data.score, reason: data.reason });
        setShowWarning(true);
        return false; // Stop submission
      }

      return true; // Safe
    } catch (e) {
      console.error('Verification exception:', e);
      return true;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(customerPhone)) return;
    if (!latitude || !longitude) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'Please set a location for this lead',
      });
      return;
    }

    // 1. Verify Content
    const isSafe = await verifyLead();
    if (!isSafe) {
      setLoading(false);
      return; // Stop and show dialog
    }

    // 2. Submit Lead
    submitToDb();
  };

  const submitToDb = async () => {
    setLoading(true);

    const { data: newLead, error } = await supabase.from('leads').insert({
      created_by: user?.id, // Track who created this lead
      customer_id: null, // Lead generator is not the customer
      category_id: selectedCategoryId || null,
      sub_category_id: selectedSubCategoryId || null,
      location_lat: latitude,
      location_long: longitude,
      address: address || null,
      title: `${customerName || 'Customer'} - ${selectedCategoryId ? 'Service Request' : 'Lead'}`,
      description: notes || null,
      customer_phone: customerPhone,
      amount: price || null,
      status: 'open',
    }).select('id').single();

    if (error) {
      console.error('Lead creation error:', error);
      setLoading(false);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: `Failed to create lead: ${error.message}`,
      });
      return;
    }

    setLoading(false);
    toast({
      title: t('success'),
      description: t('leadCreated'),
    });
    navigate('/dashboard');
  };

  const handleConfirmPost = () => {
    setBypassVerification(true);
    setShowWarning(false);
    submitToDb();
  };

  const canSubmit = customerPhone.length === 10 && latitude !== null && longitude !== null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t('generateLead')} showBack />

      <main className="px-4 py-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2 animate-slide-up">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText size={18} className="text-primary" />
              Category
            </label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="h-14 text-base rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory Selection */}
          {selectedCategoryId && filteredSubCategories.length > 0 && (
            <div className="space-y-2 animate-slide-up">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText size={18} className="text-primary" />
                Subcategory
              </label>
              <Select value={selectedSubCategoryId} onValueChange={setSelectedSubCategoryId}>
                <SelectTrigger className="h-14 text-base rounded-xl">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubCategories.map((subCat) => (
                    <SelectItem key={subCat.id} value={subCat.id}>
                      {subCat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={handleLocationChange}
            />
          </div>

          {/* Customer Name */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User size={18} className="text-primary" />
              {t('customerName')} (Optional)
            </label>
            <Input
              type="text"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-14 text-base rounded-xl"
            />
          </div>

          {/* Customer Phone */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Phone size={18} className="text-primary" />
              {t('customerPhone')} *
            </label>
            <Input
              type="tel"
              placeholder="10-digit phone number"
              value={customerPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setCustomerPhone(val);
                if (val.length === 10) validatePhone(val);
                else setPhoneError('');
              }}
              className="h-14 text-base rounded-xl"
            />
            {phoneError && <p className="text-destructive text-sm">{phoneError}</p>}
          </div>

          {/* Lead Price */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText size={18} className="text-primary" />
              Lead Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                type="number"
                placeholder="Enter amount"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="h-14 text-base rounded-xl pl-8"
                min="0"
                step="10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Amount the service provider will receive for completing this lead
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText size={18} className="text-primary" />
              {t('notes')} (Optional)
            </label>
            <Textarea
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] text-base rounded-xl"
            />
          </div>

          {/* Photo Upload Placeholder */}
          <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <button
              type="button"
              className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Camera size={24} />
              <span className="text-sm">{t('uploadPhoto')} (Optional)</span>
            </button>
          </div>

          {/* Submit */}
          <div className="pt-4 animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>{t('submit')}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              ⚠️ Check Details
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base text-foreground font-medium">
                Your description does not match the category you selected.
              </p>
              <div className="bg-amber-50 p-3 rounded-md text-amber-800 text-sm border border-amber-200">
                "{verificationResult?.reason}"
              </div>
              <p className="text-sm text-muted-foreground">
                Please edit your details to ensure the right service providers see your lead.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowWarning(false)}>Edit Details</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPost} className="bg-primary hover:bg-primary/90">
              Post Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default GenerateLead;
