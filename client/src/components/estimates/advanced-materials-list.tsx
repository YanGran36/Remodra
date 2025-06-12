import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Package, DollarSign, Edit3, Trash2 } from "lucide-react";

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
  serviceType: string;
  notes?: string;
}

interface AdvancedMaterialsListProps {
  services: any[];
  onMaterialsChange: (materials: MaterialItem[]) => void;
}

export default function AdvancedMaterialsList({ services, onMaterialsChange }: AdvancedMaterialsListProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);

  // Generate materials from services - consolidated to avoid gate duplication
  useEffect(() => {
    const merged: { [key: string]: MaterialItem } = {};
    
    // First pass: collect all gate counts across all fence services
    let totalGatesCount = 0;
    
    services.forEach((service) => {
      if (service.serviceType === "fence") {
        totalGatesCount += service.measurements?.units || 0;
      }
    });

    services.forEach((service, serviceIndex) => {
      if (service.serviceType === "fence") {
        const linearFeet = service.measurements?.linearFeet || 0;

        if (linearFeet > 0) {
          // Calculate sections and posts
          const sections = Math.ceil(linearFeet / 8);
          const posts = sections + 1;

          // Fence Posts - merge if exists
          const postKey = "fence-posts";
          if (merged[postKey]) {
            merged[postKey].quantity += posts;
            merged[postKey].total = merged[postKey].quantity * merged[postKey].unitPrice;
          } else {
            merged[postKey] = {
              id: postKey,
              name: "Fence Posts (4x4x8 PT)",
              quantity: posts,
              unit: "pieces",
              unitPrice: 18.00,
              total: posts * 18.00,
              category: "Posts & Foundation",
              serviceType: "fence",
              notes: "8ft spacing"
            };
          }

          // Fence Panels - merge if exists
          const panelKey = "fence-panels";
          if (merged[panelKey]) {
            merged[panelKey].quantity += sections;
            merged[panelKey].total = merged[panelKey].quantity * merged[panelKey].unitPrice;
          } else {
            merged[panelKey] = {
              id: panelKey,
              name: "Fence Panels (6x8 ft)",
              quantity: sections,
              unit: "pieces",
              unitPrice: 45.00,
              total: sections * 45.00,
              category: "Panels",
              serviceType: "fence"
            };
          }

          // Concrete - merge if exists
          const concreteKey = "concrete-mix";
          if (merged[concreteKey]) {
            merged[concreteKey].quantity += posts * 2;
            merged[concreteKey].total = merged[concreteKey].quantity * merged[concreteKey].unitPrice;
          } else {
            merged[concreteKey] = {
              id: concreteKey,
              name: "Concrete Mix (50lb bags)",
              quantity: posts * 2,
              unit: "bags",
              unitPrice: 5.50,
              total: posts * 2 * 5.50,
              category: "Foundation",
              serviceType: "fence"
            };
          }

          // Hardware - merge if exists
          const hardwareKey = "fence-hardware";
          if (merged[hardwareKey]) {
            merged[hardwareKey].quantity += Math.ceil(sections / 4);
            merged[hardwareKey].total = merged[hardwareKey].quantity * merged[hardwareKey].unitPrice;
          } else {
            merged[hardwareKey] = {
              id: hardwareKey,
              name: "Galvanized Screws (1lb box)",
              quantity: Math.ceil(sections / 4),
              unit: "boxes",
              unitPrice: 12.00,
              total: Math.ceil(sections / 4) * 12.00,
              category: "Hardware",
              serviceType: "fence"
            };
          }
        }
      }

      // Other service types can be added here
      if (service.serviceType === "deck") {
        const squareFeet = service.measurements?.squareFeet || 0;
        if (squareFeet > 0) {
          const deckKey = `deck-boards-${serviceIndex}`;
          merged[deckKey] = {
            id: deckKey,
            name: "Deck Boards (5/4x6x12)",
            quantity: Math.ceil(squareFeet * 1.1),
            unit: "boards",
            unitPrice: 8.50,
            total: Math.ceil(squareFeet * 1.1) * 8.50,
            category: "Decking",
            serviceType: "deck"
          };
        }
      }

      if (service.serviceType === "windows") {
        const units = service.measurements?.units || 0;
        if (units > 0) {
          const windowKey = `windows-${serviceIndex}`;
          merged[windowKey] = {
            id: windowKey,
            name: "Window Units",
            quantity: units,
            unit: "windows",
            unitPrice: 250.00,
            total: units * 250.00,
            category: "Windows",
            serviceType: "windows"
          };
        }
      }
    });

    // Add gates only ONCE at the end, after processing all services
    if (totalGatesCount > 0) {
      const gateKey = "fence-gates";
      merged[gateKey] = {
        id: gateKey,
        name: "Fence Gates (Complete Set)",
        quantity: totalGatesCount,
        unit: "sets",
        unitPrice: 125.00,
        total: totalGatesCount * 125.00,
        category: "Gates",
        serviceType: "fence",
        notes: "Includes hinges and latch"
      };
    }

    // Convert merged object back to array
    const mergedMaterials = Object.values(merged);
    setMaterials(mergedMaterials);
    onMaterialsChange(mergedMaterials);
  }, [services, onMaterialsChange]);

  const updateMaterialQuantity = (materialId: string, newQuantity: number) => {
    const updatedMaterials = materials.map(material => 
      material.id === materialId 
        ? { ...material, quantity: newQuantity, total: newQuantity * material.unitPrice }
        : material
    );
    setMaterials(updatedMaterials);
    onMaterialsChange(updatedMaterials);
  };

  const removeMaterial = (materialId: string) => {
    const updatedMaterials = materials.filter(m => m.id !== materialId);
    setMaterials(updatedMaterials);
    onMaterialsChange(updatedMaterials);
    setEditingMaterial(null);
  };

  // Group materials by category
  const groupedMaterials = materials.reduce((groups: any, material) => {
    const category = material.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(material);
    return groups;
  }, {});

  const totalCost = materials.reduce((sum, material) => sum + material.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Materials List
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.keys(groupedMaterials).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Add services and measurements to see materials list</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMaterials).map(([category, categoryMaterials]: [string, any]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-sm font-medium">
                    {category}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {categoryMaterials.map((material: MaterialItem) => (
                    <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{material.name}</div>
                        {material.notes && (
                          <div className="text-sm text-gray-500">{material.notes}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {editingMaterial === material.id ? (
                            <Input
                              type="number"
                              value={material.quantity}
                              onChange={(e) => updateMaterialQuantity(material.id, parseInt(e.target.value) || 0)}
                              onBlur={() => setEditingMaterial(null)}
                              className="w-20 h-8"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:text-blue-600 font-medium min-w-[60px] text-center"
                              onClick={() => setEditingMaterial(material.id)}
                            >
                              {material.quantity} {material.unit}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-right min-w-[80px]">
                          <div className="font-medium text-gray-900">
                            ${material.total.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            @ ${material.unitPrice.toFixed(2)}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterial(material.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
              </div>
            ))}
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Total Materials Cost</span>
              </div>
              <span className="text-xl font-bold text-blue-900">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}