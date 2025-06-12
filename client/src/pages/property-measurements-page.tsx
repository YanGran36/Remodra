import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Ruler, Scan, Upload, Plus, Trash2, FileImage, Camera, Download } from "lucide-react";

// Componentes de Medición Digital
import DigitalMeasurement from "@/components/measurement/digital-measurement";
import LiDARScanner from "@/components/measurement/lidar-scanner";

// UI Components
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Definir los tipos de servicio disponibles (mismos que en vendor-estimate-form)
const SERVICE_TYPES = [
  { value: "roof", label: "Techo" },
  { value: "siding", label: "Siding" },
  { value: "deck", label: "Terraza" },
  { value: "fence", label: "Cerca" },
  { value: "windows", label: "Ventanas" },
  { value: "gutters", label: "Canaletas" }
];

export default function PropertyMeasurementsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados locales
  const [activeTab, setActiveTab] = useState("digital");
  const [isDigitalMeasurementOpen, setIsDigitalMeasurementOpen] = useState(false);
  const [isLidarScannerOpen, setIsLidarScannerOpen] = useState(false);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("");
  const [measurementTitle, setMeasurementTitle] = useState<string>("");
  const [measurementNotes, setMeasurementNotes] = useState<string>("");
  const [savedMeasurements, setSavedMeasurements] = useState<any[]>([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/protected/clients"],
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/protected/projects"],
  });

  // Fetch property measurements
  const { data: propertyMeasurements = [], isLoading: isLoadingMeasurements } = useQuery({
    queryKey: ["/api/protected/property-measurements"],
  });

  // Filtrar proyectos por cliente
  const filteredProjects = selectedClient
    ? projects.filter((project: any) => project.clientId?.toString() === selectedClient)
    : [];

  // Funciones para las herramientas de medición
  const handleMeasurementsChange = (newMeasurements: any[]) => {
    setMeasurements(newMeasurements);
    
    toast({
      title: "Medidas actualizadas",
      description: `Se han registrado ${newMeasurements.length} medidas.`,
    });
  };
  
  const handleScanComplete = (result: any) => {
    setScanResults(prev => [...prev, result]);
    
    toast({
      title: "Escaneo completado",
      description: "El escaneo se ha completado. Puede usar estas imágenes para tomar medidas precisas.",
    });
  };

  // Mutación para guardar mediciones
  const saveMeasurementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/protected/property-measurements", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/property-measurements"] });
      toast({
        title: "Medición guardada",
        description: "La medición de la propiedad ha sido guardada exitosamente.",
      });
      
      // Limpiar el formulario
      setMeasurements([]);
      setScanResults([]);
      setMeasurementTitle("");
      setMeasurementNotes("");
      setSelectedMeasurement(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al guardar medición",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar mediciones
  const deleteMeasurementMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/protected/property-measurements/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/property-measurements"] });
      toast({
        title: "Medición eliminada",
        description: "La medición ha sido eliminada exitosamente.",
      });
      setSelectedMeasurement(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar medición",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Guardar la medición actual
  const saveMeasurement = () => {
    if (!selectedClient) {
      toast({
        title: "Cliente requerido",
        description: "Por favor, seleccione un cliente para esta medición.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPropertyType) {
      toast({
        title: "Tipo de propiedad requerido",
        description: "Por favor, seleccione un tipo de propiedad para esta medición.",
        variant: "destructive",
      });
      return;
    }

    if (!measurementTitle) {
      toast({
        title: "Título requerido",
        description: "Por favor, ingrese un título para esta medición.",
        variant: "destructive",
      });
      return;
    }

    // Construir el objeto de medición
    const measurementData = {
      clientId: Number(selectedClient),
      projectId: selectedProject ? Number(selectedProject) : null,
      title: measurementTitle,
      propertyType: selectedPropertyType,
      notes: measurementNotes,
      measurementData: JSON.stringify({
        measurements,
        scanResults,
        date: new Date().toISOString()
      }),
      createdAt: new Date()
    };

    // Guardar la medición
    saveMeasurementMutation.mutate(measurementData);
  };

  // Eliminar una medición guardada
  const deleteMeasurement = (id: number) => {
    deleteMeasurementMutation.mutate(id);
  };

  // Cargar una medición guardada
  const loadMeasurement = (measurement: any) => {
    setSelectedMeasurement(measurement);
    
    try {
      const measurementData = JSON.parse(measurement.measurementData || '{}');
      
      if (measurementData.measurements) {
        setMeasurements(measurementData.measurements);
      }
      
      if (measurementData.scanResults) {
        setScanResults(measurementData.scanResults);
      }
      
      setSelectedClient(measurement.clientId.toString());
      if (measurement.projectId) {
        setSelectedProject(measurement.projectId.toString());
      }
      setSelectedPropertyType(measurement.propertyType);
      setMeasurementTitle(measurement.title);
      setMeasurementNotes(measurement.notes || "");
      
      toast({
        title: "Medición cargada",
        description: "La medición ha sido cargada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error al cargar medición",
        description: "No se pudo cargar los datos de la medición.",
        variant: "destructive",
      });
    }
  };

  // Descargar los datos de la medición
  const downloadMeasurementData = (measurement: any) => {
    try {
      const measurementData = JSON.parse(measurement.measurementData || '{}');
      const dataStr = JSON.stringify(measurementData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportName = `medicion-${measurement.id}-${format(new Date(measurement.createdAt), 'yyyy-MM-dd')}`;
      
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataUri);
      downloadAnchorNode.setAttribute("download", exportName + ".json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast({
        title: "Datos descargados",
        description: "Los datos de medición han sido descargados como archivo JSON.",
      });
    } catch (error) {
      toast({
        title: "Error al descargar datos",
        description: "No se pudo descargar los datos de la medición.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Mediciones de Propiedades" 
        description="Capture, administre y guarde mediciones de propiedades para referencias futuras"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Herramientas de medición */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Herramientas de Medición</CardTitle>
              <CardDescription>
                Utilice estas herramientas para capturar mediciones precisas de propiedades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="digital">Medición Digital</TabsTrigger>
                  <TabsTrigger value="lidar">Escaneo 3D</TabsTrigger>
                </TabsList>
                
                <TabsContent value="digital" className="space-y-4 py-4">
                  <div className="flex justify-center gap-4">
                    <Button onClick={() => setIsDigitalMeasurementOpen(true)}>
                      <Ruler className="h-4 w-4 mr-2" />
                      Herramienta de Medición
                    </Button>
                    
                    {isDigitalMeasurementOpen && (
                      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10">
                        <div className="bg-white dark:bg-gray-950 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                          <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h2 className="text-xl font-semibold">Herramienta de Medición Digital</h2>
                                <p className="text-sm text-muted-foreground">
                                  Dibuje líneas para medir longitudes o áreas. Use la calibración para establecer la escala correcta.
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setIsDigitalMeasurementOpen(false)}
                              >
                                <span className="sr-only">Cerrar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </Button>
                            </div>
                            
                            <div className="my-4">
                              <DigitalMeasurement 
                                unit="ft"
                                onMeasurementsChange={handleMeasurementsChange}
                                canvasWidth={750}
                                canvasHeight={500}
                              />
                            </div>
                            
                            <div className="flex justify-end mt-4">
                              <Button onClick={() => setIsDigitalMeasurementOpen(false)}>
                                Aceptar Medidas
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Cargar Imagen
                    </Button>
                  </div>
                  
                  {measurements.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Mediciones Registradas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Dimensión</TableHead>
                              <TableHead>Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {measurements.map((m, i) => (
                              <TableRow key={m.id}>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell>Línea {i + 1}</TableCell>
                                <TableCell>{m.realLength.toFixed(2)} ft</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {measurements.length >= 2 && (
                          <div className="mt-4 p-3 bg-muted rounded-md">
                            <h3 className="font-medium">Cálculos Automáticos</h3>
                            <p className="text-sm mt-1">Área rectangular aproximada: {(measurements[0].realLength * measurements[1].realLength).toFixed(2)} ft²</p>
                            <p className="text-sm">Perímetro aproximado: {((measurements[0].realLength * 2) + (measurements[1].realLength * 2)).toFixed(2)} ft</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="lidar" className="space-y-4 py-4">
                  <div className="flex justify-center gap-4">
                    <Button onClick={() => setIsLidarScannerOpen(true)}>
                      <Scan className="h-4 w-4 mr-2" />
                      Iniciar Escaneo 3D
                    </Button>
                    
                    {isLidarScannerOpen && (
                      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10">
                        <div className="bg-white dark:bg-gray-950 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                          <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h2 className="text-xl font-semibold">Escáner LiDAR Simulado</h2>
                                <p className="text-sm text-muted-foreground">
                                  Escanee espacios virtualmente o cargue imágenes para generar un mapa de profundidad y tomar medidas precisas.
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setIsLidarScannerOpen(false)}
                              >
                                <span className="sr-only">Cerrar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </Button>
                            </div>
                            
                            <div className="my-4">
                              <LiDARScanner 
                                onScanComplete={handleScanComplete}
                                width={750}
                                height={500}
                                unit="ft"
                              />
                            </div>
                            
                            <div className="flex justify-end mt-4">
                              <Button onClick={() => setIsLidarScannerOpen(false)}>
                                Aceptar Escaneo
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsLidarScannerOpen(true);
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Usar Cámara
                    </Button>
                  </div>
                  
                  {scanResults.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Escaneos Realizados</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {scanResults.map((scan, index) => (
                            <Card key={scan.id} className="overflow-hidden">
                              <div className="relative h-24 bg-muted">
                                <img 
                                  src={scan.depthMap} 
                                  alt={`Escaneo ${index + 1}`}
                                  className="object-cover h-full w-full"
                                />
                              </div>
                              <CardContent className="p-2">
                                <p className="text-xs font-medium">Escaneo {index + 1}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(scan.timestamp), 'dd/MM/yyyy HH:mm')}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Medición</CardTitle>
              <CardDescription>
                Complete la información para guardar esta medición
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select 
                    value={selectedClient} 
                    onValueChange={setSelectedClient}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.firstName} {client.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project">Proyecto (Opcional)</Label>
                  <Select 
                    value={selectedProject} 
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select proyecto (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_project">No project</SelectItem>
                      {filteredProjects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="propertyType">Tipo de Propiedad</Label>
                <Select 
                  value={selectedPropertyType} 
                  onValueChange={setSelectedPropertyType}
                >
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Select tipo de propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((service) => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="e.g.: Medición de techo para proyecto de renovación"
                  value={measurementTitle}
                  onChange={(e) => setMeasurementTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre esta medición..."
                  className="min-h-[100px]"
                  value={measurementNotes}
                  onChange={(e) => setMeasurementNotes(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setMeasurements([]);
                setScanResults([]);
                setMeasurementTitle("");
                setMeasurementNotes("");
                setSelectedClient("");
                setSelectedProject("");
                setSelectedPropertyType("");
                setSelectedMeasurement(null);
              }}>
                Limpiar
              </Button>
              <Button onClick={saveMeasurement}>
                {selectedMeasurement ? "Actualizar Medición" : "Guardar Medición"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Panel derecho: Mediciones guardadas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mediciones Guardadas</CardTitle>
              <CardDescription>
                Historial de mediciones de propiedades realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMeasurements ? (
                <div className="text-center py-4">Cargando mediciones...</div>
              ) : propertyMeasurements.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No hay mediciones guardadas
                </div>
              ) : (
                <div className="space-y-2">
                  {propertyMeasurements.map((measurement: any) => {
                    const client = clients.find((c: any) => c.id === measurement.clientId);
                    const isSelected = selectedMeasurement?.id === measurement.id;
                    
                    return (
                      <Card 
                        key={measurement.id} 
                        className={`${isSelected ? 'border-primary' : ''} cursor-pointer hover:border-primary/50 transition-colors`}
                        onClick={() => loadMeasurement(measurement)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{measurement.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {client ? `${client.firstName} ${client.lastName}` : 'Cliente no disponible'}
                              </p>
                              <p className="text-xs mt-1">
                                {format(new Date(measurement.createdAt), 'PPP', { locale: es })}
                              </p>
                              <div className="flex items-center mt-2">
                                <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                                  {SERVICE_TYPES.find(s => s.value === measurement.propertyType)?.label || measurement.propertyType}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadMeasurementData(measurement);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar medición?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Esta medición se eliminará permanentemente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteMeasurement(measurement.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ayuda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium">¿Cómo usar la herramienta de medición?</h3>
                <p className="text-muted-foreground mt-1">
                  Utilice la herramienta de medición digital para dibujar líneas en imágenes o en un lienzo en blanco.
                  Asegúrese de calibrar primero para obtener medidas precisas.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">¿Cómo funciona el escaneo LiDAR?</h3>
                <p className="text-muted-foreground mt-1">
                  El escaneo LiDAR simula la captura tridimensional de un espacio. 
                  Puede utilizar la simulación o cargar imágenes para generar mapas de profundidad.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">¿Para qué sirven las mediciones guardadas?</h3>
                <p className="text-muted-foreground mt-1">
                  Las mediciones guardadas pueden utilizarse para crear estimados precisos,
                  planificar proyectos y mantener un registro histórico de las propiedades de los clientes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}