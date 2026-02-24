import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MapPin, AlertCircle, Star, Loader2, Filter, Phone, Clock, Tag, FileText, Image, IndianRupee, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import LeadCard from '@/components/LeadCard';
import LeadFilter from '@/components/LeadFilter';
import { useToast } from '@/hooks/use-toast';
import { createNotification, requestBrowserNotificationPermission, showBrowserNotification } from '@/lib/notifications';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Lead {
  id: string;
  title?: string;
  categories: { name: string } | null;
  sub_categories: { name: string } | null;
  location_lat: number;
  location_long: number;
  location_address: string | null;
  address?: string | null;
  customer_name: string | null;
  customer_phone: string;
  description?: string | null;
  images?: string[] | null;
  amount?: number | null;
  status: string;
  created_at: string;
  created_by: string;
  distance?: number;
}

interface LeadFilters {
  search: string;
  category?: string;
  subCategory?: string;
  distance: number;
  minDistance?: number;
  maxDistance?: number;
  dateFrom?: string;
  dateTo?: string;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const GetLeads: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [acceptingLead, setAcceptingLead] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    distance: 50,
  });

  const notifiedLeadIdsRef = useRef<Set<string>>(new Set());

  const fetchLeads = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const userLat = profile?.location_lat || 0;
      const userLong = profile?.location_long || 0;
      const serviceRadius = profile?.service_radius_km || 50;

      // Fetch open leads
      const { data, error } = await supabase
        .from('leads')
        .select('*, categories(name), sub_categories(name)')
        .eq('status', 'open')
        .neq('created_by', user.id) // Don't show own leads
        .order('created_at', { ascending: false });

      if (error) throw error;

      let leadsWithDistance: Lead[] = (data || []).map((lead: any) => ({
        ...lead,
        status: lead.status || 'open',
      })) as Lead[];

      if (userLat && userLong) {
        leadsWithDistance = leadsWithDistance.map((lead) => ({
          ...lead,
          distance: lead.location_lat && lead.location_long
            ? calculateDistance(userLat, userLong, lead.location_lat, lead.location_long)
            : undefined
        }));

        // Filter by radius and sort by distance
        leadsWithDistance = leadsWithDistance
          .filter((lead) => (lead.distance || 0) <= serviceRadius)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setLeads(leadsWithDistance);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'Failed to fetch leads',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, profile, t, toast]);

  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true);
      await fetchLeads();
      setLoading(false);
    };
    loadLeads();
  }, [fetchLeads]);

  // Apply filters to leads
  useEffect(() => {
    let filtered = [...leads];

    if (filters.category) {
      filtered = filtered.filter((lead) =>
        lead.categories?.name?.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    if (filters.subCategory) {
      filtered = filtered.filter((lead) =>
        lead.sub_categories?.name?.toLowerCase() === filters.subCategory?.toLowerCase()
      );
    }

    if (filters.minDistance !== undefined) {
      filtered = filtered.filter((lead) => (lead.distance || 0) >= filters.minDistance!);
    }

    if (filters.maxDistance !== undefined) {
      filtered = filtered.filter((lead) => (lead.distance || 0) <= filters.maxDistance!);
    }

    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom).getTime();
      filtered = filtered.filter((lead) => new Date(lead.created_at).getTime() >= dateFrom);
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo).getTime();
      filtered = filtered.filter((lead) => new Date(lead.created_at).getTime() <= dateTo);
    }

    setFilteredLeads(filtered);
  }, [leads, filters]);

  const activeFiltersCount = [
    filters.category,
    filters.subCategory,
    filters.minDistance,
    filters.maxDistance,
    filters.dateFrom,
    filters.dateTo,
  ].filter(v => v !== undefined && v !== '' && v !== null).length;

  // Poll every minute to ensure users get notified about available leads nearby
  useEffect(() => {
    const shouldRun = user && profile?.location_lat && profile?.location_long;
    if (!shouldRun) return;

    const pollNearbyLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id, categories(name), sub_categories(name), location_lat, location_long, created_by')
          .eq('status', 'open')
          .neq('created_by', user!.id);

        if (error || !data) return;

        const radius = profile?.service_radius_km || 50;

        data.forEach(async (lead) => {
          if (!lead.location_lat || !lead.location_long) return;

          const distanceKm = calculateDistance(
            profile.location_lat!,
            profile.location_long!,
            lead.location_lat,
            lead.location_long
          );

          if (distanceKm <= radius && !notifiedLeadIdsRef.current.has(lead.id)) {
            const serviceName = lead.categories?.name || 'Service';
            await createNotification(user!.id, {
              type: 'new_lead',
              title: 'New lead near you',
              body: `${serviceName} available ${distanceKm.toFixed(1)} km away`,
              data: { leadId: lead.id, lead_id: lead.id },
            });

            notifiedLeadIdsRef.current.add(lead.id);

            showBrowserNotification(
              'New lead near you',
              `${serviceName} available ${distanceKm.toFixed(1)} km away`,
              {
                leadId: lead.id,
                url: `/lead/${lead.id}`,
              }
            );
          }
        });
      } catch (err) {
        console.error('Polling error', err);
      }
    };

    // Run immediately, then every minute
    pollNearbyLeads();
    const interval = setInterval(pollNearbyLeads, 60 * 1000);
    return () => clearInterval(interval);
  }, [user, profile?.location_lat, profile?.location_long, profile?.service_radius_km]);

  // Realtime subscription
  useEffect(() => {
    // Request browser notification permission once
    requestBrowserNotificationPermission();

    if (!user) return;

    // Real-time updates for new leads
    const channel = supabase
      .channel('public:leads')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, async (payload) => {
        // If a lead is claimed by someone else, remove it from the list
        if (payload.eventType === 'UPDATE' && payload.new.status === 'claimed') {
          setLeads(current => current.filter(lead => lead.id !== payload.new.id));
        }
        // If a new lead is created, refresh the list
        else if (payload.eventType === 'INSERT') {
          fetchLeads();

          const newLead = payload.new as any; // Cast safely or use proper type if available
          if (!newLead || !profile?.location_lat || !profile?.location_long) return;

          const distanceKm = calculateDistance(
            profile.location_lat,
            profile.location_long,
            newLead.location_lat,
            newLead.location_long
          );

          const radius = profile.service_radius_km || 50;
          if (distanceKm <= radius) {
            // Fetch category name since it's not in the payload
            const { data: categoryData } = await supabase
              .from('categories')
              .select('name')
              .eq('id', newLead.category_id)
              .single();

            const serviceName = categoryData?.name || 'Service';

            // Persist notification entry
            await createNotification(user.id, {
              type: 'new_lead',
              title: 'New lead near you',
              body: `${serviceName} available ${distanceKm.toFixed(1)} km away`,
              data: { leadId: newLead.id, lead_id: newLead.id },
            });

            notifiedLeadIdsRef.current.add(newLead.id);

            // Browser push notification
            showBrowserNotification('New lead near you', `${serviceName} available ${distanceKm.toFixed(1)} km away`, {
              leadId: newLead.id,
              url: `/lead/${newLead.id}`,
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads, profile, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  const handleViewDetails = (lead: Lead) => {
    if (!profile?.is_subscribed) {
      setShowSubscribeModal(true);
    } else {
      setSelectedLead(lead);
    }
  };

  const handleAcceptLead = async (lead: Lead) => {
    if (!profile?.is_subscribed) {
      setShowSubscribeModal(true);
      return;
    }

    setAcceptingLead(true);

    // Atomic update with race condition handling
    const { data, error, count } = await supabase
      .from('leads')
      .update({
        status: 'claimed' as any,
        claimed_by: user?.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', lead.id)
      .eq('status', 'open')
      .select('id')
      .maybeSingle();

    setAcceptingLead(false);

    // Check if update actually affected a row (count > 0 or data exists)
    if (error || !data) {
      toast({
        variant: 'destructive',
        title: t('leadAlreadyTaken'),
        description: 'This lead was just taken by someone else.',
      });
      await fetchLeads();
    } else {
      toast({
        title: t('leadAccepted'),
        description: 'Check your history for details.',
      });
      setSelectedLead(null);
      navigate('/history');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:ml-60 md:pb-6">
      <Header
        title={t('getLeads')}
        showBack
        rightElement={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        }
      />

      <main className="px-4 py-6 max-w-4xl mx-auto">
        {/* Filter Button */}
        <div className="mb-6">
          <LeadFilter
            onFiltersChange={(newFilters: Partial<LeadFilters>) => {
              // If empty object (from Clear All), reset to defaults
              if (Object.keys(newFilters).length === 0) {
                setFilters({ search: '', distance: 50 });
              } else {
                setFilters(prev => ({ ...prev, ...newFilters }));
              }
            }}
            activeFiltersCount={activeFiltersCount}
          />
        </div>

        {/* Location Reminder */}
        {(!profile?.location_lat || !profile?.location_long) && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 mb-4 flex items-start gap-3">
            <MapPin className="text-secondary shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-foreground">Set your location</p>
              <p className="text-xs text-muted-foreground mt-1">
                Go to Profile to set your location and see nearby leads
              </p>
            </div>
          </div>
        )}

        {/* Leads List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-lg font-semibold text-foreground">{t('noLeads')}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later or expand your service radius
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/profile')}
            >
              <MapPin size={18} />
              Adjust Radius
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} found
            </p>
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">

              {filteredLeads.map((lead, index) => (
                <div
                  key={lead.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <LeadCard
                    lead={lead}
                    distance={lead.distance}
                    isSubscribed={profile?.is_subscribed || false}
                    onViewDetails={() => handleViewDetails(lead)}
                    onAccept={() => handleAcceptLead(lead)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Lead Details Modal */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-md mx-4 rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('viewDetails')}</DialogTitle>
            <DialogDescription>
              Full lead details
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-5 py-2">

              {/* Category & Subcategory */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedLead.categories?.name && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Tag size={14} />
                    {selectedLead.categories.name}
                  </span>
                )}
                {selectedLead.sub_categories?.name && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
                    {selectedLead.sub_categories.name}
                  </span>
                )}
              </div>

              {/* Creator Info */}
              {selectedLead.customer_name && (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedLead.customer_name}</p>
                    <p className="text-xs text-muted-foreground">Lead Creator</p>
                  </div>
                </div>
              )}

              {/* Description / Notes */}
              {selectedLead.description && (
                <div className="flex items-start gap-3">
                  <FileText className="text-primary mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedLead.description}</p>
                  </div>
                </div>
              )}

              {/* Images */}
              {selectedLead.images && selectedLead.images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Image className="text-primary" size={18} />
                    <p className="text-sm font-medium text-foreground">Attached Images</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedLead.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img
                          src={img}
                          alt={`Lead image ${i + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="text-primary mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLead.address || selectedLead.location_address || 'No address provided'}
                  </p>
                </div>
              </div>

              {/* Amount */}
              {selectedLead.amount && (
                <div className="flex items-start gap-3">
                  <IndianRupee className="text-primary mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-medium text-foreground">Budget / Amount</p>
                    <p className="text-sm text-muted-foreground">₹{selectedLead.amount}</p>
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="flex items-start gap-3">
                <Clock className="text-primary mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground">Posted</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedLead.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Contact Number */}
              <div className="flex items-start gap-3">
                <Phone className="text-primary mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground">Contact</p>
                  <p className="text-sm text-muted-foreground">{selectedLead.customer_phone}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                <a href={`tel:${selectedLead.customer_phone}`} className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <Phone size={16} />
                    {t('call')} {selectedLead.customer_phone}
                  </Button>
                </a>

                <Button
                  variant="hero"
                  className="w-full"
                  onClick={() => handleAcceptLead(selectedLead)}
                  disabled={acceptingLead}
                >
                  {acceptingLead ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    t('acceptLead')
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscribe Modal */}
      <Dialog open={showSubscribeModal} onOpenChange={setShowSubscribeModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="text-secondary" size={24} />
              {t('subscribeNow')}
            </DialogTitle>
            <DialogDescription>
              {t('subscribeToView')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 text-center">
            <div className="text-4xl font-bold text-foreground">₹99</div>
            <div className="text-muted-foreground">{t('perMonth')}</div>

            <ul className="mt-6 space-y-3 text-left">
              <li className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center">✓</div>
                View full lead details
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center">✓</div>
                Accept unlimited leads
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center">✓</div>
                Priority notifications
              </li>
            </ul>

            <Button
              variant="heroSecondary"
              className="w-full mt-6"
              onClick={() => {
                setShowSubscribeModal(false);
                navigate('/subscribe');
              }}
            >
              {t('subscribeNow')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default GetLeads;
