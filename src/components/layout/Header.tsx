import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Menu, X, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useSeniorMode } from '@/contexts/SeniorModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IOSSwitch } from '@/components/ui/ios-switch';
import { Label } from '@/components/ui/label';
import { BackButton } from './BackButton';
import { useNotificationCount } from '@/hooks/useNotificationCount';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { seniorMode, toggleSeniorMode } = useSeniorMode();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const { count: notificationCount } = useNotificationCount();

  // Show back button on sub-pages (not on landing or dashboard)
  const isSubPage = user && location.pathname !== '/dashboard' && location.pathname !== '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-18 items-center justify-between">
        {/* Left: Back button or Logo */}
        {isSubPage ? (
          <BackButton />
        ) : (
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              MitTek
            </span>
          </Link>
        )}

        {/* Right: Actions */}
        <nav className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {/* Admin shortcut - only for admins */}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="default" className="border-info/40 text-info hover:bg-info/10">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="default" size="default" className="relative animate-pulse-soft">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Mit Dashboard
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              {/* Senior Mode Toggle - iOS Style */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary">
                <IOSSwitch 
                  id="senior-mode" 
                  checked={seniorMode}
                  onCheckedChange={toggleSeniorMode}
                />
                <Label htmlFor="senior-mode" className="text-sm font-medium cursor-pointer">
                  Senior-tilstand
                </Label>
              </div>

              <Link to="/login">
                <Button variant="outline" size="default">
                  Log ind
                </Button>
              </Link>
              
              <Link to="/pricing">
                <Button variant="hero" size="default">
                  Prøv Gratis
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center justify-center w-12 h-12 rounded-xl hover:bg-secondary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Luk menu' : 'Åbn menu'}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-up">
          <div className="container py-6 space-y-5">
            {user ? (
              <div className="space-y-4">
                {/* Admin shortcut - mobile - only for admins */}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="outline" size="lg" className="w-full min-h-[52px] border-info/40 text-info hover:bg-info/10">
                      <ShieldCheck className="mr-2 h-5 w-5" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button variant="default" size="lg" className="w-full min-h-[52px] relative animate-pulse-soft">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Mit Dashboard
                    {notificationCount > 0 && (
                      <span className="absolute top-2 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[52px]"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Log ud
                </Button>
              </div>
            ) : (
              <>
                {/* Senior Mode Toggle - Mobile - iOS Style */}
                <div className="flex items-center justify-between py-4 px-4 rounded-xl bg-secondary min-h-[52px]">
                  <Label htmlFor="senior-mode-mobile" className="text-base font-medium">
                    Senior-tilstand
                  </Label>
                  <IOSSwitch 
                    id="senior-mode-mobile" 
                    checked={seniorMode}
                    onCheckedChange={toggleSeniorMode}
                  />
                </div>

                {/* Buttons with proper spacing for touch targets */}
                <div className="pt-2 space-y-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="outline" size="lg" className="w-full min-h-[52px]">
                      Log ind
                    </Button>
                  </Link>
                  
                  <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="hero" size="lg" className="w-full min-h-[52px]">
                      Prøv Gratis
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
