import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-8 md:py-12 px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">MitTek</span>
            </Link>
            <p className="text-sm md:text-base text-muted-foreground max-w-md">
              Din personlige IT-hjælp. Sikkerhed og ro i maven til din iPhone, iPad og Mac.
            </p>
            
            {/* Disclaimer */}
            <p className="mt-4 md:mt-6 text-xs md:text-sm text-muted-foreground bg-muted px-3 md:px-4 py-2 md:py-3 rounded-lg">
              <strong>Bemærk:</strong> Denne service er ikke tilknyttet Apple Inc. 
              Apple, iPhone, iPad og Mac er varemærker tilhørende Apple Inc.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produkt</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Priser
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-muted-foreground hover:text-foreground transition-colors">
                  Guides
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  Hjælp
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Konto</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Log ind
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                  Opret konto
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Indstillinger
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} MitTek. Alle rettigheder forbeholdes.
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/terms" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
              Vilkår
            </Link>
            <Link to="/privacy" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privatliv
            </Link>
            <Link to="/contact" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
