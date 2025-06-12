import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, XCircle, Send, Loader2, Undo, Check, Pencil, Edit3, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";

// Componente para firmar digitalmente con touchscreen
function SignaturePad({
  onChange,
  value,
  width = 350,
  height = 200,
  lineWidth = 2.5,
  lineColor = "#000000",
  clearLabel = "Borrar",
  confirmLabel = "Confirmar Firma"
}: {
  onChange: (value: string) => void;
  value?: string;
  width?: number;
  height?: number;
  lineWidth?: number;
  lineColor?: string;
  clearLabel?: string;
  confirmLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const isFirstRender = useRef(true);
  
  // Detectar si es dispositivo móvil
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);
  
  // Inicializar el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Configurar el contexto del canvas
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Establecer las dimensiones exactas del canvas
    canvas.width = width;
    canvas.height = height;
    
    // Configurar el contexto de dibujo
    context.lineWidth = lineWidth;
    context.strokeStyle = lineColor;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    
    setCtx(context);
    
    // Limpiar el canvas si es primera renderización
    if (isFirstRender.current) {
      clearCanvas();
      isFirstRender.current = false;
    }
    
    // Si hay un valor previo (por ejemplo, al editar), mostrarlo
    if (value && !hasDrawn) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0);
        setHasDrawn(true);
      };
      image.src = value;
    }
  }, [width, height, lineWidth, lineColor, value]);
  
  // Función para comenzar a dibujar
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    draw(e);
  };
  
  // Función para dibujar
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !ctx) return;
    
    // Prevenir desplazamiento en dispositivos táctiles
    if (e.nativeEvent instanceof TouchEvent) {
      e.preventDefault();
    }
    
    // Obtener coordenadas
    let x: number, y: number;
    
    if ('touches' in e.nativeEvent) {
      // Evento táctil
      const touch = e.nativeEvent.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      x = touch.clientX - (rect?.left || 0);
      y = touch.clientY - (rect?.top || 0);
    } else {
      // Evento de ratón
      const rect = canvasRef.current?.getBoundingClientRect();
      x = e.nativeEvent.clientX - (rect?.left || 0);
      y = e.nativeEvent.clientY - (rect?.top || 0);
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setHasDrawn(true);
  };
  
  // Función para dejar de dibujar
  const finishDrawing = () => {
    if (!ctx) return;
    
    ctx.beginPath();
    setDrawing(false);
  };
  
  // Función para limpiar el canvas
  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.beginPath();
    setHasDrawn(false);
    onChange('');
  };
  
  // Función para guardar la firma
  const saveSignature = () => {
    if (!canvasRef.current || !hasDrawn) return;
    
    try {
      const dataURL = canvasRef.current.toDataURL('image/png');
      onChange(dataURL);
    } catch (e) {
      console.error('Error al guardar la firma:', e);
    }
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      <div 
        className="border-2 border-blue-300 rounded-lg overflow-hidden bg-white mb-3 relative"
        style={{ width: `${width}px`, height: `${height}px`, touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={finishDrawing}
        />
        
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            <div className="text-center p-4">
              <Edit3 className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p>Dibuje su firma aquí</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-3 w-full justify-center">
        <Button 
          type="button" 
          variant="outline" 
          onClick={clearCanvas}
          className="flex items-center gap-2"
        >
          <Undo className="h-4 w-4" />
          {clearLabel}
        </Button>
        
        <Button 
          type="button" 
          onClick={saveSignature}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          disabled={!hasDrawn}
        >
          <Check className="h-4 w-4" />
          {confirmLabel}
        </Button>
      </div>
      
      {isMobile && (
        <p className="text-sm text-blue-600 mt-3 text-center">
          Use su dedo o un lápiz táctil para firmar
        </p>
      )}
    </div>
  );
}

// Colores personalizados según el estado
const statusColors: Record<string, string> = {
  draft: "bg-gray-400",
  sent: "bg-blue-400",
  accepted: "bg-green-400",
  rejected: "bg-red-400",
  converted: "bg-purple-400"
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <AlertCircle className="h-4 w-4" />,
  sent: <Send className="h-4 w-4" />,
  accepted: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  converted: <CheckCircle className="h-4 w-4" />
};

export default function PublicEstimateView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [estimate, setEstimate] = useState<any>(null);
  const [contractor, setContractor] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  // Ya no necesitamos variables para la firma
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);
  const [actionResult, setActionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/estimates/${id}`);
        
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Estimado no encontrado. Por favor verifique el enlace."
              : "Hubo un problema al cargar el estimado."
          );
        }
        
        const data = await response.json();
        setEstimate(data);
        
        if (data.contractor) {
          setContractor(data.contractor);
        }
        
        if (data.client) {
          setClient(data.client);
        }
        
        setError(null);
      } catch (error) {
        console.error("Error fetching estimate:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEstimate();
    }
  }, [id]);

  const handleAction = async (action: 'accept' | 'reject') => {
    if (action === 'reject' && !notes) {
      setError("Por favor, proporcione un motivo para el rechazo.");
      return;
    }

    try {
      setActionInProgress(true);
      setError(null);
      
      const response = await fetch(`/api/public/estimates/${id}/client-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          clientId: client?.id,
          notes: action === 'accept' ? '' : notes
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Hubo un problema al procesar su solicitud");
      }
      
      setEstimate(result.estimate);
      setActionResult({
        success: true,
        message: action === 'accept' 
          ? "¡Estimado aceptado! Gracias por su confirmación." 
          : "Estimado rechazado. Hemos registrado su decisión."
      });
      setActionComplete(true);
      
      // Cerrar diálogos
      setAcceptDialogOpen(false);
      setRejectDialogOpen(false);
      
    } catch (error) {
      console.error(`Error ${action === 'accept' ? 'accepting' : 'rejecting'} estimate:`, error);
      setActionResult({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido"
      });
    } finally {
      setActionInProgress(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Number(value));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Cargando estimado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Error
            </CardTitle>
            <CardDescription>No pudimos cargar el estimado</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-lg text-center mb-6">{error}</p>
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()}>
                Intentar nuevamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader>
            <CardTitle>Estimado no encontrado</CardTitle>
            <CardDescription>No pudimos encontrar el estimado solicitado</CardDescription>
          </CardHeader>
          <CardContent>
            <p>El estimado que está buscando no existe o ha sido eliminado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si ya se ha tomado acción y se ha completado la acción actual
  if (actionComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader className={
            estimate.status === "accepted" || actionResult?.success
              ? "bg-green-50"
              : estimate.status === "rejected"
              ? "bg-red-50"
              : "bg-blue-50"
          }>
            <CardTitle className={
              estimate.status === "accepted" || actionResult?.success
                ? "text-green-600 flex items-center gap-2"
                : estimate.status === "rejected"
                ? "text-red-600 flex items-center gap-2"
                : "text-blue-600 flex items-center gap-2"
            }>
              {estimate.status === "accepted" && <CheckCircle className="h-6 w-6" />}
              {estimate.status === "rejected" && <XCircle className="h-6 w-6" />}
              {estimate.status !== "accepted" && estimate.status !== "rejected" && <AlertCircle className="h-6 w-6" />}
              
              {estimate.status === "accepted" && "Estimado Aceptado"}
              {estimate.status === "rejected" && "Estimado Rechazado"}
              {estimate.status !== "accepted" && estimate.status !== "rejected" && "Estado Actual"}
            </CardTitle>
            <CardDescription>
              {estimate.status === "accepted" && "Este estimado ha sido aceptado."}
              {estimate.status === "rejected" && "Este estimado ha sido rechazado."}
              {estimate.status === "draft" && "Este estimado está en borrador."}
              {estimate.status === "converted" && "Este estimado ha sido convertido a factura."}
              {estimate.status === "sent" && actionComplete && actionResult?.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Detalles del Estimado</h3>
                <p><span className="font-medium">Número:</span> {estimate.estimateNumber}</p>
                <p><span className="font-medium">Fecha:</span> {estimate.issueDate ? format(new Date(estimate.issueDate), 'dd/MM/yyyy') : 'No disponible'}</p>
                <p><span className="font-medium">Expiración:</span> {estimate.expiryDate ? format(new Date(estimate.expiryDate), 'dd/MM/yyyy') : 'No disponible'}</p>
                <p className="flex items-center gap-1">
                  <span className="font-medium">Estado:</span> 
                  <Badge className={`${statusColors[estimate.status]} text-white flex gap-1 items-center`}>
                    {statusIcons[estimate.status]} 
                    {estimate.status === 'draft' && 'Borrador'}
                    {estimate.status === 'sent' && 'Enviado'}
                    {estimate.status === 'accepted' && 'Aceptado'}
                    {estimate.status === 'rejected' && 'Rechazado'}
                    {estimate.status === 'converted' && 'Convertido'}
                  </Badge>
                </p>
              </div>
              <div>
                {contractor && (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Contratista</h3>
                    <p>{contractor.companyName || `${contractor.firstName} ${contractor.lastName}`}</p>
                    <p>{contractor.email}</p>
                    <p>{contractor.phone}</p>
                  </>
                )}
                <div className="mt-4">
                  {client && (
                    <>
                      <h3 className="text-lg font-semibold mb-2">Cliente</h3>
                      <p>{client.firstName} {client.lastName}</p>
                      <p>{client.email}</p>
                      <p>{client.phone}</p>
                      <p>{client.address}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Detalle de Ítems</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unitario</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimate.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex justify-between py-1">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(estimate.subtotal)}</span>
                </div>
                {Number(estimate.tax) > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Impuesto ({estimate.tax}%):</span>
                    <span>{formatCurrency((Number(estimate.subtotal) * Number(estimate.tax) / 100))}</span>
                  </div>
                )}
                {Number(estimate.discount) > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Descuento ({estimate.discount}%):</span>
                    <span>-{formatCurrency((Number(estimate.subtotal) * Number(estimate.discount) / 100))}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between py-1 font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(estimate.total)}</span>
                </div>
              </div>
            </div>

            {estimate.terms && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Términos</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {estimate.terms}
                </div>
              </div>
            )}

            {estimate.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Notas</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {estimate.notes}
                </div>
              </div>
            )}

            {estimate.clientSignature && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Firmado por el cliente</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {estimate.clientSignature}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 p-6">
            <p className="text-sm text-gray-600">
              {estimate.status === "accepted" && "Este estimado ha sido aceptado."}
              {estimate.status === "rejected" && "Este estimado ha sido rechazado."}
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Si todavía no se ha tomado acción (estimate.status === 'sent')
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="w-full max-w-4xl relative">
        {/* Efecto de sombra decorativa */}
        <div className="absolute -top-4 -left-4 w-full h-full bg-blue-200 rounded-lg opacity-30 hidden sm:block" style={{transform: 'rotate(1deg)'}}></div>
        <div className="absolute -bottom-4 -right-4 w-full h-full bg-blue-300 rounded-lg opacity-30 hidden sm:block" style={{transform: 'rotate(-1deg)'}}></div>
        
        <Card className="w-full shadow-xl relative z-10 border border-blue-200 overflow-hidden">
          <CardHeader className="bg-blue-50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-blue-600 flex items-center gap-2 text-2xl">
                  <Send className="h-6 w-6" />
                  Estimate for Your Approval
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  <span className="font-medium">{contractor?.companyName || `${contractor?.firstName} ${contractor?.lastName}`}</span> has sent you an estimate for review.
                </CardDescription>
              </div>
              <div className="flex gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 px-6 py-4 text-base h-auto rounded-xl shadow-lg transition-all hover:shadow-xl"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject Estimate
                </Button>
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg h-auto rounded-xl shadow-lg transition-all hover:shadow-xl animate-pulse"
                  onClick={() => setAcceptDialogOpen(true)}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Accept Estimate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Detalles del Estimado</h3>
                <p><span className="font-medium">Número:</span> {estimate.estimateNumber}</p>
                <p><span className="font-medium">Fecha:</span> {estimate.issueDate ? format(new Date(estimate.issueDate), 'dd/MM/yyyy') : 'No disponible'}</p>
                <p><span className="font-medium">Expiración:</span> {estimate.expiryDate ? format(new Date(estimate.expiryDate), 'dd/MM/yyyy') : 'No disponible'}</p>
                <p className="flex items-center gap-1">
                  <span className="font-medium">Estado:</span> 
                  <Badge className={`${statusColors[estimate.status]} text-white flex gap-1 items-center`}>
                    {statusIcons[estimate.status]} 
                    {estimate.status === 'draft' && 'Borrador'}
                    {estimate.status === 'sent' && 'Enviado'}
                    {estimate.status === 'accepted' && 'Aceptado'}
                    {estimate.status === 'rejected' && 'Rechazado'}
                    {estimate.status === 'converted' && 'Convertido'}
                  </Badge>
                </p>
              </div>
              <div>
                {contractor && (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Contratista</h3>
                    <p>{contractor.companyName || `${contractor.firstName} ${contractor.lastName}`}</p>
                    <p>{contractor.email}</p>
                    <p>{contractor.phone}</p>
                  </>
                )}
                <div className="mt-4">
                  {client && (
                    <>
                      <h3 className="text-lg font-semibold mb-2">Cliente</h3>
                      <p>{client.firstName} {client.lastName}</p>
                      <p>{client.email}</p>
                      <p>{client.phone}</p>
                      <p>{client.address}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Detalle de Ítems</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unitario</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimate.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex justify-between py-1">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(estimate.subtotal)}</span>
                </div>
                {Number(estimate.tax) > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Impuesto ({estimate.tax}%):</span>
                    <span>{formatCurrency((Number(estimate.subtotal) * Number(estimate.tax) / 100))}</span>
                  </div>
                )}
                {Number(estimate.discount) > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Descuento ({estimate.discount}%):</span>
                    <span>-{formatCurrency((Number(estimate.subtotal) * Number(estimate.discount) / 100))}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between py-1 font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(estimate.total)}</span>
                </div>
              </div>
            </div>

            {estimate.terms && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Términos</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {estimate.terms}
                </div>
              </div>
            )}

            {estimate.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Notas</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {estimate.notes}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
                {error}
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                Revisión del Estimado
              </h3>
              <div className="border-l-4 border-blue-400 pl-4 mb-4">
                <p className="text-blue-800">
                  Por favor, revise cuidadosamente el estimado antes de tomar una decisión.
                </p>
                <p className="text-blue-700 mt-2">
                  <strong>Nota importante:</strong> Al aceptar este estimado, se generará automáticamente una factura que requerirá su firma para proceder con el pago.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 bg-gradient-to-b from-blue-50 to-blue-100 p-8 border-t border-blue-200">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-blue-800">¿Está de acuerdo con este estimado?</h3>
              <p className="text-blue-600 mt-1">Seleccione una de las siguientes opciones:</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-2xl mx-auto">
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(true)}
                className="w-full sm:w-1/3 py-6 text-lg h-auto border-2 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
              >
                <XCircle className="h-5 w-5 mr-2 text-red-600" />
                Rechazar
              </Button>
              
              <Button
                onClick={() => setAcceptDialogOpen(true)}
                className="w-full sm:w-2/3 bg-green-600 hover:bg-green-700 text-white py-8 text-xl h-auto rounded-lg shadow-lg transition-all hover:shadow-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                  <div className="animate-pulse bg-white/5 w-full h-full"></div>
                </div>
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  <span>APROBAR ESTIMADO</span>
                </div>
              </Button>
            </div>
            

          </CardFooter>
        </Card>

        {/* Diálogo de aceptación */}
        <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-green-700 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Confirmar Aprobación
              </DialogTitle>
              <DialogDescription className="text-base">
                Al aprobar este estimado, está autorizando al contratista a proceder con el trabajo.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-800 font-medium">Total a pagar:</span>
                  <span className="text-2xl font-bold text-green-800">{formatCurrency(estimate.total)}</span>
                </div>
                <p className="text-sm text-green-700">
                  Este es el importe total acordado para los trabajos descritos en este estimado.
                </p>
              </div>
              
              <div className="border-t border-b border-gray-200 py-4">
                <p className="font-medium mb-1">Información importante:</p>
                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                  <p className="text-sm text-blue-800">
                    Al aceptar este estimado, se generará automáticamente una factura que requerirá su firma para proceder con el pago.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setAcceptDialogOpen(false)}
                disabled={actionInProgress}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => handleAction('accept')}
                disabled={actionInProgress}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-lg"
              >
                {actionInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Aprobar Estimado
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de rechazo */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-700 flex items-center gap-2">
                <XCircle className="h-6 w-6" />
                Confirm Rejection
              </DialogTitle>
              <DialogDescription className="text-base">
                Please help us improve by indicating the reason for your rejection.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="font-medium text-red-800 mb-2">Reason for rejection:</p>
                <Textarea
                  placeholder="Please briefly explain why you are not satisfied with this estimate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] border-red-200 focus:border-red-400 focus:ring-red-400"
                />
                {!notes && (
                  <p className="text-sm text-red-600 mt-2">
                    * This field is required to reject the estimate
                  </p>
                )}
              </div>
              
              <div className="border-t border-gray-200 py-4">
                <p className="text-gray-500 text-sm italic">
                  Your feedback will help the contractor improve their services. Thank you for your input.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-3 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setRejectDialogOpen(false)}
                disabled={actionInProgress}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleAction('reject')}
                disabled={actionInProgress || !notes}
                className="w-full sm:w-auto text-lg"
              >
                {actionInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-5 w-5" />
                    Rechazar Estimado
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}