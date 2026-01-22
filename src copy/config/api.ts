// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_SUPABASE_URL,
  timeout: 30000,
  retries: 3,
} as const;

export const ENDPOINTS = {
  payment: {
    process: 'process-payment',
    confirmation: 'send-order-confirmation',
  },
  contact: {
    submit: 'submit-contact',
  },
} as const;

export const ALLOWED_ORIGINS = [
  'https://skybrasil.com.br',
  'https://www.skybrasil.com.br',
  'https://skystreamer.online',
  'https://www.skystreamer.online',
  'http://localhost:8080',
  'http://localhost:3000',
] as const;
