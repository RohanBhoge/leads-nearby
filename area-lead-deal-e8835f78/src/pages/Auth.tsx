import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, Phone, Layers, Grid, Eye, EyeOff } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';
import RadiusSlider from '@/components/RadiusSlider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit phone number'),
  category_id: z.string().optional(),
  sub_category_id: z.string().optional(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subCategoryId, setSubCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [subCategories, setSubCategories] = useState<{ id: string; name: string; category_id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radius, setRadius] = useState(10);
  const [referralCode, setReferralCode] = useState('');

  const { signIn, signUp, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCategories() {
      console.log("Fetching categories...");
      console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);

      const { data: catData, error: catError } = await supabase.from('categories').select('id, name');
      if (catError) console.error("Category Fetch Error:", catError);
      else console.log("Categories fetched:", catData);

      const { data: subCatData, error: subCatError } = await supabase.from('sub_categories').select('id, name, category_id');
      if (subCatError) console.error("SubCategory Fetch Error:", subCatError);
      else console.log("SubCategories fetched:", subCatData);

      if (catData) setCategories(catData);
      if (subCatData) setSubCategories(subCatData);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (isForgotPassword) {
        z.string().email().parse(email);
        setErrors({});
        return true;
      }

      // Check privacy policy acceptance for both login and signup
      if (!isLogin && !acceptedPrivacy) {
        setErrors({ privacy: 'You must accept the Privacy Policy to continue' });
        return false;
      }

      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({
          email,
          password,
          name,
          phone,
          category_id: categoryId,
          sub_category_id: subCategoryId,
          confirmPassword
        });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error.message,
      });
    } else {
      toast({
        title: t('success'),
        description: 'Password reset email sent! Check your inbox.',
      });
      setIsForgotPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isForgotPassword) {
      handleForgotPassword();
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: t('error'),
            description: error.message || 'Failed to sign in',
          });
        } else {
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(
          email,
          password,
          name,
          phone,
          categoryId || null,
          subCategoryId || null,
          'user',
          latitude,
          longitude,
          radius,
          referralCode
        );
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: t('error'),
              description: 'This email is already registered. Please sign in.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: t('error'),
              description: error.message || 'Failed to sign up',
            });
          }
        } else {
          toast({
            title: t('success'),
            description: 'Account created successfully!',
          });
          navigate('/dashboard');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent to-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div />
        <LanguageToggle />
      </div>

      {/* Logo Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
            <span className="text-3xl font-extrabold text-primary-foreground">LN</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">LEADS NEARBY</h1>
          <p className="text-muted-foreground mt-1">{t('tagline')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 animate-fade-in">
          {isForgotPassword ? (
            <>
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Reset Password</h2>
                <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    type="email"
                    placeholder={t('email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 text-base rounded-xl bg-card border-border"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {!isLogin && (
                <>
                  <div className="space-y-1">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <Input
                        type="text"
                        placeholder="User Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-12 h-14 text-base rounded-xl bg-card border-border"
                      />
                    </div>
                    {errors.name && <p className="text-destructive text-sm pl-2">{errors.name}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <Input
                        type="tel"
                        placeholder={t('phone')}
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(val);
                        }}
                        className="pl-12 h-14 text-base rounded-xl bg-card border-border"
                      />
                    </div>
                    {errors.phone && <p className="text-destructive text-sm pl-2">{errors.phone}</p>}
                  </div>

                  {/* Category Dropdown */}
                  <div className="space-y-1">
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" size={20} />
                      <Select onValueChange={setCategoryId} value={categoryId}>
                        <SelectTrigger className="pl-12 h-14 text-base rounded-xl bg-card border-border w-full">
                          <SelectValue placeholder="Select Category" />
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
                  </div>

                  {/* SubCategory Dropdown */}
                  <div className="space-y-1">
                    <div className="relative">
                      <Grid className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" size={20} />
                      <Select
                        onValueChange={setSubCategoryId}
                        value={subCategoryId}
                        disabled={!categoryId}
                      >
                        <SelectTrigger className="pl-12 h-14 text-base rounded-xl bg-card border-border w-full">
                          <SelectValue placeholder="Select Subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {subCategories
                            .filter(sc => sc.category_id === categoryId)
                            .map((sc) => (
                              <SelectItem key={sc.id} value={sc.id}>
                                {sc.name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location Section - Only shown if signup */}
                  {!isLogin && (
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Your Service Location
                        </label>
                        <LocationPicker
                          latitude={latitude}
                          longitude={longitude}
                          onLocationChange={(lat, lng) => {
                            setLatitude(lat);
                            setLongitude(lng);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    type="email"
                    placeholder={t('email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 text-base rounded-xl bg-card border-border"
                  />
                </div>
                {errors.email && <p className="text-destructive text-sm pl-2">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-10 h-14 text-base rounded-xl bg-card border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-sm pl-2">{errors.password}</p>}
              </div>

              {!isLogin && (
                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12 pr-10 h-14 text-base rounded-xl bg-card border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-destructive text-sm pl-2">{errors.confirmPassword}</p>}
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Referral Code (Optional)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Privacy Policy Checkbox */}
              {!isLogin && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={acceptedPrivacy}
                    onChange={(e) => {
                      setAcceptedPrivacy(e.target.checked);
                      if (e.target.checked && errors.privacy) {
                        setErrors({ ...errors, privacy: '' });
                      }
                    }}
                    className="mt-1 w-5 h-5 rounded border-border cursor-pointer"
                  />
                  <label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer">
                    I accept the{' '}
                    <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    {' '}and{' '}
                    <Link to="/terms-of-service" target="_blank" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                  </label>
                  {errors.privacy && <p className="text-destructive text-sm pl-8">{errors.privacy}</p>}
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            variant="hero"
            className="w-full mt-6"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <span>
                  {isForgotPassword ? 'Send Reset Link' : isLogin ? t('login') : 'CREATE NEW ACCOUNT'}
                </span>
                <ArrowRight size={20} />
              </>
            )}
          </Button>
        </form>

        {/* Links & Secondary Actions */}
        <div className="w-full max-w-sm mt-4 space-y-4">

          {/* Create Account Button (Login Mode Only) */}
          {!isForgotPassword && isLogin && (
            <Button
              type="button"
              variant="hero"
              className="w-full mt-2 bg-white text-primary border-2 border-primary/20 hover:bg-gray-50 hover:border-primary shadow-none"
              onClick={() => {
                setIsLogin(false);
                setErrors({});
              }}
            >
              CREATE NEW ACCOUNT
            </Button>
          )}

          {/* Links Container */}
          <div className="text-center space-y-3 pt-2">
            {!isForgotPassword && isLogin && (
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Forgot Password?
              </button>
            )}

            {(isForgotPassword || !isLogin) && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                  setErrors({});
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                ← Back to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;