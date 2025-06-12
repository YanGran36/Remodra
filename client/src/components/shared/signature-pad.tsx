import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onChange: (signatureData: string | null) => void;
  width?: number;
  height?: number;
  defaultValue?: string;
  label?: string;
}

export default function SignaturePad({
  onChange,
  width = 300,
  height = 150,
  defaultValue,
  label = "Client Signature"
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!defaultValue);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas size with proper scaling
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Initial styles
    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#000000";
    
    // Draw existing signature if provided
    if (defaultValue) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, width, height);
      };
      img.src = defaultValue;
    } else {
      // Clear canvas
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }
  }, [width, height, defaultValue]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    setIsDrawing(true);
    setHasSignature(true);

    // Get position
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Get position
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
      
      // Prevent scrolling while drawing
      e.preventDefault();
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    context.lineTo(x, y);
    context.stroke();
  };

  const endDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    if (isDrawing) {
      context.closePath();
      setIsDrawing(false);
      
      // Provide signature data as base64 image
      const signatureData = canvas.toDataURL("image/png");
      onChange(signatureData);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    
    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className="signature-pad-container">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <div 
        className="signature-pad border border-dashed rounded-md flex flex-col items-center justify-center"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          style={{ width: `${width}px`, height: `${height}px` }}
        />
        
        {!hasSignature && (
          <p className="absolute text-gray-400 pointer-events-none text-sm">Click or touch to sign</p>
        )}
      </div>
      
      <div className="mt-2 flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
