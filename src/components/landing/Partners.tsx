import { motion } from "framer-motion";
import { Building2, Sparkles } from "lucide-react";

// Placeholder partner logos (using text for now - can be replaced with actual logos)
const partners = [
  { name: "RedBull", color: "#E30613" },
  { name: "Razer", color: "#44D62C" },
  { name: "Logitech", color: "#00B8FC" },
  { name: "HyperX", color: "#FF0000" },
  { name: "Corsair", color: "#F4D701" },
  { name: "ASUS ROG", color: "#9F0000" },
  { name: "Intel", color: "#0068B5" },
  { name: "Samsung", color: "#1428A0" },
  { name: "LG", color: "#A50034" },
  { name: "Elgato", color: "#00AEEF" },
  { name: "Shopee", color: "#EE4D2D" },
  { name: "Amazon", color: "#FF9900" },
];

export const Partners = () => {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-background/90 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-8 sm:mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-medium mb-4">
            <Building2 className="w-3.5 h-3.5" />
            Parceiros de Sucesso
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Marcas que{" "}
            <span className="text-gradient-secondary">Confiam</span> em Nós
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Conectamos creators com as maiores marcas do mercado de games, tech e lifestyle
          </p>
        </motion.div>

        {/* Partners Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.08, y: -4 }}
              className="group"
            >
              <div className="aspect-[3/2] flex items-center justify-center p-3 sm:p-4 rounded-xl bg-card/40 border border-border/30 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/30 group-hover:bg-card/60 group-hover:shadow-lg group-hover:shadow-primary/10">
                {/* Grayscale to color on hover */}
                <span 
                  className="text-xs sm:text-sm font-bold text-center leading-tight transition-all duration-300 grayscale group-hover:grayscale-0"
                  style={{ 
                    color: partner.color,
                    filter: 'grayscale(100%)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'grayscale(100%)';
                  }}
                >
                  {partner.name}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              +150 marcas parceiras e crescendo
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Partners;
