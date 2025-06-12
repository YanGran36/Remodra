import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
// Removed Spanish locale import - using English only

// Interface for template configuration
export interface PdfTemplateConfig {
  logo?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  showItemDetails?: boolean;
  showItemNotes?: boolean;
  showProjectDetails?: boolean;
  showClientDetails?: boolean;
  colorPrimary?: string;
  colorSecondary?: string;
  fontMain?: string;
  headerStyle?: 'simple' | 'gradient' | 'boxed';
  tableStyle?: 'striped' | 'bordered' | 'minimal';
  showTerms?: boolean;
  showNotes?: boolean;
  showSignatureLine?: boolean;
  showDates?: boolean;
  showColumns?: {
    description?: boolean;
    quantity?: boolean;
    unitPrice?: boolean;
    amount?: boolean;
    notes?: boolean;
  };
}

// Types for estimates and invoices
interface Item {
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
  clientSignature?: string; // Base64 of the signature
  paymentMethod?: string;
}

// General configuration
const PAGE_MARGIN = 20;
const PAGE_WIDTH = 210; // A4 width in mm
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);

// Default colors - these will be overridden by template settings if available
const PRIMARY_COLOR_DEFAULT = "#003366"; // Primary color for headers
const SECONDARY_COLOR_DEFAULT = "#0D6EFD"; // Color secundario
const ACCENT_COLOR_DEFAULT = "#4F46E5"; // Color de acento

// Get template settings from localStorage or use defaults
interface TemplateSettings {
  colorPrimary: string;
  colorSecondary: string;
  fontMain: string;
  headerStyle: 'simple' | 'gradient' | 'boxed';
  tableStyle: 'striped' | 'bordered' | 'minimal';
  showHeader: boolean;
  showFooter: boolean;
  showItemDetails: boolean;
  showItemNotes: boolean;
  showProjectDetails: boolean;
  showClientDetails: boolean;
  showTerms: boolean;
  showNotes: boolean;
  showSignatureLine: boolean;
  showDates: boolean;
  showColumns: {
    description: boolean;
    quantity: boolean;
    unitPrice: boolean;
    amount: boolean;
    notes: boolean;
  };
}

function getTemplateSettings(): TemplateSettings | null {
  try {
    const savedTemplate = localStorage.getItem('pdfTemplateConfig');
    if (savedTemplate) {
      const settings = JSON.parse(savedTemplate);
      
      // Ensure showColumns exists with defaults if not specified
      if (!settings.showColumns) {
        settings.showColumns = {
          description: true,
          quantity: true,
          unitPrice: true,
          amount: true,
          notes: true
        };
      }
      
      return settings;
    }
  } catch (e) {
    console.error("Error loading PDF template settings:", e);
  }
  return null;
}

// Get current active color settings
function getColorSettings() {
  const templateSettings = getTemplateSettings();
  return {
    PRIMARY_COLOR: templateSettings?.colorPrimary || PRIMARY_COLOR_DEFAULT,
    SECONDARY_COLOR: templateSettings?.colorSecondary || SECONDARY_COLOR_DEFAULT,
  };
}

function getFontFamily(): string {
  return getTemplateSettings()?.fontMain || "helvetica";
}

// Translate text based on current language setting
function translate(textEs: string, textEn: string): string {
  // Always return English text regardless of language setting
  return textEn;
}

// Check if a template feature is enabled (enabled by default if not specified)
function isTemplateFeatureEnabled(featureName: keyof TemplateSettings): boolean {
  const settings = getTemplateSettings();
  if (!settings) return true; // Default to enabled if no settings
  
  // If the property exists and is explicitly false, disable the feature
  if (featureName in settings && settings[featureName] === false) {
    return false;
  }
  
  return true; // Default to enabled
}

// Check if a specific table column should be displayed
function isColumnEnabled(columnName: 'description' | 'quantity' | 'unitPrice' | 'amount' | 'notes'): boolean {
  const settings = getTemplateSettings();
  if (!settings || !settings.showColumns) return true; // Default to enabled if no settings
  
  // If the column is explicitly set to false, don't display it
  if (settings.showColumns[columnName] === false) {
    return false;
  }
  
  return true; // Default to enabled
}

// Function to render table header columns based on settings
function renderTableHeaderColumns(pdf: jsPDF, currentY: number): { nextColPosition: number } {
  let colPosition = PAGE_MARGIN + 5;
  
  // Always include at least description column no matter what
  if (isColumnEnabled('description')) {
    pdf.text("Description", colPosition, currentY + 5.5);
    colPosition = PAGE_MARGIN + 100;  // Default position for quantity
  }
  
  if (isColumnEnabled('quantity')) {
    pdf.text("Qty.", colPosition, currentY + 5.5);
    colPosition += 25;
  }
  
  if (isColumnEnabled('unitPrice')) {
    pdf.text("Unit Price", colPosition, currentY + 5.5);
    colPosition += 35;
  }
  
  if (isColumnEnabled('amount')) {
    pdf.text("Total", colPosition, currentY + 5.5);
    colPosition += 35;
  }
  
  // Add notes column if enabled
  if (isColumnEnabled('notes') && isTemplateFeatureEnabled('showItemNotes')) {
    pdf.text("Notes", colPosition, currentY + 5.5);
  }
  
  return { nextColPosition: colPosition };
}

// Function to render table data row based on column visibility settings
function renderTableDataRow(pdf: jsPDF, item: Item, currentY: number): void {
  let colPosition = PAGE_MARGIN + 5;
  
  // Description (truncated if too long)
  if (isColumnEnabled('description')) {
    const description = item.description.length > 50 
      ? item.description.substring(0, 47) + "..." 
      : item.description;
    pdf.text(description, colPosition, currentY + 5);
    colPosition = PAGE_MARGIN + 100;  // Default position for quantity
  }
  
  // Quantity
  if (isColumnEnabled('quantity')) {
    pdf.text(String(item.quantity), colPosition, currentY + 5);
    colPosition += 25;
  }
  
  // Unit price
  if (isColumnEnabled('unitPrice')) {
    pdf.text(formatCurrency(item.unitPrice), colPosition, currentY + 5);
    colPosition += 35;
  }
  
  // Amount
  if (isColumnEnabled('amount')) {
    pdf.text(formatCurrency(item.amount), colPosition, currentY + 5);
    colPosition += 35;
  }
  
  // Notes (if enabled and available)
  if (isColumnEnabled('notes') && isTemplateFeatureEnabled('showItemNotes') && item.notes) {
    const notes = item.notes.length > 25 
      ? item.notes.substring(0, 22) + "..." 
      : item.notes;
    pdf.text(notes, colPosition, currentY + 5);
  }
}

// Formateo de moneda
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Formateo de fecha
const formatDate = (date: Date | string) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MM/dd/yyyy');
  } catch (e) {
    console.error("Error formatting date:", e);
    return String(date);
  }
};

/**
 * Gets the localized status text for PDFs
 */
function getStatusText(status: string): string {
  // Translated status mapping
  const statusMapping: {[key: string]: string} = {
    'draft': 'Draft',
    'sent': 'Sent',
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'paid': 'Paid',
    'cancelled': 'Cancelled',
    'overdue': 'Overdue',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'borrador': 'Draft',
    'enviado': 'Sent',
    'pendiente': 'Pending',
    'aprobado': 'Approved',
    'rechazado': 'Rejected',
    'pagado': 'Paid',
    'cancelado': 'Cancelled',
    'vencido': 'Overdue',
    'en_progreso': 'In Progress',
    'completado': 'Completed',
  };
  
  return statusMapping[status.toLowerCase()] || status;
}

/**
 * Generates a PDF from an estimate
 */
export async function generateEstimatePDF(data: EstimateData): Promise<Blob> {
  const pdf = new jsPDF();
  const { PRIMARY_COLOR, SECONDARY_COLOR } = getColorSettings();
  let currentY = 20;
  
  // Only show header if enabled
  if (isTemplateFeatureEnabled("showHeader")) {
    // Logo
    if (data.contractor.logo && isTemplateFeatureEnabled("logo")) {
      try {
        pdf.addImage(data.contractor.logo, 'PNG', PAGE_MARGIN, currentY, 50, 20, undefined, 'FAST');
        currentY += 22;
      } catch (error) {
        console.error("Error adding logo to PDF", error);
      }
    }
    
    // Contractor info header
    pdf.setTextColor(PRIMARY_COLOR);
    pdf.setFontSize(20);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text(data.contractor.businessName, PAGE_MARGIN, currentY);
    
    currentY += 6;
    
    // Contractor contact info
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    pdf.setFont(getFontFamily(), "normal");
    
    if (data.contractor.phone) {
      pdf.text(data.contractor.phone, PAGE_MARGIN, currentY);
      currentY += 5;
    }
    
    if (data.contractor.email) {
      pdf.text(data.contractor.email, PAGE_MARGIN, currentY);
      currentY += 5;
    }
    
    if (data.contractor.address) {
      let address = data.contractor.address;
      if (data.contractor.city || data.contractor.state || data.contractor.zipCode) {
        const cityStateZip = [
          data.contractor.city, 
          data.contractor.state, 
          data.contractor.zipCode
        ].filter(Boolean).join(", ");
        address += `, ${cityStateZip}`;
      }
      pdf.text(address, PAGE_MARGIN, currentY);
      currentY += 5;
    }
  }
  
  // Title and number
  currentY += 5;
  pdf.setFontSize(18);
  pdf.setFont(getFontFamily(), "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("ESTIMATE", PAGE_MARGIN, currentY);
  
  pdf.setFontSize(12);
  pdf.text(`#${data.estimateNumber}`, PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(`#${data.estimateNumber}`), currentY);
  
  currentY += 8;
  
  // Client information - only if enabled
  if (isTemplateFeatureEnabled("showClientDetails")) {
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(12);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Client:", PAGE_MARGIN, currentY);
    
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(`${data.client.firstName} ${data.client.lastName}`, PAGE_MARGIN + 25, currentY);
    
    if (data.client.email) {
      currentY += 6;
      pdf.text("Email:", PAGE_MARGIN, currentY);
      pdf.text(data.client.email, PAGE_MARGIN + 25, currentY);
    }
    
    if (data.client.phone) {
      currentY += 6;
      pdf.text("Phone:", PAGE_MARGIN, currentY);
      pdf.text(data.client.phone, PAGE_MARGIN + 25, currentY);
    }
    
    if (data.client.address) {
      currentY += 6;
      pdf.text("Address:", PAGE_MARGIN, currentY);
      let address = data.client.address;
      if (data.client.city || data.client.state || data.client.zipCode) {
        const cityStateZip = [
          data.client.city, 
          data.client.state, 
          data.client.zipCode
        ].filter(Boolean).join(", ");
        address += `, ${cityStateZip}`;
      }
      pdf.text(address, PAGE_MARGIN + 25, currentY);
    }
  }
  
  currentY += 10;
  
  // Status
  pdf.setFontSize(12);
  pdf.setFont(getFontFamily(), "bold");
  pdf.text("Status:", PAGE_WIDTH / 2, currentY);
  
  // Status de traducción
  const statusText = getStatusText(data.status);
  
  // Aplicar color según el estado
  let statusColor = PRIMARY_COLOR;
  if (['approved', 'completed', 'paid', 'aprobado', 'completado', 'pagado'].includes(data.status.toLowerCase())) {
    statusColor = "#10B981"; // Verde para estados positivos
  } else if (['rejected', 'overdue', 'cancelled', 'rechazado', 'vencido', 'cancelado'].includes(data.status.toLowerCase())) {
    statusColor = "#EF4444"; // Rojo para estados negativos
  } else if (['pending', 'in_progress', 'pendiente', 'en_progreso'].includes(data.status.toLowerCase())) {
    statusColor = "#F59E0B"; // Ámbar para estados en progreso
  }
  
  pdf.setTextColor(statusColor);
  pdf.text(statusText, PAGE_WIDTH / 2 + 22, currentY);
  pdf.setTextColor(80, 80, 80);
  
  currentY += 6;
  
  // Issue date (if showing dates is enabled)
  if (isTemplateFeatureEnabled("showDates")) {
    pdf.setTextColor(80, 80, 80);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Date:", PAGE_WIDTH / 2, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(formatDate(data.issueDate), PAGE_WIDTH / 2 + 22, currentY);
    
    currentY += 6;
  }
  
  // Expiration date
  if (data.expiryDate && isTemplateFeatureEnabled("showDates")) {
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Valid until:", PAGE_WIDTH / 2, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(formatDate(data.expiryDate), PAGE_WIDTH / 2 + 30, currentY);
    currentY += 6;
  }
  
  // Project (if available)
  if (data.projectTitle && isTemplateFeatureEnabled("showProjectDetails")) {
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Project:", PAGE_MARGIN, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(data.projectTitle, PAGE_MARGIN + 25, currentY);
    
    if (data.projectDescription) {
      currentY += 6;
      pdf.setFont(getFontFamily(), "bold");
      pdf.text("Details:", PAGE_MARGIN, currentY);
      pdf.setFont(getFontFamily(), "normal");
      
      // Handle multiline project description
      const description = pdf.splitTextToSize(data.projectDescription, CONTENT_WIDTH - 25);
      pdf.text(description, PAGE_MARGIN + 25, currentY);
      currentY += (description.length * 5);
    }
  }
  
  // Separation line
  currentY = Math.max(currentY, 90); // Asegurar que hay suficiente espacio
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  
  currentY += 10;
  
  // Items table
  pdf.setFontSize(12);
  pdf.setFont(getFontFamily(), "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("SERVICE DETAILS", PAGE_MARGIN, currentY);
  
  currentY += 8;
  
  // Table headers
  pdf.setFillColor(247, 250, 252);
  pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 8, 'F');
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  // Render table header columns based on template settings
  renderTableHeaderColumns(pdf, currentY);
  
  currentY += 8;
  
  // Item rows
  let alternateRow = false;
  for (const item of data.items) {
    const itemHeight = 10;
    
    // Alternar colores de fondo para mejorar legibilidad
    if (alternateRow) {
      pdf.setFillColor(252, 252, 252);
      pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, itemHeight, 'F');
    }
    alternateRow = !alternateRow;
    
    // Check if we need to add a new page
    if (currentY > 250) {
      pdf.addPage();
      currentY = 20;
      
      // Table headers en la nueva página
      pdf.setFillColor(247, 250, 252);
      pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 8, 'F');
      
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont(getFontFamily(), "bold");
      
      // Render table header columns based on template settings
      renderTableHeaderColumns(pdf, currentY);
      
      currentY += 8;
    }
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont(getFontFamily(), "normal");
    
    // Render data row based on column visibility settings
    renderTableDataRow(pdf, item, currentY);
    
    currentY += itemHeight;
  }
  
  // Separator line for summary
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  
  currentY += 5;
  
  // Summary section - right aligned
  const summaryX = 120;
  
  pdf.setFont(getFontFamily(), "bold");
  pdf.text("Subtotal:", summaryX, currentY + 5);
  pdf.setFont(getFontFamily(), "normal");
  pdf.text(formatCurrency(data.subtotal), PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(formatCurrency(data.subtotal)), currentY + 5);
  
  currentY += 8;
  
  // Tax (if available)
  if (data.tax) {
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Tax:", summaryX, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(formatCurrency(data.tax), PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(formatCurrency(data.tax)), currentY);
    
    currentY += 5;
  }
  
  // Discount (if available)
  if (data.discount) {
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Discount:", summaryX, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(`- ${formatCurrency(data.discount)}`, PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(`- ${formatCurrency(data.discount)}`), currentY);
    
    currentY += 5;
  }
  
  // Total
  pdf.setFont(getFontFamily(), "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("TOTAL:", summaryX, currentY + 5);
  pdf.text(formatCurrency(data.total), PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(formatCurrency(data.total)), currentY + 5);
  
  currentY += 15;
  
  // Terms (if available)
  if (data.terms && isTemplateFeatureEnabled("showTerms")) {
    pdf.setTextColor(80, 80, 80);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Terms & Conditions:", PAGE_MARGIN, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.setFontSize(9);
    
    // Handle multiline terms
    currentY += 6;
    const terms = pdf.splitTextToSize(data.terms, CONTENT_WIDTH);
    pdf.text(terms, PAGE_MARGIN, currentY);
    
    currentY += (terms.length * 5);
  }
  
  // Notes (if available)
  if (data.notes && isTemplateFeatureEnabled("showNotes")) {
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Notes:", PAGE_MARGIN, currentY + 4);
    pdf.setFont(getFontFamily(), "normal");
    pdf.setFontSize(9);
    
    // Handle multiline notes
    currentY += 10;
    const notes = pdf.splitTextToSize(data.notes, CONTENT_WIDTH);
    pdf.text(notes, PAGE_MARGIN, currentY);
    
    currentY += (notes.length * 5);
  }
  
  // Signature line (if enabled)
  if (isTemplateFeatureEnabled("showSignatureLine")) {
    currentY = Math.max(currentY, 230); // Ensure sufficient space
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(PAGE_MARGIN, currentY, PAGE_MARGIN + 70, currentY);
    
    currentY += 5;
    pdf.setFontSize(8);
    pdf.setFont(getFontFamily(), "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("CUSTOMER SIGNATURE", PAGE_MARGIN, currentY);
  }
  
  // Only show footer if enabled
  if (isTemplateFeatureEnabled("showFooter")) {
    // Footer
    pdf.setDrawColor(PRIMARY_COLOR);
    pdf.setFillColor(PRIMARY_COLOR);
    pdf.rect(0, 280, PAGE_WIDTH, 15, 'F');
    
    // Footer content
    pdf.setFont(getFontFamily(), "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    
    const footerText = `Thank you for your business! | ${data.contractor.businessName} | ${data.contractor.phone || ''}`;
    pdf.text(footerText, PAGE_WIDTH / 2 - (pdf.getTextWidth(footerText) / 2), 287);
  }
  
  return pdf.output('blob');
}

/**
 * Generates a PDF from an invoice
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const pdf = new jsPDF();
  const { PRIMARY_COLOR, SECONDARY_COLOR } = getColorSettings();
  let currentY = 20;
  
  // Only show header if enabled
  if (isTemplateFeatureEnabled("showHeader")) {
    // Logo
    if (data.contractor.logo && isTemplateFeatureEnabled("logo")) {
      try {
        pdf.addImage(data.contractor.logo, 'PNG', PAGE_MARGIN, currentY, 50, 20, undefined, 'FAST');
        currentY += 22;
      } catch (error) {
        console.error("Error adding logo to PDF", error);
      }
    }
    
    // Contractor info header
    pdf.setTextColor(PRIMARY_COLOR);
    pdf.setFontSize(20);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text(data.contractor.businessName, PAGE_MARGIN, currentY);
    
    currentY += 6;
    
    // Contractor contact info
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    pdf.setFont(getFontFamily(), "normal");
    
    if (data.contractor.phone) {
      pdf.text(data.contractor.phone, PAGE_MARGIN, currentY);
      currentY += 5;
    }
    
    if (data.contractor.email) {
      pdf.text(data.contractor.email, PAGE_MARGIN, currentY);
      currentY += 5;
    }
    
    if (data.contractor.address) {
      let address = data.contractor.address;
      if (data.contractor.city || data.contractor.state || data.contractor.zipCode) {
        const cityStateZip = [
          data.contractor.city, 
          data.contractor.state, 
          data.contractor.zipCode
        ].filter(Boolean).join(", ");
        address += `, ${cityStateZip}`;
      }
      pdf.text(address, PAGE_MARGIN, currentY);
      currentY += 5;
    }
  }
  
  // Title and number
  currentY += 5;
  pdf.setFontSize(18);
  pdf.setFont(getFontFamily(), "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("INVOICE", PAGE_MARGIN, currentY);
  
  pdf.setFontSize(12);
  pdf.text(`#${data.invoiceNumber}`, PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(`#${data.invoiceNumber}`), currentY);
  
  currentY += 8;
  
  // Client information - only if enabled
  if (isTemplateFeatureEnabled("showClientDetails")) {
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(12);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Client:", PAGE_MARGIN, currentY);
    
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(`${data.client.firstName} ${data.client.lastName}`, PAGE_MARGIN + 25, currentY);
    
    if (data.client.email) {
      currentY += 6;
      pdf.text("Email:", PAGE_MARGIN, currentY);
      pdf.text(data.client.email, PAGE_MARGIN + 25, currentY);
    }
    
    if (data.client.phone) {
      currentY += 6;
      pdf.text("Phone:", PAGE_MARGIN, currentY);
      pdf.text(data.client.phone, PAGE_MARGIN + 25, currentY);
    }
    
    if (data.client.address) {
      currentY += 6;
      pdf.text("Address:", PAGE_MARGIN, currentY);
      let address = data.client.address;
      if (data.client.city || data.client.state || data.client.zipCode) {
        const cityStateZip = [
          data.client.city, 
          data.client.state, 
          data.client.zipCode
        ].filter(Boolean).join(", ");
        address += `, ${cityStateZip}`;
      }
      pdf.text(address, PAGE_MARGIN + 25, currentY);
    }
  }
  
  currentY += 10;
  
  // Status
  pdf.setFontSize(12);
  pdf.setFont(getFontFamily(), "bold");
  pdf.text("Status:", PAGE_WIDTH / 2, currentY);
  
  // Status localization
  const statusText = getStatusText(data.status);
  
  // Apply status color
  let statusColor = PRIMARY_COLOR;
  if (['approved', 'completed', 'paid', 'aprobado', 'completado', 'pagado'].includes(data.status.toLowerCase())) {
    statusColor = "#10B981"; // Green for positive status
  } else if (['rejected', 'overdue', 'cancelled', 'rechazado', 'vencido', 'cancelado'].includes(data.status.toLowerCase())) {
    statusColor = "#EF4444"; // Red for negative status
  } else if (['pending', 'in_progress', 'pendiente', 'en_progreso'].includes(data.status.toLowerCase())) {
    statusColor = "#F59E0B"; // Amber for in-progress status
  }
  
  pdf.setTextColor(statusColor);
  pdf.text(statusText, PAGE_WIDTH / 2 + 22, currentY);
  pdf.setTextColor(80, 80, 80);
  
  currentY += 6;
  
  // Issue date (if showing dates is enabled)
  if (isTemplateFeatureEnabled("showDates")) {
    pdf.setTextColor(80, 80, 80);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Date:", PAGE_WIDTH / 2, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(formatDate(data.issueDate), PAGE_WIDTH / 2 + 22, currentY);
    
    currentY += 6;
  }
  
  // Due date
  if (data.dueDate && isTemplateFeatureEnabled("showDates")) {
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Due date:", PAGE_WIDTH / 2, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(formatDate(data.dueDate), PAGE_WIDTH / 2 + 30, currentY);
    currentY += 6;
  }
  
  // Project (if available)
  if (data.projectTitle && isTemplateFeatureEnabled("showProjectDetails")) {
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Project:", PAGE_MARGIN, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(data.projectTitle, PAGE_MARGIN + 25, currentY);
    
    if (data.projectDescription) {
      currentY += 6;
      pdf.setFont(getFontFamily(), "bold");
      pdf.text("Details:", PAGE_MARGIN, currentY);
      pdf.setFont(getFontFamily(), "normal");
      
      // Handle multiline project description
      const description = pdf.splitTextToSize(data.projectDescription, CONTENT_WIDTH - 25);
      pdf.text(description, PAGE_MARGIN + 25, currentY);
      currentY += (description.length * 5);
    }
  }
  
  // Separation line
  currentY = Math.max(currentY, 90); // Ensure sufficient space
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  
  currentY += 10;
  
  // Items table
  pdf.setFontSize(12);
  pdf.setFont(getFontFamily(), "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("SERVICE DETAILS", PAGE_MARGIN, currentY);
  
  currentY += 8;
  
  // Table headers
  pdf.setFillColor(247, 250, 252);
  pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 8, 'F');
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  // Render table header columns based on template settings
  renderTableHeaderColumns(pdf, currentY);
  
  currentY += 8;
  
  // Item rows
  let alternateRow = false;
  for (const item of data.items) {
    const itemHeight = 10;
    
    // Alternar colores de fondo para mejorar legibilidad
    if (alternateRow) {
      pdf.setFillColor(252, 252, 252);
      pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, itemHeight, 'F');
    }
    alternateRow = !alternateRow;
    
    // Check if we need to add a new page
    if (currentY > 250) {
      pdf.addPage();
      currentY = 20;
      
      // Table headers en la nueva página
      pdf.setFillColor(247, 250, 252);
      pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 8, 'F');
      
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont(getFontFamily(), "bold");
      
      // Render table header columns based on template settings
      renderTableHeaderColumns(pdf, currentY);
      
      currentY += 8;
    }
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont(getFontFamily(), "normal");
    
    // Render data row based on column visibility settings
    renderTableDataRow(pdf, item, currentY);
    
    currentY += itemHeight;
  }
  
  // Separator line for summary
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  
  currentY += 5;
  
  // Summary section - right aligned
  const summaryX = 120;
  
  pdf.setFont(getFontFamily(), "bold");
  pdf.text("Subtotal:", summaryX, currentY + 5);
  pdf.setFont(getFontFamily(), "normal");
  pdf.text(formatCurrency(data.subtotal), PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(formatCurrency(data.subtotal)), currentY + 5);
  
  currentY += 8;
  
  // Tax (if available)
  if (data.tax) {
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Tax:", summaryX, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(formatCurrency(data.tax), PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(formatCurrency(data.tax)), currentY);
    
    currentY += 5;
  }
  
  // Discount (if available)
  if (data.discount) {
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Discount:", summaryX, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(`- ${formatCurrency(data.discount)}`, PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(`- ${formatCurrency(data.discount)}`), currentY);
    
    currentY += 5;
  }
  
  // Total
  pdf.setFont(getFontFamily(), "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("TOTAL:", summaryX, currentY + 5);
  pdf.text(formatCurrency(data.total), PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(formatCurrency(data.total)), currentY + 5);
  
  // Amount paid (if available)
  if (data.amountPaid) {
    currentY += 8;
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Amount Paid:", summaryX, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(formatCurrency(data.amountPaid), PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(formatCurrency(data.amountPaid)), currentY);
    
    // Balance due
    currentY += 5;
    const balanceDue = parseFloat(String(data.total)) - parseFloat(String(data.amountPaid));
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Balance Due:", summaryX, currentY);
    pdf.text(formatCurrency(balanceDue), PAGE_WIDTH - PAGE_MARGIN - pdf.getTextWidth(formatCurrency(balanceDue)), currentY);
  }
  
  currentY += 15;
  
  // Payment method (if available)
  if (data.paymentMethod) {
    pdf.setTextColor(80, 80, 80);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Payment Method:", PAGE_MARGIN, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.text(data.paymentMethod, PAGE_MARGIN + 40, currentY);
    
    currentY += 10;
  }
  
  // Terms (if available)
  if (data.terms && isTemplateFeatureEnabled("showTerms")) {
    pdf.setTextColor(80, 80, 80);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Terms & Conditions:", PAGE_MARGIN, currentY);
    pdf.setFont(getFontFamily(), "normal");
    pdf.setFontSize(9);
    
    // Handle multiline terms
    currentY += 6;
    const terms = pdf.splitTextToSize(data.terms, CONTENT_WIDTH);
    pdf.text(terms, PAGE_MARGIN, currentY);
    
    currentY += (terms.length * 5);
  }
  
  // Notes (if available)
  if (data.notes && isTemplateFeatureEnabled("showNotes")) {
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Notes:", PAGE_MARGIN, currentY + 4);
    pdf.setFont(getFontFamily(), "normal");
    pdf.setFontSize(9);
    
    // Handle multiline notes
    currentY += 10;
    const notes = pdf.splitTextToSize(data.notes, CONTENT_WIDTH);
    pdf.text(notes, PAGE_MARGIN, currentY);
    
    currentY += (notes.length * 5);
  }
  
  // Client signature (if available or line if enabled)
  if (data.clientSignature) {
    currentY = Math.max(currentY, 210); // Ensure sufficient space
    
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    pdf.setFont(getFontFamily(), "bold");
    pdf.text("Client Signature:", PAGE_MARGIN, currentY);
    
    currentY += 5;
    
    try {
      pdf.addImage(data.clientSignature, 'PNG', PAGE_MARGIN, currentY, 70, 30, undefined, 'FAST');
      currentY += 30;
    } catch (error) {
      console.error("Error adding signature to PDF", error);
      // Fallback to signature line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(PAGE_MARGIN, currentY + 10, PAGE_MARGIN + 70, currentY + 10);
      currentY += 15;
    }
  } else if (isTemplateFeatureEnabled("showSignatureLine")) {
    currentY = Math.max(currentY, 230); // Ensure sufficient space
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(PAGE_MARGIN, currentY, PAGE_MARGIN + 70, currentY);
    
    currentY += 5;
    pdf.setFontSize(8);
    pdf.setFont(getFontFamily(), "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("CLIENT SIGNATURE", PAGE_MARGIN, currentY);
  }
  
  // Only show footer if enabled
  if (isTemplateFeatureEnabled("showFooter")) {
    // Footer
    pdf.setDrawColor(PRIMARY_COLOR);
    pdf.setFillColor(PRIMARY_COLOR);
    pdf.rect(0, 280, PAGE_WIDTH, 15, 'F');
    
    // Footer content
    pdf.setFont(getFontFamily(), "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    
    const footerText = `Thank you for your business! | ${data.contractor.businessName} | ${data.contractor.phone || ''}`;
    pdf.text(footerText, PAGE_WIDTH / 2 - (pdf.getTextWidth(footerText) / 2), 287);
  }
  
  return pdf.output('blob');
}

/**
 * Función de utilidad para descargar un blob como un archivo
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Function to generate and download a PDF estimate
 */
/**
 * Generate and download a PDF for an estimate using saved template settings
 * 
 * This function applies custom template settings including:
 * - Custom colors from template settings
 * - Custom font selection
 * - Content section visibility (client details, project details, etc.)
 * - Language localization based on user preferences
 * - Style options for header, tables, etc.
 */
export async function downloadEstimatePDF(estimate: EstimateData): Promise<void> {
  try {
    const blob = await generateEstimatePDF(estimate);
    const fileName = `Estimate_${estimate.estimateNumber}_${estimate.client.lastName}.pdf`;
    downloadBlob(blob, fileName);
  } catch (error) {
    console.error("Error generating PDF", error);
  }
}

/**
 * Generate and download a PDF for an invoice using saved template settings
 * 
 * This function applies custom template settings including:
 * - Custom colors from template settings
 * - Custom font selection
 * - Content section visibility (client details, project details, etc.)
 * - Language localization based on user preferences
 * - Style options for header, tables, etc.
 * - Signature line display settings
 */
export async function downloadInvoicePDF(invoice: InvoiceData): Promise<void> {
  try {
    const blob = await generateInvoicePDF(invoice);
    const fileName = `Invoice_${invoice.invoiceNumber}_${invoice.client.lastName}.pdf`;
    downloadBlob(blob, fileName);
  } catch (error) {
    console.error("Error generating PDF", error);
  }
}