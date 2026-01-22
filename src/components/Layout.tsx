import { ReactNode, useEffect, Suspense } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LiveChat from "./LiveChat";
import SEOHead from "./SEOHead";
import AffiliateMetaTags from "./AffiliateMetaTags";
import GoogleOneTap from "./GoogleOneTap";
import PWAInstallPrompt from "./PWAInstallPrompt";
import OfflineIndicator from "./OfflineIndicator";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Load Gumroad script once
  useEffect(() => {
    if (!document.getElementById('gumroad-script')) {
      const script = document.createElement('script');
      script.id = 'gumroad-script';
      script.src = 'https://gumroad.com/js/gumroad.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Load Rewardful tracking script once
  useEffect(() => {
    if (!document.getElementById('rewardful-init')) {
      // Inline init script
      const initScript = document.createElement('script');
      initScript.id = 'rewardful-init';
      initScript.textContent = "(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');";
      document.head.appendChild(initScript);

      // Async loader script
      const loaderScript = document.createElement('script');
      loaderScript.id = 'rewardful-loader';
      loaderScript.async = true;
      loaderScript.src = 'https://r.wdfl.co/rw.js';
      loaderScript.setAttribute('data-rewardful', 'YOUR_REWARDFUL_API_KEY');
      document.head.appendChild(loaderScript);
    }
  }, []);

  return (
    <Suspense fallback={null}>
      <div className="flex flex-col min-h-screen">
        <OfflineIndicator />
        <SEOHead />
        <AffiliateMetaTags />
        <GoogleOneTap />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <LiveChat />
        <PWAInstallPrompt />
      </div>
    </Suspense>
  );
};

export default Layout;
