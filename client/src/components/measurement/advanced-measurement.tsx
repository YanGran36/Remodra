import React, { useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Define types
interface Point {
  x: number;
  y: number;
}

interface Measurement {
  id: string;
  type: 'line' | 'area' | 'perimeter';
  points: Point[];
  length?: number;
  area?: number;
  perimeter?: number;
  realLength?: number;
  realArea?: number;
  realPerimeter?: number;
  unit: string;
  label: string;
  serviceType?: string;
  materialType?: string;
  costEstimate?: number;
  color?: string;
  notes?: string;
}

interface CalculationOptions {
  servicePrices?: Record<string, { rate: number, unit: string, label: string }>;
  laborCalculationMethod?: 'by_measurement' | 'hourly' | 'fixed';
  laborFactor?: number;
}

interface AdvancedMeasurementProps {
  initialScale?: number;
  unit?: string;
  onMeasurementsChange?: (measurements: Measurement[]) => void;
  initialMeasurements?: Measurement[];
  canvasWidth?: number;
  canvasHeight?: number;
  showCostEstimates?: boolean;
  defaultServiceType?: string;
  calculationOptions?: CalculationOptions;
}

// Default service rates if none provided
const SERVICE_RATES = {
  roofing: { rate: 350, unit: "sq ft", label: "Roofing" },
  siding: { rate: 12, unit: "sq ft", label: "Siding" },
  fencing: { rate: 25, unit: "linear ft", label: "Fencing" },
  decking: { rate: 30, unit: "sq ft", label: "Decking" },
  windows: { rate: 40, unit: "sq ft", label: "Windows" },
  gutters: { rate: 10, unit: "linear ft", label: "Gutters" },
};

// Utility functions
const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const calculatePolygonArea = (points: Point[]): number => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};

const calculatePolygonPerimeter = (points: Point[]): number => {
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += distance(points[i], points[j]);
  }
  return perimeter;
};

const calculateCentroid = (points: Point[]): Point => {
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    cx += points[i].x;
    cy += points[i].y;
  }
  return { x: cx / points.length, y: cy / points.length };
};

const formatNumber = (num: number): string => {
  return num.toFixed(2);
};

export default function AdvancedMeasurement({
  initialScale = 1,
  unit = "ft",
  onMeasurementsChange,
  initialMeasurements = [],
  canvasWidth = 800,
  canvasHeight = 600,
  showCostEstimates = true,
  defaultServiceType = "roofing",
  calculationOptions
}: AdvancedMeasurementProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use custom rates if provided, default otherwise
  const serviceRates = calculationOptions?.servicePrices || SERVICE_RATES;
  
  // State variables
  const [activeTab, setActiveTab] = useState("draw");
  const [activeTool, setActiveTool] = useState<"line" | "area" | "perimeter" | "select">("line");
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>(initialMeasurements);
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [scale, setScale] = useState(initialScale);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationLength, setCalibrationLength] = useState<number>(10);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string>(defaultServiceType);
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>("standard");
  const [measurementLabel, setMeasurementLabel] = useState<string>("");
  
  // Track cursor position for real-time measurements
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  
  // Initialize canvas with background image if available
  useEffect(() => {
    if (initialMeasurements.length > 0) {
      setMeasurements(initialMeasurements);
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    drawCanvas(ctx);
    
    // Notify parent component when measurements change
    if (onMeasurementsChange) {
      onMeasurementsChange(measurements);
    }
  }, [measurements, backgroundImage, mousePosition, tempPoints, activeTool, isDrawing, selectedMeasurement]);
  
  // Draw functions
  const drawCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    if (backgroundImage) {
      // Draw background image with proper scaling to fit
      ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
    } else {
      // If no background, draw a simple house outline in the center to help visualize
      drawSimpleHouseOutline(ctx);
    }
    
    // Draw all measurements
    measurements.forEach(measurement => {
      const isSelected = selectedMeasurement === measurement.id;
      drawMeasurement(ctx, measurement, isSelected);
    });
    
    // Draw temporary points and lines while measuring
    drawTempPoints(ctx);
    
    // Draw real-time measurement distances
    drawRealTimeDistances(ctx);
  };
  
  // Draw a top-down house view to help with visualization
  const drawSimpleHouseOutline = (ctx: CanvasRenderingContext2D) => {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const houseWidth = canvasWidth * 0.3; // Smaller house for better perspective
    const houseHeight = canvasHeight * 0.25;
    
    // Fill for the property/yard area
    ctx.fillStyle = "rgba(220, 240, 220, 0.3)"; // Light green for yard
    ctx.fillRect(
      centerX - canvasWidth * 0.4,
      centerY - canvasHeight * 0.35,
      canvasWidth * 0.8,
      canvasHeight * 0.7
    );
    
    // Border for property area (dashed)
    ctx.beginPath();
    ctx.rect(
      centerX - canvasWidth * 0.4,
      centerY - canvasHeight * 0.35,
      canvasWidth * 0.8,
      canvasHeight * 0.7
    );
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw house body (rectangle) - top-down view
    ctx.beginPath();
    ctx.rect(
      centerX - houseWidth / 2,
      centerY - houseHeight / 2,
      houseWidth,
      houseHeight
    );
    ctx.fillStyle = "#f5f5f5";
    ctx.fill();
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw interior lines (rooms)
    // Vertical division
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - houseHeight / 2);
    ctx.lineTo(centerX, centerY + houseHeight / 2);
    ctx.strokeStyle = "#aaaaaa";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Horizontal division
    ctx.beginPath();
    ctx.moveTo(centerX - houseWidth / 2, centerY);
    ctx.lineTo(centerX + houseWidth / 2, centerY);
    ctx.stroke();
    
    // Front door (bottom side of house)
    ctx.beginPath();
    const doorWidth = 20;
    ctx.moveTo(centerX - doorWidth/2, centerY + houseHeight/2);
    ctx.lineTo(centerX + doorWidth/2, centerY + houseHeight/2);
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Back door (top of house)
    ctx.beginPath();
    ctx.moveTo(centerX - doorWidth/4, centerY - houseHeight/2);
    ctx.lineTo(centerX + doorWidth/4, centerY - houseHeight/2);
    ctx.stroke();
    
    // Gate symbol (at bottom of property)
    ctx.beginPath();
    const gateWidth = 30;
    const gateY = centerY + canvasHeight * 0.3;
    ctx.moveTo(centerX - gateWidth/2, gateY);
    ctx.lineTo(centerX + gateWidth/2, gateY);
    ctx.strokeStyle = "#996633";
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Gate posts
    ctx.beginPath();
    ctx.arc(centerX - gateWidth/2, gateY, 4, 0, Math.PI * 2);
    ctx.arc(centerX + gateWidth/2, gateY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#996633";
    ctx.fill();
    
    // Add labels
    ctx.font = "14px Arial";
    ctx.fillStyle = "#666666";
    ctx.textAlign = "center";
    ctx.fillText("House", centerX, centerY);
    ctx.font = "12px Arial";
    ctx.fillText("Gate", centerX, gateY + 15);
    ctx.fillText("Property Line", centerX, centerY - canvasHeight * 0.37);
    
    // Add compass direction
    ctx.font = "bold 12px Arial";
    const compassX = centerX + canvasWidth * 0.35;
    const compassY = centerY - canvasHeight * 0.3;
    // North
    ctx.fillText("N", compassX, compassY - 15);
    ctx.beginPath();
    ctx.moveTo(compassX, compassY);
    ctx.lineTo(compassX, compassY - 10);
    ctx.stroke();
    // South
    ctx.fillText("S", compassX, compassY + 25);
    ctx.beginPath();
    ctx.moveTo(compassX, compassY);
    ctx.lineTo(compassX, compassY + 10);
    ctx.stroke();
    // East
    ctx.fillText("E", compassX + 15, compassY + 5);
    ctx.beginPath();
    ctx.moveTo(compassX, compassY);
    ctx.lineTo(compassX + 10, compassY);
    ctx.stroke();
    // West
    ctx.fillText("W", compassX - 15, compassY + 5);
    ctx.beginPath();
    ctx.moveTo(compassX, compassY);
    ctx.lineTo(compassX - 10, compassY);
    ctx.stroke();
    
    // Add a scale indicator at the bottom - with ability to adjust scale
    const scaleLineLength = 100;
    // Adjust the scale text to use a smaller measurement for better precision
    const adjustedScale = scale * 0.5; // Make scale more precise (zoomed in effect)
    const scaleText = `${Math.round(scaleLineLength / adjustedScale)} ${unit}`;
    
    ctx.beginPath();
    ctx.moveTo(centerX - scaleLineLength / 2, canvasHeight - 40);
    ctx.lineTo(centerX + scaleLineLength / 2, canvasHeight - 40);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw small vertical ticks at each end
    ctx.beginPath();
    ctx.moveTo(centerX - scaleLineLength / 2, canvasHeight - 45);
    ctx.lineTo(centerX - scaleLineLength / 2, canvasHeight - 35);
    ctx.moveTo(centerX + scaleLineLength / 2, canvasHeight - 45);
    ctx.lineTo(centerX + scaleLineLength / 2, canvasHeight - 35);
    ctx.stroke();
    
    // Add scale text
    ctx.font = "12px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(scaleText, centerX, canvasHeight - 20);
    ctx.fillText("(Escala ajustable con la rueda del ratón)", centerX, canvasHeight - 5);
  };
  
  // Function to draw real-time distances during measurement
  const drawRealTimeDistances = (ctx: CanvasRenderingContext2D) => {
    if (!isDrawing || tempPoints.length === 0 || !mousePosition) return;
    
    // Only show real-time distance for line measurements
    if (activeTool === 'line') {
      // Get last point in temporary points array
      const lastPoint = tempPoints[tempPoints.length - 1];
      
      // Calculate distance between last point and current mouse position
      const dist = distance(lastPoint, mousePosition);
      const scaledDist = dist / scale;
      
      // Draw line from last point to mouse position
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(mousePosition.x, mousePosition.y);
      ctx.strokeStyle = "#FF5722";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Calculate midpoint for the text
      const midX = (lastPoint.x + mousePosition.x) / 2;
      const midY = (lastPoint.y + mousePosition.y) / 2;
      
      // Draw the distance text with improved visibility
      ctx.font = "bold 14px Arial";
      // Create a background for better readability
      const textToDraw = `${formatNumber(scaledDist)} ${unit}`;
      const textMetrics = ctx.measureText(textToDraw);
      const textWidth = textMetrics.width;
      
      ctx.fillStyle = "rgba(255, 87, 34, 0.9)"; // More opaque background
      ctx.fillRect(midX - textWidth/2 - 6, midY - 12, textWidth + 12, 24);
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textToDraw, midX, midY);
      
      // Calculate and display total length if we have more than one point
      if (tempPoints.length > 1) {
        let totalDistance = 0;
        
        // Add up all distances between consecutive points
        for (let i = 1; i < tempPoints.length; i++) {
          totalDistance += distance(tempPoints[i-1], tempPoints[i]);
        }
        
        // Add current segment being drawn
        totalDistance += dist;
        const scaledTotalDistance = totalDistance / scale;
        
        // Draw total at a fixed position in the bottom right
        const totalLabel = `Total: ${formatNumber(scaledTotalDistance)} ${unit}`;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(canvasWidth - 160, canvasHeight - 40, 150, 30);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "right";
        ctx.font = "bold 14px Arial";
        ctx.fillText(totalLabel, canvasWidth - 20, canvasHeight - 25);
        
        // Log measurement for debugging and to help with calculation
        const totalArea = 0; // No estamos calculando área en este caso
        console.log(`Measurements updated - Total Area: ${totalArea} sqft, Total Length: ${scaledTotalDistance} ft`);
        
        // Solo mostramos la longitud total, sin costos para evitar confusiones
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(canvasWidth - 250, canvasHeight - 80, 230, 30);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "right";
        ctx.fillText(`Longitud total: ${formatNumber(scaledTotalDistance)} ${unit}`, canvasWidth - 20, canvasHeight - 65);
      }
    }
  };
  
  const drawTempPoints = (ctx: CanvasRenderingContext2D) => {
    if (tempPoints.length === 0) return;
    
    // Set style
    ctx.strokeStyle = "#FF5722";
    ctx.fillStyle = "#FF5722";
    ctx.lineWidth = 2;
    
    // Draw lines between points
    if (tempPoints.length >= 1) {
      ctx.beginPath();
      ctx.moveTo(tempPoints[0].x, tempPoints[0].y);
      
      for (let i = 1; i < tempPoints.length; i++) {
        ctx.lineTo(tempPoints[i].x, tempPoints[i].y);
      }
      
      // If we're drawing an area or perimeter, close the shape
      if ((activeTool === 'area' || activeTool === 'perimeter') && tempPoints.length > 2) {
        ctx.lineTo(tempPoints[0].x, tempPoints[0].y);
      }
      
      ctx.stroke();
    }
    
    // Draw points
    tempPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw point numbers for clarity
      ctx.fillStyle = "white";
      ctx.font = "10px Arial";
      ctx.fillText(`${index + 1}`, point.x - 3, point.y + 3);
      ctx.fillStyle = "#FF5722";
    });
    
    // Show distance labels for line measurements
    if (activeTool === 'line' && tempPoints.length > 1) {
      for (let i = 0; i < tempPoints.length - 1; i++) {
        const start = tempPoints[i];
        const end = tempPoints[i + 1];
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        const segmentDist = distance(start, end);
        const scaledDist = segmentDist / scale;
        
        // Draw the label
        ctx.font = "12px Arial";
        ctx.fillStyle = "#222";
        ctx.fillRect(midX - 2, midY - 10, 65, 16);
        ctx.fillStyle = "white";
        ctx.fillText(`${formatNumber(scaledDist)} ${unit}`, midX, midY);
      }
    }
  };
  
  const drawMeasurement = (ctx: CanvasRenderingContext2D, measurement: Measurement, isSelected = false) => {
    const { points, type, label, color = "#4CAF50" } = measurement;
    
    if (points.length === 0) return;
    
    // Set style based on selection state
    ctx.strokeStyle = isSelected ? "#2196F3" : color;
    ctx.fillStyle = isSelected ? "#2196F3" : color;
    ctx.lineWidth = isSelected ? 3 : 2;
    
    // Draw the measurement path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    // Close the path for area and perimeter
    if ((type === 'area' || type === 'perimeter') && points.length > 2) {
      ctx.lineTo(points[0].x, points[0].y);
    }
    
    ctx.stroke();
    
    // Draw the points
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw measurement label at the centroid
    if (points.length > 0) {
      const centroid = calculateCentroid(points);
      drawLabel(ctx, [centroid.x, centroid.y], label, isSelected ? "#2196F3" : color);
    }
  };
  
  const drawLabel = (ctx: CanvasRenderingContext2D, position: [number, number], text: string, color = "#4CAF50") => {
    const [x, y] = position;
    
    ctx.font = "14px Arial";
    ctx.fillStyle = color;
    
    // Add background for the text
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 16;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(x - textWidth / 2 - 4, y - textHeight - 2, textWidth + 8, textHeight + 4);
    
    // Draw the text
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
  };
  
  // Event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update mouse position for real-time distance display
    setMousePosition({ x, y });
  };
  
  // Handle double click to finalize measurements
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only relevant if we're in drawing mode and have points
    if (!isDrawing || tempPoints.length < 2) return;
    
    if (activeTool === 'line') {
      // Finalize the current measurement
      finalizeMeasurement();
      
      toast({
        title: "Measurement complete",
        description: "Double-click finalized the measurement.",
      });
    }
  };
  
  // Handler para el zoom con la rueda del mouse
  const handleWheelZoom = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Determinar dirección del zoom (positivo = zoom out, negativo = zoom in)
    const direction = e.deltaY > 0 ? 1 : -1;
    
    // Factor de ajuste para el zoom
    const zoomFactor = 0.15;
    
    // Calcular la nueva escala
    let newScale = scale;
    if (direction > 0) {
      // Zoom out - aumenta la escala (menos preciso)
      newScale = scale * (1 + zoomFactor);
    } else {
      // Zoom in - disminuye la escala (más preciso)
      newScale = scale * (1 - zoomFactor);
    }
    
    // Establecer límites para evitar escalas extremas
    newScale = Math.max(0.5, Math.min(30, newScale));
    
    // Actualizar la escala
    setScale(newScale);
    
    // Actualizar el canvas con la nueva escala
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawCanvas(ctx);
      }
    }
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (calibrationMode) {
      // Handle calibration mode clicks
      handleCalibrationClick(x, y);
      return;
    }
    
    // Check if selecting an existing measurement
    if (activeTool === 'select') {
      const selected = findMeasurementAtPoint(x, y);
      setSelectedMeasurement(selected?.id || null);
      return;
    }
    
    // If using drawing tools
    if (['line', 'area', 'perimeter'].includes(activeTool)) {
      setIsDrawing(true);
      
      // Add points based on active tool
      if (activeTool === 'line') {
        if (tempPoints.length === 0) {
          // First point
          setTempPoints([{ x, y }]);
        } else {
          // Add another point - we continue until double-click
          setTempPoints([...tempPoints, { x, y }]);
        }
      } else if (activeTool === 'area' || activeTool === 'perimeter') {
        // Check if we're closing the polygon (click near first point)
        if (tempPoints.length >= 3 && distance({ x, y }, tempPoints[0]) < 20) {
          finalizeMeasurement();
        } else if (tempPoints.length === 0) {
          // First point
          setTempPoints([{ x, y }]);
        } else {
          // Add another point
          setTempPoints([...tempPoints, { x, y }]);
        }
      }
    }
  };
  
  // Find a measurement that contains the given point
  const findMeasurementAtPoint = (x: number, y: number): Measurement | undefined => {
    // Check all measurements to find if the point is near any
    for (const m of measurements) {
      for (let i = 0; i < m.points.length; i++) {
        // For line type, check if the point is near any segment
        if (m.type === 'line') {
          const start = m.points[i];
          const end = m.points[(i + 1) % m.points.length];
          if (isPointNearLine(x, y, start, end, 10)) {
            return m;
          }
        }
        // For areas, check if the point is inside the polygon
        else if (m.type === 'area' || m.type === 'perimeter') {
          if (isPointInPolygon(x, y, m.points)) {
            return m;
          }
        }
      }
    }
    return undefined;
  };
  
  // Check if a point is near a line segment
  const isPointNearLine = (x: number, y: number, start: Point, end: Point, tolerance: number): boolean => {
    const d1 = distance({ x, y }, start);
    const d2 = distance({ x, y }, end);
    const lineLength = distance(start, end);
    
    // Use the triangle inequality to check if point is near line
    if (d1 + d2 >= lineLength - tolerance && d1 + d2 <= lineLength + tolerance) {
      // Calculate the distance from point to line
      const A = y - start.y;
      const B = start.x - x;
      const C = start.x * (start.y - y) - start.y * (start.x - x);
      const dist = Math.abs(A * (end.x - start.x) + B * (end.y - start.y) + C) / 
                  Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2));
      
      return dist <= tolerance;
    }
    return false;
  };
  
  // Check if a point is inside a polygon
  const isPointInPolygon = (x: number, y: number, points: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      
      const intersect = ((yi > y) !== (yj > y)) && 
                        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };
  
  // Calculate measurement values and add to measurements list
  const finalizeMeasurement = () => {
    if (tempPoints.length < 2) return;
    
    if (activeTool === 'line') {
      let totalLength = 0;
      for (let i = 0; i < tempPoints.length - 1; i++) {
        totalLength += distance(tempPoints[i], tempPoints[i+1]);
      }
      
      const realLength = totalLength / scale;
      let costEstimate;
      
      if (showCostEstimates && selectedServiceType) {
        // Calculate cost based on service type and measurement
        // Check if the selectedServiceType exists in serviceRates
        if (selectedServiceType && typeof serviceRates === 'object' && serviceRates.hasOwnProperty(selectedServiceType)) {
          const serviceInfo = serviceRates[selectedServiceType as keyof typeof serviceRates];
          costEstimate = calculateCost(
            { type: 'line', realLength, unit },
            selectedServiceType,
            selectedMaterialType,
            serviceRates,
            calculationOptions
          );
        }
      }
      
      const newMeasurement: Measurement = {
        id: uuidv4(),
        type: 'line',
        points: [...tempPoints],
        length: totalLength,
        realLength,
        unit,
        label: measurementLabel || `Line: ${formatNumber(realLength)} ${unit}`,
        serviceType: selectedServiceType,
        materialType: selectedMaterialType,
        costEstimate
      };
      
      setMeasurements([...measurements, newMeasurement]);
      
      // Reset temporary drawing state
      setTempPoints([]);
      setIsDrawing(false);
      setMeasurementLabel("");
      
      // Notify user
      toast({
        title: "Measurement added",
        description: `Line measurement of ${formatNumber(realLength)} ${unit} added.`,
      });
    } else if (activeTool === 'area') {
      const area = calculatePolygonArea(tempPoints);
      const realArea = area / (scale * scale);
      let costEstimate;
      
      if (showCostEstimates && selectedServiceType) {
        costEstimate = calculateCost(
          { type: 'area', realArea, unit },
          selectedServiceType,
          selectedMaterialType,
          serviceRates,
          calculationOptions
        );
      }
      
      const newMeasurement: Measurement = {
        id: uuidv4(),
        type: 'area',
        points: [...tempPoints],
        area,
        realArea,
        unit,
        label: measurementLabel || `Area: ${formatNumber(realArea)} ${unit}²`,
        serviceType: selectedServiceType,
        materialType: selectedMaterialType,
        costEstimate
      };
      
      setMeasurements([...measurements, newMeasurement]);
      
      // Reset temporary drawing state
      setTempPoints([]);
      setIsDrawing(false);
      setMeasurementLabel("");
      
      // Notify user
      toast({
        title: "Measurement added",
        description: `Area measurement of ${formatNumber(realArea)} ${unit}² added.`,
      });
    } else if (activeTool === 'perimeter') {
      const perimeter = calculatePolygonPerimeter(tempPoints);
      const realPerimeter = perimeter / scale;
      let costEstimate;
      
      if (showCostEstimates && selectedServiceType) {
        costEstimate = calculateCost(
          { type: 'perimeter', realPerimeter, unit },
          selectedServiceType,
          selectedMaterialType,
          serviceRates,
          calculationOptions
        );
      }
      
      const newMeasurement: Measurement = {
        id: uuidv4(),
        type: 'perimeter',
        points: [...tempPoints],
        perimeter,
        realPerimeter,
        unit,
        label: measurementLabel || `Perimeter: ${formatNumber(realPerimeter)} ${unit}`,
        serviceType: selectedServiceType,
        materialType: selectedMaterialType,
        costEstimate
      };
      
      setMeasurements([...measurements, newMeasurement]);
      
      // Reset temporary drawing state
      setTempPoints([]);
      setIsDrawing(false);
      setMeasurementLabel("");
      
      // Notify user
      toast({
        title: "Measurement added",
        description: `Perimeter measurement of ${formatNumber(realPerimeter)} ${unit} added.`,
      });
    }
    
    // If parent needs notifications about measurement changes
    if (onMeasurementsChange) {
      onMeasurementsChange(measurements);
    }
  };
  
  // Calculate cost based on measurement type and service
  const calculateCost = (
    measurement: { type: string; realLength?: number; realArea?: number; realPerimeter?: number; unit: string },
    serviceType: string,
    materialType: string,
    serviceRates: Record<string, { rate: number; unit: string; label: string }>,
    calcOptions?: CalculationOptions
  ) => {
    if (!serviceRates[serviceType]) return 0;
    
    const { rate } = serviceRates[serviceType];
    let materialMultiplier = 1;
    
    // Adjust material cost multiplier based on material type
    switch (materialType) {
      case "premium":
        materialMultiplier = 1.5;
        break;
      case "economy":
        materialMultiplier = 0.8;
        break;
      default:
        materialMultiplier = 1;
    }
    
    // Calculate base cost based on measurement type
    let baseCost = 0;
    if (measurement.type === 'line' && measurement.realLength) {
      baseCost = rate * measurement.realLength;
    } else if (measurement.type === 'area' && measurement.realArea) {
      baseCost = rate * measurement.realArea;
    } else if (measurement.type === 'perimeter' && measurement.realPerimeter) {
      baseCost = rate * measurement.realPerimeter;
    }
    
    // Apply material multiplier
    const materialCost = baseCost * materialMultiplier;
    
    // Apply labor cost based on calculation method
    let laborCost = 0;
    if (calcOptions?.laborCalculationMethod === 'by_measurement') {
      // Labor proportional to measurement
      laborCost = baseCost * (calcOptions.laborFactor || 0.3);
    } else if (calcOptions?.laborCalculationMethod === 'fixed') {
      // Fixed labor fee
      laborCost = calcOptions.laborFactor || 250;
    } else {
      // Default: 30% of material cost
      laborCost = baseCost * 0.3;
    }
    
    return materialCost + laborCost;
  };
  
  // Handle calibration mode clicks
  const handleCalibrationClick = (x: number, y: number) => {
    if (tempPoints.length === 0) {
      // First calibration point
      setTempPoints([{ x, y }]);
    } else if (tempPoints.length === 1) {
      // Second calibration point
      const distInPixels = distance(tempPoints[0], { x, y });
      if (distInPixels < 10) {
        // Points too close
        toast({
          title: "Calibration error",
          description: "Points too close together. Try again with more distance.",
          variant: "destructive",
        });
        return;
      }
      
      // Calculate scale (pixels per unit)
      const newScale = distInPixels / calibrationLength;
      setScale(newScale);
      
      toast({
        title: "Calibration complete",
        description: `Scale set to ${formatNumber(newScale)} pixels per ${unit}.`,
      });
      
      // Exit calibration mode
      setCalibrationMode(false);
      setTempPoints([]);
    }
  };
  
  // Handle actions
  const handleStartCalibration = () => {
    setCalibrationMode(true);
    setTempPoints([]);
    setActiveTool('select');
    
    toast({
      title: "Calibration mode",
      description: `Click two points on the image that represent ${calibrationLength} ${unit}.`,
    });
  };
  
  const handleCancelCalibration = () => {
    setCalibrationMode(false);
    setTempPoints([]);
    setActiveTool('line');
    
    toast({
      title: "Calibration cancelled",
      description: "Returned to measurement mode.",
    });
  };
  
  const handleDeleteMeasurement = () => {
    if (selectedMeasurement) {
      setMeasurements(measurements.filter(m => m.id !== selectedMeasurement));
      setSelectedMeasurement(null);
      
      toast({
        title: "Measurement deleted",
        description: "The selected measurement has been removed.",
      });
    }
  };
  
  const handleClearAll = () => {
    setMeasurements([]);
    setSelectedMeasurement(null);
    
    toast({
      title: "All measurements cleared",
      description: "All measurements have been removed from the canvas.",
    });
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            setBackgroundImage(img);
          };
          img.src = event.target.result as string;
        }
      };
      
      reader.readAsDataURL(file);
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded as the measurement background.",
      });
    }
  };
  
  const handleResetImage = () => {
    setBackgroundImage(null);
    setCalibrationMode(false);
    setActiveTool('line');
    setActiveTab('draw');
    
    toast({
      title: "Image reset",
      description: "Background image has been removed.",
    });
  };
  
  const calculateTotalCost = () => {
    return measurements.reduce((total, measurement) => {
      return total + (measurement.costEstimate || 0);
    }, 0);
  };
  
  // Complete current measurement
  const handleCompleteMeasurement = () => {
    if (tempPoints.length >= 2) {
      finalizeMeasurement();
    } else {
      toast({
        title: "Not enough points",
        description: "Add at least two points to complete a measurement.",
        variant: "destructive",
      });
    }
  };
  
  // Cancel current measurement
  const handleCancelMeasurement = () => {
    setTempPoints([]);
    setIsDrawing(false);
    
    toast({
      title: "Measurement cancelled",
      description: "Current measurement has been discarded.",
    });
  };
  
  // Export measurements to JSON
  const handleExportMeasurements = () => {
    try {
      const dataStr = JSON.stringify(measurements, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'measurements.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Measurements exported",
        description: "Your measurements have been exported to a JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your measurements.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto overflow-auto">
      <CardHeader>
        <CardTitle>Advanced Digital Measurement</CardTitle>
        <CardDescription>
          Upload an image and take precise measurements for accurate cost estimates.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[80vh]">
        <Tabs defaultValue="draw" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Measure</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="draw" className="space-y-4">
            <div className="flex space-x-2">
              <Button 
                variant={activeTool === 'line' ? "default" : "outline"} 
                onClick={() => setActiveTool('line')}
              >
                Line
              </Button>
              <Button 
                variant={activeTool === 'area' ? "default" : "outline"} 
                onClick={() => setActiveTool('area')}
              >
                Area
              </Button>
              <Button 
                variant={activeTool === 'perimeter' ? "default" : "outline"} 
                onClick={() => setActiveTool('perimeter')}
              >
                Perimeter
              </Button>
              <Button 
                variant={activeTool === 'select' ? "default" : "outline"} 
                onClick={() => setActiveTool('select')}
              >
                Select
              </Button>
            </div>
            
            {isDrawing && (
              <div className="flex space-x-2 mt-2">
                <Button onClick={handleCompleteMeasurement}>
                  Complete Measurement
                </Button>
                <Button variant="outline" onClick={handleCancelMeasurement}>
                  Cancel
                </Button>
              </div>
            )}
            
            {selectedMeasurement && (
              <div className="flex space-x-2 mt-2">
                <Button variant="destructive" onClick={handleDeleteMeasurement}>
                  Delete Selected
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-type">Service Type</Label>
                <Select
                  value={selectedServiceType}
                  onValueChange={setSelectedServiceType}
                >
                  <SelectTrigger id="service-type">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceRates).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="material-type">Material Type</Label>
                <Select
                  value={selectedMaterialType}
                  onValueChange={setSelectedMaterialType}
                >
                  <SelectTrigger id="material-type">
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="measurement-label">Measurement Label</Label>
              <Input 
                id="measurement-label" 
                value={measurementLabel} 
                onChange={e => setMeasurementLabel(e.target.value)} 
                placeholder="Optional custom label"
              />
            </div>
            
            <div className="mt-4">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onDoubleClick={handleDoubleClick}
                onWheel={handleWheelZoom}
                className="border border-gray-300 bg-white"
              />
              
              <div className="mt-2 text-xs text-muted-foreground">
                <span>{calibrationMode ? 'Calibration Mode' : `Scale: ${formatNumber(scale)} pixels per ${unit}`}</span>
                {!calibrationMode && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="ml-2"
                    onClick={handleStartCalibration}
                  >
                    Calibrate
                  </Button>
                )}
                {calibrationMode && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="ml-2"
                    onClick={handleCancelCalibration}
                  >
                    Cancel Calibration
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="image" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="image-upload">Upload Background Image</Label>
                <Input 
                  id="image-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>
              
              {backgroundImage && (
                <Button variant="outline" onClick={handleResetImage}>
                  Remove Background Image
                </Button>
              )}
              
              {calibrationMode && (
                <div className="space-y-2">
                  <Label htmlFor="calibration-length">Calibration Length ({unit})</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="calibration-length" 
                      type="number" 
                      min="0.1" 
                      step="0.1" 
                      value={calibrationLength} 
                      onChange={e => setCalibrationLength(parseFloat(e.target.value))} 
                    />
                    <Button variant="secondary" onClick={handleCancelCalibration}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Measurements Summary</h3>
              
              {measurements.length === 0 ? (
                <p className="text-muted-foreground">No measurements added yet.</p>
              ) : (
                <div className="border rounded-md divide-y">
                  {measurements.map((m) => (
                    <div key={m.id} className="p-3 hover:bg-muted">
                      <div className="font-medium">{m.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {m.type === 'line' && m.realLength && (
                          <span>Length: {formatNumber(m.realLength)} {m.unit}</span>
                        )}
                        {m.type === 'area' && m.realArea && (
                          <span>Area: {formatNumber(m.realArea)} {m.unit}²</span>
                        )}
                        {m.type === 'perimeter' && m.realPerimeter && (
                          <span>Perimeter: {formatNumber(m.realPerimeter)} {m.unit}</span>
                        )}
                        {m.costEstimate !== undefined && (
                          <span className="ml-2">Est. Cost: ${formatNumber(m.costEstimate)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {measurements.length > 0 && showCostEstimates && (
                <div className="p-4 border rounded-md bg-muted">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Estimated Cost:</span>
                    <span className="text-xl font-bold">${formatNumber(calculateTotalCost())}</span>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleClearAll} disabled={measurements.length === 0}>
                  Clear All
                </Button>
                <Button onClick={handleExportMeasurements} disabled={measurements.length === 0}>
                  Export Measurements
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          <p>
            Double-click to finalize a line measurement. Real-time distances shown while measuring.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}