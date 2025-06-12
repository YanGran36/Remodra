import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { 
  Calculator, 
  ChevronDown,
  ChevronRight, 
  Ruler, 
  PaintBucket,
  Check, 
  Plus, 
  X,
  Minus 
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FormProvider, useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

// Definir los materiales y opciones que ya existen en vendor-estimate-form-page.tsx
import { 
  MATERIALS_BY_SERVICE, 
  OPTIONS_BY_SERVICE, 
  SERVICE_TYPES,
  getMaterialWithConfiguredPrice,
  getServiceBasePrice
} from "@/lib/service-options";

// Importar nuestro hook de precios centralizado
import { usePricing } from '@/hooks/use-pricing';

interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface ServiceEstimateFormProps {
  serviceType: string;
  onUpdateTotal: (items: SelectedItem[], total: number) => void;
  onClearForm?: () => void;
  initialData?: any;
}

export default function ServiceEstimateForm({
  serviceType,
  onUpdateTotal,
  onClearForm,
  initialData
}: ServiceEstimateFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("materials");
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedItem[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedItem[]>([]);
  const [customItems, setCustomItems] = useState<SelectedItem[]>([]);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [laborHours, setLaborHours] = useState<number>(0);
  const [laborRate, setLaborRate] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [measurements, setMeasurements] = useState<{
    length?: number;
    width?: number;
    height?: number;
    units?: number;
    area?: number;
  }>({});
  
  // Formulario para elementos personalizados
  const customItemForm = useForm({
    defaultValues: {
      name: "",
      quantity: "1",
      unitPrice: "0.00",
      unit: "unit"
    }
  });

  // Usar nuestro hook de precios centralizados
  const { services, materials: configuredMaterials, isLoading: pricesLoading } = usePricing();
  
  // Get materials and options for this service type
  const defaultMaterials = MATERIALS_BY_SERVICE[serviceType as keyof typeof MATERIALS_BY_SERVICE] || [];
  const options = OPTIONS_BY_SERVICE[serviceType as keyof typeof OPTIONS_BY_SERVICE] || [];
  const serviceLabel = SERVICE_TYPES.find(s => s.value === serviceType)?.label || serviceType;
  
  // Función para cargar los precios actualizados desde la API
  const [latestMaterialPrices, setLatestMaterialPrices] = useState<any[]>([]);
  
  // Efecto para cargar precios actualizados desde la API cada vez que se carga el componente
  useEffect(() => {
    const fetchLatestPrices = async () => {
      try {
        const response = await fetch('/api/pricing/materials');
        if (response.ok) {
          const data = await response.json();
          console.log("Precios actualizados directamente desde la API:", data);
          
          if (Array.isArray(data)) {
            setLatestMaterialPrices(data);
          }
        }
      } catch (error) {
        console.error("Error al cargar precios actualizados:", error);
      }
    };
    
    fetchLatestPrices();
  }, [serviceType]); // Recargar cada vez que cambia el tipo de servicio
  
  // Combinar los materiales predeterminados con los precios más actualizados
  const materials = defaultMaterials.map(material => {
    // Primero intentamos encontrar el material en los datos recién cargados de la API
    let latestPrice = null;
    if (latestMaterialPrices.length > 0) {
      latestPrice = latestMaterialPrices.find((m: any) => 
        m.id_string === material.id || 
        m.material_id === material.id || 
        m.code === material.id
      );
    }
    
    // Si encontramos un precio actualizado, usarlo
    if (latestPrice) {
      console.log(`PRECIO ACTUALIZADO para ${material.id}:`, 
        typeof latestPrice.unit_price === 'string' 
          ? parseFloat(latestPrice.unit_price) 
          : latestPrice.unit_price
      );
      
      return {
        ...material,
        unitPrice: typeof latestPrice.unit_price === 'string' 
          ? parseFloat(latestPrice.unit_price) 
          : latestPrice.unit_price,
        unit: latestPrice.unit || material.unit
      };
    }
    
    // Si no encontramos en los datos actualizados, buscar en los configurados del contexto
    // Asegurarse de que configuredMaterials sea un array
    const materialsArray = Array.isArray(configuredMaterials) ? configuredMaterials : [];
    
    // Buscar exactamente por ID primero
    let configuredMaterial = materialsArray.find((m: any) => 
      m.id === material.id
    );
    
    // Si no lo encontramos por ID exacto, intentar buscar por nombre y categoría
    if (!configuredMaterial) {
      configuredMaterial = materialsArray.find((m: any) => 
        m.category === serviceType && 
        m.name && 
        m.name.includes(material.name)
      );
    }
    
    // Si existe, actualizar el precio
    if (configuredMaterial) {
      const numericPrice = typeof configuredMaterial.unitPrice === 'string' 
        ? parseFloat(configuredMaterial.unitPrice) 
        : configuredMaterial.unitPrice;
      
      return {
        ...material,
        unitPrice: numericPrice || 0,
        unit: configuredMaterial.unit || material.unit
      };
    }
    
    // Si no, usar el predeterminado
    return material;
  });

  // Agregar un material
  const addMaterial = (material: any, quantity: number) => {
    if (quantity <= 0) return;
    
    const total = material.unitPrice * quantity;
    
    // Verificar si ya existe
    const existingIndex = selectedMaterials.findIndex(m => m.id === material.id);
    
    if (existingIndex >= 0) {
      // Update quantity
      const updatedMaterials = [...selectedMaterials];
      updatedMaterials[existingIndex] = {
        ...updatedMaterials[existingIndex],
        quantity,
        total
      };
      setSelectedMaterials(updatedMaterials);
    } else {
      // Agregar nuevo
      setSelectedMaterials([
        ...selectedMaterials,
        {
          id: material.id,
          name: material.name,
          quantity,
          unit: material.unit,
          unitPrice: material.unitPrice,
          total
        }
      ]);
    }
  };
  
  // Agregar una opción
  const addOption = (option: any, quantity: number) => {
    if (quantity <= 0) {
      // Remove if quantity is 0
      setSelectedOptions(prev => prev.filter(o => o.id !== option.id));
      return;
    }
    
    const total = option.unitPrice * quantity;
    
    // Verificar si ya existe
    const existingIndex = selectedOptions.findIndex(o => o.id === option.id);
    
    if (existingIndex >= 0) {
      // Update quantity
      const updatedOptions = [...selectedOptions];
      updatedOptions[existingIndex] = {
        ...updatedOptions[existingIndex],
        quantity,
        total
      };
      setSelectedOptions(updatedOptions);
    } else {
      // Agregar nuevo
      setSelectedOptions([
        ...selectedOptions,
        {
          id: option.id,
          name: option.name,
          quantity,
          unit: option.unit,
          unitPrice: option.unitPrice,
          total
        }
      ]);
    }
  };
  
  // Agregar un item personalizado
  const addCustomItem = () => {
    const data = customItemForm.getValues();
    
    if (!data.name || Number(data.quantity) <= 0 || Number(data.unitPrice) <= 0) {
      toast({
        title: "Información incompleta",
        description: "Complete todos los campos del artículo personalizado.",
        variant: "destructive"
      });
      return;
    }
    
    const quantity = Number(data.quantity);
    const unitPrice = Number(data.unitPrice);
    const total = quantity * unitPrice;
    const id = `custom-${Date.now()}`;
    
    setCustomItems([
      ...customItems,
      {
        id,
        name: data.name,
        quantity,
        unit: data.unit,
        unitPrice,
        total
      }
    ]);
    
    // Reset form
    customItemForm.reset({
      name: "",
      quantity: "1",
      unitPrice: "0.00",
      unit: "unit"
    });
  };
  
  // Eliminar un item personalizado
  const removeCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== id));
  };
  
  // Inicializar tarifa de mano de obra desde la configuración central de precios
  useEffect(() => {
    // Asegurarse de que services es un array
    const servicesArray = Array.isArray(services) ? services : [];
    
    // Buscar en los servicios configurados primero
    const configuredService = servicesArray.find((s: any) => 
      s.serviceType === serviceType || s.id === serviceType
    );
    
    if (configuredService && configuredService.laborRate !== undefined) {
      const numericRate = typeof configuredService.laborRate === 'string' 
        ? parseFloat(configuredService.laborRate) 
        : configuredService.laborRate;
      
      setLaborRate(numericRate);
      console.log(`Tarifa de mano de obra para ${serviceType}:`, numericRate);
      return;
    }
    
    // Valores por defecto por tipo de servicio si no hay configuración
    const defaultRates: Record<string, number> = {
      roof: 65,
      siding: 55,
      deck: 60,
      fence: 50,
      windows: 70,
      gutters: 45
    };
    
    setLaborRate(defaultRates[serviceType] || 60);
  }, [serviceType, services]);
  
  // Calcular totales
  useEffect(() => {
    // Suma de todos los materiales
    const materialsTotal = selectedMaterials.reduce((sum, m) => sum + m.total, 0);
    
    // Suma de todas las opciones
    const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.total, 0);
    
    // Suma de items personalizados
    const customTotal = customItems.reduce((sum, c) => sum + c.total, 0);
    
    // Total labor cost
    const laborTotal = laborHours * laborRate;
    
    // Grand total
    const total = materialsTotal + optionsTotal + customTotal + laborTotal;
    
    setLaborCost(laborTotal);
    setTotalAmount(total);
    
    // Notify parent component
    const allItems = [
      ...selectedMaterials,
      ...selectedOptions,
      ...customItems,
      ...(laborTotal > 0 ? [{ 
        id: "labor", 
        name: "Mano de obra", 
        quantity: laborHours, 
        unit: "horas", 
        unitPrice: laborRate, 
        total: laborTotal 
      }] : [])
    ];
    
    onUpdateTotal(allItems, total);
  }, [selectedMaterials, selectedOptions, customItems, laborHours, laborRate, onUpdateTotal]);
  
  // Manejar cambios en las dimensiones
  const handleDimensionChange = (
    dimension: 'length' | 'width' | 'height' | 'units', 
    value: string
  ) => {
    const numValue = Number(value) || 0;
    const newMeasurements = { ...measurements, [dimension]: numValue };
    
    // Calcular área si tenemos largo y ancho
    if (dimension === 'length' || dimension === 'width') {
      if (newMeasurements.length && newMeasurements.width) {
        newMeasurements.area = newMeasurements.length * newMeasurements.width;
      }
    }
    
    setMeasurements(newMeasurements);
    
    // Update materials based on service type
    if (materials.length > 0) {
      // Buscar el primer material (predeterminado)
      const defaultMaterial = materials[0];
      
      if (defaultMaterial) {
        let quantity = 0;
        
        // Determine quantity based on material unit type
        if (defaultMaterial.unit === 'sq.ft' && newMeasurements.area) {
          // Para materiales que usan pies cuadrados (area)
          quantity = newMeasurements.area;
        } else if (defaultMaterial.unit === 'ln.ft' && newMeasurements.length) {
          // Para materiales que usan pies lineales (perímetros, bordes)
          quantity = newMeasurements.length;
        } else if (defaultMaterial.unit === 'unit' && newMeasurements.units) {
          // Para materiales que se cuentan por unit
          quantity = newMeasurements.units;
        }
        
        if (quantity > 0) {
          addMaterial(defaultMaterial, quantity);
        }
      }
    }
  };
  
  // Clear form
  const handleClearForm = () => {
    setSelectedMaterials([]);
    setSelectedOptions([]);
    setCustomItems([]);
    setLaborHours(0);
    setLaborRate(0);
    setMeasurements({});
    customItemForm.reset();
    
    if (onClearForm) {
      onClearForm();
    }
  };
  
  // Render form based on service type
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="mr-2">Estimado de {serviceLabel}</span>
        </CardTitle>
        <CardDescription>
          Complete the measurements and select materials to generate a detailed estimate
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sección de medidas */}
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Ruler className="w-5 h-5 mr-2" />
            Medidas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Specific fields based on service type */}
            {(serviceType === 'roof' || serviceType === 'deck' || serviceType === 'siding') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="length">Largo (pies)</Label>
                  <Input 
                    id="length"
                    type="number" 
                    min="1" 
                    step="0.01"
                    placeholder="Largo"
                    value={measurements.length || ''}
                    onChange={(e) => handleDimensionChange('length', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Ancho (pies)</Label>
                  <Input 
                    id="width"
                    type="number" 
                    min="1" 
                    step="0.01"
                    placeholder="Ancho"
                    value={measurements.width || ''}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                  />
                </div>
                {measurements.area && (
                  <div className="space-y-2 relative bg-muted/30 rounded-md p-3">
                    <Label htmlFor="area" className="text-muted-foreground">Área calculada</Label>
                    <div className="font-medium text-lg">{measurements.area.toFixed(2)} ft²</div>
                  </div>
                )}
              </>
            )}
            
            {serviceType === 'fence' && (
              <div className="space-y-2">
                <Label htmlFor="length">Longitud de cerca (pies)</Label>
                <Input 
                  id="length"
                  type="number" 
                  min="1" 
                  step="0.01"
                  placeholder="Longitud"
                  value={measurements.length || ''}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                />
              </div>
            )}
            
            {serviceType === 'gutters' && (
              <div className="space-y-2">
                <Label htmlFor="length">Longitud de canaleta (pies)</Label>
                <Input 
                  id="length"
                  type="number" 
                  min="1" 
                  step="0.01"
                  placeholder="Longitud"
                  value={measurements.length || ''}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                />
              </div>
            )}
            
            {serviceType === 'windows' && (
              <div className="space-y-2">
                <Label htmlFor="units">Number of windows</Label>
                <Input 
                  id="units"
                  type="number" 
                  min="1" 
                  step="1"
                  placeholder="Cantidad"
                  value={measurements.units || ''}
                  onChange={(e) => handleDimensionChange('units', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Tabs para materiales, opciones, etc */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="materials">Materiales</TabsTrigger>
            <TabsTrigger value="options">Opciones</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>
          
          {/* Tab de materiales */}
          <TabsContent value="materials" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map(material => (
                <Card key={material.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{material.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          / {material.unit === 'sq.ft' ? 'pie²' : material.unit === 'ln.ft' ? 'pie lineal' : 'unit'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="mr-2">
                          <Label htmlFor={`price-${material.id}`} className="text-xs text-muted-foreground">Precio</Label>
                          <Input 
                            id={`price-${material.id}`}
                            className="w-20 text-right"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={material.unitPrice.toFixed(2)}
                            onChange={(e) => {
                              const newPrice = Number(e.target.value);
                              const materialCopy = {...material, unitPrice: newPrice};
                              const existingMaterial = selectedMaterials.find(m => m.id === material.id);
                              if (existingMaterial) {
                                addMaterial(materialCopy, existingMaterial.quantity);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`qty-${material.id}`} className="text-xs text-muted-foreground">Cant.</Label>
                          <Input 
                            id={`qty-${material.id}`}
                            className="w-20 text-right"
                            type="number"
                            min="0"
                            step="1"
                            value={selectedMaterials.find(m => m.id === material.id)?.quantity || ''}
                            onChange={(e) => addMaterial(material, Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Tab de opciones */}
          <TabsContent value="options" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map(option => (
                <Card key={option.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{option.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          / {option.unit === 'sq.ft' ? 'pie²' : option.unit === 'ln.ft' ? 'pie lineal' : 'unit'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="mr-2">
                          <Label htmlFor={`price-${option.id}`} className="text-xs text-muted-foreground">Precio</Label>
                          <Input 
                            id={`price-${option.id}`}
                            className="w-20 text-right"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={option.unitPrice.toFixed(2)}
                            onChange={(e) => {
                              const newPrice = Number(e.target.value);
                              const optionCopy = {...option, unitPrice: newPrice};
                              const existingOption = selectedOptions.find(o => o.id === option.id);
                              if (existingOption) {
                                addOption(optionCopy, existingOption.quantity);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`qty-${option.id}`} className="text-xs text-muted-foreground">Cant.</Label>
                          <Input 
                            id={`qty-${option.id}`}
                            className="w-20 text-right"
                            type="number"
                            min="0"
                            step="1"
                            value={selectedOptions.find(o => o.id === option.id)?.quantity || ''}
                            onChange={(e) => addOption(option, Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Tab de artículos personalizados */}
          <TabsContent value="custom" className="space-y-4 py-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-name">Item name</Label>
                    <Input 
                      id="custom-name"
                      placeholder="e.g., Special paint"
                      {...customItemForm.register("name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-unit">Unit</Label>
                    <Select 
                      defaultValue="unit"
                      onValueChange={(value) => customItemForm.setValue("unit", value)}
                    >
                      <SelectTrigger id="custom-unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="sq.ft">Square foot</SelectItem>
                        <SelectItem value="ln.ft">Pie lineal</SelectItem>
                        <SelectItem value="gallon">Galón</SelectItem>
                        <SelectItem value="hora">Hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-quantity">Cantidad</Label>
                    <Input 
                      id="custom-quantity"
                      type="number"
                      min="1"
                      step="1"
                      {...customItemForm.register("quantity")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-price">Precio por unit ($)</Label>
                    <Input 
                      id="custom-price"
                      type="number"
                      min="0"
                      step="0.01"
                      {...customItemForm.register("unitPrice")}
                    />
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={addCustomItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar artículo personalizado
                </Button>
              </CardContent>
            </Card>
            
            {/* Lista de artículos personalizados */}
            {customItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Artículos personalizados agregados:</h4>
                {customItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 border rounded-md">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Sección de mano de obra */}
            <div className="pt-4">
              <h4 className="font-medium mb-4">Mano de obra</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="labor-hours">Horas estimadas</Label>
                  <Input 
                    id="labor-hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={laborHours || ''}
                    onChange={(e) => setLaborHours(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labor-rate">Tarifa por hora ($)</Label>
                  <Input 
                    id="labor-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={laborRate || ''}
                    onChange={(e) => setLaborRate(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Resumen y total */}
        {(selectedMaterials.length > 0 || selectedOptions.length > 0 || customItems.length > 0 || laborCost > 0) && (
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Resumen del Estimado
            </h3>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell className="text-right">{material.quantity}</TableCell>
                    <TableCell className="text-right">${material.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${material.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                
                {selectedOptions.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell>{option.name}</TableCell>
                    <TableCell className="text-right">{option.quantity}</TableCell>
                    <TableCell className="text-right">${option.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${option.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                
                {customItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                
                {laborCost > 0 && (
                  <TableRow>
                    <TableCell>Mano de obra</TableCell>
                    <TableCell className="text-right">{laborHours} horas</TableCell>
                    <TableCell className="text-right">${laborRate.toFixed(2)}/hora</TableCell>
                    <TableCell className="text-right">${laborCost.toFixed(2)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                  <TableCell className="text-right font-bold">${totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleClearForm}>
          Limpiar
        </Button>
      </CardFooter>
    </Card>
  );
}