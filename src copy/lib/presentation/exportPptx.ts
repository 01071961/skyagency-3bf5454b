/**
 * Export presentation to PowerPoint (.pptx)
 * Uses pptxgenjs library for real PPTX generation
 */
import pptxgen from 'pptxgenjs';

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

// Convert hex color to RGB for pptxgenjs
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? hex.replace('#', '') : '000000';
};

// Convert canvas position (0-100%) to inches (10" x 5.625" slide)
const percentToInches = (percent: number, dimension: 'x' | 'y' | 'width' | 'height'): number => {
  const slideWidth = 10;
  const slideHeight = 5.625;
  
  switch (dimension) {
    case 'x':
    case 'width':
      return (percent / 100) * slideWidth;
    case 'y':
    case 'height':
      return (percent / 100) * slideHeight;
    default:
      return percent / 100;
  }
};

export async function exportToPptx(presentation: Presentation): Promise<void> {
  const pptx = new pptxgen();

  // Set presentation metadata
  pptx.title = presentation.title;
  pptx.author = 'SKY BRASIL - VIP Slides Creator';
  pptx.company = 'SKY BRASIL';
  pptx.subject = 'Apresentação gerada pelo Criador de Slides VIP';
  
  // Set slide size (16:9)
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
  pptx.layout = 'LAYOUT_16x9';

  // Process each slide
  for (const slide of presentation.slides) {
    const pptxSlide = pptx.addSlide();
    
    // Set background color
    if (slide.backgroundColor) {
      if (slide.backgroundColor.startsWith('linear-gradient')) {
        // For gradients, use first color
        pptxSlide.background = { color: '667eea' };
      } else {
        pptxSlide.background = { color: hexToRgb(slide.backgroundColor) };
      }
    }

    // Process each element
    for (const element of slide.elements) {
      const x = percentToInches(element.x, 'x');
      const y = percentToInches(element.y, 'y');
      const w = percentToInches(element.width, 'width');
      const h = percentToInches(element.height, 'height');

      switch (element.type) {
        case 'text':
          pptxSlide.addText(element.content || 'Texto', {
            x,
            y,
            w,
            h,
            fontSize: element.style.fontSize ? element.style.fontSize * 0.75 : 14,
            color: element.style.color ? hexToRgb(element.style.color) : 'FFFFFF',
            bold: element.style.fontWeight === 'bold',
            align: 'center',
            valign: 'middle',
            wrap: true,
          });
          break;

        case 'shape':
          pptxSlide.addShape('rect', {
            x,
            y,
            w,
            h,
            fill: { color: element.style.backgroundColor ? hexToRgb(element.style.backgroundColor) : '3B82F6' },
            line: { color: '000000', width: 0 },
          });
          break;

        case 'image':
          if (element.content && element.content.startsWith('http')) {
            try {
              pptxSlide.addImage({
                path: element.content,
                x,
                y,
                w,
                h,
              });
            } catch (error) {
              console.error('Failed to add image:', error);
            }
          }
          break;
      }
    }
  }

  // Generate and download
  await pptx.writeFile({ fileName: `${presentation.title || 'apresentacao'}.pptx` });
}

export async function exportToPdf(presentation: Presentation): Promise<void> {
  const { jsPDF } = await import('jspdf');
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [10, 5.625],
  });

  for (let i = 0; i < presentation.slides.length; i++) {
    const slide = presentation.slides[i];
    
    if (i > 0) {
      pdf.addPage([10, 5.625], 'landscape');
    }

    // Background
    const bgColor = slide.backgroundColor || '#1a1a2e';
    if (!bgColor.startsWith('linear-gradient')) {
      const r = parseInt(bgColor.slice(1, 3), 16);
      const g = parseInt(bgColor.slice(3, 5), 16);
      const b = parseInt(bgColor.slice(5, 7), 16);
      pdf.setFillColor(r, g, b);
      pdf.rect(0, 0, 10, 5.625, 'F');
    }

    // Elements
    for (const element of slide.elements) {
      const x = (element.x / 100) * 10;
      const y = (element.y / 100) * 5.625;
      const w = (element.width / 100) * 10;
      const h = (element.height / 100) * 5.625;

      if (element.type === 'text') {
        const color = element.style.color || '#ffffff';
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        pdf.setTextColor(r, g, b);
        pdf.setFontSize(element.style.fontSize || 14);
        pdf.text(element.content || '', x + w / 2, y + h / 2, { align: 'center' });
      } else if (element.type === 'shape') {
        const bgc = element.style.backgroundColor || '#3B82F6';
        const r = parseInt(bgc.slice(1, 3), 16);
        const g = parseInt(bgc.slice(3, 5), 16);
        const b = parseInt(bgc.slice(5, 7), 16);
        pdf.setFillColor(r, g, b);
        pdf.rect(x, y, w, h, 'F');
      }
    }
  }

  pdf.save(`${presentation.title || 'apresentacao'}.pdf`);
}
