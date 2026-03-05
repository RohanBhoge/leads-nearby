
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, FileText, Loader2, CheckCircle, Camera, ImagePlus, Sparkles, X } from 'lucide-react';
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
import { fetchCategoriesAndSubCategories } from '@/lib/api/categories.api';
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

  // AI Screenshot Extraction State
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionDone, setExtractionDone] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { t, tc } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { categories, subCategories } = await fetchCategoriesAndSubCategories();
        setCategories(categories);
        setSubCategories(subCategories as any);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    loadCategories();
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

  // Convert image file to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data:image/xxx;base64, prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle screenshot upload and AI extraction
  const handleScreenshotExtract = async (file: File) => {
    setScreenshotFile(file);
    setExtractionDone(false);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setScreenshotPreview(previewUrl);

    setIsExtracting(true);
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      const availableCategories = categories.map(c => c.name);

      const { data, error } = await supabase.functions.invoke('verify-lead-content', {
        body: {
          mode: 'extract',
          image_base64: base64,
          image_mime_type: mimeType,
          available_categories: availableCategories
        },
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }
      });

      if (error) throw error;

      // Debug: log the actual AI response
      console.log('AI extraction response:', JSON.stringify(data));

      if (data?.extract_error || data?.error) {
        throw new Error(`AI Service Error: ${data.error || 'Unknown error'}`);
      }

      // If we got the old validation format (is_matches field) and no extraction data at all
      if (data?.is_matches !== undefined && data?.customer_name === undefined && !data?.error) {
        throw new Error('Edge Function is outdated. Please redeploy verify-lead-content.');
      }

      // Auto-fill form fields from AI response
      let filledCount = 0;
      if (data?.customer_name) { setCustomerName(data.customer_name); filledCount++; }
      if (data?.customer_phone) {
        const phone = data.customer_phone.replace(/\D/g, '').slice(-10);
        if (phone.length >= 10) { setCustomerPhone(phone); validatePhone(phone); filledCount++; }
      }
      if (data?.service_description) { setNotes(data.service_description); filledCount++; }
      if (data?.estimated_price) { setPrice(data.estimated_price); filledCount++; }

      // Try to match suggested category
      if (data?.suggested_category) {
        const matched = categories.find(c =>
          c.name.toLowerCase().includes(data.suggested_category.toLowerCase()) ||
          data.suggested_category.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matched) {
          setSelectedCategoryId(matched.id);
          filledCount++;
          if (data?.suggested_sub_category) {
            setTimeout(() => {
              const matchedSub = subCategories.find(sc =>
                sc.category_id === matched.id &&
                (sc.name.toLowerCase().includes(data.suggested_sub_category.toLowerCase()) ||
                  data.suggested_sub_category.toLowerCase().includes(sc.name.toLowerCase()))
              );
              if (matchedSub) setSelectedSubCategoryId(matchedSub.id);
            }, 100);
          }
        }
      }

      // Try to geocode the location string into coordinates
      if (data?.location && window.google?.maps?.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: data.location, componentRestrictions: { country: 'in' } } as any, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              const locationObj = results[0].geometry.location;
              const formattedAddress = results[0].formatted_address;
              handleLocationChange(locationObj.lat(), locationObj.lng(), formattedAddress);
              toast({
                title: '📍 Location Found',
                description: formattedAddress,
              });
            } else {
              setAddress(data.location); // Fallback to raw string if geocoding fails
            }
          });
          filledCount++;
        } catch (e) {
          console.error("Geocoding failed for AI location", e);
          setAddress(data.location);
        }
      } else if (data?.location) {
        setAddress(data.location); // Fallback if maps not loaded
        filledCount++;
      }

      const filledCount_final = filledCount;
      setExtractionDone(true);
      if (filledCount_final === 0) {
        toast({
          title: '⚠️ No data found in image',
          description: 'AI could not extract details. Try a clearer screenshot or fill manually.',
        });
      } else {
        toast({
          title: `✅ AI filled ${filledCount_final} field${filledCount_final !== 1 ? 's' : ''}`,
          description: 'Review and edit anything that looks incorrect before submitting.',
        });
      }
    } catch (err) {
      console.error('Screenshot extraction failed:', err);
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: err instanceof Error ? err.message : 'Could not read the screenshot. Please fill the form manually.',
      });
    } finally {
      setIsExtracting(false);
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
    <div className="min-h-screen bg-background pb-24 md:ml-60 md:pb-6">
      <Header title={t('generateLead')} showBack />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* ── AI Screenshot Upload Card ── */}
        <div className="mb-6">
          <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-primary" />
              <span className="font-semibold text-foreground">Generate Lead from Screenshot</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-auto">AI</span>
            </div>

            {!screenshotFile ? (
              <label
                className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed border-primary/30 cursor-pointer hover:border-primary hover:bg-primary/10 transition-all"
                htmlFor="screenshot-upload"
              >
                <ImagePlus size={28} className="text-primary/60" />
                <span className="text-sm text-muted-foreground text-center">
                  Upload WhatsApp screenshot, SMS or any service request image<br />
                  <span className="text-xs text-primary">AI will auto-fill the form</span>
                </span>
                <input
                  ref={screenshotInputRef}
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScreenshotExtract(file);
                  }}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={screenshotPreview!}
                  alt="Screenshot preview"
                  className="w-full max-h-48 object-contain rounded-xl border border-border"
                />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); setExtractionDone(false); }}
                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1 border border-border hover:bg-destructive/10"
                >
                  <X size={14} className="text-destructive" />
                </button>
                {/* Status */}
                {isExtracting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 rounded-xl gap-2">
                    <Loader2 size={28} className="animate-spin text-primary" />
                    <span className="text-sm font-medium text-primary">AI is reading screenshot...</span>
                  </div>
                )}
                {extractionDone && !isExtracting && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-primary font-medium">
                    <CheckCircle size={16} />
                    Form auto-filled! Review and edit below.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
                    {tc(cat.name)}
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
                      {tc(subCat.name)}
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

          {/* Info about AI Screenshot (when already used) */}
          {extractionDone && (
            <div className="text-xs text-muted-foreground bg-primary/5 rounded-xl p-3 flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Fields were auto-filled from your screenshot. Edit anything that looks incorrect.
            </div>
          )}

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
