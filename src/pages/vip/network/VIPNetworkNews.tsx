import { motion } from 'framer-motion';
import { Newspaper, Clock, ExternalLink, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const mockNews = [
  { id: '1', title: 'Mercado fecha em alta com expectativas de corte de juros', source: 'Valor Econômico', time: '2 horas atrás', category: 'Mercado', isBreaking: true },
  { id: '2', title: 'Bitcoin ultrapassa marca histórica de US$ 100.000', source: 'CoinDesk', time: '4 horas atrás', category: 'Cripto', isBreaking: true },
  { id: '3', title: 'Selic deve cair para 9% até o final do ano, dizem analistas', source: 'InfoMoney', time: '5 horas atrás', category: 'Economia', isBreaking: false },
  { id: '4', title: 'Petrobras anuncia dividendos recordes para acionistas', source: 'G1', time: '6 horas atrás', category: 'Empresas', isBreaking: false },
  { id: '5', title: 'Dólar recua e fecha a R$ 5,15 com otimismo global', source: 'UOL', time: '7 horas atrás', category: 'Câmbio', isBreaking: false },
];

const categories = [
  { name: 'Mercado', count: 145 },
  { name: 'Cripto', count: 89 },
  { name: 'Economia', count: 234 },
  { name: 'Empresas', count: 178 },
  { name: 'Câmbio', count: 67 },
];

export default function VIPNetworkNews() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20">
          <Newspaper className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notícias</h1>
          <p className="text-muted-foreground">Últimas notícias do mercado financeiro</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main News */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Destaques
          </h2>
          {mockNews.map((news, index) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={news.isBreaking ? 'destructive' : 'outline'}>
                          {news.category}
                        </Badge>
                        {news.isBreaking && (
                          <Badge className="bg-red-500 animate-pulse">URGENTE</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {news.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{news.source}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {news.time}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <span className="text-sm">{category.name}</span>
                  <Badge variant="secondary">{category.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-pink-500/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <Newspaper className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Newsletter VIP</p>
              <p className="text-sm text-muted-foreground mb-3">
                Receba as principais notícias no seu email
              </p>
              <Badge className="cursor-pointer">Inscrever-se</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
