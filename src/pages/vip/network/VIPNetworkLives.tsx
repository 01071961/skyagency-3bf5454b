import { motion } from 'framer-motion';
import { Radio, Users, Eye, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockLives = [
  { id: '1', title: 'Análise de Mercado - Ao Vivo', author: 'TraderPro', avatar: '', viewers: 1234, isVIP: true },
  { id: '2', title: 'Tirando Dúvidas sobre Investimentos', author: 'EducaFinanças', avatar: '', viewers: 856, isVIP: false },
  { id: '3', title: 'Day Trade na Prática', author: 'DayTraderBR', avatar: '', viewers: 2341, isVIP: true },
  { id: '4', title: 'Criptomoedas: O que esperar?', author: 'CryptoMaster', avatar: '', viewers: 567, isVIP: true },
];

export default function VIPNetworkLives() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20">
            <Radio className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lives</h1>
            <p className="text-muted-foreground">Transmissões ao vivo da comunidade</p>
          </div>
        </div>
        <Button className="gap-2 bg-red-500 hover:bg-red-600">
          <Radio className="h-4 w-4" />
          Iniciar Live
        </Button>
      </div>

      {/* Lives Ao Vivo */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Ao Vivo Agora
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockLives.map((live, index) => (
            <motion.div
              key={live.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden cursor-pointer hover:border-red-500/50 transition-colors group">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-4 rounded-full bg-red-500/20 group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-red-500" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge variant="destructive" className="animate-pulse gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        AO VIVO
                      </Badge>
                      {live.isVIP && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                          VIP
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="gap-1">
                        <Eye className="h-3 w-3" />
                        {live.viewers.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={live.avatar} />
                        <AvatarFallback>{live.author[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{live.title}</p>
                        <p className="text-xs text-muted-foreground">{live.author}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scheduled Lives */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Próximas Lives</h2>
        <Card className="p-8 text-center">
          <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma live agendada no momento</p>
          <Button variant="outline" className="mt-4">
            Agendar Live
          </Button>
        </Card>
      </div>
    </motion.div>
  );
}
