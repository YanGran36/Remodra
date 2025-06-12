import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Slider } from "./slider";
import { Input } from "./input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Label } from "./label";

export interface ColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  color?: string; // For backward compatibility
}

// Helper function para convertir HEX a RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Helper function para convertir RGB a HEX
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

export function EnhancedColorPicker({ value, onChange, color }: ColorPickerProps) {
  // Use color prop for backward compatibility
  const initialColor = value || color || "#000000";
  const [colorValue, setColorValue] = useState(initialColor);
  const [rgb, setRgb] = useState(() => hexToRgb(initialColor) || { r: 0, g: 0, b: 0 });

  // Colores profesionales predefinidos
  const predefinedColors = [
    // Azules profesionales
    "#0a2647", "#144272", "#205295", "#2c74b3", "#5499c7",
    // Verdes de lujo
    "#0f766e", "#115e59", "#134e4a", "#0f172a", "#064e3b",
    // Tonos neutros elegantes
    "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8",
    // Púrpuras y violetas
    "#4a1d96", "#581c87", "#6d28d9", "#7e22ce", "#8b5cf6",
    // Rojos y naranjas
    "#be123c", "#b91c1c", "#c2410c", "#b45309", "#a16207"
  ];

  // Actualiza el color y propaga el cambio
  const handleColorChange = useCallback((newColor: string) => {
    if (newColor.startsWith('#') && (newColor.length === 4 || newColor.length === 7)) {
      setColorValue(newColor);
      const newRgb = hexToRgb(newColor) || { r: 0, g: 0, b: 0 };
      setRgb(newRgb);
      onChange && onChange(newColor);
    }
  }, [onChange]);

  // Actualiza RGB y el color HEX
  const handleRgbChange = useCallback((key: 'r' | 'g' | 'b', value: number) => {
    const safeValue = Math.max(0, Math.min(255, value));
    const newRgb = { ...rgb, [key]: safeValue };
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setColorValue(newHex);
    onChange && onChange(newHex);
  }, [rgb, onChange]);

  // Sincronizar el valor externo con el estado interno
  useEffect(() => {
    const newColor = value || color || "#000000";
    if (newColor !== colorValue) {
      setColorValue(newColor);
      const newRgb = hexToRgb(newColor) || { r: 0, g: 0, b: 0 };
      setRgb(newRgb);
    }
  }, [value, color, colorValue]);

  return (
    <div className="flex flex-col gap-1">
      <Label className="text-sm font-medium">Color</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-10 px-3 flex items-center justify-between rounded-md overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-md shadow-sm border border-gray-200"
                style={{ backgroundColor: colorValue }}
              />
              <span className="text-sm font-mono">{colorValue.toUpperCase()}</span>
            </div>
            <span className="text-xs text-gray-500">Click to change</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="flex flex-col space-y-4">
            {/* Preview del color */}
            <div className="h-20 rounded-md overflow-hidden shadow-sm border border-gray-200" style={{ backgroundColor: colorValue }}>
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-mono text-sm px-2 py-1 bg-white/80 rounded text-black">
                  {colorValue.toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* RGB Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs">Red</Label>
                  <span className="text-xs font-mono">{rgb.r}</span>
                </div>
                <Slider
                  value={[rgb.r]}
                  min={0}
                  max={255}
                  step={1}
                  onValueChange={(value) => handleRgbChange('r', value[0])}
                  className="h-4"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs">Green</Label>
                  <span className="text-xs font-mono">{rgb.g}</span>
                </div>
                <Slider
                  value={[rgb.g]}
                  min={0}
                  max={255}
                  step={1}
                  onValueChange={(value) => handleRgbChange('g', value[0])}
                  className="h-4"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs">Blue</Label>
                  <span className="text-xs font-mono">{rgb.b}</span>
                </div>
                <Slider
                  value={[rgb.b]}
                  min={0}
                  max={255}
                  step={1}
                  onValueChange={(value) => handleRgbChange('b', value[0])}
                  className="h-4"
                />
              </div>
            </div>
            
            {/* Color Paleta */}
            <div>
              <Label className="text-xs mb-2 block">Color Palette</Label>
              <div className="grid grid-cols-5 gap-1">
                {predefinedColors.map((clr) => (
                  <button
                    key={clr}
                    className="w-8 h-8 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    style={{ 
                      backgroundColor: clr,
                      boxShadow: colorValue.toLowerCase() === clr ? '0 0 0 2px rgba(59, 130, 246, 0.8)' : undefined
                    }}
                    onClick={() => handleColorChange(clr)}
                    aria-label={`Select color ${clr}`}
                  />
                ))}
              </div>
            </div>
            
            {/* Input HEX */}
            <div>
              <Label className="text-xs mb-2 block">Hex Value</Label>
              <Input
                type="text"
                value={colorValue}
                onChange={(e) => handleColorChange(e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}