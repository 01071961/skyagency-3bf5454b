// API Configuration
export const SUPABASE_URL = "https://pfqhspnyejzohxwaqnyb.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcWhzcG55ZWp6b2h4d2FxbnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTQ2NjksImV4cCI6MjA4NDUzMDY2OX0.yuFMCxVKrD4we1LlPXWBx3vETi2OIcurG7DjtLSTXB4";

// Edge Function Endpoints
export const ENDPOINTS = {
  contact: {
    submit: 'submit-contact',
  },
  payment: {
    process: 'process-payment',
    confirmation: 'send-order-confirmation',
    createIntent: 'create-payment-intent',
    stripeCheckout: 'stripe-checkout-brl',
  },
  stripe: {
    config: 'stripe-config',
    webhook: 'stripe-webhook',
    healthCheck: 'stripe-health-check',
  },
  affiliate: {
    actions: 'affiliate-actions',
    invite: 'send-affiliate-invite',
    commission: 'notify-affiliate-commission',
  },
};

// App Constants
export const APP_NAME = 'Sky Brasil Agency';
export const DEFAULT_CURRENCY = 'BRL';
