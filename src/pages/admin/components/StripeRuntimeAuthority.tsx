import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Lock,
  Unlock,
  CreditCard, 
  Zap,
  Shield,
  Activity,
  Server,
  AlertOctagon,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface HealthCheckResult {
  status: "operational" | "degraded" | "down";
  timestamp: string;
  checks: {
    keys: {
      status: "pass" | "fail" | "warning";
      secretKeyMode: string;
      publishableKeyMode: string;
      consistent: boolean;
      message: string;
    };
    api: {
      status: "pass" | "fail";
      latencyMs: number;
      accountId?: string;
      accountName?: string;
      message: string;
    };
    webhook: {
      status: "pass" | "fail" | "warning";
      secretConfigured: boolean;
      message: string;
    };
    paymentTests: {
      card: {
        status: "pass" | "fail" | "skipped";
        intentId?: string;
        latencyMs?: number;
        message: string;
      };
      pix: {
        status: "pass" | "fail" | "skipped";
        intentId?: string;
        latencyMs?: number;
        message: string;
      };
    };
  };
  errors: string[];
  autoFixes: string[];
}

interface RuntimeState {
  mode: "test" | "live" | "unknown";
  liveBlocked: boolean;
  blockReasons: string[];
  deployBlocked: boolean;
  lastCheck: Date | null;
  healthData: HealthCheckResult | null;
}

export const StripeRuntimeAuthority = () => {
  const [state, setState] = useState<RuntimeState>({
    mode: "unknown",
    liveBlocked: true,
    blockReasons: [],
    deployBlocked: false,
    lastCheck: null,
    healthData: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  const runSilentCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const { data } = await supabase.functions.invoke("stripe-health-check");
      
      if (data) {
        const healthData = data as HealthCheckResult;
        const blockReasons: string[] = [];
        
        // Determine mode
        const mode = healthData.checks.keys.secretKeyMode as "test" | "live" | "unknown";
        
        // Evaluate LIVE blocking conditions
        if (healthData.checks.keys.status === "fail") {
          blockReasons.push("Chaves Stripe não configuradas");
        }
        if (!healthData.checks.keys.consistent) {
          blockReasons.push("Modo das chaves inconsistente (test/live mismatch)");
        }
        if (healthData.checks.api.status === "fail") {
          blockReasons.push("API Stripe não conectada");
        }
        if (healthData.checks.webhook.status === "fail") {
          blockReasons.push("Webhook secret não configurado");
        }
        if (healthData.checks.paymentTests.card.status === "fail") {
          blockReasons.push("Teste de pagamento com Cartão falhou");
        }
        if (healthData.checks.paymentTests.pix.status === "fail") {
          blockReasons.push("Teste de pagamento com PIX falhou");
        }
        
        // Deploy is blocked if system is down
        const deployBlocked = healthData.status === "down";
        
        setState({
          mode,
          liveBlocked: blockReasons.length > 0,
          blockReasons,
          deployBlocked,
          lastCheck: new Date(),
          healthData,
        });
      }
    } catch {
      setState(prev => ({
        ...prev,
        liveBlocked: true,
        blockReasons: ["Erro ao verificar status do Stripe"],
        deployBlocked: true,
      }));
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Initial check and auto-refresh every 5 minutes (silent)
  useEffect(() => {
    runSilentCheck();
    const interval = setInterval(runSilentCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [runSilentCheck]);

  const getModeColor = () => {
    if (state.mode === "live") return "bg-green-500";
    if (state.mode === "test") return "bg-yellow-500";
    return "bg-muted";
  };

  const getModeLabel = () => {
    if (state.mode === "live") return "LIVE";
    if (state.mode === "test") return "TEST";
    return "...";
  };

  return (
    <div className="space-y-4">
      {/* Compact Runtime Status Bar */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Mode Toggle (Read-Only) */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Modo Stripe:</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getModeColor()} flex items-center gap-1.5`}>
                {state.mode === "live" ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {getModeLabel()}
              </div>
              {isChecking && (
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4">
              {/* LIVE Status */}
              <div className="flex items-center gap-2">
                {state.liveBlocked ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    LIVE Bloqueado
                  </Badge>
                ) : (
                  <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                    <CheckCircle className="h-3 w-3" />
                    LIVE Liberado
                  </Badge>
                )}
              </div>

              {/* Deploy Status */}
              <div className="flex items-center gap-2">
                {state.deployBlocked ? (
                  <Badge variant="outline" className="flex items-center gap-1 border-red-500 text-red-500">
                    <AlertOctagon className="h-3 w-3" />
                    Deploy Pausado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-500">
                    <CheckCircle className="h-3 w-3" />
                    Deploy OK
                  </Badge>
                )}
              </div>

              {/* Last Check */}
              {state.lastCheck && (
                <span className="text-xs text-muted-foreground">
                  Última verificação: {state.lastCheck.toLocaleTimeString("pt-BR")}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why LIVE is Blocked Report (Auto-shown when blocked) */}
      <AnimatePresence>
        {state.liveBlocked && state.blockReasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  Por que LIVE está bloqueado
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <ul className="space-y-1">
                  {state.blockReasons.map((reason, i) => (
                    <li key={i} className="text-sm text-red-400 flex items-start gap-2">
                      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  O sistema corrigirá automaticamente quando possível. Nenhuma ação necessária.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deploy Block Notification (Silent, informative) */}
      <AnimatePresence>
        {state.deployBlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-500">
                  <Shield className="h-4 w-4" />
                  Proteção de Deploy Ativa
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-sm text-yellow-400">
                  Deploys de pagamento estão pausados até que o sistema esteja operacional.
                  Rollback automático será aplicado se necessário.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Esta é uma medida de segurança automática. O sistema retomará quando estável.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Health Overview (Always visible) */}
      {state.healthData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Keys */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Chaves</span>
              {state.healthData.checks.keys.status === "pass" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : state.healthData.checks.keys.status === "warning" ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs mt-1 truncate">
              {state.healthData.checks.keys.consistent ? "Consistentes" : "Mismatch"}
            </p>
          </Card>

          {/* API */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">API</span>
              {state.healthData.checks.api.status === "pass" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs mt-1 truncate">
              {state.healthData.checks.api.latencyMs}ms
            </p>
          </Card>

          {/* Card */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Cartão
              </span>
              {state.healthData.checks.paymentTests.card.status === "pass" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : state.healthData.checks.paymentTests.card.status === "skipped" ? (
                <Activity className="h-4 w-4 text-muted-foreground" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs mt-1 truncate capitalize">
              {state.healthData.checks.paymentTests.card.status}
            </p>
          </Card>

          {/* PIX */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                PIX
              </span>
              {state.healthData.checks.paymentTests.pix.status === "pass" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : state.healthData.checks.paymentTests.pix.status === "skipped" ? (
                <Activity className="h-4 w-4 text-muted-foreground" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs mt-1 truncate capitalize">
              {state.healthData.checks.paymentTests.pix.status}
            </p>
          </Card>
        </div>
      )}

      {/* Auto-Fixes Applied (Silent notification) */}
      <AnimatePresence>
        {state.healthData?.autoFixes && state.healthData.autoFixes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-500">Auto-Correções Aplicadas</span>
                </div>
                <ul className="space-y-1">
                  {state.healthData.autoFixes.map((fix, i) => (
                    <li key={i} className="text-xs text-blue-400 flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
