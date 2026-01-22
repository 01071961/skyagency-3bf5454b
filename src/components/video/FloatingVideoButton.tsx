import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Video, Zap, Radio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function FloatingVideoButton() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      icon: Zap,
      label: 'Short',
      color: 'from-purple-500 to-pink-500',
      onClick: () => navigate('/videos/upload?type=short'),
    },
    {
      icon: Video,
      label: 'Vídeo',
      color: 'from-blue-500 to-cyan-500',
      onClick: () => navigate('/videos/upload'),
    },
    {
      icon: Radio,
      label: 'Live',
      color: 'from-red-500 to-orange-500',
      onClick: () => navigate('/live/create'),
    },
  ];

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu Items */}
            <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    className="px-3 py-1.5 bg-card/90 backdrop-blur border border-border rounded-lg text-sm font-medium shadow-lg"
                  >
                    {item.label}
                  </motion.span>
                  <Button
                    size="icon"
                    className={`h-12 w-12 rounded-full bg-gradient-to-br ${item.color} hover:opacity-90 shadow-lg`}
                    onClick={() => {
                      item.onClick();
                      setIsOpen(false);
                    }}
                  >
                    <item.icon className="h-5 w-5 text-white" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="icon"
          className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${
            isOpen
              ? 'bg-muted hover:bg-muted/80'
              : 'bg-gradient-to-br from-primary via-secondary to-accent hover:opacity-90'
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6 text-white" />
            )}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}
