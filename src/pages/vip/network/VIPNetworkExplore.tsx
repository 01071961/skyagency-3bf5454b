import { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Search, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const categories = [
  { name: 'Investimentos', count: 1234, color: 'bg-blue-500' },
  { name: 'Day Trading', count: 987, color: 'bg-green-500' },
  { name: 'Criptomoedas', count: 856, color: 'bg-orange-500' },
  { name: 'Educação Financeira', count: 743, color: 'bg-purple-500' },
  { name: 'Bolsa de Valores', count: 621, color: 'bg-pink-500' },
  { name: 'Renda Fixa', count: 432, color: 'bg-cyan-500' },
];

const trendingHashtags = [
  '#investimentos', '#daytrading', '#cripto', '#educacaofinanceira', 
  '#bolsadevalores', '#rendafixa', '#forex', '#acoes', '#dividendos'
];

export default function VIPNetworkExplore() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
          <Compass className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Explorar</h1>
          <p className="text-muted-foreground">Descubra novos criadores e conteúdos</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários, hashtags, conteúdos..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Categorias Populares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-4"
                >
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className={category.color + ' text-white'}>
                    {category.count.toLocaleString()}
                  </Badge>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Hashtags */}
      <Card>
        <CardHeader>
          <CardTitle>Hashtags em Alta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map((tag, index) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-primary"
                >
                  {tag}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
