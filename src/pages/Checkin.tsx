import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { DeviceCheckinWizard } from '@/components/checkin/DeviceCheckinWizard';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';

const Checkin = () => {
  useScrollRestoration();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-lg sm:text-xl font-semibold">MitTek</span>
          </Link>
        </div>
      </header>

      <main className="container py-6 md:py-8 px-4">
        <Breadcrumb className="mb-4 max-w-lg mx-auto" />
        <DeviceCheckinWizard />
      </main>

      
    </div>
  );
};

export default Checkin;
