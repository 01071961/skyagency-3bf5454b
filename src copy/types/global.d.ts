// Global type declarations

declare global {
  interface Window {
    $efiPay?: {
      CreditCard: {
        setAccount: (code: string) => void;
        setEnvironment: (env: 'sandbox' | 'production') => void;
        getPaymentToken: (options: {
          brand: string;
          number: string;
          cvv: string;
          expirationMonth: string;
          expirationYear: string;
        }, callback: (error: unknown, response: { payment_token: string }) => void) => void;
      };
    };
  }
}

export {};
