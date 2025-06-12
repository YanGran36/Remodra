import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EnhancedColorPicker } from "@/components/ui/enhanced-color-picker";
import { ColorPicker } from "@/components/ui/color-picker";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Save, Image, FileText, Layout, Palette, Columns, Type, Info, LayoutTemplate, Eye, ArrowLeft, Home, Loader2, Settings, Download } from "lucide-react";
import ServicesConfig from "./services-config";

import { PdfTemplateConfig } from "./pdf-template-settings";

interface EstimateData {
  estimateNumber: string;
  date?: string | Date;
  issueDate?: Date;
  expiryDate?: Date;
  client: Record<string, any>;
  contractor: Record<string, any>;
  items?: any[]; // La estructura actual usa 'items' en lugar de 'services'
  services?: any[]; // Para compatibilidad con versiones anteriores
  subtotal?: number;
  tax?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  notes?: string;
  status: string;
  terms?: string;
  [key: string]: any;
}

interface InvoiceData {
  invoiceNumber: string;
  date?: string | Date;
  issueDate?: Date;
  dueDate?: Date;
  client: Record<string, any>;
  contractor: Record<string, any>;
  items?: any[]; // La estructura actual usa 'items' en lugar de 'services'
  services?: any[]; // Para compatibilidad con versiones anteriores
  subtotal?: number;
  tax?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  notes?: string;
  status: string;
  terms?: string;
  amountPaid?: number;
  [key: string]: any;
}

interface EnhancedPdfTemplateEditorProps {
  initialConfig?: Partial<PdfTemplateConfig>;
  onSave?: (config: PdfTemplateConfig) => void;
  onBack?: () => void;
  onHome?: () => void;
}

// Función para generar datos de muestra para estimación
const getSampleEstimate = (): EstimateData => {
  return {
    estimateNumber: "EST-001",
    date: new Date(),
    issueDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días después
    client: {
      name: "Cliente Ejemplo",
      email: "cliente@ejemplo.com",
      phone: "(555) 123-4567",
      address: "123 Calle Principal, Ciudad Ejemplo, EJ 12345"
    },
    contractor: {
      name: "Empresa Contratista",
      email: "contacto@contratista.com",
      phone: "(555) 987-6543",
      address: "456 Avenida Negocios, Ciudad Ejemplo, EJ 54321",
      logo: "https://via.placeholder.com/150"
    },
    items: [
      {
        description: "Instalación eléctrica",
        quantity: 1,
        unitPrice: 850.00,
        unit: "servicio",
        amount: 850.00
      },
      {
        description: "Materiales eléctricos premium",
        quantity: 1,
        unitPrice: 425.50,
        unit: "paquete",
        amount: 425.50
      },
      {
        description: "Mano de obra adicional",
        quantity: 5,
        unitPrice: 75.00,
        unit: "hora",
        amount: 375.00
      }
    ],
    subtotal: 1650.50,
    taxRate: 8.25,
    taxAmount: 136.17,
    discount: 85.00,
    total: 1701.67,
    notes: "Este es un presupuesto de ejemplo. Los precios pueden variar según las condiciones del sitio.",
    status: "pendiente",
    terms: "El pago se requiere dentro de los 30 días posteriores a la aceptación del presupuesto."
  };
};

// Función para generar datos de muestra para factura
const getSampleInvoice = (): InvoiceData => {
  return {
    invoiceNumber: "FAC-001",
    date: new Date(),
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días después
    client: {
      name: "Cliente Ejemplo",
      email: "cliente@ejemplo.com",
      phone: "(555) 123-4567",
      address: "123 Calle Principal, Ciudad Ejemplo, EJ 12345"
    },
    contractor: {
      name: "Empresa Contratista",
      email: "contacto@contratista.com",
      phone: "(555) 987-6543",
      address: "456 Avenida Negocios, Ciudad Ejemplo, EJ 54321",
      logo: "https://via.placeholder.com/150"
    },
    items: [
      {
        description: "Instalación eléctrica",
        quantity: 1,
        unitPrice: 850.00,
        unit: "servicio",
        amount: 850.00
      },
      {
        description: "Materiales eléctricos premium",
        quantity: 1,
        unitPrice: 425.50,
        unit: "paquete",
        amount: 425.50
      },
      {
        description: "Mano de obra adicional",
        quantity: 5,
        unitPrice: 75.00,
        unit: "hora",
        amount: 375.00
      }
    ],
    subtotal: 1650.50,
    taxRate: 8.25,
    taxAmount: 136.17,
    discount: 85.00,
    total: 1701.67,
    amountPaid: 0,
    notes: "Esta es una factura de ejemplo. Por favor, realice el pago antes de la fecha de vencimiento.",
    status: "pendiente",
    terms: "El pago se requiere dentro de los 15 días posteriores a la emisión de la factura."
  };
};

export default function EnhancedPdfTemplateEditor({
  initialConfig,
  onSave,
  onBack,
  onHome,
}: EnhancedPdfTemplateEditorProps) {
  const [activeTab, setActiveTab] = useState("design");
  const [config, setConfig] = useState<PdfTemplateConfig>(() => {
    // Intentar cargar configuración guardada
    const savedConfig = localStorage.getItem('pdfTemplateConfig');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig) as PdfTemplateConfig;
      } catch (e) {
        console.error("Error parsing saved config:", e);
      }
    }
    
    // Si no hay configuración guardada o hubo error, usar la configuración inicial o la predeterminada
    return initialConfig as PdfTemplateConfig || {
      colorPrimary: "#3F51B5", // Azul estándar
      colorSecondary: "#F5F5F5", // Gris claro
      colorText: "#333333", // Texto oscuro
      colorAccent: "#FF4081", // Rosa acento
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      logoPosition: "left",
      showLogo: true,
      companyInfoPosition: "left",
      documentTitle: "centered",
      showTax: true,
      showDiscount: true,
      showSignature: true,
      showNotes: true,
      showTerms: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemUnit: true,
      showItemAmount: true,
      roundedCorners: true,
      alternateRowColors: true,
      showFooter: true,
      footerText: "Thank you for your business",
      tableBorderStyle: "full",
      headerStyle: "gradient",
      pageSize: "letter",
      pageOrientation: "portrait",
      lineHeight: 1.5,
      textSize: "medium",
      customCSS: "",
      colorTableHeader: "#4F5D75", // Color para encabezados de tabla
      colorTableBorder: "#DDDDDD", // Color para bordes de tabla
      colorTableEven: "#F9FAFC", // Color para filas pares
      enableEstimateDateField: true,
      enableEstimateExpiry: true,
      enableEstimateCustomFields: false,
      enableInvoiceDueDate: true,
      enableInvoiceCustomFields: false,
      enableClientDetails: true,
      enableContractorDetails: true,
      enableWatermark: false,
      customWatermarkText: "CONFIDENTIAL",
      headerImageUrl: "",
      useHeaderImage: false,
      dateFormat: "DD/MM/YYYY",
      itemsTableTitle: "Services",
      estimateTitle: "ESTIMATE",
      invoiceTitle: "INVOICE",
      enableSections: true,
      sectionsPosition: "top",
      primaryColorGradient: true,
      secondaryColorOpacity: 0.1,
      fontSizeHeading: 28,
      fontSizeSubheading: 18,
      fontSizeBody: 12,
      fontSizeFooter: 10,
      documentTitleUppercase: true,
      columnTitles: {
        service: "Service",
        description: "Description",
        quantity: "Quantity",
        unitPrice: "Unit Price",
        unit: "Unit",
        amount: "Amount",
        notes: "Notes"
      },
      enableSectionTitles: true,
      showEstimateFooterNotes: true,
      showInvoiceFooterNotes: true
    };
  });
  
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [previewType, setPreviewType] = useState<"estimate" | "invoice">("estimate");
  const { toast } = useToast();
  
  // Datos de ejemplo para la vista previa
  const sampleEstimate = getSampleEstimate();
  const sampleInvoice = getSampleInvoice();

  // Función para generar vista previa de Presupuesto
  const previewEstimatePDF = async (estimate: EstimateData): Promise<Blob> => {
    try {
      // En un caso real, aquí se llamaría a la API para generar el PDF
      // Por ahora, implementaremos un retardo artificial
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular un PDF para pruebas
      const estimateData = JSON.stringify({
        ...estimate,
        config: config
      });
      
      // En producción, aquí se generaría el PDF real
      console.log("Generando PDF de presupuesto con:", estimateData);
      
      // Devolver un blob vacío por ahora (en producción, esto sería el PDF real)
      return new Blob([estimateData], { type: 'application/pdf' });
    } catch (error) {
      console.error("Error al generar vista previa de presupuesto:", error);
      return new Blob([], { type: 'application/pdf' });
    }
  };

  // Función para generar vista previa de Factura
  const previewInvoicePDF = async (invoice: InvoiceData): Promise<Blob> => {
    try {
      // En un caso real, aquí se llamaría a la API para generar el PDF
      // Por ahora, implementaremos un retardo artificial
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular un PDF para pruebas
      const invoiceData = JSON.stringify({
        ...invoice,
        config: config
      });
      
      // En producción, aquí se generaría el PDF real
      console.log("Generando PDF de factura con:", invoiceData);
      
      // Devolver un blob vacío por ahora (en producción, esto sería el PDF real)
      return new Blob([invoiceData], { type: 'application/pdf' });
    } catch (error) {
      console.error("Error al generar vista previa de factura:", error);
      return new Blob([], { type: 'application/pdf' });
    }
  };

  // Función para generar la vista previa del PDF
  const generatePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      // Forzar actualización de localStorage
      localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
      
      // Generar el PDF
      let blob: Blob;
      
      if (previewType === "estimate") {
        blob = await previewEstimatePDF(sampleEstimate);
      } else {
        blob = await previewInvoicePDF(sampleInvoice);
      }
      
      // Abrir en nueva ventana para visualizar
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
      
      toast({
        title: "Vista previa generada",
        description: "El PDF se ha abierto en una nueva ventana"
      });
    } catch (error) {
      console.error("Error generating preview:", error);
      toast({
        title: "Error de Vista Previa",
        description: "Hubo un error al generar la vista previa. Por favor intente de nuevo.",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [config, previewType, toast, sampleEstimate, sampleInvoice]);

  // Función para descargar la vista previa del PDF
  const handleDownloadPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      let blob: Blob;
      
      if (previewType === "estimate") {
        blob = await previewEstimatePDF(sampleEstimate);
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estimate-example-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        blob = await previewInvoicePDF(sampleInvoice);
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-example-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      
      toast({
        title: "PDF Downloaded",
        description: `The ${previewType === "estimate" ? "estimate" : "invoice"} PDF has been downloaded.`
      });
    } catch (error) {
      console.error("Error downloading preview:", error);
      toast({
        title: "Error de Descarga",
        description: "No se pudo descargar el PDF. Por favor intente de nuevo.",
        variant: "destructive"
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [config, previewType, toast, sampleEstimate, sampleInvoice]);

  // Función para guardar la configuración
  const handleSave = () => {
    // Guardar la configuración en localStorage
    localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
    
    // Llamar a la función onSave si existe
    if (onSave) {
      onSave(config);
    }
    
    toast({
      title: "Configuración Guardada",
      description: "La configuración de plantilla ha sido guardada correctamente."
    });
  };

  // Actualizar un campo específico del config
  const updateConfig = <K extends keyof PdfTemplateConfig>(
    key: K,
    value: PdfTemplateConfig[K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="container mx-auto py-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" size="icon" onClick={onBack} title="Back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-2xl">PDF Template Editor</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {onHome && (
                <Button variant="outline" size="sm" onClick={onHome} className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Services
                </Button>
              )}
              <Button variant="default" size="sm" onClick={handleSave} className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </div>
          <CardDescription>
            Customize the appearance of your estimates and invoices with these settings.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="col-span-1 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Customization Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="design" value={activeTab} onValueChange={(value) => setActiveTab(value)}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="design" className="flex items-center">
                    <Palette className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Design</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="columns" className="flex items-center">
                    <Columns className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Columns</span>
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Advanced</span>
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[calc(100vh-400px)] mt-4 overflow-y-auto pr-4">
                  {/* Design Tab */}
                  <TabsContent value="design" className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Colors</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="space-y-2">
                            <Label htmlFor="color-primary" className="text-xs">Primary Color</Label>
                            <EnhancedColorPicker 
                              color={config.colorPrimary} 
                              onChange={(color) => updateConfig("colorPrimary", color)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="color-secondary" className="text-xs">Secondary Color</Label>
                            <EnhancedColorPicker 
                              color={config.colorSecondary} 
                              onChange={(color) => updateConfig("colorSecondary", color)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="color-text" className="text-xs">Color de Texto</Label>
                            <EnhancedColorPicker 
                              color={config.colorText} 
                              onChange={(color) => updateConfig("colorText", color)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="color-accent" className="text-xs">Accent Color</Label>
                            <EnhancedColorPicker 
                              color={config.colorAccent} 
                              onChange={(color) => updateConfig("colorAccent", color)}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-base font-medium">Typography</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="space-y-2">
                            <Label htmlFor="font-heading" className="text-xs">Heading Font</Label>
                            <Select 
                              value={config.fontHeading}
                              onValueChange={(value) => updateConfig("fontHeading", value)}
                            >
                              <SelectTrigger id="font-heading">
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="'Inter', sans-serif">Inter (Sans-serif)</SelectItem>
                                <SelectItem value="'Arial', sans-serif">Arial</SelectItem>
                                <SelectItem value="'Helvetica', sans-serif">Helvetica</SelectItem>
                                <SelectItem value="'Georgia', serif">Georgia (Serif)</SelectItem>
                                <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                                <SelectItem value="'Courier New', monospace">Courier New (Mono)</SelectItem>
                                <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                                <SelectItem value="'Verdana', sans-serif">Verdana</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="font-body" className="text-xs">Body Font</Label>
                            <Select 
                              value={config.fontBody}
                              onValueChange={(value) => updateConfig("fontBody", value)}
                            >
                              <SelectTrigger id="font-body">
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="'Inter', sans-serif">Inter (Sans-serif)</SelectItem>
                                <SelectItem value="'Arial', sans-serif">Arial</SelectItem>
                                <SelectItem value="'Helvetica', sans-serif">Helvetica</SelectItem>
                                <SelectItem value="'Georgia', serif">Georgia (Serif)</SelectItem>
                                <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                                <SelectItem value="'Courier New', monospace">Courier New (Mono)</SelectItem>
                                <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                                <SelectItem value="'Verdana', sans-serif">Verdana</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-base font-medium">Style and Format</Label>
                        <div className="space-y-4 mt-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="header-style" className="text-xs">Header Style</Label>
                              <Select 
                                value={config.headerStyle}
                                onValueChange={(value) => updateConfig("headerStyle", value)}
                              >
                                <SelectTrigger id="header-style">
                                  <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gradient">Gradient</SelectItem>
                                  <SelectItem value="solid">Solid Color</SelectItem>
                                  <SelectItem value="minimal">Minimalist</SelectItem>
                                  <SelectItem value="bordered">Bordered</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="table-border-style" className="text-xs">Table Border Style</Label>
                              <Select 
                                value={config.tableBorderStyle}
                                onValueChange={(value) => updateConfig("tableBorderStyle", value)}
                              >
                                <SelectTrigger id="table-border-style">
                                  <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">Full Borders</SelectItem>
                                  <SelectItem value="horizontal">Horizontal Only</SelectItem>
                                  <SelectItem value="outer">Outer Only</SelectItem>
                                  <SelectItem value="none">No Borders</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="rounded-corners" className="text-sm cursor-pointer">Rounded Corners</Label>
                            <Switch 
                              id="rounded-corners" 
                              checked={config.roundedCorners}
                              onCheckedChange={(checked) => updateConfig("roundedCorners", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="alternate-row-colors" className="text-sm cursor-pointer">Alternate Row Colors</Label>
                            <Switch 
                              id="alternate-row-colors" 
                              checked={config.alternateRowColors}
                              onCheckedChange={(checked) => updateConfig("alternateRowColors", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="primary-color-gradient" className="text-sm cursor-pointer">Use Gradient for Primary Color</Label>
                            <Switch 
                              id="primary-color-gradient" 
                              checked={config.primaryColorGradient}
                              onCheckedChange={(checked) => updateConfig("primaryColorGradient", checked)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-base font-medium">Size and Orientation</Label>
                        <div className="space-y-4 mt-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="page-size" className="text-xs">Page Size</Label>
                              <Select 
                                value={config.pageSize}
                                onValueChange={(value) => updateConfig("pageSize", value)}
                              >
                                <SelectTrigger id="page-size">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="letter">Letter (8.5" x 11")</SelectItem>
                                  <SelectItem value="a4">A4 (210 x 297 mm)</SelectItem>
                                  <SelectItem value="legal">Legal (8.5" x 14")</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="page-orientation" className="text-xs">Orientation</Label>
                              <Select 
                                value={config.pageOrientation}
                                onValueChange={(value) => updateConfig("pageOrientation", value)}
                              >
                                <SelectTrigger id="page-orientation">
                                  <SelectValue placeholder="Select orientation" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="portrait">Portrait</SelectItem>
                                  <SelectItem value="landscape">Landscape</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Content Tab */}
                  <TabsContent value="content" className="space-y-6">
                    <div>
                      <Label className="text-base font-medium">Document Title</Label>
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="estimate-title" className="text-xs">Estimate Title</Label>
                            <Input 
                              id="estimate-title" 
                              value={config.estimateTitle}
                              onChange={(e) => updateConfig("estimateTitle", e.target.value)}
                              placeholder="ESTIMATE"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invoice-title" className="text-xs">Invoice Title</Label>
                            <Input 
                              id="invoice-title" 
                              value={config.invoiceTitle}
                              onChange={(e) => updateConfig("invoiceTitle", e.target.value)}
                              placeholder="INVOICE"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="document-title-position" className="text-xs">Title Position</Label>
                          <Select 
                            value={config.documentTitle}
                            onValueChange={(value) => updateConfig("documentTitle", value)}
                          >
                            <SelectTrigger id="document-title-position">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="centered">Centered</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="document-title-uppercase" className="text-sm cursor-pointer">Uppercase Title</Label>
                          <Switch 
                            id="document-title-uppercase" 
                            checked={config.documentTitleUppercase}
                            onCheckedChange={(checked) => updateConfig("documentTitleUppercase", checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-base font-medium">Elementos Visibles</Label>
                      <div className="space-y-3 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-logo" 
                              checked={config.showLogo}
                              onCheckedChange={(checked) => updateConfig("showLogo", checked === true)}
                            />
                            <Label htmlFor="show-logo" className="text-sm cursor-pointer">Show Logo</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-tax" 
                              checked={config.showTax}
                              onCheckedChange={(checked) => updateConfig("showTax", checked === true)}
                            />
                            <Label htmlFor="show-tax" className="text-sm cursor-pointer">Show Taxes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-discount" 
                              checked={config.showDiscount}
                              onCheckedChange={(checked) => updateConfig("showDiscount", checked === true)}
                            />
                            <Label htmlFor="show-discount" className="text-sm cursor-pointer">Show Discount</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-signature" 
                              checked={config.showSignature}
                              onCheckedChange={(checked) => updateConfig("showSignature", checked === true)}
                            />
                            <Label htmlFor="show-signature" className="text-sm cursor-pointer">Show Signature</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-notes" 
                              checked={config.showNotes}
                              onCheckedChange={(checked) => updateConfig("showNotes", checked === true)}
                            />
                            <Label htmlFor="show-notes" className="text-sm cursor-pointer">Show Notes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-terms" 
                              checked={config.showTerms}
                              onCheckedChange={(checked) => updateConfig("showTerms", checked === true)}
                            />
                            <Label htmlFor="show-terms" className="text-sm cursor-pointer">Show Terms</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-footer" 
                              checked={config.showFooter}
                              onCheckedChange={(checked) => updateConfig("showFooter", checked === true)}
                            />
                            <Label htmlFor="show-footer" className="text-sm cursor-pointer">Show Footer</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-estimate-footer-notes" 
                              checked={config.showEstimateFooterNotes}
                              onCheckedChange={(checked) => updateConfig("showEstimateFooterNotes", checked === true)}
                            />
                            <Label htmlFor="show-estimate-footer-notes" className="text-sm cursor-pointer">Estimate Notes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-invoice-footer-notes" 
                              checked={config.showInvoiceFooterNotes}
                              onCheckedChange={(checked) => updateConfig("showInvoiceFooterNotes", checked === true)}
                            />
                            <Label htmlFor="show-invoice-footer-notes" className="text-sm cursor-pointer">Invoice Notes</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-base font-medium">Client/Contractor Information</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enable-client-details" 
                            checked={config.enableClientDetails}
                            onCheckedChange={(checked) => updateConfig("enableClientDetails", checked === true)}
                          />
                          <Label htmlFor="enable-client-details" className="text-sm cursor-pointer">Show Client Details</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enable-contractor-details" 
                            checked={config.enableContractorDetails}
                            onCheckedChange={(checked) => updateConfig("enableContractorDetails", checked === true)}
                          />
                          <Label htmlFor="enable-contractor-details" className="text-sm cursor-pointer">Show Contractor Details</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="logo-position" className="text-xs">Logo Position</Label>
                          <Select 
                            value={config.logoPosition}
                            onValueChange={(value) => updateConfig("logoPosition", value)}
                            disabled={!config.showLogo}
                          >
                            <SelectTrigger id="logo-position">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company-info-position" className="text-xs">Company Info Position</Label>
                          <Select 
                            value={config.companyInfoPosition}
                            onValueChange={(value) => updateConfig("companyInfoPosition", value)}
                          >
                            <SelectTrigger id="company-info-position">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-base font-medium">Specific Sections</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enable-estimate-date-field" 
                            checked={config.enableEstimateDateField}
                            onCheckedChange={(checked) => updateConfig("enableEstimateDateField", checked === true)}
                          />
                          <Label htmlFor="enable-estimate-date-field" className="text-sm cursor-pointer">Show Date in Estimates</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enable-estimate-expiry" 
                            checked={config.enableEstimateExpiry}
                            onCheckedChange={(checked) => updateConfig("enableEstimateExpiry", checked === true)}
                          />
                          <Label htmlFor="enable-estimate-expiry" className="text-sm cursor-pointer">Expiration Date in Estimates</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enable-invoice-due-date" 
                            checked={config.enableInvoiceDueDate}
                            onCheckedChange={(checked) => updateConfig("enableInvoiceDueDate", checked === true)}
                          />
                          <Label htmlFor="enable-invoice-due-date" className="text-sm cursor-pointer">Due Date in Invoices</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enable-sections" 
                            checked={config.enableSections}
                            onCheckedChange={(checked) => updateConfig("enableSections", checked === true)}
                          />
                          <Label htmlFor="enable-sections" className="text-sm cursor-pointer">Enable Sections</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enable-section-titles" 
                            checked={config.enableSectionTitles}
                            onCheckedChange={(checked) => updateConfig("enableSectionTitles", checked === true)}
                            disabled={!config.enableSections}
                          />
                          <Label htmlFor="enable-section-titles" className="text-sm cursor-pointer">Show Section Titles</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sections-position" className="text-xs">Sections Position</Label>
                          <Select 
                            value={config.sectionsPosition}
                            onValueChange={(value) => updateConfig("sectionsPosition", value)}
                            disabled={!config.enableSections}
                          >
                            <SelectTrigger id="sections-position">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="left">Sidebar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date-format" className="text-xs">Date Format</Label>
                          <Select 
                            value={config.dateFormat}
                            onValueChange={(value) => updateConfig("dateFormat", value)}
                          >
                            <SelectTrigger id="date-format">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              <SelectItem value="DD of MMMM, YYYY">DD of Month, YYYY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-base font-medium">Pie de Página</Label>
                      <div className="space-y-3 mt-2">
                        <div className="space-y-2">
                          <Label htmlFor="footer-text" className="text-xs">Texto del Pie de Página</Label>
                          <Input 
                            id="footer-text" 
                            value={config.footerText}
                            onChange={(e) => updateConfig("footerText", e.target.value)}
                            placeholder="Thank you for your business"
                            disabled={!config.showFooter}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Columns Tab */}
                  <TabsContent value="columns" className="space-y-6">
                    <div>
                      <Label className="text-base font-medium">Services/Products Table</Label>
                      <div className="space-y-3 mt-2">
                        <div className="space-y-2">
                          <Label htmlFor="items-table-title" className="text-xs">Table Title</Label>
                          <Input 
                            id="items-table-title" 
                            value={config.itemsTableTitle}
                            onChange={(e) => updateConfig("itemsTableTitle", e.target.value)}
                            placeholder="Services"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Visible Columns</Label>
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="show-item-description" 
                                checked={config.showItemDescription}
                                onCheckedChange={(checked) => updateConfig("showItemDescription", checked === true)}
                              />
                              <Label htmlFor="show-item-description" className="text-sm cursor-pointer">Description</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="show-item-quantity" 
                                checked={config.showItemQuantity}
                                onCheckedChange={(checked) => updateConfig("showItemQuantity", checked === true)}
                              />
                              <Label htmlFor="show-item-quantity" className="text-sm cursor-pointer">Quantity</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="show-item-unit-price" 
                                checked={config.showItemUnitPrice}
                                onCheckedChange={(checked) => updateConfig("showItemUnitPrice", checked === true)}
                              />
                              <Label htmlFor="show-item-unit-price" className="text-sm cursor-pointer">Unit Price</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="show-item-unit" 
                                checked={config.showItemUnit}
                                onCheckedChange={(checked) => updateConfig("showItemUnit", checked === true)}
                              />
                              <Label htmlFor="show-item-unit" className="text-sm cursor-pointer">Unit</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="show-item-amount" 
                                checked={config.showItemAmount}
                                onCheckedChange={(checked) => updateConfig("showItemAmount", checked === true)}
                              />
                              <Label htmlFor="show-item-amount" className="text-sm cursor-pointer">Amount</Label>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Column Titles</Label>
                          <div className="space-y-3 mt-2">
                            {config.showColumns?.description && (
                              <div className="space-y-1">
                                <Label htmlFor="col-description" className="text-xs">Title for Description</Label>
                                <Input 
                                  id="col-description" 
                                  value={config.columnTitles?.description || ""}
                                  onChange={(e) => updateConfig("columnTitles", { ...(config.columnTitles || {}), description: e.target.value })}
                                  placeholder="Description"
                                />
                              </div>
                            )}
                            
                            {config.showColumns?.quantity && (
                              <div className="space-y-1">
                                <Label htmlFor="col-quantity" className="text-xs">Title for Quantity</Label>
                                <Input 
                                  id="col-quantity" 
                                  value={config.columnTitles?.quantity || ""}
                                  onChange={(e) => updateConfig("columnTitles", { ...(config.columnTitles || {}), quantity: e.target.value })}
                                  placeholder="Quantity"
                                />
                              </div>
                            )}
                            
                            {config.showColumns?.unitPrice && (
                              <div className="space-y-1">
                                <Label htmlFor="col-unit-price" className="text-xs">Title for Unit Price</Label>
                                <Input 
                                  id="col-unit-price" 
                                  value={config.columnTitles?.unitPrice || ""}
                                  onChange={(e) => updateConfig("columnTitles", { ...(config.columnTitles || {}), unitPrice: e.target.value })}
                                  placeholder="Unit Price"
                                />
                              </div>
                            )}
                            
                            {config.showColumns?.notes && (
                              <div className="space-y-1">
                                <Label htmlFor="col-unit" className="text-xs">Title for Notes</Label>
                                <Input 
                                  id="col-notes" 
                                  value={config.columnTitles?.notes || ""}
                                  onChange={(e) => updateConfig("columnTitles", { ...(config.columnTitles || {}), notes: e.target.value })}
                                  placeholder="Notes"
                                />
                              </div>
                            )}
                            
                            {config.showColumns?.amount && (
                              <div className="space-y-1">
                                <Label htmlFor="col-amount" className="text-xs">Title for Amount</Label>
                                <Input 
                                  id="col-amount" 
                                  value={config.columnTitles?.amount || ""}
                                  onChange={(e) => updateConfig("columnTitles", { ...(config.columnTitles || {}), amount: e.target.value })}
                                  placeholder="Amount"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Advanced Tab */}
                  <TabsContent value="advanced" className="space-y-6">
                    <div>
                      <Label className="text-base font-medium">Advanced Settings</Label>
                      <div className="space-y-4 mt-2">
                        <div className="space-y-2">
                          <Label htmlFor="text-size" className="text-xs">Text Size</Label>
                          <Select 
                            value={config.textSize}
                            onValueChange={(value) => updateConfig("textSize", value)}
                          >
                            <SelectTrigger id="text-size">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="line-height" className="text-xs">
                              Line Height: {config.lineHeight}
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {config.lineHeight}
                            </Badge>
                          </div>
                          <Slider
                            id="line-height"
                            min={1.0}
                            max={2.0}
                            step={0.1}
                            value={[config.lineHeight]}
                            onValueChange={(values) => updateConfig("lineHeight", values[0])}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="font-size-heading" className="text-xs">
                              Heading Font Size: {config.fontSizeHeading}px
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {config.fontSizeHeading}px
                            </Badge>
                          </div>
                          <Slider
                            id="font-size-heading"
                            min={16}
                            max={42}
                            step={1}
                            value={[config.fontSizeHeading]}
                            onValueChange={(values) => updateConfig("fontSizeHeading", values[0])}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="font-size-subheading" className="text-xs">
                              Subheading Font Size: {config.fontSizeSubheading}px
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {config.fontSizeSubheading}px
                            </Badge>
                          </div>
                          <Slider
                            id="font-size-subheading"
                            min={12}
                            max={24}
                            step={1}
                            value={[config.fontSizeSubheading]}
                            onValueChange={(values) => updateConfig("fontSizeSubheading", values[0])}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="font-size-body" className="text-xs">
                              Body Font Size: {config.fontSizeBody}px
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {config.fontSizeBody}px
                            </Badge>
                          </div>
                          <Slider
                            id="font-size-body"
                            min={9}
                            max={16}
                            step={1}
                            value={[config.fontSizeBody]}
                            onValueChange={(values) => updateConfig("fontSizeBody", values[0])}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="secondary-color-opacity" className="text-xs">
                              Secondary Color Opacity: {Math.round(config.secondaryColorOpacity * 100)}%
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(config.secondaryColorOpacity * 100)}%
                            </Badge>
                          </div>
                          <Slider
                            id="secondary-color-opacity"
                            min={0}
                            max={1}
                            step={0.05}
                            value={[config.secondaryColorOpacity]}
                            onValueChange={(values) => updateConfig("secondaryColorOpacity", values[0])}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="enable-watermark" className="text-sm cursor-pointer">Enable Watermark</Label>
                            <Switch 
                              id="enable-watermark" 
                              checked={config.enableWatermark}
                              onCheckedChange={(checked) => updateConfig("enableWatermark", checked)}
                            />
                          </div>
                          
                          {config.enableWatermark && (
                            <div className="space-y-2 mt-2">
                              <Label htmlFor="watermark-text" className="text-xs">Watermark Text</Label>
                              <Input 
                                id="watermark-text" 
                                value={config.customWatermarkText}
                                onChange={(e) => updateConfig("customWatermarkText", e.target.value)}
                                placeholder="CONFIDENTIAL"
                              />
                            </div>
                          )}
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="use-header-image" className="text-sm cursor-pointer">Use Header Image</Label>
                            <Switch 
                              id="use-header-image" 
                              checked={config.useHeaderImage}
                              onCheckedChange={(checked) => updateConfig("useHeaderImage", checked)}
                            />
                          </div>
                          
                          {config.useHeaderImage && (
                            <div className="space-y-2 mt-2">
                              <Label htmlFor="header-image-url" className="text-xs">Header Image URL</Label>
                              <Input 
                                id="header-image-url" 
                                value={config.headerImageUrl}
                                onChange={(e) => updateConfig("headerImageUrl", e.target.value)}
                                placeholder="https://example.com/image.jpg"
                              />
                            </div>
                          )}
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label htmlFor="custom-css" className="text-xs">Custom CSS</Label>
                          <div className="border rounded-md">
                            <textarea
                              id="custom-css"
                              rows={5}
                              value={config.customCSS}
                              onChange={(e) => updateConfig("customCSS", e.target.value)}
                              className="w-full p-2 text-sm font-mono resize-y rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background"
                              placeholder="/* Custom CSS here */"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add custom CSS styles for advanced adjustments.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1 lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Document Preview</CardTitle>
                <Select
                  value={previewType}
                  onValueChange={(value: "estimate" | "invoice") => setPreviewType(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estimate">Estimate</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                This is a preview of how your {previewType === "estimate" ? "estimate" : "invoice"} will look.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden bg-white relative">
                {/* Estas etiquetas son solo para dar contexto visual al usuario mientras se desarrolla */}
                <div className="bg-muted-foreground/10 p-2 text-center text-xs text-muted-foreground">
                  <span className="font-medium">Generating preview...</span>
                </div>
                <div className="w-full h-full bg-gray-100 rounded-md border border-gray-200 overflow-hidden flex items-center justify-center">
                  {previewLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Generating preview...</p>
                    </div>
                  ) : (
                    <div id="pdf-preview-container" className="flex flex-col items-center justify-center h-full text-center p-6">
                      <div className="mb-6 text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">PDF Preview</h3>
                        <p className="max-w-md">
                          Click the button below to generate a PDF preview with current settings.
                        </p>
                      </div>
                      
                      <div className="flex gap-4">
                        <Button 
                          variant="default" 
                          onClick={generatePreview}
                          className="flex items-center"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Generate Preview
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {activeTab === "content" && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-xl">Configuración de Servicios</CardTitle>
                <CardDescription>
                  Define los servicios que ofrece tu empresa para agregarlos fácilmente a tus presupuestos y facturas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServicesConfig contractorId={1} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}