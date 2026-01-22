/**
 * Public Presentation Viewer
 * Displays a shared presentation via share token
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    opacity?: number;
  };
}

interface Slide {
  id: string;
  order: number;
  backgroundColor: string;
  elements: SlideElement[];
  transition: 'fade' | 'slide' | 'zoom' | 'none';
}

interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: string;
}

export default function VIPPresentationShare() {
  const { token } = useParams<{ token: string }>();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (token) {
      loadPresentation();
    }
  }, [token]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentIndex(prev => Math.min((presentation?.slides.length || 1) - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation?.slides.length]);

  const loadPresentation = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('vip_presentations')
        .select('*')
        .eq('share_token', token)
        .eq('is_public', true)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (!data) {
        setError('Apresentação não encontrada ou não está mais disponível.');
        return;
      }

      // Update view count
      await supabase
        .from('vip_presentations')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', data.id);

      setPresentation({
        id: data.id,
        title: data.title as string,
        slides: (Array.isArray(data.slides) ? data.slides : []) as unknown as Slide[],
        theme: (data.theme as string) || 'dark'
      });
    } catch (err) {
      console.error('Error loading presentation:', err);
      setError('Erro ao carregar apresentação.');
    } finally {
      setLoading(false);
    }
  };

  const currentSlide = presentation?.slides[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Apresentação Indisponível</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      {!isFullscreen && (
        <div className="bg-card/90 backdrop-blur-xl border-b px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold truncate">{presentation.title}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {presentation.slides.length}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(true)}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Slide Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-2xl"
            style={{ background: currentSlide?.backgroundColor || '#1a1a2e' }}
          >
            {currentSlide?.elements.map(element => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${(element.x / 800) * 100}%`,
                  top: `${(element.y / 450) * 100}%`,
                  width: `${(element.width / 800) * 100}%`,
                  height: `${(element.height / 450) * 100}%`,
                  opacity: (element.style.opacity || 100) / 100
                }}
              >
                {element.type === 'text' && (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      fontSize: `clamp(12px, ${(element.style.fontSize || 24) / 24}vw, ${element.style.fontSize || 24}px)`,
                      fontWeight: element.style.fontWeight,
                      color: element.style.color || '#ffffff'
                    }}
                  >
                    {element.content}
                  </div>
                )}
                {element.type === 'shape' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: element.style.backgroundColor,
                      borderRadius: element.content === 'circle' ? '50%' : element.style.borderRadius
                    }}
                  />
                )}
                {element.type === 'image' && element.content && (
                  <img
                    src={element.content}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ borderRadius: element.style.borderRadius }}
                  />
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
          onClick={() => setCurrentIndex(prev => Math.min(presentation.slides.length - 1, prev + 1))}
          disabled={currentIndex === presentation.slides.length - 1}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>

        {/* Fullscreen Exit */}
        {isFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setIsFullscreen(false)}
          >
            <Minimize2 className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / presentation.slides.length) * 100}%` }}
        />
      </div>

      {/* Footer */}
      {!isFullscreen && (
        <div className="bg-card/90 backdrop-blur-xl border-t px-6 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Criado com Slides VIP • SKY BRASIL
          </p>
        </div>
      )}
    </div>
  );
}
