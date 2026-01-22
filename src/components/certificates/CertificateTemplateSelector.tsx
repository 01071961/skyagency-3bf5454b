'use client';

import { useCertificateTemplates, CertificateTemplate, TranscriptTemplate } from '@/hooks/useCertificateTemplates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Award, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertificateTemplateSelectorProps {
  selectedId: string | null;
  onChange: (id: string) => void;
}

interface TranscriptTemplateSelectorProps {
  selectedId: string | null;
  onChange: (id: string) => void;
}

export function CertificateTemplateSelector({ selectedId, onChange }: CertificateTemplateSelectorProps) {
  const { certificateTemplates, loadingCertificates } = useCertificateTemplates();

  if (loadingCertificates) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Template de Certificado</h3>
      </div>
      
      <RadioGroup 
        value={selectedId || certificateTemplates?.find(t => t.is_default)?.id || ''}
        onValueChange={onChange}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {certificateTemplates?.map((template) => (
          <div key={template.id}>
            <RadioGroupItem
              value={template.id}
              id={`cert-${template.id}`}
              className="sr-only"
            />
            <Label
              htmlFor={`cert-${template.id}`}
              className="cursor-pointer"
            >
              <Card
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-md",
                  selectedId === template.id || (!selectedId && template.is_default)
                    ? "ring-2 ring-primary"
                    : "hover:ring-1 hover:ring-primary/50"
                )}
              >
                {/* Preview */}
                <div 
                  className="h-24 flex items-center justify-center"
                  style={{
                    backgroundColor: template.layout?.backgroundColor || '#ffffff',
                    borderBottom: `4px solid ${template.layout?.borderColor || '#3b82f6'}`
                  }}
                >
                  <Award 
                    className="h-12 w-12"
                    style={{ color: template.layout?.accentColor || '#1e40af' }}
                  />
                </div>
                
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{template.name}</span>
                    {(selectedId === template.id || (!selectedId && template.is_default)) && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  {template.is_default && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Padrão
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

export function TranscriptTemplateSelector({ selectedId, onChange }: TranscriptTemplateSelectorProps) {
  const { transcriptTemplates, loadingTranscripts } = useCertificateTemplates();

  if (loadingTranscripts) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Template de Histórico Escolar</h3>
      </div>
      
      <RadioGroup 
        value={selectedId || transcriptTemplates?.find(t => t.is_default)?.id || ''}
        onValueChange={onChange}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {transcriptTemplates?.map((template) => (
          <div key={template.id}>
            <RadioGroupItem
              value={template.id}
              id={`trans-${template.id}`}
              className="sr-only"
            />
            <Label
              htmlFor={`trans-${template.id}`}
              className="cursor-pointer"
            >
              <Card
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-md",
                  selectedId === template.id || (!selectedId && template.is_default)
                    ? "ring-2 ring-primary"
                    : "hover:ring-1 hover:ring-primary/50"
                )}
              >
                {/* Preview */}
                <div className="h-24 p-3 bg-muted/50 flex flex-col justify-center">
                  <div className="space-y-1">
                    <div className="h-2 bg-muted-foreground/20 rounded w-3/4" />
                    <div className="h-2 bg-muted-foreground/20 rounded w-1/2" />
                    {template.layout?.showModuleDetails && (
                      <>
                        <div className="h-2 bg-muted-foreground/10 rounded w-full mt-2" />
                        <div className="h-2 bg-muted-foreground/10 rounded w-2/3" />
                      </>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{template.name}</span>
                    {(selectedId === template.id || (!selectedId && template.is_default)) && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {template.description}
                  </p>
                  {template.is_default && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Padrão
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
