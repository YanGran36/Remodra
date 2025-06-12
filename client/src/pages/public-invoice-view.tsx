import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Download, 
  FileSignature, 
  Building, 
  Check, 
  X, 
  Info, 
  Phone,
  Mail,
  FileText,
  MapPin
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Componente para el pad de firma
const SignaturePad = ({ onSave, onCancel }: { onSave: (signatureData: string) => void, onCancel: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configurar el canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    // Limpiar canvas
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
  }, []);
  
  const getCoordinates = (event: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      // Es un evento táctil
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Es un evento de ratón
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };
  
  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const coords = getCoordinates(event.nativeEvent);
    if (!coords) return;
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };
  
  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const coords = getCoordinates(event.nativeEvent);
    if (!coords) return;
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setIsEmpty(false);
  };
  
  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };
  
  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">Dibuje su firma a continuación:</p>
      <div className="border rounded-lg p-1 bg-white">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className="w-full h-[200px] cursor-crosshair border border-dashed border-gray-300 rounded touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={clearCanvas}>
          Borrar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={saveSignature} disabled={isEmpty}>
            Firmar
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function PublicInvoiceView() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const { toast } = useToast();

  // Cargar los datos de la factura
  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Obtener la factura con todos los datos relacionados
        const invoiceRes = await apiRequest("GET", `/api/public/invoices/${id}`);
        if (!invoiceRes.ok) {
          throw new Error(`Error al cargar la factura: ${invoiceRes.status}`);
        }
        const invoiceData = await invoiceRes.json();
        
        // Extraer los datos de la respuesta
        const { items: invoiceItems, client: clientData, project: projectData, ...invoiceDetails } = invoiceData;
        
        // Actualizar el estado con los datos recibidos
        setInvoice(invoiceDetails);
        setClient(clientData);
        if (projectData) {
          setProject(projectData);
        }
        setItems(invoiceItems || []);
        
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || "Error al cargar los datos de la factura");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchInvoiceData();
    }
  }, [id]);

  // Función para manejar la firma de la factura
  const handleSignatureSubmit = async (signatureData: string) => {
    if (!invoice || !id) return;
    
    try {
      setSignatureDialogOpen(false);
      
      const response = await apiRequest("POST", `/api/public/invoices/${id}/client-action`, {
        action: "sign",
        signature: signatureData,
        notes: "Firmado por el cliente a través del portal"
      });
      
      if (!response.ok) {
        throw new Error("Error al guardar la firma");
      }
      
      // Obtener los datos actualizados de la factura
      const updatedInvoiceRes = await apiRequest("GET", `/api/public/invoices/${id}`);
      if (updatedInvoiceRes.ok) {
        const updatedData = await updatedInvoiceRes.json();
        const { items: invoiceItems, client: clientData, project: projectData, ...invoiceDetails } = updatedData;
        
        // Actualizar el estado local con los datos recibidos
        setInvoice(invoiceDetails);
        setItems(invoiceItems || []);
      } else {
        // Actualizar solo el estado local si no se pudo obtener la factura actualizada
        setSignatureData(signatureData);
        setInvoice({
          ...invoice,
          status: "signed",
          signature: signatureData,
          signedAt: new Date().toISOString(),
        });
      }
      
      toast({
        title: "Factura firmada correctamente",
        description: "Gracias por su firma.",
      });
      
    } catch (error: any) {
      console.error("Error al firmar la factura:", error);
      toast({
        title: "Error al firmar la factura",
        description: error.message || "Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Función para descargar la factura como PDF
  const handleDownloadInvoice = () => {
    // Esta función sería implementada para generar y descargar un PDF
    // En una implementación real, se llamaría a un endpoint para generar el PDF
    toast({
      title: "Descarga de factura",
      description: "La descarga comenzará en unos momentos...",
    });
  };

  // Renderizar pantalla de carga
  if (loading) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-500">Cargando factura...</p>
      </div>
    );
  }

  // Renderizar mensaje de error
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>
              No se pudo cargar la factura solicitada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" onClick={() => window.history.back()}>
              Volver
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Renderizar mensaje si no hay factura
  if (!invoice || !client) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Factura no encontrada</CardTitle>
            <CardDescription>
              No se pudo encontrar la factura solicitada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>La factura solicitada no existe o ha sido eliminada.</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" onClick={() => window.history.back()}>
              Volver
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Calcular el total
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const taxRate = invoice.taxRate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Renderizar la vista de la factura
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-5 w-5 text-primary" />
                <span className="text-lg font-medium text-primary">
                  {invoice.contractorName || "ContractorHub"}
                </span>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold">
                Factura #{invoice.invoiceNumber || invoice.id}
              </CardTitle>
            </div>
            <div className="flex flex-col items-start md:items-end mt-4 md:mt-0">
              <StatusBadge status={invoice.status} />
              <p className="text-sm text-gray-500 mt-2">
                Fecha de emisión: {format(new Date(invoice.createdAt), "PP", { locale: es })}
              </p>
              {invoice.dueDate && (
                <p className="text-sm text-gray-500">
                  Fecha de vencimiento: {format(new Date(invoice.dueDate), "PP", { locale: es })}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Información de cliente y contratista */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">Bill To:</h3>
              <p className="font-medium">{client.firstName} {client.lastName}</p>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{client.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{client.phone}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">Contractor:</h3>
              <p className="font-medium">{invoice.contractorName || "ContractorHub"}</p>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{invoice.contractorAddress || "Contractor Address"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{invoice.contractorEmail || "contractor@email.com"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{invoice.contractorPhone || "(555) 123-4567"}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detalles del proyecto */}
          {project && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold">Detalles del Proyecto:</h3>
              </div>
              <p className="font-medium">{project.title}</p>
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            </div>
          )}
          
          {/* Tabla de conceptos */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Detalles:</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Descripción</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.description}
                      {item.notes && (
                        <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Totales */}
          <div className="flex flex-col items-end space-y-2 pt-2">
            <div className="w-full max-w-xs">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Impuestos ({taxRate}%):</span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between py-2">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Términos y condiciones */}
          <div className="text-sm text-gray-600 border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Términos y condiciones:</h3>
            <p>{invoice.terms || "El pago debe realizarse dentro del plazo establecido. Por favor, incluya el número de factura en su pago."}</p>
          </div>
          
          {/* Firma */}
          {invoice.status === 'signed' && invoice.signature && (
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-700">Firmado por el cliente:</h3>
              <div className="p-2 bg-white border rounded-lg">
                <img 
                  src={invoice.signature} 
                  alt="Firma del cliente" 
                  className="max-h-24 mx-auto" 
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Firmado el {format(new Date(invoice.signedAt), "PPpp", { locale: es })}
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
          
          {invoice.status === 'pending' && (
            <div className="flex gap-3">
              <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Firmar Factura
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Firmar Factura</DialogTitle>
                    <DialogDescription>
                      Al firmar esta factura, usted confirma haber recibido los bienes o servicios descritos.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <SignaturePad 
                    onSave={handleSignatureSubmit}
                    onCancel={() => setSignatureDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// Componente para mostrar el estado de la factura
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline">Borrador</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500">Pendiente de firma</Badge>;
    case 'signed':
      return <Badge className="bg-blue-600">Firmada</Badge>;
    case 'paid':
      return <Badge className="bg-green-600">Pagada</Badge>;
    case 'overdue':
      return <Badge variant="destructive">Vencida</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-red-600 border-red-300">Cancelada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}