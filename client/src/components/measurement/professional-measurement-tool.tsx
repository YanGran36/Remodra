import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Ruler, 
  Square, 
  CornerDownRight, 
  Plus,
  Trash2,
  Calculator
} from "lucide-react";

interface Measurement {
  id: string;
  label: string;
  type: 'rectangle' | 'linear' | 'lshape' | 'custom';
  area?: number;
  perimeter?: number;
  length?: number;
  unit: string;
  dimensions: Record<string, number>;
}

interface ProfessionalMeasurementToolProps {
  onMeasurementsChange: (measurements: Measurement[]) => void;
  serviceUnit: string;
}

export default function ProfessionalMeasurementTool({ 
  onMeasurementsChange, 
  serviceUnit 
}: ProfessionalMeasurementToolProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [segments, setSegments] = useState<{length: number, angle: number}[]>([]);

  const createRectangle = () => {
    const widthInput = document.getElementById('rect-width') as HTMLInputElement;
    const lengthInput = document.getElementById('rect-length') as HTMLInputElement;
    
    const width = parseFloat(widthInput?.value || '0');
    const length = parseFloat(lengthInput?.value || '0');
    
    if (width <= 0 || length <= 0) return;

    const area = width * length;
    const perimeter = (width + length) * 2;

    const newMeasurement: Measurement = {
      id: `rect-${Date.now()}`,
      label: `Rectangle ${width}' × ${length}'`,
      type: 'rectangle',
      area,
      perimeter,
      unit: serviceUnit === 'sqft' ? 'sqft' : 'ft',
      dimensions: { width, length }
    };

    const updatedMeasurements = [...measurements, newMeasurement];
    setMeasurements(updatedMeasurements);
    onMeasurementsChange(updatedMeasurements);

    // Clear inputs
    if (widthInput) widthInput.value = '';
    if (lengthInput) lengthInput.value = '';
  };

  const createLinear = () => {
    const lengthInput = document.getElementById('fence-length') as HTMLInputElement;
    const length = parseFloat(lengthInput?.value || '0');
    
    if (length <= 0) return;

    const newMeasurement: Measurement = {
      id: `linear-${Date.now()}`,
      label: `Linear ${length}'`,
      type: 'linear',
      length,
      unit: 'ft',
      dimensions: { length }
    };

    const updatedMeasurements = [...measurements, newMeasurement];
    setMeasurements(updatedMeasurements);
    onMeasurementsChange(updatedMeasurements);

    // Clear input
    if (lengthInput) lengthInput.value = '';
  };

  const createLShape = () => {
    const w1Input = document.getElementById('l-w1') as HTMLInputElement;
    const l1Input = document.getElementById('l-l1') as HTMLInputElement;
    const w2Input = document.getElementById('l-w2') as HTMLInputElement;
    const l2Input = document.getElementById('l-l2') as HTMLInputElement;
    
    const w1 = parseFloat(w1Input?.value || '0');
    const l1 = parseFloat(l1Input?.value || '0');
    const w2 = parseFloat(w2Input?.value || '0');
    const l2 = parseFloat(l2Input?.value || '0');
    
    if (w1 <= 0 || l1 <= 0 || w2 <= 0 || l2 <= 0) return;

    const area = (w1 * l1) - ((w1 - w2) * (l1 - l2));
    const perimeter = 2 * w1 + 2 * l1 - 2 * (w1 - w2) - 2 * (l1 - l2);

    const newMeasurement: Measurement = {
      id: `lshape-${Date.now()}`,
      label: `L-Shape ${area.toFixed(1)} sqft`,
      type: 'lshape',
      area,
      perimeter,
      unit: 'sqft',
      dimensions: { w1, l1, w2, l2 }
    };

    const updatedMeasurements = [...measurements, newMeasurement];
    setMeasurements(updatedMeasurements);
    onMeasurementsChange(updatedMeasurements);

    // Clear inputs
    if (w1Input) w1Input.value = '';
    if (l1Input) l1Input.value = '';
    if (w2Input) w2Input.value = '';
    if (l2Input) l2Input.value = '';
  };

  const addSegment = () => {
    const lengthInput = document.getElementById('segment-length') as HTMLInputElement;
    const angleInput = document.getElementById('segment-angle') as HTMLInputElement;
    
    const length = parseFloat(lengthInput?.value || '0');
    const angle = parseFloat(angleInput?.value || '0');
    
    if (length <= 0) return;

    setSegments(prev => [...prev, { length, angle }]);

    // Clear inputs
    if (lengthInput) lengthInput.value = '';
    if (angleInput) angleInput.value = '';
  };

  const createCustomFromSegments = () => {
    if (segments.length < 3) return;

    const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
    
    const newMeasurement: Measurement = {
      id: `custom-${Date.now()}`,
      label: `Custom Shape (${segments.length} segments)`,
      type: 'custom',
      perimeter: totalLength,
      unit: 'ft',
      dimensions: { segments: segments.length, totalLength }
    };

    const updatedMeasurements = [...measurements, newMeasurement];
    setMeasurements(updatedMeasurements);
    onMeasurementsChange(updatedMeasurements);

    setSegments([]);
  };

  const deleteMeasurement = (id: string) => {
    const updatedMeasurements = measurements.filter(m => m.id !== id);
    setMeasurements(updatedMeasurements);
    onMeasurementsChange(updatedMeasurements);
  };

  const clearAll = () => {
    setMeasurements([]);
    setSegments([]);
    onMeasurementsChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Professional CAD-Style Input */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Calculator className="h-5 w-5" />
            Professional Measurement by Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rectangle (Deck/Roof) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rectangle (Deck/Roof)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width (ft)</Label>
                  <Input 
                    type="number" 
                    placeholder="20" 
                    className="h-8 text-sm"
                    id="rect-width"
                  />
                </div>
                <div>
                  <Label className="text-xs">Length (ft)</Label>
                  <Input 
                    type="number" 
                    placeholder="30" 
                    className="h-8 text-sm"
                    id="rect-length"
                  />
                </div>
              </div>
              <Button 
                onClick={createRectangle}
                variant="outline" 
                size="sm" 
                className="w-full h-8 text-xs"
              >
                <Square className="h-3 w-3 mr-1" />
                Add Rectangle
              </Button>
            </div>

            {/* Linear/Fence */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Linear (Fence/Gutter)</Label>
              <div>
                <Label className="text-xs">Total Length (ft)</Label>
                <Input 
                  type="number" 
                  placeholder="150" 
                  className="h-8 text-sm"
                  id="fence-length"
                />
              </div>
              <Button 
                onClick={createLinear}
                variant="outline" 
                size="sm" 
                className="w-full h-8 text-xs"
              >
                <Ruler className="h-3 w-3 mr-1" />
                Add Linear
              </Button>
            </div>
          </div>

          {/* L-Shape */}
          <div className="border rounded p-3 bg-white">
            <Label className="text-sm font-medium mb-2 block">L-Shape (Complex Areas)</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">Width 1</Label>
                <Input type="number" placeholder="20" className="h-8 text-sm" id="l-w1" />
              </div>
              <div>
                <Label className="text-xs">Length 1</Label>
                <Input type="number" placeholder="30" className="h-8 text-sm" id="l-l1" />
              </div>
              <div>
                <Label className="text-xs">Width 2</Label>
                <Input type="number" placeholder="15" className="h-8 text-sm" id="l-w2" />
              </div>
              <div>
                <Label className="text-xs">Length 2</Label>
                <Input type="number" placeholder="20" className="h-8 text-sm" id="l-l2" />
              </div>
            </div>
            <Button 
              onClick={createLShape}
              variant="outline" 
              size="sm" 
              className="w-full h-8 text-xs mt-2"
            >
              <CornerDownRight className="h-3 w-3 mr-1" />
              Add L-Shape
            </Button>
          </div>

          {/* Custom Shape by Segments */}
          <div className="border rounded p-3 bg-white">
            <Label className="text-sm font-medium mb-2 block">Custom Shape by Segments</Label>
            <div className="flex gap-2 mb-2">
              <Input 
                type="number" 
                placeholder="Length (ft)" 
                className="h-8 text-sm flex-1"
                id="segment-length"
              />
              <Input 
                type="number" 
                placeholder="Angle (°)" 
                className="h-8 text-sm w-20"
                id="segment-angle"
              />
              <Button 
                onClick={addSegment}
                variant="outline" 
                size="sm" 
                className="h-8 px-3"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            {segments.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-slate-600">
                  Segments: {segments.map((seg, i) => `${seg.length}ft@${seg.angle}°`).join(', ')}
                </div>
                <Button 
                  onClick={createCustomFromSegments}
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs"
                  disabled={segments.length < 3}
                >
                  Create Custom Shape ({segments.length} segments)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Measurements Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Measurements Summary</CardTitle>
            <Button onClick={clearAll} variant="outline" size="sm">
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {measurements.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No measurements yet. Add dimensions above.
            </p>
          ) : (
            <div className="space-y-2">
              {measurements.map((measurement) => (
                <div key={measurement.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div>
                    <div className="text-sm font-medium">{measurement.label}</div>
                    <div className="text-xs text-slate-600">
                      {measurement.area && `Area: ${measurement.area.toFixed(1)} sqft`}
                      {measurement.length && `Length: ${measurement.length} ft`}
                      {measurement.perimeter && ` | Perimeter: ${measurement.perimeter.toFixed(1)} ft`}
                    </div>
                  </div>
                  <Button 
                    onClick={() => deleteMeasurement(measurement.id)}
                    variant="ghost" 
                    size="sm"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {/* Total Summary */}
              <div className="border-t pt-2 mt-3">
                <div className="text-sm font-medium">
                  Total Area: {measurements.reduce((sum, m) => sum + (m.area || 0), 0).toFixed(1)} sqft
                </div>
                <div className="text-sm font-medium">
                  Total Linear: {measurements.reduce((sum, m) => sum + (m.length || m.perimeter || 0), 0).toFixed(1)} ft
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}