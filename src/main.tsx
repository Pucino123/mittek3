import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enforceWwwRedirect } from "./utils/wwwRedirect";
import { initGA4OnLoad } from "./utils/analytics";
import { initWebVitals } from "./utils/webVitals";

// Redirect non-www to www for consistent SEO
enforceWwwRedirect();

// Initialize GA4 if user has already consented
initGA4OnLoad();

// Initialize Web Vitals tracking if consent is given
const consent = localStorage.getItem('cookie-consent');
if (consent === 'accepted') {
  initWebVitals();
}

createRoot(document.getElementById("root")!).render(<App />);