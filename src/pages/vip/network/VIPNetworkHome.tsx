import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VIPFeed } from '@/components/vip/social/VIPFeed';

export default function VIPNetworkHome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-pink-500/20">
          <Home className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Início</h1>
          <p className="text-muted-foreground">Veja os posts mais recentes da comunidade VIP</p>
        </div>
      </div>

      <VIPFeed filter="all" isVIP={true} />
    </motion.div>
  );
}
