import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { useEfiPayment } from "@/hooks/useEfiPayment";
import { initEfiPay } from "@/lib/efiConfig";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { processPayment, isProcessing } = useEfiPayment();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  // Inicializar EfíPay SDK ao montar o componente
  useEffect(() => {
    // IMPORTANTE: Substitua 'SEU_PAYEE_CODE' pelo seu payee_code da EfíPay
    const PAYEE_CODE = 'SEU_PAYEE_CODE_AQUI';
    const ENVIRONMENT = 'sandbox'; // ou 'production'
    
    initEfiPay(PAYEE_CODE, ENVIRONMENT as 'sandbox' | 'production').catch((error) => {
      console.error('Erro ao inicializar EfíPay:', error);
      toast({
        title: "Erro de inicialização",
        description: "Não foi possível carregar o sistema de pagamento. Recarregue a página.",
        variant: "destructive",
      });
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.name || !formData.email || !formData.cpf || !formData.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.cardNumber || !formData.cvv || !formData.expiry) {
      toast({
        title: "Dados do cartão incompletos",
        description: "Preencha todos os dados do cartão.",
        variant: "destructive",
      });
      return;
    }

    // Separar mês e ano da validade
    const [expiryMonth, expiryYear] = formData.expiry.split('/');
    
    // Preparar dados do pagamento
    const paymentData = {
      cardNumber: formData.cardNumber,
      cardName: formData.cardName,
      expiryMonth: expiryMonth.trim(),
      expiryYear: `20${expiryYear.trim()}`,
      cvv: formData.cvv,
      customer: {
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf,
        phone: formData.phone,
      },
      address: {
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        zipcode: formData.cep,
        city: formData.city,
        complement: formData.complement,
      },
      items: items.map(item => ({
        name: item.name,
        value: item.price,
        amount: item.quantity,
      })),
    };

    // Processar pagamento
    const result = await processPayment(paymentData);

    if (result.success) {
      toast({
        title: "Pagamento confirmado!",
        description: `Seu pedido foi processado com sucesso. ID: ${result.charge_id}`,
        duration: 5000,
      });
      clearCart();
      navigate("/");
    } else {
      toast({
        title: "Erro no pagamento",
        description: result.error || "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-tech flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Carrinho Vazio</h2>
            <p className="text-muted-foreground mb-6">
              Adicione produtos ao carrinho para finalizar sua compra
            </p>
            <Button onClick={() => navigate("/vendas")} className="bg-gradient-primary">
              Ver Produtos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-tech py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/vendas")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Loja
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Formulário de Checkout */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input 
                        id="name" 
                        placeholder="Seu nome" 
                        value={formData.name}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input 
                        id="cpf" 
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input 
                      id="cep" 
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="street">Rua</Label>
                  <Input 
                    id="street" 
                    placeholder="Nome da rua"
                    value={formData.street}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input 
                      id="number" 
                      placeholder="123"
                      value={formData.number}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input 
                      id="complement" 
                      placeholder="Apto, Bloco, etc"
                      value={formData.complement}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input 
                      id="neighborhood" 
                      placeholder="Bairro"
                      value={formData.neighborhood}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input 
                      id="city" 
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input 
                    id="cardNumber" 
                    placeholder="0000 0000 0000 0000"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    maxLength={19}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Validade</Label>
                    <Input 
                      id="expiry" 
                      placeholder="MM/AA"
                      value={formData.expiry}
                      onChange={handleInputChange}
                      maxLength={5}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input 
                      id="cvv" 
                      placeholder="123"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      maxLength={4}
                      required 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cardName">Nome no Cartão</Label>
                  <Input 
                    id="cardName" 
                    placeholder="Nome impresso no cartão"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b border-border/50">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qtd: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="text-accent">Grátis</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-gradient-primary">
                      R$ {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full bg-gradient-primary hover:shadow-glow-primary"
                >
                  {isProcessing ? "Processando..." : "Finalizar Pedido"}
                </Button>

                <div className="text-xs text-muted-foreground text-center pt-2">
                  Seus dados estão seguros e protegidos
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
