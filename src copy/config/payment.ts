// EfíPay Configuration

export const EFIPAY_CONFIG = {
  cdnUrl: 'https://cdn.jsdelivr.net/npm/payment-token-efi/dist/payment-token-efi-umd.min.js',
  environment: (import.meta.env.VITE_EFI_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
} as const;

export const initEfiPay = (payeeCode: string, environment: 'sandbox' | 'production' = 'sandbox') => {
  return new Promise<void>((resolve, reject) => {
    if (window.$efiPay) {
      console.log('EfíPay já inicializado');
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = EFIPAY_CONFIG.cdnUrl;
    script.async = true;

    script.onload = () => {
      try {
        if (window.$efiPay) {
          window.$efiPay.CreditCard.setAccount(payeeCode);
          window.$efiPay.CreditCard.setEnvironment(environment);
          console.log('EfíPay inicializado com sucesso');
          resolve();
        } else {
          reject(new Error('Biblioteca EfíPay não encontrada após carregamento'));
        }
      } catch (error) {
        reject(error);
      }
    };

    script.onerror = () => {
      reject(new Error('Falha ao carregar biblioteca EfíPay'));
    };

    document.head.appendChild(script);
  });
};
