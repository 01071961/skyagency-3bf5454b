import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { motion, Reorder } from 'framer-motion';
import {
  Type, Image, Square, Minus, Link, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Trash2, Copy, MoveVertical, Eye, Code,
  Palette, Settings, Smartphone, Monitor, Plus, GripVertical
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type ComponentType = 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'columns';

interface EmailComponent {
  id: string;
  type: ComponentType;
  content: Record<string, any>;
  styles: Record<string, any>;
}

const COMPONENT_LIBRARY: { type: ComponentType; label: string; icon: React.ElementType }[] = [
  { type: 'text', label: 'Texto', icon: Type },
  { type: 'image', label: 'Imagem', icon: Image },
  { type: 'button', label: 'Botão', icon: Square },
  { type: 'divider', label: 'Divisor', icon: Minus },
  { type: 'spacer', label: 'Espaço', icon: MoveVertical },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultComponent = (type: ComponentType): EmailComponent => {
  const base = { id: generateId(), type, styles: {} };
  
  switch (type) {
    case 'text':
      return {
        ...base,
        content: { text: 'Digite seu texto aqui...', alignment: 'left' },
        styles: { fontSize: '16px', color: '#a1a1aa', fontWeight: 'normal', padding: '16px' },
      };
    case 'image':
      return {
        ...base,
        content: { src: '', alt: 'Imagem', link: '' },
        styles: { width: '100%', borderRadius: '8px', padding: '16px' },
      };
    case 'button':
      return {
        ...base,
        content: { text: 'Clique Aqui', link: '#', alignment: 'center' },
        styles: { 
          backgroundColor: '#ec4899', 
          color: '#ffffff', 
          padding: '14px 32px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
        },
      };
    case 'divider':
      return {
        ...base,
        content: {},
        styles: { borderColor: 'rgba(255,255,255,0.1)', borderWidth: '1px', margin: '24px 0' },
      };
    case 'spacer':
      return {
        ...base,
        content: {},
        styles: { height: '32px' },
      };
    default:
      return { ...base, content: {}, styles: {} };
  }
};

interface EmailEditorProps {
  initialHtml?: string;
  onSave?: (html: string) => void;
  onPreview?: (html: string) => void;
}

const EmailEditor = ({ initialHtml, onSave, onPreview }: EmailEditorProps) => {
  const [components, setComponents] = useState<EmailComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'code'>('editor');
  const [emailSettings, setEmailSettings] = useState({
    backgroundColor: '#0a0a0f',
    contentWidth: '600',
    contentBackground: '#1a1a2e',
  });
  const { toast } = useToast();

  const selectedComponent = components.find(c => c.id === selectedId);

  const addComponent = (type: ComponentType) => {
    const newComponent = createDefaultComponent(type);
    setComponents([...components, newComponent]);
    setSelectedId(newComponent.id);
  };

  const duplicateComponent = (id: string) => {
    const comp = components.find(c => c.id === id);
    if (comp) {
      const duplicate = { ...comp, id: generateId() };
      const index = components.findIndex(c => c.id === id);
      const newComponents = [...components];
      newComponents.splice(index + 1, 0, duplicate);
      setComponents(newComponents);
    }
  };

  const deleteComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateComponent = (id: string, updates: Partial<EmailComponent>) => {
    setComponents(components.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const generateHtml = useCallback(() => {
    const renderComponent = (comp: EmailComponent): string => {
      const { type, content, styles } = comp;
      
      switch (type) {
        case 'text':
          return `
            <tr>
              <td style="padding:${styles.padding || '16px'};text-align:${content.alignment || 'left'};">
                <p style="margin:0;font-size:${styles.fontSize};color:${styles.color};font-weight:${styles.fontWeight};line-height:1.6;">
                  ${content.text}
                </p>
              </td>
            </tr>
          `;
        case 'image':
          const imgHtml = `<img src="${content.src}" alt="${content.alt}" style="width:${styles.width};border-radius:${styles.borderRadius};display:block;max-width:100%;" />`;
          return `
            <tr>
              <td style="padding:${styles.padding || '16px'};text-align:center;">
                ${content.link ? `<a href="${content.link}" target="_blank">${imgHtml}</a>` : imgHtml}
              </td>
            </tr>
          `;
        case 'button':
          return `
            <tr>
              <td style="padding:16px;text-align:${content.alignment || 'center'};">
                <a href="${content.link}" target="_blank" style="display:inline-block;background:${styles.backgroundColor};color:${styles.color};text-decoration:none;padding:${styles.padding};border-radius:${styles.borderRadius};font-weight:${styles.fontWeight};font-size:${styles.fontSize};">
                  ${content.text}
                </a>
              </td>
            </tr>
          `;
        case 'divider':
          return `
            <tr>
              <td style="padding:0 16px;">
                <hr style="border:none;border-top:${styles.borderWidth} solid ${styles.borderColor};margin:${styles.margin};" />
              </td>
            </tr>
          `;
        case 'spacer':
          return `
            <tr>
              <td style="height:${styles.height};"></td>
            </tr>
          `;
        default:
          return '';
      }
    };

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:${emailSettings.backgroundColor};font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${emailSettings.backgroundColor};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="${emailSettings.contentWidth}" cellpadding="0" cellspacing="0" style="background:${emailSettings.contentBackground};border-radius:16px;overflow:hidden;">
          ${components.map(renderComponent).join('')}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }, [components, emailSettings]);

  const handleSave = () => {
    const html = generateHtml();
    onSave?.(html);
    toast({
      title: 'E-mail salvo!',
      description: 'O HTML foi gerado com sucesso.',
    });
  };

  const renderComponentPreview = (comp: EmailComponent) => {
    const { type, content, styles } = comp;
    const isSelected = selectedId === comp.id;

    return (
      <div
        className={`relative group cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
        }`}
        onClick={() => setSelectedId(comp.id)}
      >
        {/* Drag Handle */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        </div>

        {/* Actions */}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="secondary"
            size="sm"
            className="w-7 h-7 p-0"
            onClick={(e) => { e.stopPropagation(); duplicateComponent(comp.id); }}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-7 h-7 p-0 text-destructive"
            onClick={(e) => { e.stopPropagation(); deleteComponent(comp.id); }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Component */}
        {type === 'text' && (
          <p 
            style={{
              padding: styles.padding,
              fontSize: styles.fontSize,
              color: styles.color,
              fontWeight: styles.fontWeight,
              textAlign: content.alignment as any,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {content.text}
          </p>
        )}
        
        {type === 'image' && (
          <div style={{ padding: styles.padding, textAlign: 'center' }}>
            {content.src ? (
              <img 
                src={content.src} 
                alt={content.alt}
                style={{ 
                  width: styles.width, 
                  borderRadius: styles.borderRadius,
                  maxWidth: '100%',
                }}
              />
            ) : (
              <div className="w-full h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                <Image className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {type === 'button' && (
          <div style={{ padding: '16px', textAlign: content.alignment as any }}>
            <button
              style={{
                background: styles.backgroundColor,
                color: styles.color,
                padding: styles.padding,
                borderRadius: styles.borderRadius,
                fontWeight: styles.fontWeight,
                fontSize: styles.fontSize,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {content.text}
            </button>
          </div>
        )}

        {type === 'divider' && (
          <hr 
            style={{
              border: 'none',
              borderTop: `${styles.borderWidth} solid ${styles.borderColor}`,
              margin: styles.margin,
            }}
          />
        )}

        {type === 'spacer' && (
          <div style={{ height: styles.height }} />
        )}
      </div>
    );
  };

  const renderPropertyEditor = () => {
    if (!selectedComponent) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Settings className="w-8 h-8 mb-2" />
          <p className="text-sm">Selecione um componente</p>
        </div>
      );
    }

    const { type, content, styles, id } = selectedComponent;

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-foreground capitalize">{type}</h4>
        
        {type === 'text' && (
          <>
            <div>
              <Label className="text-xs">Texto</Label>
              <Textarea
                value={content.text}
                onChange={(e) => updateComponent(id, { content: { ...content, text: e.target.value } })}
                className="bg-muted/50 min-h-24"
              />
            </div>
            <div>
              <Label className="text-xs">Alinhamento</Label>
              <div className="flex gap-1 mt-1">
                {['left', 'center', 'right'].map((align) => (
                  <Button
                    key={align}
                    variant={content.alignment === align ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateComponent(id, { content: { ...content, alignment: align } })}
                  >
                    {align === 'left' && <AlignLeft className="w-4 h-4" />}
                    {align === 'center' && <AlignCenter className="w-4 h-4" />}
                    {align === 'right' && <AlignRight className="w-4 h-4" />}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Tamanho da fonte</Label>
              <Select
                value={styles.fontSize}
                onValueChange={(v) => updateComponent(id, { styles: { ...styles, fontSize: v } })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">Pequeno</SelectItem>
                  <SelectItem value="14px">Normal</SelectItem>
                  <SelectItem value="16px">Médio</SelectItem>
                  <SelectItem value="18px">Grande</SelectItem>
                  <SelectItem value="24px">Título</SelectItem>
                  <SelectItem value="32px">Destaque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cor do texto</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={styles.color}
                  onChange={(e) => updateComponent(id, { styles: { ...styles, color: e.target.value } })}
                  className="w-12 h-8 p-1"
                />
                <Input
                  value={styles.color}
                  onChange={(e) => updateComponent(id, { styles: { ...styles, color: e.target.value } })}
                  className="bg-muted/50 flex-1"
                />
              </div>
            </div>
          </>
        )}

        {type === 'image' && (
          <>
            <div>
              <Label className="text-xs">URL da imagem</Label>
              <Input
                value={content.src}
                onChange={(e) => updateComponent(id, { content: { ...content, src: e.target.value } })}
                placeholder="https://..."
                className="bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-xs">Texto alternativo</Label>
              <Input
                value={content.alt}
                onChange={(e) => updateComponent(id, { content: { ...content, alt: e.target.value } })}
                className="bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-xs">Link (opcional)</Label>
              <Input
                value={content.link}
                onChange={(e) => updateComponent(id, { content: { ...content, link: e.target.value } })}
                placeholder="https://..."
                className="bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-xs">Largura</Label>
              <Select
                value={styles.width}
                onValueChange={(v) => updateComponent(id, { styles: { ...styles, width: v } })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50%">50%</SelectItem>
                  <SelectItem value="75%">75%</SelectItem>
                  <SelectItem value="100%">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {type === 'button' && (
          <>
            <div>
              <Label className="text-xs">Texto do botão</Label>
              <Input
                value={content.text}
                onChange={(e) => updateComponent(id, { content: { ...content, text: e.target.value } })}
                className="bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-xs">Link</Label>
              <Input
                value={content.link}
                onChange={(e) => updateComponent(id, { content: { ...content, link: e.target.value } })}
                placeholder="https://..."
                className="bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-xs">Cor de fundo</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={styles.backgroundColor}
                  onChange={(e) => updateComponent(id, { styles: { ...styles, backgroundColor: e.target.value } })}
                  className="w-12 h-8 p-1"
                />
                <Input
                  value={styles.backgroundColor}
                  onChange={(e) => updateComponent(id, { styles: { ...styles, backgroundColor: e.target.value } })}
                  className="bg-muted/50 flex-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Alinhamento</Label>
              <div className="flex gap-1 mt-1">
                {['left', 'center', 'right'].map((align) => (
                  <Button
                    key={align}
                    variant={content.alignment === align ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateComponent(id, { content: { ...content, alignment: align } })}
                  >
                    {align === 'left' && <AlignLeft className="w-4 h-4" />}
                    {align === 'center' && <AlignCenter className="w-4 h-4" />}
                    {align === 'right' && <AlignRight className="w-4 h-4" />}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {type === 'spacer' && (
          <div>
            <Label className="text-xs">Altura: {parseInt(styles.height)}px</Label>
            <Slider
              value={[parseInt(styles.height)]}
              min={8}
              max={100}
              step={4}
              onValueChange={([v]) => updateComponent(id, { styles: { ...styles, height: `${v}px` } })}
              className="mt-2"
            />
          </div>
        )}

        {type === 'divider' && (
          <div>
            <Label className="text-xs">Cor da linha</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={styles.borderColor.replace('rgba(255,255,255,0.1)', '#1a1a2e')}
                onChange={(e) => updateComponent(id, { styles: { ...styles, borderColor: e.target.value } })}
                className="w-12 h-8 p-1"
              />
              <Input
                value={styles.borderColor}
                onChange={(e) => updateComponent(id, { styles: { ...styles, borderColor: e.target.value } })}
                className="bg-muted/50 flex-1"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Código</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'preview' && (
            <div className="flex gap-1 mr-4">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Salvar E-mail
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'editor' && (
          <>
            {/* Component Library */}
            <div className="w-64 border-r border-border p-4 overflow-auto">
              <h4 className="font-medium text-foreground mb-4">Componentes</h4>
              <div className="space-y-2">
                {COMPONENT_LIBRARY.map((comp) => (
                  <Card
                    key={comp.type}
                    className="bg-muted/30 border-border hover:border-primary/50 cursor-pointer transition-all"
                    onClick={() => addComponent(comp.type)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <comp.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{comp.label}</span>
                      <Plus className="w-4 h-4 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Email Settings */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-4">Configurações</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Cor de fundo</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={emailSettings.backgroundColor}
                        onChange={(e) => setEmailSettings({ ...emailSettings, backgroundColor: e.target.value })}
                        className="w-10 h-8 p-1"
                      />
                      <Input
                        value={emailSettings.backgroundColor}
                        onChange={(e) => setEmailSettings({ ...emailSettings, backgroundColor: e.target.value })}
                        className="bg-muted/50 flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Fundo do conteúdo</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={emailSettings.contentBackground}
                        onChange={(e) => setEmailSettings({ ...emailSettings, contentBackground: e.target.value })}
                        className="w-10 h-8 p-1"
                      />
                      <Input
                        value={emailSettings.contentBackground}
                        onChange={(e) => setEmailSettings({ ...emailSettings, contentBackground: e.target.value })}
                        className="bg-muted/50 flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: emailSettings.backgroundColor }}>
              <div 
                className="mx-auto rounded-2xl overflow-hidden min-h-96"
                style={{ 
                  maxWidth: `${emailSettings.contentWidth}px`,
                  backgroundColor: emailSettings.contentBackground,
                }}
              >
                {components.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Type className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm">Arraste componentes para começar</p>
                    <p className="text-xs mt-1">ou clique em um componente à esquerda</p>
                  </div>
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={components}
                    onReorder={setComponents}
                    className="divide-y divide-border/10"
                  >
                    {components.map((comp) => (
                      <Reorder.Item key={comp.id} value={comp}>
                        {renderComponentPreview(comp)}
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
            </div>

            {/* Properties Panel */}
            <div className="w-72 border-l border-border p-4 overflow-auto">
              <h4 className="font-medium text-foreground mb-4">Propriedades</h4>
              {renderPropertyEditor()}
            </div>
          </>
        )}

        {viewMode === 'preview' && (
          <div className="flex-1 overflow-auto p-8 bg-muted/30 flex justify-center">
            <div
              className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all ${
                previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[700px]'
              }`}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generateHtml()) }}
            />
          </div>
        )}

        {viewMode === 'code' && (
          <div className="flex-1 overflow-auto p-4">
            <pre className="bg-muted/50 p-4 rounded-lg overflow-auto text-sm text-muted-foreground">
              <code>{generateHtml()}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailEditor;
