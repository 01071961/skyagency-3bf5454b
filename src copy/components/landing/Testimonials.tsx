import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

// Import testimonial images
import testimonialLucas from "@/assets/testimonial-lucas.jpg";
import testimonialMarina from "@/assets/testimonial-marina.jpg";
import testimonialPedro from "@/assets/testimonial-pedro.jpg";
import testimonialJuliana from "@/assets/testimonial-juliana.jpg";
import testimonialRafael from "@/assets/testimonial-rafael.jpg";
import testimonialAmanda from "@/assets/testimonial-amanda.jpg";

const testimonials = [
  {
    name: "Lucas Silva",
    role: "Streamer de Games",
    image: testimonialLucas,
    platform: "Twitch",
    followers: "45K",
    quote: "Em 3 meses com a SKY, fechei mais parcerias do que em 2 anos solo. O suporte técnico e as conexões com marcas mudaram meu jogo completamente.",
    rating: 5,
  },
  {
    name: "Marina Costa",
    role: "Content Creator",
    image: testimonialMarina,
    platform: "YouTube",
    followers: "120K",
    quote: "A mentoria de conteúdo foi transformadora. Aprendi a posicionar meu canal de forma profissional e triplicar minha receita mensal.",
    rating: 5,
  },
  {
    name: "Pedro Henrique",
    role: "Streamer Variety",
    image: testimonialPedro,
    platform: "Twitch",
    followers: "28K",
    quote: "O time de branding criou uma identidade visual incrível pro meu canal. Overlays, alertas, tudo perfeito. Minha audiência amou!",
    rating: 5,
  },
  {
    name: "Juliana Ramos",
    role: "IRL Streamer",
    image: testimonialJuliana,
    platform: "TikTok",
    followers: "250K",
    quote: "A SKY me conectou com marcas que combinam perfeitamente com meu conteúdo. Zero publis forçadas, só parcerias autênticas.",
    rating: 5,
  },
  {
    name: "Rafael Nunes",
    role: "Streamer de FPS",
    image: testimonialRafael,
    platform: "Twitch",
    followers: "65K",
    quote: "Do setup técnico às negociações com patrocinadores, a equipe cuida de tudo. Finalmente posso focar 100% no conteúdo.",
    rating: 5,
  },
  {
    name: "Amanda Torres",
    role: "Just Chatting",
    image: testimonialAmanda,
    platform: "Twitch",
    followers: "38K",
    quote: "A comunidade exclusiva de creators é sensacional. Collabs, trocas de experiência e muito networking valioso.",
    rating: 5,
  },
];

export const Testimonials = () => {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-background via-card/30 to-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-[100px]" />
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
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-4">
            <Quote className="w-3.5 h-3.5" />
            Depoimentos
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            O que Nossos{" "}
            <span className="text-gradient-accent">Creators</span> Dizem
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Histórias reais de streamers que transformaram suas carreiras com a SKY BRASIL
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            opts={{ loop: true, align: "start" }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="h-full"
                  >
                    <div className="h-full p-5 sm:p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/70 transition-all duration-300 flex flex-col">
                      {/* Quote Icon */}
                      <Quote className="w-8 h-8 text-primary/30 mb-3" />
                      
                      {/* Quote Text */}
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
                        "{testimonial.quote}"
                      </p>

                      {/* Rating */}
                      <div className="flex gap-0.5 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                        ))}
                      </div>

                      {/* Author with Real Photo */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-sm">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-primary">{testimonial.platform}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.followers}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-12 bg-card/80 border-border/50 hover:bg-card hover:border-primary/30" />
            <CarouselNext className="hidden sm:flex -right-4 lg:-right-12 bg-card/80 border-border/50 hover:bg-card hover:border-primary/30" />
          </Carousel>
        </motion.div>

        {/* Bottom Stats with Real Photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-10"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border border-primary/20">
            <div className="flex -space-x-2">
              {[testimonialLucas, testimonialMarina, testimonialPedro].map((img, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-background"
                >
                  <img 
                    src={img} 
                    alt="Creator"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">
              Junte-se a <span className="text-primary font-semibold">500+ creators</span> satisfeitos
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
