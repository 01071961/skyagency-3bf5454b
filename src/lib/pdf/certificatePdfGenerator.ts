import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface CertificateData {
  certificate_number: string;
  validation_code: string;
  student_name: string;
  course_name: string;
  course_hours: number;
  final_score: number | null;
  issued_at: string;
}

interface CompanySettings {
  company_name: string;
  legal_name: string | null;
  cnpj: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_city: string | null;
  address_state: string | null;
  legal_representative_name: string | null;
  legal_representative_role: string | null;
  legal_representative_signature_url: string | null;
  academic_coordinator_name: string | null;
  academic_coordinator_role: string | null;
  academic_coordinator_signature_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  certificate_footer_text: string | null;
}

interface TemplateLayout {
  background_url?: string;
  font_family?: string;
  title_position?: { x: number; y: number };
  name_position?: { x: number; y: number };
  course_position?: { x: number; y: number };
  date_position?: { x: number; y: number };
  qr_position?: { x: number; y: number };
  signature_positions?: Array<{ x: number; y: number; width: number }>;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Load image as base64 for jsPDF
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Generate QR Code as data URL
async function generateQRCode(text: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, {
      width: 100,
      margin: 1,
      color: {
        dark: '#1e3a5f',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
}

export async function generateCertificatePDF(
  certificate: CertificateData,
  company: CompanySettings | null,
  template?: TemplateLayout | null
): Promise<Blob> {
  // Create landscape A4 PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor = hexToRgb(company?.primary_color || '#1e3a5f');
  const secondaryColor = hexToRgb(company?.secondary_color || '#d4a574');

  // Add background image if provided in template
  if (template?.background_url) {
    const bgBase64 = await loadImageAsBase64(template.background_url);
    if (bgBase64) {
      try {
        doc.addImage(bgBase64, 'PNG', 0, 0, pageWidth, pageHeight);
      } catch (e) {
        console.warn('Could not add background to PDF:', e);
      }
    }
  } else {
    // Default elegant border design
    // Draw decorative border
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    
    doc.setLineWidth(0.8);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
    
    doc.setLineWidth(0.3);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Corner ornaments
    doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
    doc.setLineWidth(1.5);
    // Top-left
    doc.line(8, 22, 22, 22);
    doc.line(22, 8, 22, 22);
    // Top-right
    doc.line(pageWidth - 22, 22, pageWidth - 8, 22);
    doc.line(pageWidth - 22, 8, pageWidth - 22, 22);
    // Bottom-left
    doc.line(8, pageHeight - 22, 22, pageHeight - 22);
    doc.line(22, pageHeight - 8, 22, pageHeight - 22);
    // Bottom-right
    doc.line(pageWidth - 22, pageHeight - 22, pageWidth - 8, pageHeight - 22);
    doc.line(pageWidth - 22, pageHeight - 8, pageWidth - 22, pageHeight - 22);
  }

  // Header - Company name
  let yPos = template?.title_position?.y || 30;
  
  // Load and add logo if available
  if (company?.logo_url) {
    const logoBase64 = await loadImageAsBase64(company.logo_url);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 12, yPos - 5, 24, 24);
        yPos += 22;
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }
  }

  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const companyName = company?.company_name || 'SKY Brasil Academy';
  doc.text(companyName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  const companyInfo = [
    company?.cnpj ? `CNPJ: ${company.cnpj}` : '',
    company?.website || ''
  ].filter(Boolean).join(' | ');
  if (companyInfo) {
    doc.text(companyInfo, pageWidth / 2, yPos, { align: 'center' });
  }

  // Title
  yPos += 20;
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO', pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('DE CONCLUSÃO DE CURSO', pageWidth / 2, yPos, { align: 'center' });

  // Main content
  yPos += 18;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.text('Certificamos que', pageWidth / 2, yPos, { align: 'center' });

  yPos += 12;
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.student_name, pageWidth / 2, yPos, { align: 'center' });

  // Underline for name
  const nameWidth = doc.getTextWidth(certificate.student_name);
  doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - nameWidth / 2 - 5, yPos + 2, pageWidth / 2 + nameWidth / 2 + 5, yPos + 2);

  yPos += 14;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('concluiu com êxito o curso de', pageWidth / 2, yPos, { align: 'center' });

  yPos += 10;
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.course_name, pageWidth / 2, yPos, { align: 'center' });

  // Course details
  yPos += 12;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const details = [];
  if (certificate.course_hours > 0) {
    details.push(`Carga Horária: ${certificate.course_hours} horas`);
  }
  if (certificate.final_score !== null) {
    details.push(`Aproveitamento: ${certificate.final_score}%`);
  }
  if (details.length > 0) {
    doc.text(details.join('     |     '), pageWidth / 2, yPos, { align: 'center' });
  }

  // Date and location
  yPos += 18;
  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const location = [company?.address_city, company?.address_state].filter(Boolean).join(' - ') || 'São Paulo - SP';
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.text(`${location}, ${issuedDate}`, pageWidth / 2, yPos, { align: 'center' });

  // Signatures
  yPos += 18;
  const signatureWidth = 60;
  const signatureSpacing = 30;
  const totalWidth = signatureWidth * 2 + signatureSpacing;
  const startX = (pageWidth - totalWidth) / 2;

  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.5);

  // Coordinator signature
  if (company?.academic_coordinator_name) {
    // Add signature image if available
    if (company.academic_coordinator_signature_url) {
      const sigBase64 = await loadImageAsBase64(company.academic_coordinator_signature_url);
      if (sigBase64) {
        try {
          doc.addImage(sigBase64, 'PNG', startX + 10, yPos - 12, 40, 12);
        } catch (e) {
          console.warn('Could not add coordinator signature:', e);
        }
      }
    }
    
    doc.line(startX, yPos, startX + signatureWidth, yPos);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.academic_coordinator_name, startX + signatureWidth / 2, yPos + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(company.academic_coordinator_role || 'Coordenador Acadêmico', startX + signatureWidth / 2, yPos + 9, { align: 'center' });
  }

  // Legal representative signature
  if (company?.legal_representative_name) {
    const legalX = startX + signatureWidth + signatureSpacing;
    
    // Add signature image if available
    if (company.legal_representative_signature_url) {
      const sigBase64 = await loadImageAsBase64(company.legal_representative_signature_url);
      if (sigBase64) {
        try {
          doc.addImage(sigBase64, 'PNG', legalX + 10, yPos - 12, 40, 12);
        } catch (e) {
          console.warn('Could not add legal representative signature:', e);
        }
      }
    }
    
    doc.line(legalX, yPos, legalX + signatureWidth, yPos);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.legal_representative_name, legalX + signatureWidth / 2, yPos + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(company.legal_representative_role || 'Diretor', legalX + signatureWidth / 2, yPos + 9, { align: 'center' });
  }

  // QR Code for validation
  const validationUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://skybrasil.com.br'}/verificar-certificado/${certificate.validation_code}`;
  const qrDataUrl = await generateQRCode(validationUrl);
  
  const qrX = template?.qr_position?.x || pageWidth - 45;
  const qrY = template?.qr_position?.y || pageHeight - 45;
  
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, 25, 25);
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('Escaneie para validar', qrX + 12.5, qrY + 28, { align: 'center' });
    } catch (e) {
      console.warn('Could not add QR code to PDF:', e);
    }
  }

  // Footer - Certificate info
  yPos = pageHeight - 25;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(25, yPos - 5, pageWidth - 50, yPos - 5);

  doc.setTextColor(140, 140, 140);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  // Left side - certificate numbers
  doc.text(`Certificado Nº: ${certificate.certificate_number}`, 25, yPos);
  doc.text(`Código de Validação: ${certificate.validation_code}`, 25, yPos + 4);

  // Right side - verification
  const website = company?.website || 'skybrasil.com.br';
  doc.text('Verifique a autenticidade em:', pageWidth - 50, yPos, { align: 'right' });
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text(`${website}/verificar-certificado/${certificate.validation_code}`, pageWidth - 50, yPos + 4, { align: 'right' });

  // Footer text
  if (company?.certificate_footer_text) {
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(6);
    doc.text(company.certificate_footer_text, pageWidth / 2, pageHeight - 12, { align: 'center' });
  }

  // Return as blob
  return doc.output('blob');
}

export async function downloadCertificatePDF(
  certificate: CertificateData,
  company: CompanySettings | null
): Promise<void> {
  const pdfBlob = await generateCertificatePDF(certificate, company);
  
  // Create download link
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `certificado-${certificate.validation_code}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
