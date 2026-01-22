// Configuração do EfíPay SDK
// Este arquivo carrega dinamicamente a biblioteca payment-token-efi

export const initEfiPay = (payeeCode: string, environment: 'sandbox' | 'production' = 'sandbox') => {
  return new Promise<void>((resolve, reject) => {
    // Verificar se já foi carregado
    if (window.$efiPay) {
      console.log('EfíPay já inicializado');
      resolve();
      return;
    }

    // Criar script tag
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/payment-token-efi/dist/payment-token-efi-umd.min.js';
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

declare global {
  interface Window {
    $efiPay?: any;
  }
}