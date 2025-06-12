import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PdfTemplateConfig } from './pdf-generator';

// Types for PDF data
interface Item {
  service?: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  amount: string | number;
  notes?: string;
}

interface ClientInfo {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface ContractorInfo {
  businessName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logo?: string;
}

interface EstimateData {
  estimateNumber: string;
  status: string;
  issueDate: Date | string;
  expiryDate?: Date | string;
  subtotal: string | number;
  tax?: string | number;
  discount?: string | number;
  total: string | number;
  terms?: string;
  notes?: string;
  items: Item[];
  client: ClientInfo;
  contractor: ContractorInfo;
  projectTitle?: string;
  projectDescription?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  status: string;
  issueDate: Date | string;
  dueDate?: Date | string;
  subtotal: string | number;
  tax?: string | number;
  discount?: string | number;
  total: string | number;
  amountPaid?: string | number;
  terms?: string;
  notes?: string;
  items: Item[];
  client: ClientInfo;
  contractor: ContractorInfo;
  projectTitle?: string;
  projectDescription?: string;
  clientSignature?: string;
  paymentMethod?: string;
}

// Constants for PDF generation
const PAGE_MARGIN = 20;
const PAGE_WIDTH = 210; // A4 width in mm
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);

// Always use English for this preview generator
function translate(_textEs: string, textEn: string): string {
  return textEn;
}

// Format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Format date
const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return "Not specified";
  
  try {
    const date = new Date(dateString);
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

/**
 * Generate a preview of an estimate PDF with customizations from the template settings
 */
export async function generateEstimatePreview(data: EstimateData, config: PdfTemplateConfig): Promise<Blob> {
  // Create a new PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Use basic styling based on config
  const primaryColor = config.colorPrimary || "#003366";
  const secondaryColor = config.colorSecondary || "#0D6EFD";
  
  // Set font
  const fontFamily = config.fontMain || "helvetica";
  pdf.setFont(fontFamily);
  
  // Title section
  pdf.setFontSize(24);
  pdf.setTextColor(primaryColor);
  pdf.setFont(fontFamily, 'bold');
  pdf.text('ESTIMATE', PAGE_MARGIN, 30);
  
  // Add contractor info
  pdf.setFontSize(14);
  pdf.text(data.contractor.businessName, PAGE_MARGIN, 40);
  
  pdf.setFontSize(10);
  pdf.setFont(fontFamily, 'normal');
  let contactY = 45;
  
  if (data.contractor.address) {
    pdf.text(data.contractor.address, PAGE_MARGIN, contactY);
    contactY += 5;
  }
  
  if (data.contractor.phone) {
    pdf.text(data.contractor.phone, PAGE_MARGIN, contactY);
    contactY += 5;
  }
  
  if (data.contractor.email) {
    pdf.text(data.contractor.email, PAGE_MARGIN, contactY);
    contactY += 5;
  }
  
  // Add client info
  pdf.setFontSize(12);
  pdf.setFont(fontFamily, 'bold');
  pdf.text('Bill to', PAGE_MARGIN, 70);
  
  pdf.setFontSize(10);
  pdf.setFont(fontFamily, 'normal');
  let clientY = 75;
  
  pdf.text(`${data.client.firstName} ${data.client.lastName}`, PAGE_MARGIN, clientY);
  clientY += 5;
  
  if (data.client.address) {
    pdf.text(data.client.address, PAGE_MARGIN, clientY);
    clientY += 5;
  }
  
  if (data.client.city && data.client.state) {
    pdf.text(`${data.client.city}, ${data.client.state} ${data.client.zipCode || ''}`, PAGE_MARGIN, clientY);
    clientY += 5;
  }
  
  // Add estimate details
  pdf.setFontSize(12);
  pdf.setFont(fontFamily, 'bold');
  pdf.text('Estimate details', PAGE_MARGIN, 95);
  
  pdf.setFontSize(10);
  pdf.setFont(fontFamily, 'normal');
  let detailsY = 100;
  
  pdf.text(`Estimate no.: ${data.estimateNumber}`, PAGE_MARGIN, detailsY);
  detailsY += 5;
  
  pdf.text(`Estimate date: ${formatDate(data.issueDate)}`, PAGE_MARGIN, detailsY);
  detailsY += 5;
  
  if (data.expiryDate) {
    pdf.text(`Expiration date: ${formatDate(data.expiryDate)}`, PAGE_MARGIN, detailsY);
    detailsY += 5;
  }
  
  // Add items table
  let tableY = 120;
  
  // Table header
  pdf.setFont(fontFamily, 'bold');
  pdf.setFillColor(240, 240, 240);
  pdf.rect(PAGE_MARGIN, tableY, CONTENT_WIDTH, 10, 'F');
  
  pdf.text('#', PAGE_MARGIN + 5, tableY + 6);
  pdf.text('Product or service', PAGE_MARGIN + 15, tableY + 6);
  pdf.text('SKU', PAGE_MARGIN + 85, tableY + 6);
  pdf.text('Description', PAGE_MARGIN + 105, tableY + 6);
  pdf.text('Qty', PAGE_MARGIN + 140, tableY + 6);
  pdf.text('Rate', PAGE_MARGIN + 155, tableY + 6);
  pdf.text('Amount', PAGE_MARGIN + 175, tableY + 6);
  
  tableY += 15;
  
  // Table rows
  pdf.setFont(fontFamily, 'normal');
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    
    pdf.text(`${i + 1}.`, PAGE_MARGIN + 5, tableY);
    pdf.text(item.service || '', PAGE_MARGIN + 15, tableY);
    pdf.text('', PAGE_MARGIN + 85, tableY); // SKU (empty)
    
    // Description - we'll truncate if too long
    const desc = item.description.length > 20 ? item.description.substring(0, 17) + '...' : item.description;
    pdf.text(desc, PAGE_MARGIN + 105, tableY);
    
    pdf.text(String(item.quantity), PAGE_MARGIN + 140, tableY);
    pdf.text(formatCurrency(item.unitPrice), PAGE_MARGIN + 155, tableY);
    pdf.text(formatCurrency(item.amount), PAGE_MARGIN + 175, tableY);
    
    tableY += 10;
    
    // If we're near the bottom of the page, start a new page
    if (tableY > 250) {
      pdf.addPage();
      tableY = 30;
    }
  }
  
  // Totals section
  tableY += 5;
  pdf.line(PAGE_MARGIN, tableY, PAGE_WIDTH - PAGE_MARGIN, tableY);
  tableY += 10;
  
  // Right align the total labels and values
  pdf.text('Total', PAGE_WIDTH - PAGE_MARGIN - 40, tableY);
  pdf.text(formatCurrency(data.total), PAGE_WIDTH - PAGE_MARGIN, tableY, { align: 'right' });
  
  // Terms and notes if configured to show
  if (config.showTerms && data.terms) {
    tableY += 20;
    pdf.setFont(fontFamily, 'bold');
    pdf.text('Note to customer', PAGE_MARGIN, tableY);
    tableY += 8;
    
    pdf.setFont(fontFamily, 'normal');
    pdf.text(data.terms, PAGE_MARGIN, tableY);
  }
  
  // Signature line if configured
  if (config.showSignatureLine) {
    tableY += 25;
    pdf.line(PAGE_MARGIN, tableY, PAGE_MARGIN + 60, tableY);
    tableY += 5;
    pdf.text('Accepted date', PAGE_MARGIN, tableY);
    
    pdf.line(PAGE_MARGIN + 80, tableY - 5, PAGE_MARGIN + 140, tableY - 5);
    pdf.text('Accepted by', PAGE_MARGIN + 80, tableY);
  }
  
  // Return the PDF as a blob
  return pdf.output('blob');
}

/**
 * Generate a preview of an invoice PDF with customizations from the template settings
 */
export async function generateInvoicePreview(data: InvoiceData, config: PdfTemplateConfig): Promise<Blob> {
  // Create a new PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Use basic styling based on config
  const primaryColor = config.colorPrimary || "#003366";
  const secondaryColor = config.colorSecondary || "#0D6EFD";
  
  // Set font
  const fontFamily = config.fontMain || "helvetica";
  pdf.setFont(fontFamily);
  
  // Title section
  pdf.setFontSize(24);
  pdf.setTextColor(primaryColor);
  pdf.setFont(fontFamily, 'bold');
  pdf.text('INVOICE', PAGE_MARGIN, 30);
  
  // Add contractor info
  pdf.setFontSize(14);
  pdf.text(data.contractor.businessName, PAGE_MARGIN, 40);
  
  pdf.setFontSize(10);
  pdf.setFont(fontFamily, 'normal');
  let contactY = 45;
  
  if (data.contractor.address) {
    pdf.text(data.contractor.address, PAGE_MARGIN, contactY);
    contactY += 5;
  }
  
  if (data.contractor.phone) {
    pdf.text(data.contractor.phone, PAGE_MARGIN, contactY);
    contactY += 5;
  }
  
  if (data.contractor.email) {
    pdf.text(data.contractor.email, PAGE_MARGIN, contactY);
    contactY += 5;
  }
  
  // Add client info
  pdf.setFontSize(12);
  pdf.setFont(fontFamily, 'bold');
  pdf.text('Bill to', PAGE_MARGIN, 70);
  
  pdf.setFontSize(10);
  pdf.setFont(fontFamily, 'normal');
  let clientY = 75;
  
  pdf.text(`${data.client.firstName} ${data.client.lastName}`, PAGE_MARGIN, clientY);
  clientY += 5;
  
  if (data.client.address) {
    pdf.text(data.client.address, PAGE_MARGIN, clientY);
    clientY += 5;
  }
  
  if (data.client.city && data.client.state) {
    pdf.text(`${data.client.city}, ${data.client.state} ${data.client.zipCode || ''}`, PAGE_MARGIN, clientY);
    clientY += 5;
  }
  
  // Add invoice details
  pdf.setFontSize(12);
  pdf.setFont(fontFamily, 'bold');
  pdf.text('Invoice details', PAGE_MARGIN, 95);
  
  pdf.setFontSize(10);
  pdf.setFont(fontFamily, 'normal');
  let detailsY = 100;
  
  pdf.text(`Invoice no.: ${data.invoiceNumber}`, PAGE_MARGIN, detailsY);
  detailsY += 5;
  
  pdf.text(`Invoice date: ${formatDate(data.issueDate)}`, PAGE_MARGIN, detailsY);
  detailsY += 5;
  
  if (data.dueDate) {
    pdf.text(`Due date: ${formatDate(data.dueDate)}`, PAGE_MARGIN, detailsY);
    detailsY += 5;
  }
  
  // Add items table
  let tableY = 120;
  
  // Table header
  pdf.setFont(fontFamily, 'bold');
  pdf.setFillColor(240, 240, 240);
  pdf.rect(PAGE_MARGIN, tableY, CONTENT_WIDTH, 10, 'F');
  
  pdf.text('#', PAGE_MARGIN + 5, tableY + 6);
  pdf.text('Product or service', PAGE_MARGIN + 15, tableY + 6);
  pdf.text('SKU', PAGE_MARGIN + 85, tableY + 6);
  pdf.text('Description', PAGE_MARGIN + 105, tableY + 6);
  pdf.text('Qty', PAGE_MARGIN + 140, tableY + 6);
  pdf.text('Rate', PAGE_MARGIN + 155, tableY + 6);
  pdf.text('Amount', PAGE_MARGIN + 175, tableY + 6);
  
  tableY += 15;
  
  // Table rows
  pdf.setFont(fontFamily, 'normal');
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    
    pdf.text(`${i + 1}.`, PAGE_MARGIN + 5, tableY);
    pdf.text(item.service || '', PAGE_MARGIN + 15, tableY);
    pdf.text('', PAGE_MARGIN + 85, tableY); // SKU (empty)
    
    // Description - we'll truncate if too long
    const desc = item.description.length > 20 ? item.description.substring(0, 17) + '...' : item.description;
    pdf.text(desc, PAGE_MARGIN + 105, tableY);
    
    pdf.text(String(item.quantity), PAGE_MARGIN + 140, tableY);
    pdf.text(formatCurrency(item.unitPrice), PAGE_MARGIN + 155, tableY);
    pdf.text(formatCurrency(item.amount), PAGE_MARGIN + 175, tableY);
    
    tableY += 10;
    
    // If we're near the bottom of the page, start a new page
    if (tableY > 250) {
      pdf.addPage();
      tableY = 30;
    }
  }
  
  // Totals section
  tableY += 5;
  pdf.line(PAGE_MARGIN, tableY, PAGE_WIDTH - PAGE_MARGIN, tableY);
  tableY += 10;
  
  // Right align the total labels and values
  pdf.text('Total', PAGE_WIDTH - PAGE_MARGIN - 40, tableY);
  pdf.text(formatCurrency(data.total), PAGE_WIDTH - PAGE_MARGIN, tableY, { align: 'right' });
  
  // If showing amount paid
  if (data.amountPaid) {
    tableY += 7;
    pdf.text('Amount paid', PAGE_WIDTH - PAGE_MARGIN - 40, tableY);
    pdf.text(formatCurrency(data.amountPaid), PAGE_WIDTH - PAGE_MARGIN, tableY, { align: 'right' });
    
    // Due calculation
    const due = Number(data.total) - Number(data.amountPaid);
    tableY += 7;
    pdf.text('Balance due', PAGE_WIDTH - PAGE_MARGIN - 40, tableY);
    pdf.text(formatCurrency(due), PAGE_WIDTH - PAGE_MARGIN, tableY, { align: 'right' });
  }
  
  // Terms and notes if configured to show
  if (config.showTerms && data.terms) {
    tableY += 20;
    pdf.setFont(fontFamily, 'bold');
    pdf.text('Note to customer', PAGE_MARGIN, tableY);
    tableY += 8;
    
    pdf.setFont(fontFamily, 'normal');
    pdf.text(data.terms, PAGE_MARGIN, tableY);
  }
  
  // Signature line if configured
  if (config.showSignatureLine) {
    tableY += 25;
    pdf.text('Signature', PAGE_MARGIN, tableY);
    pdf.line(PAGE_MARGIN, tableY + 5, PAGE_MARGIN + 60, tableY + 5);
    
    // If we have a client signature, we can add it here
    if (data.clientSignature) {
      try {
        pdf.addImage(data.clientSignature, 'PNG', PAGE_MARGIN, tableY - 15, 60, 20);
      } catch (error) {
        console.error("Error adding signature to PDF:", error);
      }
    }
  }
  
  // Return the PDF as a blob
  return pdf.output('blob');
}