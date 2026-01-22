import { motion } from "framer-motion";
import { XCircle, ArrowLeft, ShoppingBag, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PaymentCanceled = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="p-8 text-center space-y-6 border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent">
          {/* Canceled Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center"
          >
            <XCircle className="w-12 h-12 text-orange-500" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pagamento Cancelado
            </h1>
            <p className="text-muted-foreground">
              Sua compra foi cancelada. Nenhum valor foi cobrado.
            </p>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-muted/30 rounded-lg p-4 text-left space-y-3"
          >
            <p className="text-sm text-foreground">
              Não se preocupe! Seus itens ainda estão disponíveis. Você pode:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Voltar à loja e tentar novamente</li>
              <li>• Escolher outro método de pagamento</li>
              <li>• Entrar em contato se tiver dúvidas</li>
            </ul>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 pt-4"
          >
            <Button asChild className="flex-1">
              <Link to="/vendas">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Voltar à Loja
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/contato">
                <MessageCircle className="w-4 h-4 mr-2" />
                Falar Conosco
              </Link>
            </Button>
          </motion.div>

          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link 
              to="/" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao início
            </Link>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentCanceled;
