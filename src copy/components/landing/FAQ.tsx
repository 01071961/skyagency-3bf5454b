import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqData = [
  {
    question: "Como a SKY BRASIL seleciona streamers?",
    answer: "Avaliamos perfil, engajamento, potencial de crescimento e alinhamento com marcas. Não focamos apenas em números — valorizamos criadores autênticos com comunidades engajadas. Nossa curadoria busca creators com potencial de conversão real, independente do tamanho inicial.",
  },
  {
    question: "Quais tipos de parcerias com marcas vocês oferecem?",
    answer: "Trabalhamos com diversos modelos: publis pontuais, contratos mensais, comissionamento por vendas, embaixadores de marca e collabs especiais. Negociamos o melhor formato para cada creator, maximizando retorno para ambos os lados.",
  },
  {
    question: "Quanto tempo leva para começar a monetizar?",
    answer: "Em média, creators ativos começam a receber propostas nas primeiras 4-8 semanas após onboarding completo. O tempo varia conforme nicho, engajamento e disponibilidade para campanhas. Nosso time trabalha ativamente para acelerar esse processo.",
  },
  {
    question: "Vocês ajudam com treinamento e branding?",
    answer: "Sim! Nossa Academy SKY oferece treinamentos exclusivos em técnicas de conversão, storytelling, negociação e posicionamento. Também temos time de design para criar identidade visual profissional — logos, overlays, banners e todo material de marca.",
  },
  {
    question: "Há taxa de comissão? Como funciona o pagamento?",
    answer: "Trabalhamos com modelo de comissão sobre parcerias fechadas (percentual acordado individualmente). Você recebe 100% das campanhas diretas que já possui. Pagamentos são transparentes, com relatórios detalhados e repasse via PIX/TED.",
  },
  {
    question: "Posso manter meu estilo único de conteúdo?",
    answer: "Absolutamente! Seu estilo é seu diferencial. Conectamos você com marcas que combinam com sua audiência e valores. Nunca forçamos conteúdo que não faça sentido para você ou sua comunidade — autenticidade gera mais resultado.",
  },
  {
    question: "Como é o suporte técnico (OBS, overlays)?",
    answer: "Oferecemos suporte completo: configuração profissional de OBS/Streamlabs, criação de overlays personalizados, alertas customizados, integração de bots e otimização de qualidade de stream. Tudo para você focar no conteúdo.",
  },
  {
    question: "Qual o tamanho mínimo de audiência para entrar?",
    answer: "Não exigimos número mínimo fixo. Avaliamos o conjunto: engajamento, consistência, nicho e potencial. Creators com 500+ espectadores médios já podem se candidatar. O importante é ter comunidade ativa e vontade de crescer profissionalmente.",
  },
];

export const FAQ = () => {
  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-background via-background/95 to-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-secondary/15 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-8 sm:mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            Dúvidas Frequentes
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Tudo que Você Precisa{" "}
            <span className="text-gradient-primary">Saber</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Respostas transparentes para as perguntas mais comuns de creators
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqData.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="group rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 data-[state=open]:border-primary/40 data-[state=open]:bg-card/60"
                >
                  <AccordionTrigger className="px-5 py-4 text-left text-sm sm:text-base font-medium hover:no-underline group-hover:text-primary transition-colors duration-200 [&[data-state=open]]:text-primary">
                    <span className="pr-4">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-10"
        >
          <p className="text-sm text-muted-foreground">
            Ainda tem dúvidas?{" "}
            <a 
              href="/contato" 
              className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
            >
              Fale com nosso time
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
