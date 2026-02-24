import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect } from "react";
import { checkExpiredLeads } from "@/lib/auto-rejection";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";

import Dashboard from "./pages/Dashboard";
import GenerateLead from "./pages/GenerateLead";
import GetLeads from "./pages/GetLeads";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Subscribe from "./pages/Subscribe";
import Community from "./pages/Community";
import Notifications from "./pages/Notifications";
import LeadDetails from "./pages/LeadDetails";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AdminDashboard from "./pages/AdminDashboard";
import Messages from "./pages/Messages";
import MessageNotificationBanner from "./components/MessageNotificationBanner";

const queryClient = new QueryClient();

const AppContent = () => {
  // Check for expired leads on app load
  useEffect(() => {
    const checkLeads = async () => {
      const count = await checkExpiredLeads();
      if (count > 0) {
        console.log(`Auto-rejected ${count} expired leads`);
      }
    };

    checkLeads();

    // Check every hour
    const interval = setInterval(checkLeads, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load Google Maps Script with API key from environment
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if already loaded
      if (window.google?.maps) return;

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) return;

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key not found in environment variables');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate-lead" element={<GenerateLead />} />
          <Route path="/get-leads" element={<GetLeads />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/community" element={<Community />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/lead/:id" element={<LeadDetails />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <MessageNotificationBanner />
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
