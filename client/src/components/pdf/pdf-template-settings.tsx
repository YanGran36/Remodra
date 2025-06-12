import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ColorPicker } from "../ui/color-picker";
import { useToast } from "@/hooks/use-toast";
import { Check, Save, Image, FileText, Layout, Palette, Type, Info } from "lucide-react";

export interface PdfTemplateConfig {
  // General options
  logo: boolean;
  showHeader: boolean;
  showFooter: boolean;
  // Content options
  showItemDetails: boolean;
  showItemNotes: boolean;
  showProjectDetails: boolean;
  showClientDetails: boolean;
  // Style options
  colorPrimary: string;
  colorSecondary: string;
  fontMain: string;
  headerStyle: 'simple' | 'gradient' | 'boxed';
  tableStyle: 'striped' | 'bordered' | 'minimal';
  // Metadata
  showTerms: boolean;
  showNotes: boolean;
  showSignatureLine: boolean;
  showDates: boolean;
  // Column configuration
  showColumns: {
    service: boolean;
    description: boolean;
    quantity: boolean;
    unitPrice: boolean;
    amount: boolean;
    notes: boolean;
  };
  // Column titles
  columnTitles?: {
    service?: string;
    description?: string;
    quantity?: string;
    unitPrice?: string;
    amount?: string;
    notes?: string;
  };
  // Other options for enhanced template
  documentTitle?: string;
  colorText?: string;
  colorAccent?: string;
  fontHeading?: string;
  fontBody?: string;
  showLogo?: boolean;
  showTax?: boolean;
  showDiscount?: boolean;
  showSignature?: boolean;
  footerText?: string;
  logoPosition?: string;
  companyInfoPosition?: string;
}

// Default configuration
const defaultConfig: PdfTemplateConfig = {
  logo: true,
  showHeader: true,
  showFooter: true,
  showItemDetails: true,
  showItemNotes: true,
  showProjectDetails: true,
  showClientDetails: true,
  colorPrimary: "#0f766e",
  colorSecondary: "#2563eb",
  fontMain: "Inter",
  headerStyle: 'gradient',
  tableStyle: 'bordered',
  showTerms: true,
  showNotes: true,
  showSignatureLine: true,
  showDates: true,
  showColumns: {
    service: true,
    description: true,
    quantity: true,
    unitPrice: true,
    amount: true,
    notes: true
  }
};

// Predefined templates
const templates = {
  professional: {
    ...defaultConfig,
    headerStyle: 'gradient',
    tableStyle: 'bordered',
    colorPrimary: "#0f766e",
    colorSecondary: "#2563eb",
    showColumns: {
      ...defaultConfig.showColumns,
      service: true
    }
  },
  minimal: {
    ...defaultConfig,
    headerStyle: 'simple',
    showFooter: false,
    tableStyle: 'minimal',
    showItemNotes: false,
    colorPrimary: "#1e293b",
    colorSecondary: "#64748b",
    showColumns: {
      ...defaultConfig.showColumns,
      service: true
    }
  },
  elegant: {
    ...defaultConfig,
    headerStyle: 'boxed',
    tableStyle: 'striped',
    colorPrimary: "#6d28d9",
    colorSecondary: "#4f46e5",
    showColumns: {
      ...defaultConfig.showColumns,
      service: true
    }
  },
};

interface PdfTemplateSettingsProps {
  initialConfig?: Partial<PdfTemplateConfig>;
  onChange?: (config: PdfTemplateConfig) => void;
  onSave?: (config: PdfTemplateConfig) => void;
  onUpdate?: (config: PdfTemplateConfig) => void; // For live preview
  livePreview?: boolean; // Whether to enable live preview mode
}

export default function PdfTemplateSettings({ 
  initialConfig, 
  onChange,
  onSave,
  onUpdate,
  livePreview = false
}: PdfTemplateSettingsProps) {
  const [config, setConfig] = useState<PdfTemplateConfig>({
    ...defaultConfig,
    ...initialConfig
  });
  const [activeTab, setActiveTab] = useState("content");
  const { toast } = useToast();

  // Effect to notify changes and live preview
  useEffect(() => {
    if (onChange) {
      onChange(config);
    }
    // Update live preview if enabled
    if (livePreview && onUpdate) {
      onUpdate(config);
    }
  }, [config, onChange, onUpdate, livePreview]);

  // Function to update configuration
  const updateConfig = (key: keyof PdfTemplateConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Function to apply predefined template
  const applyTemplate = (template: 'professional' | 'minimal' | 'elegant') => {
    const templateConfig = templates[template] as PdfTemplateConfig;
    setConfig(templateConfig);
    toast({
      title: "Template Applied",
      description: `The ${template} template has been applied`,
    });
  };

  // Function to save configuration
  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
    toast({
      title: "Configuration Saved",
      description: "Your template configuration has been saved",
      action: (
        <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
          <Check className="h-4 w-4" />
        </div>
      ),
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">PDF Template Configuration</CardTitle>
        <CardDescription>
          Customize the appearance and content of your PDF documents
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Style</span>
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Metadata</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer hover:border-primary/50 transition-colors ${
                  JSON.stringify(config) === JSON.stringify(templates.professional) ? 'border-primary' : ''
                }`}
                onClick={() => applyTemplate('professional')}
              >
                <CardHeader className="py-3">
                  <CardTitle className="text-md">Professional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-r from-teal-600 to-blue-600 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold">Preview</div>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Professional design with vibrant colors and complete details.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:border-primary/50 transition-colors ${
                  JSON.stringify(config) === JSON.stringify(templates.minimal) ? 'border-primary' : ''
                }`}
                onClick={() => applyTemplate('minimal')}
              >
                <CardHeader className="py-3">
                  <CardTitle className="text-md">Minimalist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-slate-800 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold">Preview</div>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Clean and simple design, without distracting elements.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:border-primary/50 transition-colors ${
                  JSON.stringify(config) === JSON.stringify(templates.elegant) ? 'border-primary' : ''
                }`}
                onClick={() => applyTemplate('elegant')}
              >
                <CardHeader className="py-3">
                  <CardTitle className="text-md">Elegant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold">Preview</div>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Elegant design with sophisticated tones and refined style.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Main Elements</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="logo" className="cursor-pointer flex items-center">
                      <Image className="h-4 w-4 mr-2 text-muted-foreground" />
                      Show Logo
                    </Label>
                    <Switch 
                      id="logo" 
                      checked={config.logo} 
                      onCheckedChange={value => updateConfig('logo', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showHeader" className="cursor-pointer">
                      Show Header
                    </Label>
                    <Switch 
                      id="showHeader" 
                      checked={config.showHeader} 
                      onCheckedChange={value => updateConfig('showHeader', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showFooter" className="cursor-pointer">
                      Show Footer
                    </Label>
                    <Switch 
                      id="showFooter" 
                      checked={config.showFooter} 
                      onCheckedChange={value => updateConfig('showFooter', value)} 
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Detailed Information</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showItemDetails" className="cursor-pointer">
                      Show Item Details
                    </Label>
                    <Switch 
                      id="showItemDetails" 
                      checked={config.showItemDetails} 
                      onCheckedChange={value => updateConfig('showItemDetails', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showItemNotes" className="cursor-pointer">
                      Show Item Notes
                    </Label>
                    <Switch 
                      id="showItemNotes" 
                      checked={config.showItemNotes} 
                      onCheckedChange={value => updateConfig('showItemNotes', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showProjectDetails" className="cursor-pointer">
                      Show Project Details
                    </Label>
                    <Switch 
                      id="showProjectDetails" 
                      checked={config.showProjectDetails} 
                      onCheckedChange={value => updateConfig('showProjectDetails', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showClientDetails" className="cursor-pointer">
                      Show Client Details
                    </Label>
                    <Switch 
                      id="showClientDetails" 
                      checked={config.showClientDetails} 
                      onCheckedChange={value => updateConfig('showClientDetails', value)} 
                    />
                  </div>
                  
                  <h3 className="text-base font-medium mt-6">Table Columns</h3>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showColumnsService" className="cursor-pointer">
                        Service Column
                      </Label>
                      <Switch 
                        id="showColumnsService" 
                        checked={config.showColumns.service} 
                        onCheckedChange={value => updateConfig('showColumns', {...config.showColumns, service: value})} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showColumnsDescription" className="cursor-pointer">
                        Description Column
                      </Label>
                      <Switch 
                        id="showColumnsDescription" 
                        checked={config.showColumns.description} 
                        onCheckedChange={value => updateConfig('showColumns', {...config.showColumns, description: value})} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showColumnsQuantity" className="cursor-pointer">
                        Quantity Column
                      </Label>
                      <Switch 
                        id="showColumnsQuantity" 
                        checked={config.showColumns.quantity} 
                        onCheckedChange={value => updateConfig('showColumns', {...config.showColumns, quantity: value})} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showColumnsUnitPrice" className="cursor-pointer">
                        Unit Price Column
                      </Label>
                      <Switch 
                        id="showColumnsUnitPrice" 
                        checked={config.showColumns.unitPrice} 
                        onCheckedChange={value => updateConfig('showColumns', {...config.showColumns, unitPrice: value})} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showColumnsAmount" className="cursor-pointer">
                        Amount Column
                      </Label>
                      <Switch 
                        id="showColumnsAmount" 
                        checked={config.showColumns.amount} 
                        onCheckedChange={value => updateConfig('showColumns', {...config.showColumns, amount: value})} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showColumnsNotes" className="cursor-pointer">
                        Notes Column
                      </Label>
                      <Switch 
                        id="showColumnsNotes" 
                        checked={config.showColumns.notes} 
                        onCheckedChange={value => updateConfig('showColumns', {...config.showColumns, notes: value})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Colors</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="colorPrimary">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-8 w-8 rounded-md border" 
                          style={{ backgroundColor: config.colorPrimary }}
                        />
                        <Input 
                          id="colorPrimary" 
                          value={config.colorPrimary} 
                          onChange={e => updateConfig('colorPrimary', e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="colorSecondary">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-8 w-8 rounded-md border" 
                          style={{ backgroundColor: config.colorSecondary }}
                        />
                        <Input 
                          id="colorSecondary" 
                          value={config.colorSecondary} 
                          onChange={e => updateConfig('colorSecondary', e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fontMain">Main Font</Label>
                    <Select 
                      value={config.fontMain} 
                      onValueChange={value => updateConfig('fontMain', value)}
                    >
                      <SelectTrigger id="fontMain">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Courier">Courier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Element Styles</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="headerStyle">Header Style</Label>
                    <Select 
                      value={config.headerStyle} 
                      onValueChange={value => updateConfig('headerStyle', value as 'simple' | 'gradient' | 'boxed')}
                    >
                      <SelectTrigger id="headerStyle">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="boxed">Boxed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tableStyle">Table Style</Label>
                    <Select 
                      value={config.tableStyle} 
                      onValueChange={value => updateConfig('tableStyle', value as 'striped' | 'bordered' | 'minimal')}
                    >
                      <SelectTrigger id="tableStyle">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="striped">Striped</SelectItem>
                        <SelectItem value="bordered">Bordered</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metadata">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Additional Information</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTerms" className="cursor-pointer">
                      Show Terms and Conditions
                    </Label>
                    <Switch 
                      id="showTerms" 
                      checked={config.showTerms} 
                      onCheckedChange={value => updateConfig('showTerms', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showNotes" className="cursor-pointer">
                      Show General Notes
                    </Label>
                    <Switch 
                      id="showNotes" 
                      checked={config.showNotes} 
                      onCheckedChange={value => updateConfig('showNotes', value)} 
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Legal Elements</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showSignatureLine" className="cursor-pointer">
                      Show Signature Line
                    </Label>
                    <Switch 
                      id="showSignatureLine" 
                      checked={config.showSignatureLine} 
                      onCheckedChange={value => updateConfig('showSignatureLine', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showDates" className="cursor-pointer">
                      Show Dates (issue/expiration)
                    </Label>
                    <Switch 
                      id="showDates" 
                      checked={config.showDates} 
                      onCheckedChange={value => updateConfig('showDates', value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}