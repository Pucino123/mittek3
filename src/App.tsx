import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SeniorModeProvider } from "@/contexts/SeniorModeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AIChatWidget } from "@/components/chat/AIChatWidget";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { RouteTracker } from "@/components/analytics/RouteTracker";
import { AdminDebugPanel } from "@/components/debug/AdminDebugPanel";
import { Loader2 } from 'lucide-react';

// Critical pages - static imports for fast LCP
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages - reduces initial bundle by ~70%
const Pricing = lazy(() => import("./pages/Pricing"));
const FinishSignup = lazy(() => import("./pages/FinishSignup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Checkin = lazy(() => import("./pages/Checkin"));
const Guides = lazy(() => import("./pages/Guides"));
const Panic = lazy(() => import("./pages/Panic"));
const KodeMappe = lazy(() => import("./pages/KodeMappe"));
const ScreenshotAI = lazy(() => import("./pages/ScreenshotAI"));
const Safety = lazy(() => import("./pages/Safety"));
const Help = lazy(() => import("./pages/Help"));
const Settings = lazy(() => import("./pages/Settings"));
const SubscriptionManagement = lazy(() => import("./pages/SubscriptionManagement"));
const Admin = lazy(() => import("./pages/Admin"));
const HelperInvite = lazy(() => import("./pages/HelperInvite"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const HelperDashboard = lazy(() => import("./pages/HelperDashboard"));
const PasswordGenerator = lazy(() => import("./pages/PasswordGenerator"));
const TechDictionary = lazy(() => import("./pages/TechDictionary"));
const BatteryDoctor = lazy(() => import("./pages/BatteryDoctor"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const CleaningGuide = lazy(() => import("./pages/CleaningGuide"));
const ScamQuiz = lazy(() => import("./pages/ScamQuiz"));
const MedicalId = lazy(() => import("./pages/MedicalId"));
const HardwareDetective = lazy(() => import("./pages/HardwareDetective"));
const GuestWifi = lazy(() => import("./pages/GuestWifi"));
const SecurityCheck = lazy(() => import("./pages/SecurityCheck"));
const DeviceSetup = lazy(() => import("./pages/DeviceSetup"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));

const queryClient = new QueryClient();

// Loading fallback for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Helper component to wrap lazy components with Suspense
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SeniorModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteTracker />
            <Routes>
              {/* Public routes - Critical pages (static) */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Public routes - Non-critical (lazy) */}
              <Route path="/pricing" element={<LazyRoute><Pricing /></LazyRoute>} />
              <Route path="/finish-signup" element={<LazyRoute><FinishSignup /></LazyRoute>} />
              <Route path="/reset-password" element={<LazyRoute><ResetPassword /></LazyRoute>} />
              <Route path="/helper-invite" element={<LazyRoute><HelperInvite /></LazyRoute>} />
              <Route path="/privacy" element={<LazyRoute><Privacy /></LazyRoute>} />
              <Route path="/terms" element={<LazyRoute><Terms /></LazyRoute>} />
              <Route path="/contact" element={<LazyRoute><Contact /></LazyRoute>} />
              <Route path="/faq" element={<LazyRoute><FAQ /></LazyRoute>} />
              
              {/* Protected routes - Basic+ */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <LazyRoute><Dashboard /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/checkin" element={
                <ProtectedRoute>
                  <LazyRoute><Checkin /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/guides" element={
                <ProtectedRoute>
                  <LazyRoute><Guides /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/help" element={
                <ProtectedRoute>
                  <LazyRoute><Help /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/help/:ticketId" element={
                <ProtectedRoute>
                  <LazyRoute><TicketDetail /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/helper-dashboard" element={
                <ProtectedRoute>
                  <LazyRoute><HelperDashboard /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <LazyRoute><Settings /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/settings/subscription" element={
                <ProtectedRoute>
                  <LazyRoute><SubscriptionManagement /></LazyRoute>
                </ProtectedRoute>
              } />
              
              {/* Protected routes - Plus+ */}
              <Route path="/panic" element={
                <ProtectedRoute requiredPlan="plus">
                  <LazyRoute><Panic /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/kode-mappe" element={
                <ProtectedRoute requiredPlan="plus">
                  <LazyRoute><KodeMappe /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/screenshot-ai" element={<LazyRoute><ScreenshotAI /></LazyRoute>} />
              <Route path="/safety" element={<LazyRoute><Safety /></LazyRoute>} />
              
              {/* New utility tools */}
              <Route path="/tools/password-generator" element={
                <ProtectedRoute>
                  <LazyRoute><PasswordGenerator /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/dictionary" element={
                <ProtectedRoute>
                  <LazyRoute><TechDictionary /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/battery-doctor" element={
                <ProtectedRoute>
                  <LazyRoute><BatteryDoctor /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/wishlist" element={
                <ProtectedRoute>
                  <LazyRoute><Wishlist /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/cleaning-guide" element={
                <ProtectedRoute>
                  <LazyRoute><CleaningGuide /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/scam-quiz" element={
                <ProtectedRoute>
                  <LazyRoute><ScamQuiz /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/medical-id" element={
                <ProtectedRoute>
                  <LazyRoute><MedicalId /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/guest-wifi" element={
                <ProtectedRoute>
                  <LazyRoute><GuestWifi /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/hardware" element={
                <ProtectedRoute>
                  <LazyRoute><HardwareDetective /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/security-check" element={
                <ProtectedRoute>
                  <LazyRoute><SecurityCheck /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/tools/device-setup" element={
                <ProtectedRoute>
                  <LazyRoute><DeviceSetup /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/guides/:guideId" element={
                <ProtectedRoute>
                  <LazyRoute><Guides /></LazyRoute>
                </ProtectedRoute>
              } />
              
              {/* Admin - Strict admin-only route */}
              <Route path="/admin" element={
                <AdminRoute>
                  <LazyRoute><Admin /></LazyRoute>
                </AdminRoute>
              } />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* Floating AI Chat Widget */}
            <AIChatWidget />
            
            {/* Cookie Consent Banner */}
            <CookieConsent />
            
            {/* Admin Debug Panel - only renders for admins */}
            <AdminDebugPanel />
          </BrowserRouter>
        </TooltipProvider>
      </SeniorModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;