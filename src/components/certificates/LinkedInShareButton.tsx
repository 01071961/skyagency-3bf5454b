import { useState } from 'react';
import { Linkedin, Share2, Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface LinkedInShareButtonProps {
  certificateUrl: string;
  courseName: string;
  studentName: string;
  className?: string;
}

export default function LinkedInShareButton({ 
  certificateUrl, 
  courseName, 
  studentName,
  className 
}: LinkedInShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const publicUrl = certificateUrl.startsWith('http') 
    ? certificateUrl 
    : `${window.location.origin}${certificateUrl}`;
  
  const encodedUrl = encodeURIComponent(publicUrl);
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  
  const shareText = `🎓 Concluí o curso "${courseName}" e obtive meu certificado! Verifique em: ${publicUrl}`;

  const handleLinkedInShare = () => {
    window.open(linkedInShareUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificado - ${courseName}`,
          text: `${studentName} concluiu o curso "${courseName}"`,
          url: publicUrl,
        });
      } catch (error) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleLinkedInShare}>
          <Linkedin className="h-4 w-4 mr-2 text-[#0077b5]" />
          Compartilhar no LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? 'Link copiado!' : 'Copiar link público'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(publicUrl, '_blank')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir página pública
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Mais opções de compartilhamento
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
