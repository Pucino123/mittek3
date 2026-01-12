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

// Pages
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FinishSignup from "./pages/FinishSignup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Checkin from "./pages/Checkin";
import Guides from "./pages/Guides";
import Panic from "./pages/Panic";
import KodeMappe from "./pages/KodeMappe";
import ScreenshotAI from "./pages/ScreenshotAI";
import Safety from "./pages/Safety";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import HelperInvite from "./pages/HelperInvite";
import TicketDetail from "./pages/TicketDetail";
import HelperDashboard from "./pages/HelperDashboard";
import PasswordGenerator from "./pages/PasswordGenerator";
import TechDictionary from "./pages/TechDictionary";
import BatteryDoctor from "./pages/BatteryDoctor";
import Wishlist from "./pages/Wishlist";
import CleaningGuide from "./pages/CleaningGuide";
import ScamQuiz from "./pages/ScamQuiz";
import MedicalId from "./pages/MedicalId";
import HardwareDetective from "./pages/HardwareDetective";
import GuestWifi from "./pages/GuestWifi";
import SecurityCheck from "./pages/SecurityCheck";
import DeviceSetup from "./pages/DeviceSetup";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";

const queryClient = new QueryClient();

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
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/finish-signup" element={<FinishSignup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/helper-invite" element={<HelperInvite />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              
              {/* Protected routes - Basic+ */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/checkin" element={
                <ProtectedRoute>
                  <Checkin />
                </ProtectedRoute>
              } />
              <Route path="/guides" element={
                <ProtectedRoute>
                  <Guides />
                </ProtectedRoute>
              } />
              <Route path="/help" element={
                <ProtectedRoute>
                  <Help />
                </ProtectedRoute>
              } />
              <Route path="/help/:ticketId" element={
                <ProtectedRoute>
                  <TicketDetail />
                </ProtectedRoute>
              } />
              <Route path="/helper-dashboard" element={
                <ProtectedRoute>
                  <HelperDashboard />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/subscription" element={
                <ProtectedRoute>
                  <SubscriptionManagement />
                </ProtectedRoute>
              } />
              
              {/* Protected routes - Plus+ */}
              <Route path="/panic" element={
                <ProtectedRoute requiredPlan="plus">
                  <Panic />
                </ProtectedRoute>
              } />
              <Route path="/kode-mappe" element={
                <ProtectedRoute requiredPlan="plus">
                  <KodeMappe />
                </ProtectedRoute>
              } />
              <Route path="/screenshot-ai" element={<ScreenshotAI />} />
              <Route path="/safety" element={<Safety />} />
              
              {/* New utility tools */}
              <Route path="/tools/password-generator" element={
                <ProtectedRoute>
                  <PasswordGenerator />
                </ProtectedRoute>
              } />
              <Route path="/tools/dictionary" element={
                <ProtectedRoute>
                  <TechDictionary />
                </ProtectedRoute>
              } />
              <Route path="/tools/battery-doctor" element={
                <ProtectedRoute>
                  <BatteryDoctor />
                </ProtectedRoute>
              } />
              <Route path="/tools/wishlist" element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              } />
              <Route path="/tools/cleaning-guide" element={
                <ProtectedRoute>
                  <CleaningGuide />
                </ProtectedRoute>
              } />
              <Route path="/tools/scam-quiz" element={
                <ProtectedRoute>
                  <ScamQuiz />
                </ProtectedRoute>
              } />
              <Route path="/tools/medical-id" element={
                <ProtectedRoute>
                  <MedicalId />
                </ProtectedRoute>
              } />
              <Route path="/tools/guest-wifi" element={
                <ProtectedRoute>
                  <GuestWifi />
                </ProtectedRoute>
              } />
              <Route path="/tools/hardware" element={
                <ProtectedRoute>
                  <HardwareDetective />
                </ProtectedRoute>
              } />
              <Route path="/tools/security-check" element={
                <ProtectedRoute>
                  <SecurityCheck />
                </ProtectedRoute>
              } />
              <Route path="/tools/device-setup" element={
                <ProtectedRoute>
                  <DeviceSetup />
                </ProtectedRoute>
              } />
              <Route path="/guides/:guideId" element={
                <ProtectedRoute>
                  <Guides />
                </ProtectedRoute>
              } />
              
              {/* Admin - Strict admin-only route */}
              <Route path="/admin" element={
                <AdminRoute>
                  <Admin />
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
