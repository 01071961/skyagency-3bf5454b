import { motion } from "framer-motion";

const cardBrands = [
  {
    name: "Visa",
    svg: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect fill="#1565C0" width="48" height="48" rx="4"/>
        <path fill="#FFF" d="M32.2,25.1l0.9-5H30l-1.4,5H32.2z M22.3,15.2l-3.8,17.6h-3.6l3.8-17.6H22.3z M14.8,15.2l-3.4,12.1 c0,0-0.4-1.9-0.8-3.4c-0.6-2.3-2.4-6-2.4-6l-0.1,0.1l0-0.1H5l0,0.3c0,0,3.8,0.7,5.8,2.8l2.9,11h4L19.1,15.2H14.8z M38.2,32.8 l3.1-17.6h-3.5l-2.3,14.4L38.2,32.8z M28.4,20.1l0.6-3.1c0,0-1.9-0.8-4-0.8c-2.2,0-7.4,1-7.4,5.7c0,4.4,6.1,4.5,6.1,6.8 s-5.5,1.9-7.3,0.4l-0.6,3.3c0,0,2,0.9,5,0.9c3,0,7.6-1.5,7.6-5.9c0-4.5-6.2-4.9-6.2-6.8C22.2,18.6,26.4,18.5,28.4,20.1z"/>
      </svg>
    ),
  },
  {
    name: "Mastercard",
    svg: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect fill="#3F51B5" width="48" height="48" rx="4"/>
        <circle fill="#E91E63" cx="18" cy="24" r="10"/>
        <circle fill="#FF9800" cx="30" cy="24" r="10"/>
        <path fill="#FF5722" d="M24,16.9c2.3,1.7,3.8,4.4,3.8,7.4s-1.5,5.7-3.8,7.4c-2.3-1.7-3.8-4.4-3.8-7.4S21.7,18.6,24,16.9z"/>
      </svg>
    ),
  },
  {
    name: "Amex",
    svg: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect fill="#1976D2" width="48" height="48" rx="4"/>
        <path fill="#FFF" d="M10,18h4l0.7,1.7L15.5,18h12.8v10H16l-0.8-1L14.5,28h-4.5v-3.5l-0.7,1.2H7V20l-0.5,0.8H5L10,18z M11,20.5v5h2.5l1-1.5l1,1.5H18v-5h-2v3.5l-1.5-2.3L13,23.5V20.5H11z M20,20.5v5h5v-1.2h-3v-0.8h3v-1.2h-3v-0.8h3v-1H20z M27,20.5l1.5,2.3l1.5-2.3h2.5l-2.8,2.5l2.8,2.5h-2.5L28.5,23l-1.5,2.5H24.5l2.8-2.5l-2.8-2.5H27z"/>
      </svg>
    ),
  },
  {
    name: "Elo",
    svg: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect fill="#000" width="48" height="48" rx="4"/>
        <circle fill="#FFCB05" cx="14" cy="24" r="6"/>
        <circle fill="#00A4E0" cx="24" cy="24" r="6"/>
        <circle fill="#EF4123" cx="34" cy="24" r="6"/>
      </svg>
    ),
  },
  {
    name: "Hipercard",
    svg: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect fill="#B71C1C" width="48" height="48" rx="4"/>
        <path fill="#FFF" d="M10,17h5v14h-5V17z M17,17h5v5.5L26.5,17H32l-6,7l6,7h-5.5L22,25.5V31h-5V17z"/>
      </svg>
    ),
  },
];

interface PaymentCardBrandsProps {
  className?: string;
}

export const PaymentCardBrands = ({ className }: PaymentCardBrandsProps) => {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-2">Aceitamos as principais bandeiras:</p>
      <div className="flex items-center gap-2 flex-wrap">
        {cardBrands.map((brand, index) => (
          <motion.div
            key={brand.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="w-10 h-7 rounded overflow-hidden shadow-sm border border-border/50 bg-background"
            title={brand.name}
          >
            {brand.svg}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
