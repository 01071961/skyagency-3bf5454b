import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Sparkles, CheckCircle } from "lucide-react";

const VIP = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    channel: "",
    platform: "",
    followers: "",
    description: "",
    acceptTerms: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
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

    // Simulate form submission
    toast.success(
      "Inscrição enviada com sucesso! Entraremos em contato em breve."
    );
    setFormData({
      name: "",
      email: "",
      channel: "",
      platform: "",
      followers: "",
      description: "",
      acceptTerms: false,
    });
  };

  const benefits = [
    "Acesso prioritário a campanhas exclusivas",
    "Mentoria individual mensal",
    "Suporte técnico dedicado",
    "Kit de boas-vindas completo",
    "Treinamento avançado de conversão",
    "Networking com outros creators VIP",
  ];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
            <Sparkles className="text-primary" size={20} />
            <span className="text-primary font-semibold">Lista VIP</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Entre para a{" "}
            <span className="text-gradient-primary">Lista VIP</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Faça parte de um grupo seleto de streamers com acesso prioritário a
            parcerias, treinamentos e suporte exclusivo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">
                  Preencha seus dados
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nome Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-mail <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="channel">
                      Nome do Canal <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="channel"
                      placeholder="@seucanal"
                      value={formData.channel}
                      onChange={(e) =>
                        setFormData({ ...formData, channel: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">
                      Plataforma Principal <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="platform"
                      placeholder="Ex: Twitch, YouTube, TikTok"
                      value={formData.platform}
                      onChange={(e) =>
                        setFormData({ ...formData, platform: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followers">Número de Seguidores</Label>
                    <Input
                      id="followers"
                      placeholder="Ex: 5000"
                      value={formData.followers}
                      onChange={(e) =>
                        setFormData({ ...formData, followers: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Conte-nos sobre você e seus objetivos
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Fale sobre seu conteúdo, audiência e o que você espera conquistar..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          acceptTerms: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      Aceito os termos e condições e autorizo o contato da SKY
                      BRASIL para avaliação do meu perfil
                    </Label>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    <Sparkles size={16} />
                    Enviar Inscrição VIP
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <Card className="bg-gradient-primary p-8 border-0">
              <h2 className="text-2xl font-bold text-white mb-6">
                Benefícios Exclusivos VIP
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-3 text-white"
                  >
                    <CheckCircle className="flex-shrink-0 mt-1" size={20} />
                    <span className="leading-relaxed">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border p-8">
              <h3 className="text-xl font-bold mb-4">Processo Seletivo</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  A Lista VIP é limitada e passamos por um processo de seleção para
                  garantir que podemos oferecer o melhor suporte a cada creator.
                </p>
                <p>
                  Analisamos fatores como qualidade do conteúdo, engajamento da
                  audiência, consistência nas transmissões e alinhamento com nossos
                  valores.
                </p>
                <p className="text-foreground font-semibold">
                  Você receberá uma resposta em até 7 dias úteis após o envio.
                </p>
              </div>
            </Card>

            <Card className="bg-gradient-accent p-8 border-0">
              <h3 className="text-xl font-bold text-white mb-3">
                Vagas Limitadas!
              </h3>
              <p className="text-white/90 leading-relaxed">
                Abrimos apenas 20 vagas por trimestre para garantir qualidade no
                atendimento. Não perca essa oportunidade de fazer parte do time SKY
                BRASIL.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VIP;
