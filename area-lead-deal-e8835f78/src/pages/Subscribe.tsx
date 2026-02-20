import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle, Shield, Loader2, CreditCard, RefreshCw, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import SubscriptionTimer from '@/components/SubscriptionTimer';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Subscribe: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if Razorpay script is loaded
  useEffect(() => {
    const checkRazorpay = () => {
      if (typeof window.Razorpay !== 'undefined') {
        setRazorpayLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkRazorpay()) return;

    // Poll every 500ms for up to 10 seconds
    const interval = setInterval(() => {
      if (checkRazorpay()) {
        clearInterval(interval);
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!razorpayLoaded) {
        toast({
          variant: 'destructive',
          title: 'Payment System Error',
          description: 'Razorpay failed to load. Please refresh the page.',
        });
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [razorpayLoaded, toast]);


  const handleApplyCoupon = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please login to apply coupon.',
      });
      return;
    }

    if (!couponCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a coupon code.',
      });
      return;
    }

    setCouponLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      console.log('Applying Coupon - Access Token:', accessToken ? 'Present' : 'Missing');
      if (!accessToken) console.error('No access token found in session');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-razorpay-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'X-User-Token': accessToken || ""
        },
        body: JSON.stringify({ coupon_code: couponCode.trim().toUpperCase() })
      });

      // Handle raw text response first to avoid JSON parse errors
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply coupon');
      }

      if (data?.type === 'coupon-applied') {
        toast({
          title: '🎉 Coupon Applied!',
          description: data.message,
        });

        await refreshProfile();

        setTimeout(() => {
          navigate('/get-leads');
        }, 1500);
      } else if (data?.error) {
        toast({
          variant: 'destructive',
          title: 'Invalid Coupon',
          description: data.error,
        });
      }
    } catch (error) {
      console.error('Coupon error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to apply coupon',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const PLAN_PRICE = 99;

  const handleSubscribe = async () => {
    const razorpayReady = typeof window.Razorpay !== 'undefined';
    if (!user || (!razorpayLoaded && !razorpayReady)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Payment system not ready. Please try again.',
      });
      return;
    }

    setLoading(true);

    try {
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!key) throw new Error('Razorpay key not configured');

      const credits = profile?.credit_balance || 0;
      let payableAmount = PLAN_PRICE;
      let creditsToDeduct = 0;

      // Logic: Use credits to reduce price
      if (credits > 0) {
        if (credits >= PLAN_PRICE) {
          payableAmount = 0;
          creditsToDeduct = PLAN_PRICE;
        } else {
          payableAmount = PLAN_PRICE - credits;
          creditsToDeduct = credits;
        }
      }

      console.log(`Plan: ${PLAN_PRICE}, Credits: ${credits}, Payable: ${payableAmount}, Deduct: ${creditsToDeduct}`);

      // CASE 1: Full Payment via Credits
      if (payableAmount === 0) {
        // @ts-ignore
        const { data, error } = await supabase.rpc('purchase_subscription_via_credits', {
          p_user_id: user.id,
          p_cost: creditsToDeduct,
          p_duration_days: 30
        });

        if (error) throw error;
        // RPC returns JSONB, check success field
        const result = data as any;
        if (!result || !result.success) throw new Error(result?.error || 'Failed to purchase with credits');

        toast({
          title: '🎉 Subscription Activated!',
          description: `Paid fully using ${creditsToDeduct} credits.`,
        });
        await refreshProfile();
        setTimeout(() => navigate('/get-leads'), 1500);
        return;
      }

      // CASE 2: Partial Payment (Razorpay Order) or Full Payment (Razorpay One-Time)
      // We use the Order flow for everything now to support dynamic pricing (₹99) without needing new Plan IDs.
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      console.log('Initiating Payment via Razorpay Order...');

      // 1. Create Order
      const orderResponse = await fetch(`${supabaseUrl}/functions/v1/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ amount: payableAmount, currency: "INR" })
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error || 'Failed to create order');

      // 2. Open Razorpay
      const options: any = {
        key: key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'LEADX Premium',
        description: creditsToDeduct > 0 ? `Partial Payment (Credits: ${creditsToDeduct})` : 'Premium Subscription',
        order_id: orderData.id,
        prefill: {
          name: profile?.name ?? 'User',
          email: user.email,
          contact: profile?.phone
        },
        theme: { color: '#0f172a' },
        handler: async (response: any) => {
          try {
            // 3. Complete Payment on Backend
            // @ts-ignore
            const { data: completeData, error: completeError } = await supabase.rpc('complete_partial_payment', {
              p_user_id: user.id,
              p_credits_deducted: creditsToDeduct,
              p_payment_amount: payableAmount,
              p_payment_id: response.razorpay_payment_id,
              p_order_id: response.razorpay_order_id
            });

            if (completeError) throw completeError;
            const result = completeData as any;
            if (!result.success) throw new Error(result.error || 'Failed to complete payment');

            toast({ title: '🎉 Subscription Activated!', description: 'Payment successful.' });
            await refreshProfile();
            setTimeout(() => navigate('/get-leads'), 1500);

          } catch (err: any) {
            console.error('Verification failed:', err);
            toast({ variant: 'destructive', title: 'Error', description: err.message });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.',
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    /* Auth check handled by ProtectedRoute */
    if (!user) return; // Just safety return, no navigate needed

    // Fetch payment history
    const fetchPayments = async () => {
      // @ts-ignore
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setPaymentHistory(data || []);
    };

    fetchPayments();
  }, [user, navigate]);

  const benefits = [
    'View full lead details including customer phone',
    'Accept unlimited leads in your area',
    'Priority notifications for new leads',
    'Chat with lead generators',
    'Access to community chat',
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:ml-60 md:pb-6">
      <Header title="Subscription" showBack />

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Current Status with Timer */}
        <div className={`rounded-2xl p-6 text-center ${profile?.is_subscribed
          ? 'bg-primary/10 border-2 border-primary'
          : 'bg-card border border-border'
          }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${profile?.is_subscribed ? 'bg-primary' : 'bg-secondary'
            }`}>
            <Star size={32} className={profile?.is_subscribed ? 'fill-primary-foreground text-primary-foreground' : 'text-secondary-foreground'} />
          </div>

          <h2 className="text-xl font-bold text-foreground">
            {profile?.is_subscribed ? 'Premium Active' : 'Free Plan'}
          </h2>

          {/* Subscription Timer */}
          <div className="mt-4">
            <SubscriptionTimer
              expiresAt={profile?.subscription_expires_at || null}
              isSubscribed={profile?.is_subscribed || false}
            />
          </div>
        </div>

        {/* Premium Plan Card */}
        {!profile?.is_subscribed && (
          <div className="bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl p-6 border border-secondary/30 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Premium Plan
                </h2>
                <p className="text-xl font-bold mt-2">₹99 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border space-y-4 mb-8"></div>
            </div>

            <ul className="space-y-3 mb-6">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="text-primary shrink-0 mt-0.5" size={18} />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="bg-primary/10 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-primary font-medium">
                ✨ Autopay enabled - Auto-renews every 30 days
              </p>
            </div>

            {/* Coupon Code Input */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="pl-10 uppercase"
                    disabled={couponLoading}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                >
                  {couponLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Have a coupon? Enter it above for special offers!
              </p>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or pay with card</span>
              </div>
            </div>

            <Button
              variant="heroSecondary"
              className="w-full"
              onClick={handleSubscribe}
              disabled={loading || !razorpayLoaded}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <CreditCard size={20} />
                  <span>{t('subscribeNow')}</span>
                </>
              )}
            </Button>

            {!razorpayLoaded && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Loading payment system...
              </p>
            )}
          </div>
        )}

        {/* Renew Button for existing subscribers */}
        {profile?.is_subscribed && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSubscribe}
              disabled={loading || !razorpayLoaded}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>Renew Subscription</span>
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Extend by another 30 days
            </p>
          </div>
        )}

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Payment History</h3>
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-foreground">₹{payment.amount}</p>
                    <p className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Summary UI */}
        {!profile?.is_subscribed && (profile?.credit_balance || 0) > 0 && (
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Plan Price</span>
              <span>₹{PLAN_PRICE}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>Credits applied</span>
              <span>- ₹{Math.min(profile?.credit_balance || 0, PLAN_PRICE)}</span>
            </div>
            <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-lg">
              <span>To Pay</span>
              <span>₹{Math.max(0, PLAN_PRICE - (profile?.credit_balance || 0))}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Using credits will make this a one-time 30-day plan instead of auto-renewing.
            </p>
          </div>
        )}

        {/* Subscribe Button */}
        {!profile?.is_subscribed ? (
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all rounded-xl shadow-lg shadow-primary/25"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CreditCard className="w-5 h-5 mr-2" />
            )}
            {(profile?.credit_balance || 0) >= PLAN_PRICE ? 'Pay with Credits' : `Pay ₹${Math.max(0, PLAN_PRICE - (profile?.credit_balance || 0))}`}
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            variant="outline"
            className="w-full h-12"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Renew Subscription
          </Button>
        )}

        {/* Already Subscribed Message */}
        {profile?.is_subscribed && (
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <CheckCircle className="text-primary mx-auto mb-3" size={48} />
            <h3 className="font-semibold text-foreground">You're all set!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Enjoy unlimited access to all leads in your area.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/get-leads')}
            >
              Browse Leads
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Subscribe;
