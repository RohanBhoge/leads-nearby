import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, MapPin, Bell, Users, Zap, Shield, Phone, Mail, Globe, Search, PlusCircle, Briefcase, Navigation, Star, Menu, X, Plus, Minus, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

// ── Category Background Images ──
import imgEvents from '@/assets/Events & Celebrations.png';
import imgHomeRepairs from '@/assets/Home Repairs & Maintenance.png';
import imgElectronic from '@/assets/Electronic & Home Appliances.png';
import imgAcademic from '@/assets/Academic & College Services.png';
import imgLogistics from '@/assets/Logistics & Daily Labor.png';
import imgPersonalCare from '@/assets/Personal Care & Wellness.png';
import imgCleaning from '@/assets/Cleaning & Sanitization.png';
import imgProfessional from '@/assets/Professional & Legal Services.png';
import imgIT from '@/assets/IT & Digital Solutions.png';
import imgUrgent from '@/assets/Urgent & Emergency Help.png';
import imgHospitality from '@/assets/Hospitality & Stay Management.png';

// ── Typing Animation Strings ──
const TYPING_STRINGS = [
  "Plumber",
  "Electrician",
  "Rent Agreement",
  "Home Tutor",
  "Event Host",
  "AC Repair",
  "House Cleaner",
  "CCTV Setup",
  "Packers & Movers",
];

// ── All 11 Service Categories ──
const SERVICE_CATEGORIES = [
  { titleKey: 'catEvents', subtitleKey: 'catSubEvents', image: imgEvents },
  { titleKey: 'catHomeRepairs', subtitleKey: 'catSubHomeRepairs', image: imgHomeRepairs },
  { titleKey: 'catElectronic', subtitleKey: 'catSubElectronic', image: imgElectronic },
  { titleKey: 'catAcademic', subtitleKey: 'catSubAcademic', image: imgAcademic },
  { titleKey: 'catLogistics', subtitleKey: 'catSubLogistics', image: imgLogistics },
  { titleKey: 'catPersonalCare', subtitleKey: 'catSubPersonalCare', image: imgPersonalCare },
  { titleKey: 'catCleaning', subtitleKey: 'catSubCleaning', image: imgCleaning },
  { titleKey: 'catProfessional', subtitleKey: 'catSubProfessional', image: imgProfessional },
  { titleKey: 'catIT', subtitleKey: 'catSubIT', image: imgIT },
  { titleKey: 'catUrgent', subtitleKey: 'catSubUrgent', image: imgUrgent },
  { titleKey: 'catHospitality', subtitleKey: 'catSubHospitality', image: imgHospitality },
];

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ── Typing Animation State ──
  const [currentText, setCurrentText] = useState("");
  const [stringIndex, setStringIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Landing page is accessible to everyone — no redirect

  // ── Typing Effect ──
  useEffect(() => {
    if (isPaused) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(timeout);
    }

    const currentString = TYPING_STRINGS[stringIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentString.length) {
          setCurrentText((prev) => prev + currentString[charIndex]);
          setCharIndex((prev) => prev + 1);
        } else {
          setIsPaused(true);
        }
      } else {
        if (charIndex > 0) {
          setCurrentText((prev) => prev.slice(0, -1));
          setCharIndex((prev) => prev - 1);
        } else {
          setIsDeleting(false);
          setStringIndex((prev) => (prev + 1) % TYPING_STRINGS.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, isPaused, stringIndex]);

  // ── Header shadow on scroll ──
  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // ── Scroll Reveal Observer ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
      );

      document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ═══════════════════════════════════════════ */}
      {/* HEADER — Responsive with Hamburger          */}
      {/* ═══════════════════════════════════════════ */}
      <header className={`border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50 transition-shadow duration-500 ${headerScrolled ? 'shadow-lg shadow-black/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-12 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/30">
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground fill-current" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              Leads <span className="text-primary">Nearby</span>
            </span>
          </div>

          {/* Desktop Nav — visible on lg (1024px+) */}
          <nav className="hidden lg:flex items-center gap-4">
            <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">{t('navServices')}</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">{t('navHowItWorks')}</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">{t('navContact')}</a>
            <LanguageToggle />
            {user ? (
              <Button
                variant="hero"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
              >
                {t('dashboard') || 'Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200">
                  {t('login')}
                </Button>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
                >
                  <PlusCircle className="w-4 h-4" />
                  {t('navPostJob')}
                </Button>
                <button
                  className="h-9 px-4 bg-[#FF8C00] hover:bg-orange-600 active:scale-[0.97] transition-all duration-300 rounded-lg flex items-center gap-2 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.03] text-white font-semibold text-sm"
                  onClick={() => navigate('/auth')}
                >
                  <Briefcase className="w-4 h-4" />
                  {t('navFindWork')}
                </button>
              </>
            )}
          </nav>

          {/* Mobile / Tablet Menu Button — visible below lg */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageToggle />
            <button
              className="p-2 rounded-full hover:bg-accent transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card p-4 animate-slide-up">
            <div className="flex flex-col gap-3">
              <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-primary py-2 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>{t('navServices')}</a>
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary py-2 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>{t('navHowItWorks')}</a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-primary py-2 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>{t('navContact')}</a>
              <div className="border-t border-border pt-3 mt-1 flex flex-col gap-2">
                {user ? (
                  <Button variant="hero" size="sm" onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} className="w-full gap-2">
                    {t('dashboard') || 'Dashboard'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }} className="w-full">{t('login')}</Button>
                    <Button variant="hero" size="sm" onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }} className="w-full gap-2">
                      <PlusCircle className="w-4 h-4" /> {t('navPostJob')}
                    </Button>
                    <button
                      className="h-10 bg-[#FF8C00] hover:bg-orange-600 active:scale-[0.97] transition-all rounded-lg flex items-center justify-center gap-2 text-white font-semibold text-sm w-full"
                      onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}
                    >
                      <Briefcase className="w-4 h-4" /> {t('navFindWork')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION — Always visible on load        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="snap-section relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary blur-[120px] animate-float"></div>
          <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary blur-[100px]" style={{ animation: 'float 4s ease-in-out 1.5s infinite' }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-28 text-center">
          {/* Badge — CSS animation, no scroll-reveal */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-scale-in">
            <Bell size={16} />
            {t('heroBadge')}
          </div>

          {/* Heading — CSS animation */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-8 tracking-tight leading-tight animate-slide-up">
            {t('heroHeading')}
          </h1>
          <p className='m-5'>{t('heroSubtext')}</p>

          {/* Search Bar — CSS animation */}
          {/* <div className="relative group mb-10 w-full max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="text-primary w-7 h-7" />
            </div>
            <div className="flex items-center w-full h-16 md:h-20 pl-16 pr-6 rounded-2xl bg-card border-2 border-border shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500">
              <span className="text-muted-foreground text-lg md:text-2xl w-full overflow-hidden whitespace-nowrap text-left flex items-center">
                {t('heroSearchPrefix')}&nbsp;
                <span className="text-foreground font-medium border-r-2 border-primary animate-cursor-blink h-7 flex items-center">
                  {currentText}
                </span>
              </span>
            </div>
          </div> */}

          {/* CTA — Get Started */}
          <div className="animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <Button
              variant="hero"
              size="lg"
              className="h-14 md:h-16 gap-3 text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.04] active:scale-[0.97] transition-all duration-300 px-10"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
            >
              {user ? (t('dashboard') || 'Dashboard') : t('heroGetStarted')}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6 animate-slide-up" style={{ animationDelay: '0.45s', animationFillMode: 'both' }}>
            {t('heroTagline')}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SERVICE GRID — All 11 Categories            */}
      {/* ═══════════════════════════════════════════ */}
      <section id="services" className="snap-section py-16 md:py-20 bg-gradient-to-b from-background to-accent/10">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="scroll-reveal flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4" style={{ transitionDelay: '0s' }}>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t('servicesTitle')}</h2>
              <p className="text-muted-foreground">{t('servicesSubtitle')}</p>
            </div>
            <button
              className="text-base font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
              onClick={() => navigate('/auth')}
            >
              {t('servicesSeeAll')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {SERVICE_CATEGORIES.map((service, idx) => (
              <div
                key={service.titleKey}
                className="scroll-reveal group relative overflow-hidden rounded-2xl h-48 md:h-64 cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500"
                style={{ transitionDelay: `${idx * 0.06}s` }}
                onClick={() => navigate('/auth')}
              >
                <img
                  alt={t(service.titleKey)}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={service.image}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-white font-bold text-base md:text-xl block mb-1 group-hover:translate-x-1 transition-transform duration-300">{t(service.titleKey)}</span>
                  <span className="text-slate-200 text-xs md:text-sm hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">{t(service.subtitleKey)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* TRUST SECTION — Testimonial Card            */}
      {/* ═══════════════════════════════════════════ */}
      <section className="snap-section py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-12 scroll-reveal">
          <div className="relative w-full rounded-3xl overflow-hidden bg-card shadow-2xl border border-border hover:shadow-3xl transition-shadow duration-500">
            <div className="grid md:grid-cols-2 h-auto md:h-80">
              <div className="relative h-64 md:h-full order-2 md:order-1 overflow-hidden">
                <img
                  alt="Service provider shaking hands with client"
                  className="absolute inset-0 w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT5_YGy6TcpcWv-ME-jtfu-BkCNJxCNwCMactEeRUNqeiVhDNlqqPeanfaf5i1nnqB1AFVNfx2pheYU3dDr7jgTMfrFxZksv8ozO370U2McXrGkJJbvdFLStHRVrCnYEGzLiQyqvTKYg0_V0tiBYyQ4lF4Yv6ilpkWIrRU_vAdsQiXJ76mo2-HOT80PsG26QYfiE1w-loSWjqgmhW00BXg9DX35R1zjGWgENqVdn197HL6h2Fcj7ZShrIuHIGbkDmMI5UA4DE7D9XX"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-transparent"></div>
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{t('trustBadge')}</span>
                  <div className="flex text-yellow-400 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-foreground font-bold text-2xl md:text-3xl leading-tight mb-4">
                  {t('trustQuote')}
                </p>
                <p className="text-muted-foreground text-lg">
                  {t('trustCommunity')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* VIDEO SECTION — Tutorial                    */}
      {/* ═══════════════════════════════════════════ */}
      {/* <section className="snap-section py-12 bg-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 scroll-reveal">
            How to create an account step-by-step
          </h2>
          <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-border shadow-lg scroll-reveal hover:shadow-2xl transition-shadow duration-500">
            <video
              className="w-full h-full object-cover"
              controls
              controlsList="nodownload"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/placeholder.svg"
            >
              <source src="/assets/account_create_video.mp4" type="video/mp4" />
              <track kind="captions" srcLang="en" label="English" />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-sm text-muted-foreground mt-4 scroll-reveal">
            📹 Watch the complete tutorial • Click to play/pause • Use fullscreen for better viewing
          </p>
        </div>
      </section> */}


      {/* ═══════════════════════════════════════════ */}
      {/* WHY JOIN — Features Section                 */}
      {/* ═══════════════════════════════════════════ */}
      <section className="snap-section py-20 bg-gradient-to-b from-accent/10 to-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </div>

          {/* Main Feature */}
          <div className="mb-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 border border-primary/20 scroll-reveal">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <Bell size={20} />
                  {t('featMainBadge')}
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4">
                  {t('featMainTitle')}
                </h3>
                <p className="text-muted-foreground text-lg mb-6">
                  {t('featMainDesc')}
                </p>
                <ul className="space-y-3">
                  {[
                    t('featBullet1'),
                    t('featBullet2'),
                    t('featBullet3'),
                    t('featBullet4')
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-foreground font-medium">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-xl transition-shadow duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/30 dark:border-green-800">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-300">{t('featLiveDemo')}</span>
                  </div>
                  <div className="text-center text-2xl font-bold text-primary">
                    {t('featClaimNow')}
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {t('featFirstToSee')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <MapPin className="text-primary" size={28} />, title: t('featLocalLeads'), description: t('featLocalLeadsDesc') },
              { icon: <Users className="text-secondary" size={28} />, title: t('featRealPeople'), description: t('featRealPeopleDesc') },
              { icon: <CheckCircle className="text-primary" size={28} />, title: t('featEasyProof'), description: t('featEasyProofDesc') },
              { icon: <Shield className="text-secondary" size={28} />, title: t('featSafeVerified'), description: t('featSafeVerifiedDesc') },
              { icon: <Zap className="text-primary" size={28} />, title: t('featFirstCome'), description: t('featFirstComeDesc') },
              { icon: <Phone className="text-secondary" size={28} />, title: t('featDirectContact'), description: t('featDirectContactDesc') }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="scroll-reveal bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-500"
                style={{ transitionDelay: `${idx * 0.08}s` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* HOW IT WORKS — 3 Steps                      */}
      {/* ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="snap-section py-20 bg-accent/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('howTitle')}
            </h2>
            <p className="text-muted-foreground text-base">{t('howSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: t('howStep1Title'), description: t('howStep1Desc') },
              { step: '2', title: t('howStep2Title'), description: t('howStep2Desc') },
              { step: '3', title: t('howStep3Title'), description: t('howStep3Desc') }
            ].map((step, idx) => (
              <div
                key={idx}
                className="scroll-reveal relative text-center"
                style={{ transitionDelay: `${idx * 0.12}s` }}
              >
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 hover:scale-110 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* POSTERS — Visual Highlight Section           */}
      {/* ═══════════════════════════════════════════ */}
      <section className="snap-section py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('postersTitle')}
            </h2>
            <p className="text-muted-foreground text-lg">{t('postersSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {[
              { emoji: '🏠', title: t('posterGetServices'), subtitle: t('posterGetServicesDesc'), gradient: 'from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20', border: 'border-orange-200 dark:border-orange-800', titleColor: 'text-orange-900 dark:text-orange-200', subtitleColor: 'text-orange-800 dark:text-orange-300' },
              { emoji: '💰', title: t('posterEarnMoney'), subtitle: t('posterEarnMoneyDesc'), gradient: 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20', border: 'border-green-200 dark:border-green-800', titleColor: 'text-green-900 dark:text-green-200', subtitleColor: 'text-green-800 dark:text-green-300' },
              { emoji: '📱', title: t('posterInstantAlert'), subtitle: t('posterInstantAlertDesc'), gradient: 'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20', border: 'border-blue-200 dark:border-blue-800', titleColor: 'text-blue-900 dark:text-blue-200', subtitleColor: 'text-blue-800 dark:text-blue-300' },
              { emoji: '✅', title: t('posterNoTimepass'), subtitle: t('posterNoTimepassDesc'), gradient: 'from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20', border: 'border-purple-200 dark:border-purple-800', titleColor: 'text-purple-900 dark:text-purple-200', subtitleColor: 'text-purple-800 dark:text-purple-300' },
            ].map((poster, idx) => (
              <div
                key={idx}
                className={`scroll-reveal bg-gradient-to-br ${poster.gradient} rounded-3xl overflow-hidden shadow-lg border-2 ${poster.border} h-80 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500`}
                style={{ transitionDelay: `${idx * 0.1}s` }}
              >
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="text-5xl mb-4 hover:scale-125 transition-transform duration-300 inline-block">{poster.emoji}</div>
                    <h3 className={`text-2xl font-bold ${poster.titleColor} mb-2`}>{poster.title}</h3>
                    <p className={poster.subtitleColor}>{poster.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CONTACT SECTION                             */}
      {/* ═══════════════════════════════════════════ */}
      <section id="contact" className="snap-section py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('contactTitle')}
            </h2>
            <p className="text-muted-foreground text-lg">{t('contactSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Phone className="text-primary" size={24} />, title: t('contactPhone'), desc: t('contactPhoneDesc'), link: 'tel:+919309282749', linkText: '+91 9309282749', bg: 'bg-primary/10' },
              { icon: <Mail className="text-secondary" size={24} />, title: t('contactEmail'), desc: t('contactEmailDesc'), link: 'mailto:bisugentech@gmail.com', linkText: 'bisugentech@gmail.com', bg: 'bg-secondary/10' },
              { icon: <Globe className="text-primary" size={24} />, title: t('contactWebsite'), desc: t('contactWebsiteDesc'), link: 'https://www.bisugentech.in', linkText: 'www.bisugentech.in', bg: 'bg-primary/10', external: true },
            ].map((contact, idx) => (
              <div
                key={idx}
                className="scroll-reveal bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                style={{ transitionDelay: `${idx * 0.1}s` }}
              >
                <div className={`w-12 h-12 ${contact.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  {contact.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{contact.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">{contact.desc}</p>
                <a
                  href={contact.link}
                  {...(contact.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="text-primary font-medium hover:underline"
                >
                  {contact.linkText}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA SECTION                                 */}
      {/* ═══════════════════════════════════════════ */}
      <section className="snap-section py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto px-4 text-center scroll-reveal">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            {t('ctaSubtitle')}
          </p>
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate('/auth')}
            className="gap-2 hover:scale-[1.04] active:scale-[0.97] shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
          >
            {t('ctaButton')}
            <ArrowRight size={20} />
          </Button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FAQ / QnA SECTION                            */}
      {/* ═══════════════════════════════════════════ */}
      <section id="faq" className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('faqTitle')}
            </h2>
            <p className="text-muted-foreground text-lg">{t('faqSubtitle')}</p>
          </div>

          <div className="space-y-3">
            {[
              {
                question: t('faqQ1'),
                answer: t('faqA1')
              },
              {
                question: t('faqQ2'),
                answer: t('faqA2'),
                hasVideo: true,
                videoUrl: '/assets/account_create_video.mp4'
              },
              {
                question: t('faqQ3'),
                answer: t('faqA3')
              },
              {
                question: t('faqQ4'),
                answer: t('faqA4')
              },
              {
                question: t('faqQ5'),
                answer: t('faqA5')
              },
              {
                question: t('faqQ6'),
                answer: t('faqA6')
              },
              {
                question: t('faqQ7'),
                answer: t('faqA7')
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="scroll-reveal bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/30"
                style={{ transitionDelay: `${idx * 0.06}s` }}
              >
                <button
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left gap-4"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  aria-expanded={openFaqIndex === idx}
                >
                  <span className="text-base md:text-lg font-semibold text-foreground">{faq.question}</span>
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openFaqIndex === idx
                    ? 'bg-primary text-primary-foreground rotate-0'
                    : 'bg-accent text-muted-foreground rotate-0'
                    }`}>
                    {openFaqIndex === idx ? <Minus size={18} /> : <Plus size={18} />}
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-400 ease-in-out ${openFaqIndex === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="px-5 md:px-6 pb-5 md:pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    {faq.hasVideo && faq.videoUrl && (
                      <div className="mt-4">
                        <div className="relative aspect-video bg-muted rounded-xl overflow-hidden border border-border shadow-md">
                          <video
                            className="w-full h-full object-cover"
                            controls
                            controlsList="nodownload"
                            muted
                            playsInline
                            preload="metadata"
                          >
                            <source src={faq.videoUrl} type="video/mp4" />
                            <track kind="captions" srcLang="en" label="English" />
                          </video>
                        </div>
                        <p className="text-sm text-primary font-medium mt-2 flex items-center gap-1">
                          <PlayCircle size={16} /> {t('faqVideoLabel')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER                                      */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Navigation className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-foreground">Leads Nearby</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {t('footerCopyright')}
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors duration-300">{t('footerPrivacy')}</Link>
            <Link to="/terms-of-service" className="hover:text-primary transition-colors duration-300">{t('footerTerms')}</Link>
            <a href="mailto:bisugentech@gmail.com" className="hover:text-primary transition-colors duration-300">{t('footerContactUs')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
