import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  CreditCard, 
  Zap,
  Shield,
  Activity,
  Clock,
  Server,
  Search,
  Database,
  Store,
  Users,
  Gift,
  DollarSign,
  AlertOctagon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SectionStatus {
  name: string;
  type: "admin" | "vip" | "shop" | "affiliate" | "rewards" | "subscriptions";
  hasPaymentFlows: boolean;
  status: "active" | "inactive" | "error";
  lastActivity?: string;
  issues: string[];
}

interface HealthCheckResult {
  status: "operational" | "degraded" | "down";
  timestamp: string;
  mode: "test" | "live" | "unknown";
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
      chargesEnabled?: boolean;
      payoutsEnabled?: boolean;
      message: string;
    };
    webhook: {
      status: "pass" | "fail" | "warning";
      secretConfigured: boolean;
      lastEventReceived?: string;
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
    siteSearch?: {
      status: "pass" | "fail" | "warning" | "skipped";
      sectionsScanned: number;
      paymentFlowsFound: number;
      sections: SectionStatus[];
      message: string;
    };
    databaseSync?: {
      status: "pass" | "fail" | "warning" | "skipped";
      ordersChecked: number;
      pendingOrders: number;
      inconsistentOrders: number;
      commissionsProcessed: number;
      pendingCommissions: number;
      pointsAwarded: boolean;
      issues: string[];
      message: string;
    };
  };
  errors: string[];
  autoFixes: string[];
  recommendations?: string[];
}

const StatusIcon = ({ status }: { status: "pass" | "fail" | "warning" | "skipped" }) => {
  switch (status) {
    case "pass":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "fail":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
};

const StatusBadge = ({ status }: { status: "operational" | "degraded" | "down" | string }) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    operational: { variant: "default", label: "Operacional" },
    degraded: { variant: "secondary", label: "Degradado" },
    down: { variant: "destructive", label: "Offline" },
  };

  const config = variants[status] || { variant: "outline" as const, label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const ModeBadge = ({ mode }: { mode: string }) => {
  if (mode === "live") {
    return <Badge className="bg-green-500 hover:bg-green-600">LIVE</Badge>;
  }
  if (mode === "test") {
    return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">TEST</Badge>;
  }
  return <Badge variant="outline">UNKNOWN</Badge>;
};

const getSectionIcon = (type: string) => {
  switch (type) {
    case "admin": return <Server className="h-4 w-4" />;
    case "vip": return <Users className="h-4 w-4" />;
    case "shop": return <Store className="h-4 w-4" />;
    case "affiliate": return <DollarSign className="h-4 w-4" />;
    case "rewards": return <Gift className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
};

export const StripeHealthDashboard = () => {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const runHealthCheck = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-health-check");

      if (error) {
        toast.error("Erro ao verificar saúde do Stripe", { description: error.message });
        return;
      }

      setHealthData(data);
      setLastCheck(new Date());

      if (data.status === "operational") {
        toast.success("Stripe operacional", { description: `Modo ${data.mode?.toUpperCase() || 'N/A'} - Todos os checks passaram` });
      } else if (data.status === "degraded") {
        toast.warning("Stripe degradado", { description: "Alguns checks falharam" });
      } else {
        toast.error("Stripe offline", { description: "Checks críticos falharam" });
      }
    } catch (err) {
      toast.error("Erro ao executar health check");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      runHealthCheck();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, runHealthCheck]);

  // Initial check on mount
  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Stripe Health Check
            {healthData?.mode && <ModeBadge mode={healthData.mode} />}
          </h2>
          <p className="text-muted-foreground">
            Verificação autônoma, busca automática e auto-correção do sistema de pagamentos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {healthData && <StatusBadge status={healthData.status} />}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Desativar Auto-Refresh" : "Ativar Auto-Refresh"}
          </Button>
          <Button onClick={runHealthCheck} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Verificando..." : "Executar Teste"}
          </Button>
        </div>
      </div>

      {lastCheck && (
        <p className="text-sm text-muted-foreground">
          Última verificação: {lastCheck.toLocaleString("pt-BR")}
        </p>
      )}

      {healthData && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Keys Check */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chaves</CardTitle>
                <StatusIcon status={healthData.checks.keys.status} />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Secret: <span className="font-medium">{healthData.checks.keys.secretKeyMode.toUpperCase()}</span></p>
                  <p>Public: <span className="font-medium">{healthData.checks.keys.publishableKeyMode.toUpperCase()}</span></p>
                  <p className={healthData.checks.keys.consistent ? "text-green-600" : "text-red-600"}>
                    {healthData.checks.keys.consistent ? "✓ Consistentes" : "⚠ Inconsistentes"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* API Check */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Stripe</CardTitle>
                <StatusIcon status={healthData.checks.api.status} />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Latência: {healthData.checks.api.latencyMs}ms</p>
                  {healthData.checks.api.accountName && (
                    <p>Conta: {healthData.checks.api.accountName}</p>
                  )}
                  {healthData.checks.api.chargesEnabled !== undefined && (
                    <p className={healthData.checks.api.chargesEnabled ? "text-green-600" : "text-yellow-600"}>
                      {healthData.checks.api.chargesEnabled ? "✓ Cobranças ativas" : "⚠ Cobranças inativas"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Webhook Check */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Webhook</CardTitle>
                <StatusIcon status={healthData.checks.webhook.status} />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{healthData.checks.webhook.secretConfigured ? "✓ Configurado" : "⚠ Não configurado"}</p>
                  {healthData.checks.webhook.lastEventReceived && (
                    <p>Último evento: {new Date(healthData.checks.webhook.lastEventReceived).toLocaleString("pt-BR")}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Overall Status */}
            <Card className={
              healthData.status === "operational" ? "border-green-500/50 bg-green-500/5" :
              healthData.status === "degraded" ? "border-yellow-500/50 bg-yellow-500/5" :
              "border-red-500/50 bg-red-500/5"
            }>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
                <Activity className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {healthData.status === "operational" ? "Operacional" :
                   healthData.status === "degraded" ? "Degradado" : "Offline"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Testes de Pagamento (Cartão + PIX)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Test */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Cartão de Crédito
                    </span>
                    <StatusIcon status={healthData.checks.paymentTests.card.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {healthData.checks.paymentTests.card.message}
                  </p>
                  {healthData.checks.paymentTests.card.latencyMs && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Latência: {healthData.checks.paymentTests.card.latencyMs}ms
                    </p>
                  )}
                </div>

                {/* PIX Test */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      PIX (BRL)
                    </span>
                    <StatusIcon status={healthData.checks.paymentTests.pix.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {healthData.checks.paymentTests.pix.message}
                  </p>
                  {healthData.checks.paymentTests.pix.latencyMs && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Latência: {healthData.checks.paymentTests.pix.latencyMs}ms
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site-Wide Search Results */}
          {healthData.checks.siteSearch && healthData.checks.siteSearch.status !== "skipped" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Busca Automática no Site
                  <Badge variant="outline" className="ml-2">
                    {healthData.checks.siteSearch.sectionsScanned} seções | {healthData.checks.siteSearch.paymentFlowsFound} fluxos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {healthData.checks.siteSearch.sections.map((section, i) => (
                    <div 
                      key={i} 
                      className={`p-3 border rounded-lg ${
                        section.status === "error" ? "border-red-500/30 bg-red-500/5" :
                        section.status === "active" ? "border-green-500/30 bg-green-500/5" :
                        "border-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm flex items-center gap-2">
                          {getSectionIcon(section.type)}
                          {section.name}
                        </span>
                        {section.status === "active" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : section.status === "error" ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {section.lastActivity && (
                        <p className="text-xs text-muted-foreground">
                          Última atividade: {new Date(section.lastActivity).toLocaleString("pt-BR")}
                        </p>
                      )}
                      {section.issues.length > 0 && (
                        <p className="text-xs text-red-400 mt-1">{section.issues[0]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Sync Results */}
          {healthData.checks.databaseSync && healthData.checks.databaseSync.status !== "skipped" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Verificação de Banco de Dados
                  <StatusIcon status={healthData.checks.databaseSync.status} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">{healthData.checks.databaseSync.ordersChecked}</div>
                    <div className="text-xs text-muted-foreground">Pedidos Verificados</div>
                  </div>
                  <div className={`text-center p-3 border rounded-lg ${
                    healthData.checks.databaseSync.pendingOrders > 0 ? "border-yellow-500/30 bg-yellow-500/5" : ""
                  }`}>
                    <div className="text-2xl font-bold">{healthData.checks.databaseSync.pendingOrders}</div>
                    <div className="text-xs text-muted-foreground">Pedidos Pendentes (+2h)</div>
                  </div>
                  <div className={`text-center p-3 border rounded-lg ${
                    healthData.checks.databaseSync.inconsistentOrders > 0 ? "border-red-500/30 bg-red-500/5" : ""
                  }`}>
                    <div className="text-2xl font-bold">{healthData.checks.databaseSync.inconsistentOrders}</div>
                    <div className="text-xs text-muted-foreground">Inconsistentes</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">{healthData.checks.databaseSync.pendingCommissions}</div>
                    <div className="text-xs text-muted-foreground">Comissões Pendentes</div>
                  </div>
                </div>
                {healthData.checks.databaseSync.issues.length > 0 && (
                  <div className="p-3 border border-yellow-500/30 bg-yellow-500/5 rounded-lg">
                    <p className="text-sm font-medium text-yellow-500 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Problemas Detectados
                    </p>
                    <ul className="text-xs text-yellow-400 space-y-1">
                      {healthData.checks.databaseSync.issues.map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {healthData.recommendations && healthData.recommendations.length > 0 && (
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-blue-500 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {healthData.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-blue-400 flex items-start gap-2">
                      <span>💡</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Errors & Auto-Fixes */}
          {(healthData.errors.length > 0 || healthData.autoFixes.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthData.errors.length > 0 && (
                <Card className="border-red-500/50">
                  <CardHeader>
                    <CardTitle className="text-red-500 flex items-center gap-2">
                      <AlertOctagon className="h-5 w-5" />
                      Erros Detectados ({healthData.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {healthData.errors.map((error, i) => (
                        <li key={i} className="text-sm text-red-400 flex items-start gap-2">
                          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {healthData.autoFixes.length > 0 && (
                <Card className="border-yellow-500/50">
                  <CardHeader>
                    <CardTitle className="text-yellow-500 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Auto-Correções Aplicadas ({healthData.autoFixes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {healthData.autoFixes.map((fix, i) => (
                        <li key={i} className="text-sm text-yellow-400 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{fix}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Detalhes Técnicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
