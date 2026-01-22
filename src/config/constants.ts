// Application Constants

export const APP_CONFIG = {
  name: 'SKY BRASIL',
  supportEmail: 'contato@skybrasil.com.br',
  responseTimeBusinessDays: 7,
} as const;

export const RATE_LIMITS = {
  contactForm: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
  },
  payment: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  },
} as const;

export const VALIDATION = {
  name: {
    min: 2,
    max: 100,
  },
  email: {
    max: 255,
  },
  message: {
    min: 10,
    max: 2000,
  },
  cpf: {
    length: 11,
  },
  phone: {
    min: 10,
    max: 15,
  },
} as const;
