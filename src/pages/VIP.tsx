import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, CheckCircle, Loader2, Crown, Star, Zap, Users, Award, Target } from "lucide-react";
import { useContactForm } from "@/hooks/useContactForm";

const VIP = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    channel: "",
    platform: "",
    followers: "",
    city: "",
    state: "",
    description: "",
    acceptTerms: false,
  });

  const { submitForm, isSubmitting } = useContactForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      toast.error("Por favor, aceite os termos e condições");
      return;
    }

    if (
      !formData.name ||
      !formData.email ||
      !formData.channel ||
      !formData.platform
    ) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const result = await submitForm({
      name: formData.name,
      email: formData.email,
      message: formData.description || "Inscrição VIP sem descrição adicional",
      source: "vip",
      channel: formData.channel,
      platform: formData.platform,
      followers: formData.followers,
      city: formData.city,
      state: formData.state,
    });

    if (result.success) {
      toast.success("Inscrição enviada com sucesso! Você receberá uma confirmação por e-mail.");
      setFormData({
        name: "",
        email: "",
        channel: "",
        platform: "",
        followers: "",
        city: "",
        state: "",
        description: "",
        acceptTerms: false,
      });
    } else {
      toast.error(result.message);
    }
  };

  const benefits = [
    { icon: Target, text: "Acesso prioritário a campanhas exclusivas", color: "primary" },
    { icon: Users, text: "Mentoria individual mensal", color: "secondary" },
    { icon: Zap, text: "Suporte técnico dedicado", color: "accent" },
    { icon: Award, text: "Kit de boas-vindas completo", color: "primary" },
    { icon: Star, text: "Treinamento avançado de conversão", color: "secondary" },
    { icon: Crown, text: "Networking com outros creators VIP", color: "accent" },
  ];

  const steps = [
    { num: "01", title: "Inscrição", desc: "Preencha o formulário com seus dados" },
    { num: "02", title: "Análise", desc: "Avaliamos seu perfil e conteúdo" },
    { num: "03", title: "Aprovação", desc: "Receba a confirmação em até 7 dias" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            {/* Glass Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/30 backdrop-blur-xl border border-white/10 shadow-lg mb-8"
            >
              <Crown className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-gradient-primary">Lista VIP Exclusiva</span>
              <Sparkles className="w-4 h-4 text-secondary" />
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Entre para a{" "}
              <span className="text-gradient-primary">Lista VIP</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Faça parte de um grupo seleto de streamers com acesso prioritário a
              parcerias, treinamentos e suporte exclusivo.
            </p>
          </motion.div>

          {/* Steps - Glass Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative p-6 rounded-2xl bg-background/30 backdrop-blur-xl border border-white/10 text-center group hover:border-primary/30 transition-all duration-300"
              >
                <div className="text-4xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors mb-2">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Form with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-background/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
                {/* Glass Header */}
                <div className="p-6 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border-b border-white/10">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Preencha seus dados
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Campos com * são obrigatórios</p>
                </div>
                
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nome Completo <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isSubmitting}
                        className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        E-mail <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={isSubmitting}
                        className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="channel" className="text-sm font-medium">
                          Nome do Canal <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="channel"
                          placeholder="@seucanal"
                          value={formData.channel}
                          onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                          required
                          disabled={isSubmitting}
                          className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="platform" className="text-sm font-medium">
                          Plataforma <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="platform"
                          placeholder="Twitch, YouTube..."
                          value={formData.platform}
                          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                          required
                          disabled={isSubmitting}
                          className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">Cidade</Label>
                        <Input
                          id="city"
                          placeholder="Sua cidade"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          disabled={isSubmitting}
                          className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium">Estado</Label>
                        <Select
                          value={formData.state}
                          onValueChange={(value) => setFormData({ ...formData, state: value })}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="followers" className="text-sm font-medium">Número de Seguidores</Label>
                      <Input
                        id="followers"
                        placeholder="Ex: 5000"
                        value={formData.followers}
                        onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                        disabled={isSubmitting}
                        className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Conte-nos sobre você
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Fale sobre seu conteúdo, audiência e objetivos..."
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        disabled={isSubmitting}
                        className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors resize-none"
                      />
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-background/30 border border-white/5">
                      <Checkbox
                        id="terms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, acceptTerms: checked as boolean })
                        }
                        disabled={isSubmitting}
                        className="mt-1"
                      />
                      <Label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                        Aceito os termos e condições e autorizo o contato da SKY
                        BRASIL para avaliação do meu perfil
                      </Label>
                    </div>

                    <Button 
                      type="submit" 
                      variant="glow" 
                      size="lg" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Crown size={16} />
                          Enviar Inscrição VIP
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Benefits with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-6"
            >
              {/* Benefits Card */}
              <Card className="overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10 backdrop-blur-xl border-white/10 shadow-2xl">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Benefícios Exclusivos VIP
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {benefits.map((benefit, index) => {
                      const Icon = benefit.icon;
                      return (
                        <motion.div
                          key={benefit.text}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all cursor-default"
                        >
                          <div className={`p-2 rounded-lg bg-${benefit.color}/20`}>
                            <Icon className={`w-4 h-4 text-white`} />
                          </div>
                          <span className="text-white/90 text-sm leading-relaxed">{benefit.text}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Process Card */}
              <Card className="bg-background/40 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold">Processo Seletivo</h3>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    A Lista VIP é limitada e passamos por um processo de seleção para
                    garantir que podemos oferecer o melhor suporte a cada creator.
                  </p>
                  <p>
                    Analisamos fatores como qualidade do conteúdo, engajamento da
                    audiência, consistência nas transmissões e alinhamento com nossos
                    valores.
                  </p>
                  <div className="flex items-center gap-2 pt-2 text-foreground font-medium">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Você receberá uma resposta em até 7 dias úteis.</span>
                  </div>
                </div>
              </Card>

              {/* Limited Spots Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-secondary to-primary opacity-90" />
                <div className="relative p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-6 h-6 text-white" />
                    <h3 className="text-xl font-bold text-white">
                      Vagas Limitadas!
                    </h3>
                  </div>
                  <p className="text-white/90 leading-relaxed text-sm">
                    Abrimos apenas <span className="font-bold">20 vagas por trimestre</span> para garantir qualidade no
                    atendimento. Não perca essa oportunidade de fazer parte do time SKY
                    BRASIL.
                  </p>
                  
                  {/* Progress indicator */}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between text-xs text-white/80 mb-2">
                      <span>Vagas preenchidas</span>
                      <span className="font-bold">14/20</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "70%" }}
                        transition={{ duration: 1, delay: 1 }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIP;
