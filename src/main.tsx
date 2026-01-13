import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGA4OnLoad } from "./utils/analytics";
import { initWebVitals } from "./utils/webVitals";

// Note: www-redirect is now handled at server level via Lovable's domain settings
// This provides faster redirects before JavaScript loads

// Disable browser's own scroll restoration - we handle it ourselves
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

// Initialize GA4 if user has already consented
initGA4OnLoad();

// Initialize Web Vitals tracking if consent is given
const consent = localStorage.getItem('cookie-consent');
if (consent === 'accepted') {
  initWebVitals();
}

createRoot(document.getElementById("root")!).render(<App />);