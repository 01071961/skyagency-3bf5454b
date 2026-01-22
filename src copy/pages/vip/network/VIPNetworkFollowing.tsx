import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { VIPFeed } from '@/components/vip/social/VIPFeed';

export default function VIPNetworkFollowing() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
          <Users className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Seguindo</h1>
          <p className="text-muted-foreground">Posts de pessoas que você segue</p>
        </div>
      </div>

      <VIPFeed filter="following" isVIP={true} />
    </motion.div>
  );
}
