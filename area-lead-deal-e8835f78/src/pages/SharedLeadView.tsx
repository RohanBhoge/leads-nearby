import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Clock, Tag, FileText, IndianRupee, Loader2,
    Navigation, Share2, ExternalLink, UserPlus, ImageIcon,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface SharedLead {
    id: string;
    lead_code: string | null;
    categories: { name: string } | null;
    sub_categories: { name: string } | null;
    location_address: string | null;
    description: string | null;
    images?: string[] | null;
    amount?: number | null;
    status: string;
    created_at: string;
    notes: string | null;
    special_instructions: string | null;
}

const SharedLeadView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [lead, setLead] = useState<SharedLead | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (!id) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        fetchLead();
    }, [id]);

    const fetchLead = async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('id, lead_code, categories(name), sub_categories(name), location_address, description, images, amount, status, created_at, notes, special_instructions')
            .eq('id', id!)
            .maybeSingle();

        if (error || !data) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        setLead(data as unknown as SharedLead);
        setLoading(false);
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        const shareText = `Check out this lead on Leads Nearby: ${lead?.categories?.name || 'Lead'}`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Leads Nearby', text: shareText, url: shareUrl });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(shareUrl);
            toast({ title: 'Link copied!', description: 'Share this link with anyone.' });
        }
    };

    const statusConfig: Record<string, { label: string; color: string }> = {
        active: { label: 'Available', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
        claimed: { label: 'Claimed', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
        completed: { label: 'Completed', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
        rejected: { label: 'Rejected', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading lead details...</p>
                </div>
            </div>
        );
    }

    if (notFound || !lead) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-6">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <FileText size={36} className="text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">Lead Not Found</h1>
                    <p className="text-sm text-muted-foreground">
                        This lead may have been removed or the link is invalid.
                    </p>
                    <Button onClick={() => navigate('/')} variant="hero" className="rounded-xl">
                        Go to Leads Nearby
                    </Button>
                </div>
            </div>
        );
    }

    const status = statusConfig[lead.status] || statusConfig.active;
    const images = lead.images || [];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Navigation size={16} className="text-primary-foreground fill-current" />
                        </div>
                        <span className="text-base font-bold text-foreground">Leads Nearby</span>
                    </div>
                    <Button
                        onClick={handleShare}
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                    >
                        <Share2 size={16} />
                        Share
                    </Button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-32">
                {/* Status + Category */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${status.color} border text-xs font-semibold px-2.5 py-1`}>
                            {status.label}
                        </Badge>
                        {lead.lead_code && (
                            <Badge variant="outline" className="text-xs text-muted-foreground font-mono">
                                #{lead.lead_code}
                            </Badge>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-foreground leading-tight">
                        {lead.categories?.name || 'Lead'}
                    </h1>

                    {lead.sub_categories?.name && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Tag size={14} />
                            {lead.sub_categories.name}
                        </div>
                    )}
                </div>

                {/* Images */}
                {images.length > 0 && (
                    <div className="relative rounded-2xl overflow-hidden bg-muted/30 border border-border">
                        <img
                            src={images[currentImageIndex]}
                            alt={`Lead image ${currentImageIndex + 1}`}
                            className="w-full h-64 sm:h-80 object-cover"
                        />
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentImageIndex(i => (i - 1 + images.length) % images.length)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setCurrentImageIndex(i => (i + 1) % images.length)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {images.map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-2 h-2 rounded-full transition-colors ${i === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Location */}
                    {lead.location_address && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                <MapPin size={18} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                                <p className="text-sm font-medium text-foreground">{lead.location_address}</p>
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    {lead.amount != null && lead.amount > 0 && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                            <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <IndianRupee size={18} className="text-green-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Estimated Value</p>
                                <p className="text-sm font-bold text-foreground">₹{lead.amount.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    )}

                    {/* Posted */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                        <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                            <Clock size={18} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Posted</p>
                            <p className="text-sm font-medium text-foreground">
                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {lead.description && (
                    <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{lead.description}</p>
                    </div>
                )}

                {/* Notes */}
                {lead.notes && (
                    <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                )}

                {/* Special Instructions */}
                {lead.special_instructions && (
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Special Instructions</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{lead.special_instructions}</p>
                    </div>
                )}
            </main>

            {/* Sticky CTA */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
                <div className="max-w-2xl mx-auto p-4 space-y-2">
                    <Button
                        onClick={() => navigate('/auth')}
                        variant="hero"
                        className="w-full h-12 rounded-xl text-base font-semibold gap-2"
                    >
                        <UserPlus size={20} />
                        Sign up to claim this lead
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                        Join Leads Nearby to connect with customers in your area
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SharedLeadView;
