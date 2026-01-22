import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Video,
  Radio,
  FileText,
  Image as ImageIcon,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const createOptions = [
  { 
    icon: Video, 
    label: 'Vídeo', 
    href: '/vip/youtube',
    color: 'bg-red-500',
    description: 'Upload para YouTube'
  },
  { 
    icon: Zap, 
    label: 'Short', 
    href: '/vip/network/post/short',
    color: 'bg-pink-500',
    description: 'Vídeo vertical curto'
  },
  { 
    icon: Radio, 
    label: 'Live', 
    href: '/vip/network/live/create',
    color: 'bg-purple-500',
    description: 'Transmissão ao vivo'
  },
  { 
    icon: FileText, 
    label: 'Post', 
    href: '/vip/network/blog',
    color: 'bg-blue-500',
    description: 'Texto e mídia'
  },
  { 
    icon: ImageIcon, 
    label: 'Imagem', 
    href: '/vip/network/post/image',
    color: 'bg-green-500',
    description: 'Foto ou galeria'
  },
];

export function CreatePostButton() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Options */}
            <div className="absolute bottom-16 right-0 flex flex-col gap-3">
              {createOptions.map((option, index) => (
                <motion.div
                  key={option.href}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="secondary"
                    className="flex items-center gap-3 pr-6 shadow-lg"
                    onClick={() => {
                      navigate(option.href);
                      setIsOpen(false);
                    }}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      option.color
                    )}>
                      <option.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg',
            'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
            'hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600',
            'transition-all duration-300'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Plus className="h-6 w-6 text-white" />
            )}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}
