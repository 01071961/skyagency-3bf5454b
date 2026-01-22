import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

interface UserProperties {
  email?: string;
  name?: string;
  tier?: string;
  affiliate_code?: string;
  [key: string]: string | number | boolean | undefined;
}

// Generate a unique session ID
const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('analytics_session_id');
  if (stored) return stored;
  
  const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  sessionStorage.setItem('analytics_session_id', newId);
  return newId;
};

// Get or create session ID
const getSessionId = (): string => {
  return generateSessionId();
};

export const useAnalytics = () => {
  const { user } = useAuth();
  const sessionId = useRef(getSessionId());
  const retryQueue = useRef<Array<() => Promise<void>>>([]);
  const isProcessingQueue = useRef(false);

  // Process retry queue
  const processRetryQueue = useCallback(async () => {
    if (isProcessingQueue.current || retryQueue.current.length === 0) return;
    
    isProcessingQueue.current = true;
    while (retryQueue.current.length > 0) {
      const task = retryQueue.current.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Analytics retry failed:', error);
        }
      }
    }
    isProcessingQueue.current = false;
  }, []);

  // Retry failed analytics with exponential backoff
  const retryAnalytics = useCallback((task: () => Promise<void>, maxRetries = 3) => {
    let retries = 0;
    const attempt = async () => {
      try {
        await task();
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          const delay = Math.pow(2, retries) * 1000;
          setTimeout(attempt, delay);
        } else {
          retryQueue.current.push(task);
        }
      }
    };
    attempt();
  }, []);

  // Track page view
  const trackPageView = useCallback(async (pageName: string, properties?: EventProperties) => {
    const task = async () => {
      await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        session_id: sessionId.current,
        event_name: 'page_view',
        event_properties: {
          page_name: pageName,
          ...properties
        },
        page_url: window.location.href,
        referrer: document.referrer,
        device_type: getDeviceType(),
        browser: getBrowser(),
        country: await getCountry()
      });
    };

    try {
      await task();
    } catch (error) {
      console.error('Analytics error:', error);
      retryAnalytics(task);
    }
  }, [user?.id, retryAnalytics]);

  // Track custom event
  const trackEvent = useCallback(async (
    eventName: string, 
    properties?: EventProperties,
    userProperties?: UserProperties
  ) => {
    const task = async () => {
      await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        session_id: sessionId.current,
        event_name: eventName,
        event_properties: properties || {},
        user_properties: userProperties || {},
        page_url: window.location.href,
        referrer: document.referrer,
        device_type: getDeviceType(),
        browser: getBrowser(),
        country: await getCountry()
      });
    };

    try {
      await task();
    } catch (error) {
      console.error('Analytics error:', error);
      retryAnalytics(task);
    }
  }, [user?.id, retryAnalytics]);

  // Identify user
  const identify = useCallback(async (userProperties: UserProperties) => {
    try {
      await trackEvent('user_identified', {}, userProperties);
    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  }, [trackEvent]);

  // Track conversion events
  const trackConversion = useCallback(async (
    conversionType: 'signup' | 'purchase' | 'subscription' | 'referral' | 'affiliate_click',
    value?: number,
    properties?: EventProperties
  ) => {
    await trackEvent(`conversion_${conversionType}`, {
      value,
      currency: 'BRL',
      ...properties
    });
  }, [trackEvent]);

  // Track affiliate events
  const trackAffiliateEvent = useCallback(async (
    action: 'link_click' | 'link_copy' | 'referral_signup' | 'commission_earned' | 'payout_requested',
    properties?: EventProperties
  ) => {
    await trackEvent(`affiliate_${action}`, properties);
  }, [trackEvent]);

  // Track error events
  const trackError = useCallback(async (
    errorType: string,
    errorMessage: string,
    properties?: EventProperties
  ) => {
    await trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      ...properties
    });
  }, [trackEvent]);

  // Track timing events
  const trackTiming = useCallback(async (
    category: string,
    variable: string,
    timeMs: number,
    label?: string
  ) => {
    await trackEvent('timing', {
      timing_category: category,
      timing_variable: variable,
      timing_value: timeMs,
      timing_label: label
    });
  }, [trackEvent]);

  // Process queue on mount and visibility change
  useEffect(() => {
    processRetryQueue();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        processRetryQueue();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [processRetryQueue]);

  return {
    trackPageView,
    trackEvent,
    identify,
    trackConversion,
    trackAffiliateEvent,
    trackError,
    trackTiming,
    sessionId: sessionId.current
  };
};

// Helper functions
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
}

async function getCountry(): Promise<string | null> {
  try {
    // Check cached country
    const cached = sessionStorage.getItem('user_country');
    if (cached) return cached;
    
    // Fallback to timezone-based detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryMap: Record<string, string> = {
      'America/Sao_Paulo': 'BR',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Rome': 'IT',
      'Asia/Tokyo': 'JP',
      'Australia/Sydney': 'AU'
    };
    
    const country = countryMap[timezone] || null;
    if (country) sessionStorage.setItem('user_country', country);
    return country;
  } catch {
    return null;
  }
}
