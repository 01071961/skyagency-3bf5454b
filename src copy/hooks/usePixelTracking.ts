import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface AnalyticsConfig {
  facebookPixelId?: string;
  googleAnalyticsId?: string;
  googleAdsId?: string;
}

export const usePixelTracking = (config: AnalyticsConfig = {}) => {
  useEffect(() => {
    // Facebook Pixel
    if (config.facebookPixelId && typeof window !== 'undefined') {
      if (!window.fbq) {
        const n = (window.fbq = function(...args: any[]) {
          n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
        } as any);
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        document.head.appendChild(script);
      }
      window.fbq('init', config.facebookPixelId);
      window.fbq('track', 'PageView');
    }

    // Google Analytics / Google Ads
    if ((config.googleAnalyticsId || config.googleAdsId) && typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(...args: any[]) {
        window.dataLayer.push(args);
      };
      window.gtag('js', new Date());
      
      if (config.googleAnalyticsId) {
        window.gtag('config', config.googleAnalyticsId);
      }
      if (config.googleAdsId) {
        window.gtag('config', config.googleAdsId);
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId || config.googleAdsId}`;
      document.head.appendChild(script);
    }
  }, [config.facebookPixelId, config.googleAnalyticsId, config.googleAdsId]);

  const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
    // Facebook
    if (window.fbq) {
      window.fbq('track', eventName, params);
    }
    // Google
    if (window.gtag) {
      window.gtag('event', eventName, params);
    }
  };

  const trackPurchase = (value: number, currency = 'BRL', orderId?: string) => {
    if (window.fbq) {
      window.fbq('track', 'Purchase', { value, currency, content_ids: [orderId] });
    }
    if (window.gtag) {
      window.gtag('event', 'purchase', { transaction_id: orderId, value, currency });
    }
  };

  const trackAddToCart = (productId: string, value: number, currency = 'BRL') => {
    if (window.fbq) {
      window.fbq('track', 'AddToCart', { content_ids: [productId], value, currency });
    }
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', { items: [{ id: productId, price: value }], currency });
    }
  };

  const trackViewContent = (productId: string, productName: string, value: number) => {
    if (window.fbq) {
      window.fbq('track', 'ViewContent', { content_ids: [productId], content_name: productName, value });
    }
    if (window.gtag) {
      window.gtag('event', 'view_item', { items: [{ id: productId, name: productName, price: value }] });
    }
  };

  const trackInitiateCheckout = (value: number, currency = 'BRL') => {
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', { value, currency });
    }
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', { value, currency });
    }
  };

  const trackLead = (email?: string) => {
    if (window.fbq) {
      window.fbq('track', 'Lead');
    }
    if (window.gtag) {
      window.gtag('event', 'generate_lead', { email });
    }
  };

  return {
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackViewContent,
    trackInitiateCheckout,
    trackLead
  };
};

export default usePixelTracking;
