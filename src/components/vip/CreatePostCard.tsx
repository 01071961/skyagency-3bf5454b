import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, Send, X, Smile, Hash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categories = [
  { value: 'geral', label: 'Geral', emoji: '💬' },
  { value: 'estrategias', label: 'Estratégias de Vendas', emoji: '🎯' },
  { value: 'marketing', label: 'Marketing Digital', emoji: '📱' },
  { value: 'cases', label: 'Cases de Sucesso', emoji: '🏆' },
  { value: 'duvidas', label: 'Dúvidas', emoji: '❓' },
  { value: 'networking', label: 'Networking', emoji: '🤝' },
];

interface CreatePostCardProps {
  userAvatar?: string;
  userName?: string;
  onSubmit: (data: { title: string; content: string; category: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreatePostCard({ 
  userAvatar, 
  userName = 'Você', 
  onSubmit,
  isSubmitting = false 
}: CreatePostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('geral');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    await onSubmit({ 
      title: title.trim() || 'Post', 
      content: content.trim(), 
      category 
    });
    
    // Reset form
    setTitle('');
    setContent('');
    setCategory('geral');
    setIsExpanded(false);
  };

  const selectedCategory = categories.find(c => c.value === category);

  return (
    <Card className="overflow-hidden bg-card/80 backdrop-blur border-border/50">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
              {userName?.charAt(0) || 'V'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {!isExpanded ? (
              <motion.button
                className="w-full text-left px-4 py-3 bg-muted/30 hover:bg-muted/50 rounded-full text-muted-foreground transition-colors"
                onClick={() => setIsExpanded(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                O que você quer compartilhar, {userName?.split(' ')[0]}?
              </motion.button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Title Input */}
                  <Input
                    placeholder="Título do post (opcional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-muted/30 border-border/50 font-medium"
                  />

                  {/* Content */}
                  <Textarea
                    placeholder="Compartilhe uma ideia, dica ou pergunta com a comunidade..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] bg-muted/30 border-border/50 resize-none"
                    autoFocus
                  />

                  {/* Category & Actions */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-auto gap-2 bg-muted/30">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <span>{cat.emoji}</span>
                                {cat.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Media buttons - future feature */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" disabled>
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" disabled>
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" disabled>
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsExpanded(false);
                          setTitle('');
                          setContent('');
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!content.trim() || isSubmitting}
                        className="bg-gradient-to-r from-primary to-primary/80 gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? 'Publicando...' : 'Publicar'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Quick action buttons when collapsed */}
        {!isExpanded && (
          <div className="flex items-center justify-around mt-4 pt-4 border-t border-border/50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 text-muted-foreground hover:text-foreground gap-2"
              onClick={() => setIsExpanded(true)}
            >
              <ImageIcon className="h-4 w-4 text-green-500" />
              Foto
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 text-muted-foreground hover:text-foreground gap-2"
              onClick={() => setIsExpanded(true)}
            >
              <Video className="h-4 w-4 text-red-500" />
              Vídeo
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 text-muted-foreground hover:text-foreground gap-2"
              onClick={() => setIsExpanded(true)}
            >
              <Hash className="h-4 w-4 text-blue-500" />
              Tópico
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
