import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Phone, Clock, User, FileText, CheckCircle, XCircle,
  Camera, Loader2, MessageSquare, Upload, MessageCircle, AlertTriangle, Star, Eye, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { completeLead, rejectLead } from '@/lib/lead-actions';
import { openWhatsApp, generateLeadWhatsAppMessage } from '@/lib/whatsapp';
import { triggerLeadNotification } from '@/lib/notifications';
import { getDaysUntilExpiry, isLeadAboutToExpire } from '@/lib/auto-rejection';
import RatingModal from '@/components/RatingModal';
import UserProfileModal from '@/components/UserProfileModal';
import UserRatingDisplay from '@/components/UserRatingDisplay';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Lead {
  id: string;
  lead_code: string | null;
  categories: { name: string } | null;
  location_lat: number;
  location_long: number;
  location_address: string | null;
  address?: string | null; // Add optional address to satisfy types if needed
  customer_name: string | null;
  customer_phone: string;
  lead_generator_phone: string | null;
  status: string;
  created_at: string;
  claimed_at: string | null;
  notes: string | null;
  special_instructions: string | null;
  proof_url: string | null;
  created_by: string;
  claimed_by: string | null;
}

import { getServiceLabel } from '@/constants/serviceTypes';

const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [autoShowRating, setAutoShowRating] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [generatorPhone, setGeneratorPhone] = useState('');
  const [claimerName, setClaimerName] = useState('');
  const [claimerRating, setClaimerRating] = useState({ average: 0, count: 0 });
  const [hasRated, setHasRated] = useState(false);

  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !id) {
      navigate('/auth');
      return;
    }
    fetchLead();
  }, [user, id, navigate]);

  const fetchLead = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('leads')
      .select('*, categories(name)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'Lead not found',
      });
      navigate('/history');
      return;
    }

    setLead(data as unknown as Lead);

    // Fetch generator profile for phone
    if (data.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', data.created_by)
        .maybeSingle();

      if ((profile as any)?.phone) {
        setGeneratorPhone((profile as any).phone);
      }
    }

    // Fetch claimer info and ratings if lead is claimed/completed
    if (data.claimed_by) {
      const { data: claimerProfile } = await supabase
        .from('profiles')
        .select('user_name')
        .eq('id', data.claimed_by)
        .maybeSingle();

      if ((claimerProfile as any)?.user_name) {
        setClaimerName((claimerProfile as any).user_name);
      }

      // Fetch claimer's average rating (table may not exist yet)
      try {
        const { data: ratings } = await (supabase as any)
          .from('ratings')
          .select('rating')
          .eq('rated_user_id', data.claimed_by);

        if (ratings && ratings.length > 0) {
          const avg = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length;
          setClaimerRating({ average: avg, count: ratings.length });
        }
      } catch (e) {
        console.warn('Ratings table not available:', e);
      }

      // Check if already rated this lead
      if (user) {
        try {
          const { data: existingRating } = await (supabase as any)
            .from('ratings')
            .select('id')
            .eq('lead_id', id)
            .eq('rater_id', user.id)
            .maybeSingle();

          setHasRated(!!existingRating);

          // Auto-show rating modal for generator when lead is completed and not yet rated
          if (data.status === 'completed' && data.created_by === user.id && !existingRating) {
            setAutoShowRating(true);
          }
        } catch (e) {
          console.warn('Ratings check not available:', e);
        }
      }
    }

    setLoading(false);
  };

  const isGenerator = lead?.created_by === user?.id;
  const isClaimer = lead?.claimed_by === user?.id;
  const daysRemaining = getDaysUntilExpiry(lead?.claimed_at || null);
  const aboutToExpire = isLeadAboutToExpire(lead?.claimed_at || null);

  const handleRejectLead = async () => {
    if (!lead || !user) return;

    setActionLoading(true);

    const { success, error } = await rejectLead(lead.id);

    setActionLoading(false);

    if (!success) {
      const errorMsg = typeof error === 'string' ? error : 'Failed to reject lead';
      toast({
        variant: 'destructive',
        title: t('error'),
        description: errorMsg,
      });
    } else {
      // Notify the appropriate party
      if (isClaimer && lead.created_by) {
        // Notify lead generator that agent rejected the lead
        await triggerLeadNotification(lead.created_by, 'rejected', {
          id: lead.id,
          service_type: lead.categories?.name || 'Service',
        });
      } else if (isGenerator && lead.claimed_by) {
        // Notify agent that generator took back the lead
        await triggerLeadNotification(lead.claimed_by, 'recalled', {
          id: lead.id,
          service_type: lead.categories?.name || 'Service',
        });
      }

      toast({
        title: t('success'),
        description: isClaimer ? 'Lead released back to available' : 'Lead retrieved successfully',
      });
      setShowRejectModal(false);
      navigate('/history');
    }
  };

  const handleCompleteLead = async () => {
    if (!lead || !user || !proofFile) return;

    setActionLoading(true);

    try {
      // Upload proof image
      const fileExt = proofFile.name.split('.').pop();
      const filePath = `proofs/${lead.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('lead-proofs')
        .upload(filePath, proofFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('lead-proofs')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded proof');
      }

      // Use the completeLead utility function
      const { success, error } = await completeLead(
        lead.id,
        urlData.publicUrl,
        generatorPhone
      );

      if (!success) {
        const errorMsg = typeof error === 'string' ? error : 'Failed to update lead status';
        throw new Error(errorMsg);
      }

      // Award 5 credits to the lead GENERATOR (created_by)
      // The DB trigger handles this automatically when status changes to 'completed'
      // The trigger awards to created_by (generator)

      // Try to notify (non-critical, may fail due to RLS)
      if (lead.created_by) {
        try {
          await triggerLeadNotification(lead.created_by, 'completed', {
            id: lead.id,
            service_type: lead.categories?.name || 'Service',
          });
        } catch (notifErr) {
          console.warn('Notification failed (non-critical):', notifErr);
        }
      }

      toast({
        title: t('success'),
        description: 'Lead completed successfully!',
      });
      setShowCompleteModal(false);
      setProofFile(null);

      // Refresh lead data to update status
      await fetchLead();

    } catch (error) {
      console.error('Complete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete lead';
      toast({
        variant: 'destructive',
        title: t('error'),
        description: errorMessage,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openWhatsAppChat = (targetPhone: string, isAgentConnection: boolean) => {
    if (!targetPhone) {
      toast({
        title: t('error'),
        description: 'No phone number available',
        variant: 'destructive',
      });
      return;
    }

    const message = generateLeadWhatsAppMessage(
      lead?.id || '',
      user?.user_metadata?.name || 'User',
      lead?.categories?.name || 'Service'
    );
    openWhatsApp(targetPhone, message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="min-h-screen bg-background pb-24 md:ml-60 md:pb-6">
      <Header title="Lead Details" showBack />

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {/* Expiry Warning */}
        {(isClaimer || isGenerator) && lead.status === 'claimed' && daysRemaining !== null && (
          <div className={`rounded-2xl p-4 flex items-start gap-3 ${aboutToExpire
            ? 'bg-destructive/10 border border-destructive/30'
            : 'bg-secondary/10 border border-secondary/30'
            }`}>
            <AlertTriangle
              className={aboutToExpire ? 'text-destructive' : 'text-secondary'}
              size={20}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {daysRemaining > 0
                  ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                  : 'Lead expires today'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isClaimer
                  ? 'Complete this lead or it will be automatically released.'
                  : 'This lead will be automatically released if not completed in time.'}
              </p>
            </div>
          </div>
        )}

        {/* Lead Code Badge */}
        {lead.lead_code && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm font-mono">
            <Hash size={14} className="text-muted-foreground" />
            {lead.lead_code}
          </div>
        )}

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${lead.status === 'completed' ? 'bg-primary/20 text-primary' :
          lead.status === 'claimed' ? 'bg-secondary/20 text-secondary' :
            lead.status === 'open' ? 'bg-accent text-accent-foreground' :
              'bg-destructive/20 text-destructive'
          }`}>
          {lead.status === 'completed' ? <CheckCircle size={16} /> :
            lead.status === 'claimed' ? <Clock size={16} /> :
              <FileText size={16} />}
          {t(lead.status)}
        </div>

        {/* Service Type Card */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {lead.categories?.name || 'Service'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Created {formatDistanceToNow(new Date(lead.created_at))} {t('ago')}
              </p>
            </div>
          </div>
        </div>

        {/* Location - Visible for subscribed/claimed/generated users */}
        {(isClaimer || isGenerator || profile?.is_subscribed) && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <MapPin className="text-primary mt-1 shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-foreground">{t('location')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {lead.address || lead.location_address || 'No address provided'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location - Blurred for non-subscribed users unless claimed/generated */}
        {(!profile?.is_subscribed && !isClaimer && !isGenerator) && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <MapPin className="text-primary mt-1 shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-foreground">{t('location')}</h3>
                <p className="text-sm text-muted-foreground mt-1 blur-sm select-none">
                  {lead.location_address ? lead.location_address.split(',')[0] + '...' : 'Location details hidden'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Info - Only for claimer, generator, or subscribed users */}
        {(isClaimer || isGenerator || profile?.is_subscribed) && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User size={18} className="text-primary" />
              Customer Details
            </h3>

            {lead.customer_name && (
              <p className="text-sm text-foreground">{lead.customer_name}</p>
            )}

            {/* Customer phone only for generator */}
            {isGenerator && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-muted-foreground" />
                <span className="text-sm">{lead.customer_phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {lead.notes && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-semibold text-foreground mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground">{lead.notes}</p>
          </div>
        )}

        {/* Special Instructions */}
        {lead.special_instructions && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4">
            <h3 className="font-semibold text-foreground mb-2">Special Instructions</h3>
            <p className="text-sm text-muted-foreground">{lead.special_instructions}</p>
          </div>
        )}

        {/* Proof Image */}
        {lead.proof_url && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-semibold text-foreground mb-2">Proof of Completion</h3>
            <img
              src={lead.proof_url}
              alt="Proof"
              className="w-full rounded-xl"
            />
          </div>
        )}

        {/* Actions for Claimer */}
        {isClaimer && lead.status === 'claimed' && (
          <div className="space-y-3 pt-4">
            {/* Chat with Generator */}
            {generatorPhone && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => openWhatsAppChat(generatorPhone, true)}
              >
                <MessageSquare size={18} />
                Chat with Lead Generator
              </Button>
            )}

            {/* Complete Lead */}
            <Button
              variant="hero"
              className="w-full"
              onClick={() => setShowCompleteModal(true)}
            >
              <CheckCircle size={18} />
              Complete Lead
            </Button>

            {/* Reject Lead */}
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle size={18} />
              Reject / Cancel
            </Button>
          </div>
        )}

        {/* Actions for Generator */}
        {isGenerator && lead.status === 'claimed' && lead.claimed_by && (
          <div className="space-y-3 pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                const { data } = await supabase
                  .from('profiles')
                  .select('phone')
                  .eq('id', lead.claimed_by!)
                  .maybeSingle();

                if (data?.phone) {
                  openWhatsAppChat(data.phone, false);
                }
              }}
            >
              <MessageSquare size={18} />
              Chat with Agent
            </Button>

            {/* Get Back Lead */}
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle size={18} />
              Get Back Lead
            </Button>
          </div>
        )}
        {/* Rate User Button - for generator when lead is completed */}
        {isGenerator && lead.status === 'completed' && lead.claimed_by && !hasRated && (
          <div className="pt-4">
            <Button
              variant="hero"
              className="w-full"
              onClick={() => setShowRatingModal(true)}
            >
              <Star size={18} />
              Rate Service Provider
            </Button>
          </div>
        )}

        {/* View Profile Button - for generator when lead is claimed */}
        {isGenerator && lead.claimed_by && (
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowProfileModal(true)}
            >
              <Eye size={18} />
              View Provider Profile
              {claimerRating.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  ★ {claimerRating.average.toFixed(1)}
                </Badge>
              )}
            </Button>
          </div>
        )}
      </main>

      {/* Rating Modal */}
      {lead.claimed_by && (
        <RatingModal
          open={showRatingModal || autoShowRating}
          onOpenChange={(open) => {
            setShowRatingModal(open);
            setAutoShowRating(false);
          }}
          leadId={lead.id}
          ratedUserId={lead.claimed_by}
          ratedUserName={claimerName}
          onRatingSubmitted={() => {
            setHasRated(true);
            navigate('/history');
          }}
        />
      )}

      {/* User Profile Modal */}
      {lead.claimed_by && (
        <UserProfileModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          userId={lead.claimed_by}
        />
      )}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{isClaimer ? 'Reject Lead?' : 'Get Back Lead?'}</DialogTitle>
            <DialogDescription>
              {isClaimer
                ? 'This lead will go back to available status and can be claimed by others.'
                : 'This will release the lead from the current agent and make it available for others to claim.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRejectModal(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleRejectLead}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="animate-spin" size={18} /> : (isClaimer ? 'Reject' : 'Get Back')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Complete Lead</DialogTitle>
            <DialogDescription>
              Upload proof (receipt, document, or photo) to mark this lead as completed.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
              {proofFile ? (
                <div className="text-center">
                  <CheckCircle className="mx-auto text-primary mb-2" size={32} />
                  <p className="text-sm text-foreground">{proofFile.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto text-muted-foreground mb-2" size={32} />
                  <p className="text-sm text-muted-foreground">Click to upload proof</p>
                </div>
              )}
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCompleteModal(false);
                setProofFile(null);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="hero"
              className="flex-1"
              onClick={handleCompleteLead}
              disabled={actionLoading || !proofFile}
            >
              {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Complete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default LeadDetails;
