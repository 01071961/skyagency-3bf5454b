import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

type Preview = {
  ok: boolean;
  url: string;
  title?: string;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
  error?: string;
};

export function LinkPreviewCard({ url }: { url: string }) {
  const [data, setData] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizedUrl = useMemo(() => {
    try {
      return new URL(url).toString();
    } catch {
      return url;
    }
  }, [url]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("url-preview", {
          body: { url: normalizedUrl },
        });

        if (!active) return;
        if (error) {
          setData({ ok: false, url: normalizedUrl, error: error.message });
          return;
        }
        setData(data as Preview);
      } catch (e) {
        if (!active) return;
        setData({ ok: false, url: normalizedUrl, error: e instanceof Error ? e.message : "Erro" });
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [normalizedUrl]);

  if (loading) {
    return (
      <Card className="overflow-hidden bg-muted/20 border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.ok) {
    return (
      <Card className="bg-muted/20 border-border/50">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{normalizedUrl}</span>
            </p>
            <p className="text-xs text-muted-foreground">Pré-visualização indisponível</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href={normalizedUrl} target="_blank" rel="noreferrer">
              Abrir <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-muted/20 border-border/50 hover:border-primary/30 transition-colors">
      <a href={data.url} target="_blank" rel="noreferrer" className="block">
        <div className="flex">
          {data.image ? (
            <img
              src={data.image}
              alt={`Prévia do link: ${data.title ?? data.url}`}
              loading="lazy"
              className="h-24 w-24 object-cover"
            />
          ) : (
            <div className="h-24 w-24 bg-muted flex items-center justify-center">
              <LinkIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="p-3 min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{data.siteName ?? new URL(data.url).hostname}</p>
            <p className="text-sm font-semibold text-foreground line-clamp-1">{data.title ?? data.url}</p>
            {data.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{data.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1 truncate">{data.url}</p>
            )}
          </div>
        </div>
      </a>
    </Card>
  );
}
