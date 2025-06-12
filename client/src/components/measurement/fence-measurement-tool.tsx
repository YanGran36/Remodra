import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Ruler, 
  Square, 
  RotateCcw, 
  Trash2,
  MapPin,
  Home,
  Calculator,
  Save,
  Camera,
  Edit,
  Download
} from "lucide-react";

interface FencePoint {
  x: number;
  y: number;
  id: string;
}

interface Gate {
  x: number;
  y: number;
  width: number;
  id: string;
  type: 'gate' | 'double-gate';
  rotation: number; // degrees
}

interface Post {
  x: number;
  y: number;
  id: string;
  type: 'corner' | 'line' | 'gate';
}

interface FenceSection {
  start: FencePoint;
  end: FencePoint;
  length: number;
  posts: Post[];
  gates: Gate[];
}

interface FenceMeasurement {
  id: string;
  label: string;
  sections: FenceSection[];
  totalLength: number;
  totalPosts: number;
  totalGates: number;
  materialsList: {
    posts: number;
    panels: number;
    gates: number;
    hardware: string[];
  };
}

interface FenceMeasurementToolProps {
  onMeasurementsChange: (measurements: FenceMeasurement[]) => void;
  serviceUnit: string;
}

export default function FenceMeasurementTool({ 
  onMeasurementsChange, 
  serviceUnit 
}: FenceMeasurementToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<FencePoint[]>([]);
  const [measurements, setMeasurements] = useState<FenceMeasurement[]>([]);
  const [scale, setScale] = useState(10); // pixels per foot
  const [fenceHeight, setFenceHeight] = useState(6);
  const [postSpacing, setPostSpacing] = useState(8);
  const [gateMode, setGateMode] = useState(false);
  const [selectedGateWidth, setSelectedGateWidth] = useState(4);
  const [selectedGateType, setSelectedGateType] = useState<'gate' | 'double-gate'>('gate');
  const [selectedGateRotation, setSelectedGateRotation] = useState(0);
  const [gates, setGates] = useState<Gate[]>([]);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [editingMeasurement, setEditingMeasurement] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<string | null>(null);
  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState<{x: number, y: number} | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Click outside handler and ESC key to exit measurement mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX;
      const clickY = event.clientY;

      // Check if click is outside the canvas area
      const isOutsideCanvas = (
        clickX < rect.left ||
        clickX > rect.right ||
        clickY < rect.top ||
        clickY > rect.bottom
      );

      if (isOutsideCanvas) {
        exitMeasurementMode();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        exitMeasurementMode();
      }
    };

    const exitMeasurementMode = () => {
      // Exit current measurement mode if active
      if (isDrawing && currentPoints.length >= 2) {
        finishFence();
      } else if (isDrawing && currentPoints.length < 2) {
        // Cancel incomplete measurement
        setIsDrawing(false);
        setCurrentPoints([]);
      }
      
      // Exit gate mode
      if (gateMode) {
        setGateMode(false);
      }
      
      // Clear selections
      setSelectedGate(null);
      setDraggingPoint(null);
      setDraggingGate(null);
      setEditingMeasurement(null);
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawing, currentPoints, gateMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Apply zoom and pan transformation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-canvas.width / 2 + panOffset.x, -canvas.height / 2 + panOffset.y);

    // Draw property grid (5ft squares)
    drawPropertyGrid(ctx, canvas.width, canvas.height);
    
    // Draw current fence line being drawn
    if (currentPoints.length > 0) {
      drawFenceLine(ctx, currentPoints, true);
    }

    // Draw completed measurements
    measurements.forEach(measurement => {
      measurement.sections.forEach(section => {
        drawFenceSection(ctx, section, false);
      });
    });

    // Draw gates
    gates.forEach(gate => {
      drawGate(ctx, gate);
    });

    // Draw mouse position if measuring
    if (mousePos && isDrawing && currentPoints.length > 0) {
      const lastPoint = currentPoints[currentPoints.length - 1];
      drawTempLine(ctx, lastPoint, mousePos);
    }

    // Restore canvas transformation
    ctx.restore();
  }, [currentPoints, measurements, gates, mousePos, isDrawing, zoomLevel, panOffset]);

  const drawPropertyGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    
    const gridSize = 5 * scale; // 5ft grid
    
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Property grid is ready for fence planning
  };

  const drawFenceLine = (ctx: CanvasRenderingContext2D, points: FencePoint[], isActive: boolean) => {
    if (points.length < 2) return;

    // Draw fence line
    ctx.strokeStyle = isActive ? "#3b82f6" : "#1f2937";
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Draw points and measurements
    points.forEach((point, index) => {
      // Draw point with drag handle
      ctx.fillStyle = isActive ? "#dc2626" : "#6b7280";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add white center for better visibility
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Draw measurement between points
      if (index > 0) {
        const prevPoint = points[index - 1];
        const distance = Math.sqrt(
          Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
        ) / scale;
        
        const midX = (point.x + prevPoint.x) / 2;
        const midY = (point.y + prevPoint.y) / 2;
        
        // Background for text
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        const text = `${distance.toFixed(1)}'`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(midX - textWidth/2 - 4, midY - 12, textWidth + 8, 20);
        
        // Distance text
        ctx.fillStyle = "#1f2937";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(text, midX, midY + 4);
      }
    });

    // Calculate and draw posts
    if (points.length >= 2) {
      const posts = calculatePosts(points);
      posts.forEach(post => {
        drawPost(ctx, post);
      });
    }
  };

  const drawFenceSection = (ctx: CanvasRenderingContext2D, section: FenceSection, isActive: boolean) => {
    const points = [section.start, section.end];
    drawFenceLine(ctx, points, isActive);
  };

  const drawPost = (ctx: CanvasRenderingContext2D, post: Post) => {
    ctx.fillStyle = post.type === 'corner' ? "#dc2626" : "#59a2f4";
    ctx.beginPath();
    ctx.arc(post.x, post.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Post marker
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawGate = (ctx: CanvasRenderingContext2D, gate: Gate) => {
    ctx.save();
    
    // Apply rotation around gate center
    ctx.translate(gate.x, gate.y);
    ctx.rotate((gate.rotation * Math.PI) / 180);
    
    // Gate opening
    ctx.strokeStyle = gate.type === 'double-gate' ? "#dc2626" : "#f59e0b";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    
    const gateWidth = gate.width * scale;
    ctx.beginPath();
    ctx.moveTo(-gateWidth/2, 0);
    ctx.lineTo(gateWidth/2, 0);
    ctx.stroke();
    
    ctx.setLineDash([]); // Reset dash
    
    // Gate symbol - different for single vs double
    if (gate.type === 'double-gate') {
      // Double gate symbol (two arcs)
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-gateWidth/4, 0, gateWidth/4, 0, Math.PI);
      ctx.arc(gateWidth/4, 0, gateWidth/4, 0, Math.PI);
      ctx.stroke();
    } else {
      // Single gate symbol (one arc)
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-gateWidth/2, 0, gateWidth/2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Selection highlight if selected
    if (selectedGate === gate.id) {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(-gateWidth/2 - 5, -10, gateWidth + 10, 20);
      ctx.setLineDash([]);
    }
    
    ctx.restore();
    
    // Gate label (not rotated)
    ctx.fillStyle = gate.type === 'double-gate' ? "#dc2626" : "#f59e0b";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    const gateLabel = gate.type === 'double-gate' ? `${gate.width}' Double Gate` : `${gate.width}' Gate`;
    ctx.fillText(gateLabel, gate.x, gate.y - 20);
  };

  const drawTempLine = (ctx: CanvasRenderingContext2D, from: FencePoint, to: {x: number, y: number}) => {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Show temp distance
    const distance = Math.sqrt(
      Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
    ) / scale;
    
    const midX = (to.x + from.x) / 2;
    const midY = (to.y + from.y) / 2;
    
    ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${distance.toFixed(1)}'`, midX, midY);
  };

  const calculatePosts = (points: FencePoint[]): Post[] => {
    const posts: Post[] = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const distance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      ) / scale;
      
      const numPosts = Math.ceil(distance / postSpacing) + 1;
      
      for (let j = 0; j < numPosts; j++) {
        const ratio = j / (numPosts - 1);
        const postX = start.x + (end.x - start.x) * ratio;
        const postY = start.y + (end.y - start.y) * ratio;
        
        const postType = (j === 0 || j === numPosts - 1) ? 'corner' : 'line';
        
        posts.push({
          x: postX,
          y: postY,
          id: `post-${i}-${j}`,
          type: postType
        });
      }
    }
    
    return posts;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Adjust for zoom and pan
    x = (x - canvas.width / 2) / zoomLevel + canvas.width / 2 - panOffset.x;
    y = (y - canvas.height / 2) / zoomLevel + canvas.height / 2 - panOffset.y;

    // Check if clicking on an existing fence point to start dragging
    const clickedPoint = currentPoints.find(point => {
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
      return distance <= 10; // 10px tolerance
    });

    if (clickedPoint && !isDrawing) {
      setDraggingPoint(clickedPoint.id);
      setLastMousePos({ x, y });
      return;
    }

    // Check if clicking on completed measurement lines to start dragging
    for (const measurement of measurements) {
      for (const section of measurement.sections) {
        const startPoint = section.start;
        const endPoint = section.end;
        
        // Check if clicking on start or end point
        const startDistance = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
        const endDistance = Math.sqrt(Math.pow(x - endPoint.x, 2) + Math.pow(y - endPoint.y, 2));
        
        if (startDistance <= 10) {
          setDraggingPoint(startPoint.id);
          setLastMousePos({ x, y });
          setEditingMeasurement(measurement.id);
          
          // Convert measurement back to editable points
          const allPoints: FencePoint[] = [];
          measurement.sections.forEach(sec => {
            if (allPoints.length === 0) {
              allPoints.push(sec.start);
            }
            allPoints.push(sec.end);
          });
          setCurrentPoints(allPoints);
          return;
        }
        
        if (endDistance <= 10) {
          setDraggingPoint(endPoint.id);
          setLastMousePos({ x, y });
          setEditingMeasurement(measurement.id);
          
          // Convert measurement back to editable points
          const allPoints: FencePoint[] = [];
          measurement.sections.forEach(sec => {
            if (allPoints.length === 0) {
              allPoints.push(sec.start);
            }
            allPoints.push(sec.end);
          });
          setCurrentPoints(allPoints);
          return;
        }
      }
    }

    // Check if clicking on an existing gate to select it
    const clickedGate = gates.find(gate => {
      const gateWidth = gate.width * scale;
      const distance = Math.sqrt(Math.pow(x - gate.x, 2) + Math.pow(y - gate.y, 2));
      return distance <= gateWidth / 2 + 10; // 10px tolerance
    });

    if (clickedGate) {
      setSelectedGate(selectedGate === clickedGate.id ? null : clickedGate.id);
      return;
    }

    // Handle double-click to finish fence
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    setLastClickTime(currentTime);

    if (timeDiff < 400 && isDrawing && currentPoints.length >= 2) {
      // Double-click detected - finish fence
      finishFence();
      return;
    }

    if (gateMode) {
      // Add gate with selected size and type
      const newGate: Gate = {
        x,
        y,
        width: selectedGateWidth,
        id: `gate-${Date.now()}`,
        type: selectedGateType,
        rotation: selectedGateRotation
      };
      setGates(prev => [...prev, newGate]);
      setGateMode(false);
      return;
    }

    const newPoint: FencePoint = {
      x,
      y,
      id: `point-${Date.now()}`
    };

    if (!isDrawing) {
      setIsDrawing(true);
      setCurrentPoints([newPoint]);
    } else {
      setCurrentPoints(prev => [...prev, newPoint]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Adjust for zoom and pan
    x = (x - canvas.width / 2) / zoomLevel + canvas.width / 2 - panOffset.x;
    y = (y - canvas.height / 2) / zoomLevel + canvas.height / 2 - panOffset.y;

    // Handle point dragging
    if (draggingPoint && lastMousePos) {
      const deltaX = x - lastMousePos.x;
      const deltaY = y - lastMousePos.y;
      
      setCurrentPoints(prev => prev.map(point => 
        point.id === draggingPoint 
          ? { ...point, x: point.x + deltaX, y: point.y + deltaY }
          : point
      ));
      
      // If editing a completed measurement, also update the measurement
      if (editingMeasurement) {
        setMeasurements(prev => prev.map(measurement => {
          if (measurement.id === editingMeasurement) {
            // Recalculate measurement with updated points
            const updatedPoints = currentPoints.map(point => 
              point.id === draggingPoint 
                ? { ...point, x: point.x + deltaX, y: point.y + deltaY }
                : point
            );
            
            const totalLength = updatedPoints.reduce((sum, point, index) => {
              if (index === 0) return 0;
              const prevPoint = updatedPoints[index - 1];
              const distance = Math.sqrt(
                Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
              ) / scale;
              return sum + distance;
            }, 0);

            const posts = calculatePosts(updatedPoints);
            const sections: FenceSection[] = [];

            for (let i = 0; i < updatedPoints.length - 1; i++) {
              const sectionLength = Math.sqrt(
                Math.pow(updatedPoints[i + 1].x - updatedPoints[i].x, 2) + 
                Math.pow(updatedPoints[i + 1].y - updatedPoints[i].y, 2)
              ) / scale;

              sections.push({
                start: updatedPoints[i],
                end: updatedPoints[i + 1],
                length: sectionLength,
                posts: posts.filter(p => 
                  Math.abs(p.x - updatedPoints[i].x) < 10 || 
                  Math.abs(p.x - updatedPoints[i + 1].x) < 10
                ),
                gates: gates.filter(g => 
                  g.x >= Math.min(updatedPoints[i].x, updatedPoints[i + 1].x) &&
                  g.x <= Math.max(updatedPoints[i].x, updatedPoints[i + 1].x)
                )
              });
            }

            const panels = Math.ceil(totalLength / 8);
            const totalPosts = posts.length;
            const totalGates = gates.length;

            return {
              ...measurement,
              label: `Fence - ${totalLength.toFixed(1)} ft`,
              sections,
              totalLength,
              totalPosts,
              totalGates,
              materialsList: {
                posts: totalPosts,
                panels,
                gates: totalGates,
                hardware: [
                  `${totalPosts} post anchors`,
                  `${panels} panel brackets`,
                  `${totalGates} gate hinges`,
                  `${totalGates} gate latches`
                ]
              }
            };
          }
          return measurement;
        }));
      }
      
      setLastMousePos({ x, y });
      return;
    }

    // Handle gate dragging
    if (draggingGate && lastMousePos) {
      const deltaX = x - lastMousePos.x;
      const deltaY = y - lastMousePos.y;
      
      setGates(prev => prev.map(gate => 
        gate.id === draggingGate 
          ? { ...gate, x: gate.x + deltaX, y: gate.y + deltaY }
          : gate
      ));
      
      setLastMousePos({ x, y });
      return;
    }

    setMousePos({ x, y });
  };

  const handleCanvasMouseUp = () => {
    // If we were editing a measurement and finished dragging, update the parent
    if (editingMeasurement && draggingPoint) {
      onMeasurementsChange(measurements);
    }
    
    setDraggingPoint(null);
    setDraggingGate(null);
    setLastMousePos(null);
  };

  const handleCanvasDoubleClick = () => {
    // Double-click to finish fence or exit editing mode
    if (isDrawing || editingMeasurement) {
      finishFence();
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Adjust for zoom and pan
    x = (x - canvas.width / 2) / zoomLevel + canvas.width / 2 - panOffset.x;
    y = (y - canvas.height / 2) / zoomLevel + canvas.height / 2 - panOffset.y;

    // Check if clicking on a gate to start dragging
    const clickedGate = gates.find(gate => {
      const distance = Math.sqrt(Math.pow(x - gate.x, 2) + Math.pow(y - gate.y, 2));
      return distance <= 15; // 15px tolerance for gates
    });

    if (clickedGate) {
      setDraggingGate(clickedGate.id);
      setLastMousePos({ x, y });
      return;
    }
  };

  const finishFence = () => {
    // Allow completion with any number of points, including 1
    if (currentPoints.length === 0) return;

    const totalLength = currentPoints.length < 2 ? 0 : currentPoints.reduce((sum, point, index) => {
      if (index === 0) return 0;
      const prevPoint = currentPoints[index - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
      ) / scale;
      return sum + distance;
    }, 0);

    const posts = calculatePosts(currentPoints);
    const sections: FenceSection[] = [];

    for (let i = 0; i < currentPoints.length - 1; i++) {
      const sectionLength = Math.sqrt(
        Math.pow(currentPoints[i + 1].x - currentPoints[i].x, 2) + 
        Math.pow(currentPoints[i + 1].y - currentPoints[i].y, 2)
      ) / scale;

      sections.push({
        start: currentPoints[i],
        end: currentPoints[i + 1],
        length: sectionLength,
        posts: posts.filter(p => 
          Math.abs(p.x - currentPoints[i].x) < 10 || 
          Math.abs(p.x - currentPoints[i + 1].x) < 10
        ),
        gates: gates.filter(g => 
          g.x >= Math.min(currentPoints[i].x, currentPoints[i + 1].x) &&
          g.x <= Math.max(currentPoints[i].x, currentPoints[i + 1].x)
        )
      });
    }

    const panels = Math.ceil(totalLength / 8); // 8ft panels
    const totalPosts = posts.length;
    
    // Only include gates that are actually ON THIS fence line
    const gatesOnThisFence = gates.filter(gate => {
      return sections.some(section => {
        const sectionGates = section.gates || [];
        return sectionGates.some(sg => sg.id === gate.id);
      });
    });
    
    const singleGates = gatesOnThisFence.filter(g => g.type === 'gate').length;
    const doubleGates = gatesOnThisFence.filter(g => g.type === 'double-gate').length;

    const hardwareList = [
      `${totalPosts} post anchors`,
      `${panels} panel brackets`,
      `${Math.ceil(totalLength / 10)} lbs screws/nails`
    ];

    const measurementId = editingMeasurement || `fence-${Date.now()}`;
    const newMeasurement: FenceMeasurement = {
      id: measurementId,
      label: `Fence - ${totalLength.toFixed(1)} ft`,
      sections,
      totalLength,
      totalPosts,
      totalGates: singleGates + doubleGates,
      materialsList: {
        posts: totalPosts,
        panels,
        gates: singleGates + doubleGates,
        hardware: hardwareList
      }
    };

    const updatedMeasurements = editingMeasurement 
      ? measurements.map(m => m.id === editingMeasurement ? newMeasurement : m)
      : [...measurements, newMeasurement];
    
    setMeasurements(updatedMeasurements);
    onMeasurementsChange(updatedMeasurements);

    // Reset
    setCurrentPoints([]);
    setIsDrawing(false);
    setEditingMeasurement(null);
    // Don't clear gates - they should persist
  };

  const clearAll = () => {
    setMeasurements([]);
    setCurrentPoints([]);
    setGates([]);
    setIsDrawing(false);
    setEditingMeasurement(null);
    setSelectedGate(null);
    onMeasurementsChange([]);
  };

  const editMeasurement = (measurementId: string) => {
    const measurement = measurements.find(m => m.id === measurementId);
    if (!measurement) return;

    // Convert measurement back to editable points
    const allPoints: FencePoint[] = [];
    measurement.sections.forEach(section => {
      allPoints.push(section.start);
      if (allPoints.length === 1 || allPoints[allPoints.length - 1].id !== section.end.id) {
        allPoints.push(section.end);
      }
    });

    setCurrentPoints(allPoints);
    setIsDrawing(true);
    setEditingMeasurement(measurementId);

    // Remove the measurement from completed list temporarily
    setMeasurements(prev => prev.filter(m => m.id !== measurementId));
  };



  const deleteMeasurement = (measurementId: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== measurementId));
    const updatedMeasurements = measurements.filter(m => m.id !== measurementId);
    onMeasurementsChange(updatedMeasurements);
  };

  const captureScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a download link
    const link = document.createElement('a');
    link.download = `fence-plan-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const rotateSelectedGate = (direction: 'left' | 'right') => {
    if (!selectedGate) return;
    
    setGates(prev => prev.map(gate => {
      if (gate.id === selectedGate) {
        const newRotation = direction === 'right' 
          ? (gate.rotation + 5) % 360
          : (gate.rotation - 5 + 360) % 360;
        return { ...gate, rotation: newRotation };
      }
      return gate;
    }));
  };

  const updateSelectedGateSize = (newWidth: number) => {
    if (!selectedGate) return;
    
    setGates(prev => prev.map(gate => {
      if (gate.id === selectedGate) {
        return { ...gate, width: newWidth };
      }
      return gate;
    }));
  };

  const updateSelectedGateType = (newType: 'gate' | 'double-gate') => {
    if (!selectedGate) return;
    
    setGates(prev => prev.map(gate => {
      if (gate.id === selectedGate) {
        return { ...gate, type: newType };
      }
      return gate;
    }));
  };

  const deleteSelectedGate = () => {
    if (!selectedGate) return;
    setGates(prev => prev.filter(gate => gate.id !== selectedGate));
    setSelectedGate(null);
  };

  return (
    <div className="space-y-3">
      {/* Compact Control Panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-4">
          {/* Top Row - Basic Settings */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            <div>
              <Label className="text-xs font-medium">Height</Label>
              <Input 
                type="number" 
                value={fenceHeight}
                onChange={(e) => setFenceHeight(parseInt(e.target.value))}
                className="h-7 text-xs"
                placeholder="6"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Spacing</Label>
              <Input 
                type="number" 
                value={postSpacing}
                onChange={(e) => setPostSpacing(parseInt(e.target.value))}
                className="h-7 text-xs"
                placeholder="8"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Scale</Label>
              <Input 
                type="number" 
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="h-7 text-xs"
                placeholder="10"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Gate Width</Label>
              <select 
                value={selectedGateWidth}
                onChange={(e) => setSelectedGateWidth(parseInt(e.target.value))}
                className="h-7 text-xs border rounded px-1 w-full"
              >
                {[3, 4, 5, 6, 8, 10, 12].map(width => (
                  <option key={width} value={width}>{width}'</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-medium">Gate Type</Label>
              <select 
                value={selectedGateType}
                onChange={(e) => setSelectedGateType(e.target.value as 'gate' | 'double-gate')}
                className="h-7 text-xs border rounded px-1 w-full"
              >
                <option value="gate">Single</option>
                <option value="double-gate">Double</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-medium">Rotation</Label>
              <select 
                value={selectedGateRotation}
                onChange={(e) => setSelectedGateRotation(parseInt(e.target.value))}
                className="h-7 text-xs border rounded px-1 w-full"
              >
                {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                  <option key={angle} value={angle}>{angle}°</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              onClick={() => setGateMode(!gateMode)}
              variant={gateMode ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {gateMode ? "Exit Gate" : "Add Gate"}
            </Button>
            
            <Button 
              type="button"
              onClick={finishFence} 
              variant="default"
              size="sm" 
              className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-3 w-3 mr-1" />
              Complete ({currentPoints.length})
            </Button>
            
            <Button type="button" onClick={clearAll} variant="outline" size="sm" className="h-8 text-xs">
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
            
            <Button type="button" onClick={captureScreenshot} variant="outline" size="sm" className="h-8 text-xs">
              <Camera className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>

          {/* Compact Gate Editor */}
          {selectedGate && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-blue-800">Edit Gate:</span>
                <div className="flex gap-1">
                  <select 
                    value={gates.find(g => g.id === selectedGate)?.width || 4}
                    onChange={(e) => updateSelectedGateSize(parseInt(e.target.value))}
                    className="h-6 text-xs border rounded px-1"
                  >
                    {[3, 4, 5, 6, 8, 10, 12].map(width => (
                      <option key={width} value={width}>{width}'</option>
                    ))}
                  </select>
                  <select 
                    value={gates.find(g => g.id === selectedGate)?.type || 'gate'}
                    onChange={(e) => updateSelectedGateType(e.target.value as 'gate' | 'double-gate')}
                    className="h-6 text-xs border rounded px-1"
                  >
                    <option value="gate">Single</option>
                    <option value="double-gate">Double</option>
                  </select>
                  <Button onClick={() => rotateSelectedGate('left')} variant="outline" size="sm" className="h-6 w-6 p-0 text-xs">↺</Button>
                  <Button onClick={() => rotateSelectedGate('right')} variant="outline" size="sm" className="h-6 w-6 p-0 text-xs">↻</Button>
                  <Button onClick={deleteSelectedGate} variant="outline" size="sm" className="h-6 w-6 p-0 text-xs text-red-600">✕</Button>
                  <Button onClick={() => setSelectedGate(null)} variant="ghost" size="sm" className="h-6 w-6 p-0 text-xs">✓</Button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-green-700 bg-green-50 p-2 rounded space-y-1">
            <div>
              <strong>Drawing:</strong> Click to start drawing fence line. Each click adds a fence section.
            </div>
            <div>
              <strong>Exit:</strong> Double-click to finish fence, or click outside the canvas area, or press ESC key to exit measurement mode.
            </div>
            <div>
              <strong>Editing:</strong> Drag red points to adjust lines. Click gates to select and edit them.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drawing Canvas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Property Plan</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            className="border border-gray-300 cursor-crosshair w-full"
            style={{ maxWidth: "800px", height: "600px" }}
          />
          
          {/* Zoom Control */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 border">
            <div className="flex flex-col items-center gap-2">
              <Label className="text-xs font-medium text-gray-700">Zoom</Label>
              <div className="flex flex-col items-center gap-1">
                <Button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 text-xs"
                  disabled={zoomLevel >= 3}
                >
                  +
                </Button>
                <div className="text-xs text-center min-w-12 py-1">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <Button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 text-xs"
                  disabled={zoomLevel <= 0.5}
                >
                  -
                </Button>
              </div>
              <Button
                onClick={() => setZoomLevel(1)}
                variant="outline"
                size="sm"
                className="h-5 px-2 text-xs"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Summary */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4" />
              Materials List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {measurements.map(measurement => (
              <div key={measurement.id} className="space-y-2 border-b pb-4 mb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{measurement.label}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{measurement.totalLength.toFixed(1)} ft</Badge>
                    <Button
                      onClick={() => editMeasurement(measurement.id)}
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                      title="Edit this fence line"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => deleteMeasurement(measurement.id)}
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs text-red-600 hover:bg-red-50"
                      title="Delete this fence line"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Posts needed:</strong> {measurement.materialsList.posts}
                  </div>
                  <div>
                    <strong>Panels needed:</strong> {measurement.materialsList.panels}
                  </div>
                  <div>
                    <strong>Total Gates:</strong> {measurement.materialsList.gates}
                  </div>
                  <div>
                    <strong>Height:</strong> {fenceHeight} ft
                  </div>
                </div>
                
                {/* Detailed Gate Information - Show ALL gates on canvas */}
                {gates.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded mt-2">
                    <h5 className="font-medium text-blue-900 mb-2">Gate Details:</h5>
                    <div className="text-sm space-y-1">
                      {gates.filter(g => g.type === 'gate').length > 0 && (
                        <div>• Single Gates: {gates.filter(g => g.type === 'gate').length}</div>
                      )}
                      {gates.filter(g => g.type === 'double-gate').length > 0 && (
                        <div>• Double Gates: {gates.filter(g => g.type === 'double-gate').length}</div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <strong>Hardware:</strong>
                  <ul className="text-xs ml-4 mt-1">
                    {measurement.materialsList.hardware.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}