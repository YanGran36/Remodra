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

// Helper para convertir RGB a HSL
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

// Helper para convertir HSL a RGB
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { 
    r: Math.round(r * 255), 
    g: Math.round(g * 255), 
    b: Math.round(b * 255) 
  };
};

export function ColorPicker({ value, onChange, color }: ColorPickerProps) {
  // Use color prop for backward compatibility
  const initialColor = value || color || "#000000";
  const [colorValue, setColorValue] = useState(initialColor);
  const [rgb, setRgb] = useState(() => hexToRgb(initialColor) || { r: 0, g: 0, b: 0 });
  const [hsl, setHsl] = useState(() => rgbToHsl(rgb.r, rgb.g, rgb.b));
  const [activeTab, setActiveTab] = useState("swatches");
  
  // Colores premium predefinidos - paleta más lujosa y profesional
  const predefinedColors = [
    // Grises elegantes
    "#000000", "#1E1E1E", "#2D2D2D", "#3C3C3C", "#4B4B4B",
    // Azules profesionales
    "#0A2647", "#144272", "#205295", "#2C74B3", "#5499C7",
    // Verdes de lujo
    "#0F766E", "#115E59", "#134E4A", "#1E3A8A", "#0F172A",
    // Purpuras y violetas elegantes
    "#4A1D96", "#581C87", "#6D28D9", "#7E22CE", "#8B5CF6",
    // Tonos cálidos premium
    "#BE123C", "#9F1239", "#881337", "#7F1D1D", "#7C2D12",
    // Oro y premium
    "#B45309", "#A16207", "#854D0E", "#713F12", "#422006"
  ];

  // Actualiza el color y propaga el cambio
  const handleColorChange = useCallback((newColor: string) => {
    setColorValue(newColor);
    const newRgb = hexToRgb(newColor) || { r: 0, g: 0, b: 0 };
    setRgb(newRgb);
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    onChange && onChange(newColor);
  }, [onChange]);

  // Actualiza RGB y el color HEX
  const handleRgbChange = useCallback((key: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [key]: value };
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setColorValue(newHex);
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    onChange && onChange(newHex);
  }, [rgb, onChange]);

  // Actualiza HSL y el color HEX
  const handleHslChange = useCallback((key: 'h' | 's' | 'l', value: number) => {
    const newHsl = { ...hsl, [key]: value };
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setColorValue(newHex);
    onChange && onChange(newHex);
  }, [hsl, onChange]);

  // Sincronizar el valor externo con el estado interno
  useEffect(() => {
    const newColor = value || color || "#000000";
    if (newColor !== colorValue) {
      setColorValue(newColor);
      const newRgb = hexToRgb(newColor) || { r: 0, g: 0, b: 0 };
      setRgb(newRgb);
      setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    }
  }, [value, color, colorValue]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-10 h-10 p-0 border-2 rounded-md overflow-hidden shadow-sm transition-all hover:shadow-md"
          style={{ 
            backgroundColor: colorValue,
            borderColor: 'rgba(0,0,0,0.1)'
          }}
        >
          <div className="w-full h-full" style={{ 
            backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), 
                            linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)`,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 4px 4px',
            opacity: 0.3
          }}></div>
          <span className="sr-only">Open color picker</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 shadow-xl border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="flex flex-col space-y-4">
          {/* Preview del color seleccionado */}
          <div className="relative h-16 rounded-md overflow-hidden shadow-inner mb-2">
            {/* Fondo de transparencia */}
            <div className="absolute inset-0" style={{ 
              backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), 
                              linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)`,
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 4px 4px'
            }}></div>
            {/* Color seleccionado */}
            <div className="absolute inset-0" style={{ backgroundColor: colorValue }}></div>
            {/* Información del color */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white text-xs p-1 font-mono">
              {colorValue.toUpperCase()}
            </div>
          </div>

          {/* Tabs de selección de color */}
          <Tabs defaultValue="swatches" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="swatches" className="flex-1">Paleta</TabsTrigger>
              <TabsTrigger value="rgb" className="flex-1">RGB</TabsTrigger>
              <TabsTrigger value="hsl" className="flex-1">HSL</TabsTrigger>
            </TabsList>

            {/* Paletas de colores */}
            <TabsContent value="swatches" className="mt-2">
              <div className="grid grid-cols-5 gap-2">
                {predefinedColors.map((clr) => (
                  <button
                    key={clr}
                    className="w-9 h-9 rounded-md border border-gray-300 dark:border-gray-700 
                            focus:outline-none focus:ring-2 focus:ring-primary transition-all
                            shadow-sm hover:shadow-md"
                    style={{ 
                      backgroundColor: clr,
                      boxShadow: colorValue === clr ? '0 0 0 2px rgba(59, 130, 246, 0.8)' : undefined
                    }}
                    onClick={() => handleColorChange(clr)}
                    aria-label={`Select color ${clr}`}
                  >
                    {colorValue === clr && (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4">
                <Input
                  type="text"
                  value={colorValue}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-28 font-mono text-sm"
                  maxLength={7}
                />
                <input
                  type="color"
                  value={colorValue}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                  id="custom-color-picker"
                  aria-label="Select custom color"
                />
              </div>
            </TabsContent>

            {/* RGB Controls */}
            <TabsContent value="rgb" className="space-y-4 mt-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor="r-slider" className="text-xs font-medium">Red ({rgb.r})</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="r-slider"
                      min={0}
                      max={255}
                      step={1}
                      value={[rgb.r]}
                      onValueChange={(values) => handleRgbChange('r', values[0])}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb.r}
                      onChange={(e) => handleRgbChange('r', Number(e.target.value))}
                      className="w-16 text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor="g-slider" className="text-xs font-medium">Green ({rgb.g})</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="g-slider"
                      min={0}
                      max={255}
                      step={1}
                      value={[rgb.g]}
                      onValueChange={(values) => handleRgbChange('g', values[0])}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb.g}
                      onChange={(e) => handleRgbChange('g', Number(e.target.value))}
                      className="w-16 text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor="b-slider" className="text-xs font-medium">Blue ({rgb.b})</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="b-slider"
                      min={0}
                      max={255}
                      step={1}
                      value={[rgb.b]}
                      onValueChange={(values) => handleRgbChange('b', values[0])}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb.b}
                      onChange={(e) => handleRgbChange('b', Number(e.target.value))}
                      className="w-16 text-right"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* HSL Controls */}
            <TabsContent value="hsl" className="space-y-4 mt-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor="h-slider" className="text-xs font-medium">Hue ({hsl.h}°)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-full h-4 rounded-md" 
                      style={{
                        background: `linear-gradient(to right, 
                          #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`
                      }}
                    >
                      <Slider
                        id="h-slider"
                        min={0}
                        max={360}
                        step={1}
                        value={[hsl.h]}
                        onValueChange={(values) => handleHslChange('h', values[0])}
                        className="flex-1"
                        trackClassName="bg-transparent"
                        thumbClassName="h-5 w-5 border-2 border-white"
                      />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={360}
                      value={hsl.h}
                      onChange={(e) => handleHslChange('h', Number(e.target.value))}
                      className="w-16 text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor="s-slider" className="text-xs font-medium">Saturation ({hsl.s}%)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-full h-4 rounded-md" 
                      style={{
                        background: `linear-gradient(to right, 
                          hsl(${hsl.h}, 0%, ${hsl.l}%), 
                          hsl(${hsl.h}, 100%, ${hsl.l}%))`
                      }}
                    >
                      <Slider
                        id="s-slider"
                        min={0}
                        max={100}
                        step={1}
                        value={[hsl.s]}
                        onValueChange={(values) => handleHslChange('s', values[0])}
                        className="flex-1"
                        trackClassName="bg-transparent"
                      />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={hsl.s}
                      onChange={(e) => handleHslChange('s', Number(e.target.value))}
                      className="w-16 text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor="l-slider" className="text-xs font-medium">Lightness ({hsl.l}%)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-full h-4 rounded-md" 
                      style={{
                        background: `linear-gradient(to right, 
                          hsl(${hsl.h}, ${hsl.s}%, 0%), 
                          hsl(${hsl.h}, ${hsl.s}%, 50%), 
                          hsl(${hsl.h}, ${hsl.s}%, 100%))`
                      }}
                    >
                      <Slider
                        id="l-slider"
                        min={0}
                        max={100}
                        step={1}
                        value={[hsl.l]}
                        onValueChange={(values) => handleHslChange('l', values[0])}
                        className="flex-1"
                        trackClassName="bg-transparent"
                      />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={hsl.l}
                      onChange={(e) => handleHslChange('l', Number(e.target.value))}
                      className="w-16 text-right"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}