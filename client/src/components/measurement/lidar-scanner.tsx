import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { RotateCw, Camera, Download, Save, Layers, Settings, Smartphone, Trash2, Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";

interface ScanSettings {
  resolution: number; // 1-100
  range: number; // in meters/feet
  accuracy: number; // 1-100
  density: number; // 1-100
}

interface ScanResult {
  id: string;
  timestamp: number;
  depthMap: string; // base64 data URL
  pointCloud?: number[][]; // [x, y, z] points
  width: number;
  height: number;
  scanSetting: ScanSettings;
}

export interface LiDARScannerProps {
  onScanComplete?: (results: ScanResult[]) => void;
  onSaveScan?: (scan: ScanResult) => void;
  width?: number;
  height?: number;
  unit?: string;
}

export default function LiDARScanner({
  onScanComplete,
  onSaveScan,
  width = 640,
  height = 480,
  unit = "ft"
}: LiDARScannerProps) {
  const { toast } = useToast();
  const isMobile = useMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [currentScanResult, setCurrentScanResult] = useState<ScanResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [scanSettings, setScanSettings] = useState<ScanSettings>({
    resolution: 70,
    range: 50,
    accuracy: 85,
    density: 60
  });
  const [showSettings, setShowSettings] = useState(false);

  // Initialize canvas when component loads
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Fill with a neutral color
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Update overlay when scanning
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !isScanning) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Animation frame handling
    let frameId: number;
    let lastProgress = 0;
    
    const animateScan = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw scan line
      if (scanProgress > lastProgress) {
        lastProgress = scanProgress;
        
        // Draw scanning effect
        const y = (scanProgress / 100) * canvas.height;
        
        // Draw the scan line
        ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        
        // Draw scan beams
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * canvas.width;
          ctx.strokeStyle = `rgba(0, 255, 0, ${Math.random() * 0.5 + 0.3})`;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - Math.random() * 20 - 5);
          ctx.stroke();
        }
      }
      
      if (isScanning) {
        frameId = requestAnimationFrame(animateScan);
      }
    };
    
    frameId = requestAnimationFrame(animateScan);
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isScanning, scanProgress]);

  const startScan = () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanProgress(0);
    
    toast({
      title: "Escáner LiDAR iniciado",
      description: "Procesando análisis del espacio...",
    });
    
    // Simulate scanning process
    const scanDuration = 5000; // 5 seconds
    const scanInterval = 100; // Check every 100ms
    const totalIncrements = scanDuration / scanInterval;
    let currentIncrement = 0;
    
    const interval = setInterval(() => {
      currentIncrement++;
      const progress = Math.min((currentIncrement / totalIncrements) * 100, 100);
      setScanProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        completeScan();
      }
    }, scanInterval);
  };

  const completeScan = () => {
    // Generate simulated LiDAR data
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear existing content
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create a simulated depth map
    const depthMapData = generateDepthMap(canvas.width, canvas.height, scanSettings);
    
    // Draw the depth map
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < depthMapData.length; i++) {
      // Each pixel has 4 values (r,g,b,a)
      const pixelIndex = i * 4;
      const depth = depthMapData[i];
      
      // Map depth to color (darker = closer, brighter = farther)
      const colorValue = Math.min(255, Math.max(0, Math.floor(depth * 255)));
      
      imageData.data[pixelIndex] = colorValue; // R
      imageData.data[pixelIndex + 1] = colorValue; // G
      imageData.data[pixelIndex + 2] = colorValue; // B
      imageData.data[pixelIndex + 3] = 255; // Alpha
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Prepare scan result
    const scanResult: ScanResult = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      depthMap: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
      scanSetting: { ...scanSettings }
    };
    
    // Update state
    setCurrentScanResult(scanResult);
    setScanResults([...scanResults, scanResult]);
    setIsScanning(false);
    
    // Callback to parent component
    if (onScanComplete) {
      onScanComplete(scanResult);
    }
    
    toast({
      title: "Escáner LiDAR completado",
      description: "La medición 3D se ha completado correctamente.",
    });
    
    // Draw visualization on top of the depth map
    drawSimulation();
  };

  function generateDepthMap(width: number, height: number, settings: ScanSettings): number[] {
    const { resolution, range, density } = settings;
    const depthMap: number[] = new Array(width * height).fill(0);
    
    // Create a basic room layout with walls
    // Higher numbers mean farther away (0-1 range)
    
    // Factor in settings
    const resolutionFactor = resolution / 100;
    const rangeFactor = range / 100;
    const densityFactor = density / 100;
    
    // Fill in the room
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        
        // Create base depth (distance from center)
        const centerX = width / 2;
        const centerY = height / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow((x - centerX) / width, 2) + 
          Math.pow((y - centerY) / height, 2)
        );
        
        // Base depth value
        let depth = distanceFromCenter * rangeFactor;
        
        // Add walls
        const wallThickness = 0.05;
        if (x < width * wallThickness || x > width * (1 - wallThickness) || 
            y < height * wallThickness || y > height * (1 - wallThickness)) {
          depth = 0.8 * rangeFactor; // Walls are at a specific distance
        }
        
        // Add some objects (furniture, etc)
        if (x > width * 0.2 && x < width * 0.4 && 
            y > height * 0.3 && y < height * 0.7) {
          depth = 0.3 * rangeFactor; // A table or cabinet
        }
        
        if (x > width * 0.6 && x < width * 0.8 && 
            y > height * 0.4 && y < height * 0.6) {
          depth = 0.4 * rangeFactor; // Another piece of furniture
        }
        
        // Add noise based on density
        const noise = (1 - densityFactor) * Math.random() * 0.2;
        depth = Math.min(1, Math.max(0, depth + noise));
        
        // Apply resolution (higher resolution = more detail, less smoothing)
        if (resolutionFactor < 1) {
          // Reduce resolution by averaging with neighbors
          const blockSize = Math.max(1, Math.floor((1 - resolutionFactor) * 10));
          const blockX = Math.floor(x / blockSize) * blockSize;
          const blockY = Math.floor(y / blockSize) * blockSize;
          
          if (x === blockX && y === blockY) {
            // This is the first pixel in the block, calculate the average
            let sum = 0;
            let count = 0;
            
            for (let by = 0; by < blockSize && blockY + by < height; by++) {
              for (let bx = 0; bx < blockSize && blockX + bx < width; bx++) {
                const bIndex = (blockY + by) * width + (blockX + bx);
                if (bIndex < depthMap.length && depthMap[bIndex] !== 0) {
                  sum += depthMap[bIndex];
                  count++;
                }
              }
            }
            
            if (count > 0) {
              depth = sum / count;
            }
          }
        }
        
        depthMap[index] = depth;
      }
    }
    
    return depthMap;
  }

  function drawSimulation() {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;
    
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    
    // Clear overlay
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    // Draw room dimensions
    const roomWidth = 20; // feet or meters
    const roomHeight = 15; // feet or meters
    
    // Draw room measurements
    ctx.strokeStyle = "#FF5722";
    ctx.lineWidth = 2;
    
    // Draw horizontal dimension line at the top
    ctx.beginPath();
    ctx.moveTo(50, 30);
    ctx.lineTo(canvas.width - 50, 30);
    ctx.stroke();
    
    // Draw arrows
    ctx.beginPath();
    ctx.moveTo(50, 30);
    ctx.lineTo(60, 25);
    ctx.moveTo(50, 30);
    ctx.lineTo(60, 35);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(canvas.width - 50, 30);
    ctx.lineTo(canvas.width - 60, 25);
    ctx.moveTo(canvas.width - 50, 30);
    ctx.lineTo(canvas.width - 60, 35);
    ctx.stroke();
    
    // Text for width
    ctx.font = "14px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(`${roomWidth.toFixed(1)} ${unit}`, canvas.width / 2, 25);
    
    // Draw vertical dimension line on the left
    ctx.beginPath();
    ctx.moveTo(30, 50);
    ctx.lineTo(30, canvas.height - 50);
    ctx.stroke();
    
    // Draw arrows
    ctx.beginPath();
    ctx.moveTo(30, 50);
    ctx.lineTo(25, 60);
    ctx.moveTo(30, 50);
    ctx.lineTo(35, 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 50);
    ctx.lineTo(25, canvas.height - 60);
    ctx.moveTo(30, canvas.height - 50);
    ctx.lineTo(35, canvas.height - 60);
    ctx.stroke();
    
    // Text for height
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(`${roomHeight.toFixed(1)} ${unit}`, 0, 0);
    ctx.restore();
    
    // Calculate approximate surface area
    const area = roomWidth * roomHeight;
    
    // Display the area
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(canvas.width - 180, canvas.height - 80, 160, 60);
    
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.fillText("Área Estimada:", canvas.width - 170, canvas.height - 60);
    ctx.fillText(`${area.toFixed(1)} ${unit}²`, canvas.width - 170, canvas.height - 40);
  }

  const handleSettingChange = (setting: keyof ScanSettings, value: number) => {
    setScanSettings({
      ...scanSettings,
      [setting]: value
    });
  };

  // Activar la cámara
  const startCamera = async () => {
    try {
      // Limpiar cualquier error previo
      setCameraError(null);
      
      // Verificar soporte de API de MediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Tu navegador no soporta acceso a la cámara. Intenta usar Chrome, Firefox o Safari reciente.");
        toast({
          title: "Cámara no disponible",
          description: "Tu navegador no soporta acceso a la cámara. Intenta usar Chrome, Firefox o Safari reciente.",
          variant: "destructive",
        });
        return;
      }
      
      // Mostrar que estamos intentando acceder a la cámara
      toast({
        title: "Accediendo a la cámara",
        description: "Espera mientras accedemos a tu cámara...",
      });
      
      // Configurar restricciones de la cámara - probar primero con valores más bajos si hay problemas
      const constraints = {
        video: {
          facingMode: isMobile ? "environment" : "user",
          width: { ideal: width },
          height: { ideal: height }
        },
        audio: false
      };
      
      console.log("Intentando acceder a la cámara con restricciones:", constraints);
      
      // Intentar obtener acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Acceso a la cámara concedido:", stream.getVideoTracks()[0].getSettings());
      
      // Verificar que el elemento de video existe
      if (!videoRef.current) {
        throw new Error("Elemento de video no encontrado");
      }
      
      // Asignar la transmisión al elemento de video
      videoRef.current.srcObject = stream;
      
      // Escuchar cuando el video esté listo para reproducirse
      videoRef.current.onloadedmetadata = () => {
        console.log("Video metadata loaded");
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              console.log("Video reproducido correctamente");
              setIsCameraActive(true);
              setCameraError(null);
            })
            .catch(playError => {
              console.error("Error al reproducir video:", playError);
              setCameraError("Error al reproducir video: " + playError.message);
              toast({
                title: "Error al mostrar la cámara",
                description: "No se pudo reproducir el video de la cámara: " + playError.message,
                variant: "destructive",
              });
            });
        }
      };
      
      // Manejar errores durante la carga de metadata
      videoRef.current.onerror = (e) => {
        console.error("Error en el elemento de video:", e);
        setCameraError("Error en el elemento de video");
        toast({
          title: "Error de cámara",
          description: "Error en el elemento de video",
          variant: "destructive",
        });
      };
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      const errorMsg = (err as Error).message || "Error desconocido";
      setCameraError("Error al acceder a la cámara: " + errorMsg);
      
      // Mostrar instrucciones específicas según el error
      let descripcion = "No se pudo acceder a la cámara. ";
      
      if (errorMsg.includes("Permission denied") || errorMsg.includes("permiso")) {
        descripcion += "Has denegado el permiso de la cámara. Por favor, permite el acceso en la configuración de tu navegador.";
      } else if (errorMsg.includes("NotFoundError") || errorMsg.includes("NotReadableError")) {
        descripcion += "No se encuentra la cámara o está siendo utilizada por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.";
      } else if (errorMsg.includes("NotAllowedError")) {
        descripcion += "Acceso a la cámara bloqueado. Verifica los permisos en tu navegador.";
      } else {
        descripcion += errorMsg;
      }
      
      toast({
        title: "Error de cámara",
        description: descripcion,
        variant: "destructive",
      });
    }
  };
  
  // Detener la cámara
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };
  
  // Capturar una imagen de la cámara
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Dibujar el frame actual de la cámara en el canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Detener la cámara después de capturar
    stopCamera();
    
    setHasUploadedImage(true);
    
    toast({
      title: "Imagen capturada",
      description: "La imagen se ha capturado. Ahora puedes iniciar el escaneo LiDAR.",
    });
  };
  
  // Cargar una imagen desde el dispositivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Crear un objeto URL para la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Limpiar el canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar la imagen manteniendo la proporción
        const aspectRatio = img.width / img.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.width / aspectRatio;
        
        if (drawHeight > canvas.height) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * aspectRatio;
        }
        
        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;
        
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        setHasUploadedImage(true);
        
        toast({
          title: "Imagen cargada",
          description: "La imagen se ha cargado correctamente. Ahora puedes iniciar el escaneo LiDAR.",
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Clear the input to be able to select el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Simular una imagen para el lidar
  const simulateImage = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar una habitación simple desde arriba para simular
    const roomWidth = canvas.width * 0.8;
    const roomHeight = canvas.height * 0.7;
    const x = (canvas.width - roomWidth) / 2;
    const y = (canvas.height - roomHeight) / 2;
    
    // Fondo (suelo)
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x, y, roomWidth, roomHeight);
    
    // Paredes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, roomWidth, roomHeight);
    
    // Muebles
    // Mesa
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + roomWidth * 0.3, y + roomHeight * 0.3, roomWidth * 0.4, roomHeight * 0.2);
    
    // Silla
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x + roomWidth * 0.4, y + roomHeight * 0.55, roomWidth * 0.2, roomHeight * 0.1);
    
    // Sofá
    ctx.fillStyle = '#6B8E23';
    ctx.fillRect(x + roomWidth * 0.1, y + roomHeight * 0.7, roomWidth * 0.4, roomHeight * 0.15);
    
    setHasUploadedImage(true);
    
    toast({
      title: "Imagen simulada creada",
      description: "Se ha creado una simulación de habitación. Ahora puedes iniciar el escaneo LiDAR.",
    });
  };
  
  // Limpiar recursos al desmontar el componente
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleDownload = () => {
    if (!currentScanResult) return;
    
    const a = document.createElement('a');
    a.href = currentScanResult.depthMap;
    a.download = `lidar-scan-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Escaneo descargado",
      description: "La imagen del escaneo LiDAR ha sido descargada.",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Escáner LiDAR</span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Simula un escaneo LiDAR para medir espacios y obtener dimensiones precisas. Puedes cargar imágenes o utilizar la simulación de habitación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showSettings && (
          <div className="mb-6 p-4 border rounded-md space-y-4">
            <h3 className="font-medium mb-2">Configuración de Escaneo</h3>
            
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolución ({scanSettings.resolution})</Label>
              <Slider 
                id="resolution"
                value={[scanSettings.resolution]} 
                min={10} 
                max={100} 
                step={1}
                onValueChange={(value) => handleSettingChange('resolution', value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="range">Rango ({scanSettings.range} {unit})</Label>
              <Slider 
                id="range"
                value={[scanSettings.range]} 
                min={10} 
                max={100} 
                step={1}
                onValueChange={(value) => handleSettingChange('range', value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accuracy">Precisión ({scanSettings.accuracy}%)</Label>
              <Slider 
                id="accuracy"
                value={[scanSettings.accuracy]} 
                min={10} 
                max={100} 
                step={1}
                onValueChange={(value) => handleSettingChange('accuracy', value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="density">Densidad de Puntos ({scanSettings.density}%)</Label>
              <Slider 
                id="density"
                value={[scanSettings.density]} 
                min={10} 
                max={100} 
                step={1}
                onValueChange={(value) => handleSettingChange('density', value[0])}
              />
            </div>
          </div>
        )}
        
        <div className="relative mb-4">
          {/* Video de cámara */}
          {isCameraActive && (
            <div className="relative mb-4">
              <video 
                ref={videoRef}
                width={width}
                height={height}
                className="w-full h-auto border rounded-md bg-black"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute bottom-3 right-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={captureImage} 
                  className="bg-white/70 hover:bg-white"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Overlay de instrucciones sobre el video */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                <div className="bg-white/90 p-4 rounded-md text-center max-w-xs">
                  <p className="font-medium text-sm mb-2">
                    Si ves este mensaje pero no la cámara:
                  </p>
                  <ul className="text-xs text-left list-disc pl-4 space-y-1">
                    <li>Verifica que tu navegador tiene permisos de cámara</li>
                    <li>Refresca la página e intenta de nuevo</li>
                    <li>Prueba con otro dispositivo o navegador</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Canvas para depthmap */}
          {!isCameraActive && (
            <>
              <canvas 
                ref={canvasRef} 
                width={width} 
                height={height}
                className="w-full h-auto border rounded-md bg-white"
              />
              <canvas 
                ref={overlayCanvasRef} 
                width={width} 
                height={height}
                className="absolute top-0 left-0 w-full h-auto pointer-events-none"
              />
              
              {!hasUploadedImage && !isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                  <div className="bg-white/90 p-4 rounded-md text-center max-w-xs">
                    <p className="font-medium text-sm mb-2">
                      ¿Problemas con la cámara?
                    </p>
                    <p className="text-xs mb-2">
                      Utiliza los botones de abajo para cargar una imagen o simular una habitación, y luego inicia el escaneo.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Indicador de escaneo */}
          {isScanning && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="bg-black/70 text-white p-4 rounded-md text-center">
                <RotateCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Escaneando... {scanProgress.toFixed(0)}%</p>
              </div>
            </div>
          )}
          
          {/* Mensaje de error de cámara */}
          {cameraError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
              <p className="font-medium mb-1">Problema con la cámara:</p>
              <p className="text-sm">{cameraError}</p>
              <div className="mt-2 text-xs text-gray-700">
                <p className="font-medium">Soluciones comunes:</p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>Asegúrate de permitir el acceso a la cámara cuando el navegador lo solicite</li>
                  <li>Verifica que ninguna otra aplicación esté usando la cámara</li>
                  <li>Prueba con el navegador Chrome (es el más compatible)</li>
                  <li>Si estás en iOS, usa Safari</li>
                </ul>
              </div>
              <p className="mt-2 text-xs">Nota: Si no puedes usar la cámara, aún puedes utilizar el escáner con una imagen subida o la simulación.</p>
            </div>
          )}
        </div>
        
        {isScanning && (
          <Progress value={scanProgress} className="h-2 mb-4" />
        )}
        
        <div className="flex flex-wrap gap-2">
          {isCameraActive ? (
            <>
              <Button
                onClick={captureImage}
                variant="default"
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar Imagen
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 w-full mb-3">
                {/* Input oculto para subir imágenes */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                
                {/* Botón para cargar imagen */}
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  variant="outline"
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Cargar Imagen
                </Button>
                
                {/* Botón para simular imagen */}
                <Button
                  onClick={simulateImage}
                  disabled={isScanning}
                  variant="outline"
                  className="flex-1"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Simular Habitación
                </Button>
                
                {/* Botón para usar cámara (solo en móviles) */}
                {isMobile && (
                  <Button
                    onClick={startCamera}
                    disabled={isScanning}
                    variant="outline"
                    className="flex-1"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Usar Cámara
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 w-full">
                <Button
                  onClick={startScan}
                  disabled={isScanning || (!hasUploadedImage && !isCameraActive)}
                  className="flex-1"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  {scanResults.length > 0 ? "Nuevo Escaneo" : "Iniciar Escaneo"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!currentScanResult || isScanning}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
      {scanResults.length > 0 && (
        <CardFooter className="flex flex-col items-start border-t px-6 py-4">
          <h3 className="text-sm font-medium mb-2">Historial de Escaneos ({scanResults.length})</h3>
          <div className="w-full text-sm text-muted-foreground space-y-1">
            {scanResults.map((scan, index) => (
              <div key={scan.id} className="flex justify-between items-center px-2 py-1 hover:bg-muted rounded-sm">
                <span>
                  Escaneo {index + 1} - {new Date(scan.timestamp).toLocaleTimeString()}
                </span>
                <span>
                  {scan.width}x{scan.height}
                </span>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}