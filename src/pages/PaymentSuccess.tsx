import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Package, Home, ShoppingBag, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth";

interface Enrollment {
  id: string;
  product: {
    name: string;
    cover_image_url: string | null;
  } | null;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = searchParams.get("session_id");
  const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentEnrollments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch recent enrollments (created in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('enrollments')
          .select('id, product:products(name, cover_image_url)')
          .eq('user_id', user.id)
          .gte('enrolled_at', fiveMinutesAgo)
          .eq('status', 'active')
          .limit(5);

        if (!error && data) {
          setRecentEnrollments(data as Enrollment[]);
        }
      } catch (err) {
        console.error('[PaymentSuccess] Error loading enrollments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecentEnrollments();
    
    // Also log the session
    if (sessionId) {
      console.log("[PaymentSuccess] Session ID:", sessionId);
    }
  }, [sessionId, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="p-8 text-center space-y-6 border-green-500/20 bg-gradient-to-b from-green-500/5 to-transparent">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-muted-foreground">
              Obrigado pela sua compra. Seu pagamento foi processado com sucesso.
            </p>
          </motion.div>

          {/* Enrolled Products */}
          {recentEnrollments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-left space-y-3"
            >
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Sparkles className="w-4 h-4" />
                <span>Produtos Liberados</span>
              </div>
              
              <div className="space-y-2">
                {recentEnrollments.map((enrollment) => (
                  <div 
                    key={enrollment.id}
                    className="flex items-center gap-3 p-2 bg-background/50 rounded"
                  >
                    {enrollment.product?.cover_image_url ? (
                      <img 
                        src={enrollment.product.cover_image_url} 
                        alt={enrollment.product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium flex-1">
                      {enrollment.product?.name || 'Produto'}
                    </span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-muted/30 rounded-lg p-4 text-left space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>Detalhes do Pedido</span>
            </div>
            
            {sessionId && (
              <div className="text-xs text-muted-foreground/70 break-all">
                ID da Sessão: {sessionId}
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <p className="text-sm text-foreground">
                Você receberá um e-mail de confirmação em breve com os detalhes da sua compra.
              </p>
            </div>
          </motion.div>

          {/* PIX Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-left"
          >
            <p className="text-sm text-blue-400">
              <strong>Pagou com PIX?</strong> A confirmação pode levar alguns segundos. 
              Se você não receber o e-mail de confirmação, verifique sua caixa de spam.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 pt-4"
          >
            {user ? (
              <Button asChild className="flex-1 bg-green-600 hover:bg-green-700">
                <Link to="/members/courses">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Acessar Meus Cursos
                </Link>
              </Button>
            ) : (
              <Button asChild className="flex-1">
                <Link to="/auth">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Fazer Login para Acessar
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="flex-1">
              <Link to="/vendas">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continuar Comprando
              </Link>
            </Button>
          </motion.div>

          {/* Support Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-muted-foreground"
          >
            Precisa de ajuda?{" "}
            <Link to="/contato" className="text-primary hover:underline">
              Entre em contato conosco
            </Link>
          </motion.p>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
