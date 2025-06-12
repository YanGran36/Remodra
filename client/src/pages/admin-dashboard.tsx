import { useState } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart, 
  FileText, 
  Users, 
  ClipboardList, 
  Calendar, 
  Settings,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Plus,
  Activity,
  Search,
  Send,
  Filter,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";

// Componente principal del panel de administración para contratistas
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Datos de ejemplo para el panel
  const companyInfo = {
    name: "ABC Construction",
    totalRevenue: 125750,
    pendingPayments: 35250,
    completedProjects: 24,
    activeProjects: 8,
    pendingEstimates: 5
  };
  
  // Componente para la tarjeta de resumen
  const SummaryCard = ({ title, value, icon, trend, percentage }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    trend?: 'up' | 'down'; 
    percentage?: number;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            
            {trend && percentage && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' ? (
                  <div className="flex items-center text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-xs font-medium">{percentage}%</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <ArrowDownRight className="h-4 w-4" />
                    <span className="text-xs font-medium">{percentage}%</span>
                  </div>
                )}
                <span className="text-xs text-gray-500">vs mes anterior</span>
              </div>
            )}
          </div>
          <div className="rounded-lg p-2 bg-primary/10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Componente de resumen general
  const OverviewTab = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Ingresos Totales" 
          value={`$${companyInfo.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          trend="up"
          percentage={12}
        />
        <SummaryCard 
          title="Pagos Pendientes" 
          value={`$${companyInfo.pendingPayments.toLocaleString()}`} 
          icon={<FileText className="h-6 w-6 text-primary" />}
          trend="down"
          percentage={5}
        />
        <SummaryCard 
          title="Proyectos Activos" 
          value={companyInfo.activeProjects} 
          icon={<Activity className="h-6 w-6 text-primary" />}
        />
        <SummaryCard 
          title="Presupuestos Pendientes" 
          value={companyInfo.pendingEstimates} 
          icon={<ClipboardList className="h-6 w-6 text-primary" />}
        />
      </div>
      
      {/* Próximos eventos y actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>Visitas y reuniones programadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {/* Evento 1 */}
                <div className="flex gap-4 items-start">
                  <div className="rounded-full bg-blue-100 text-blue-700 p-2 mt-1">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">Visita en sitio - John Smith</p>
                      <Badge variant="outline">{format(new Date(2023, 6, 22, 10, 0), "HH:mm", { locale: es })}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(2023, 6, 22), "PPP", { locale: es })}
                    </p>
                    <p className="text-sm mt-1">Medición para windows - 123 Main St</p>
                  </div>
                </div>
                
                {/* Evento 2 */}
                <div className="flex gap-4 items-start">
                  <div className="rounded-full bg-green-100 text-green-700 p-2 mt-1">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">Reunión con proveedor</p>
                      <Badge variant="outline">{format(new Date(2023, 6, 23, 14, 30), "HH:mm", { locale: es })}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(2023, 6, 23), "PPP", { locale: es })}
                    </p>
                    <p className="text-sm mt-1">Discusión de precios de materiales para roofs</p>
                  </div>
                </div>
                
                {/* Evento 3 */}
                <div className="flex gap-4 items-start">
                  <div className="rounded-full bg-amber-100 text-amber-700 p-2 mt-1">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">Inicio de obra - Mary Johnson</p>
                      <Badge variant="outline">{format(new Date(2023, 6, 24, 9, 0), "HH:mm", { locale: es })}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(2023, 6, 24), "PPP", { locale: es })}
                    </p>
                    <p className="text-sm mt-1">Demolición inicial - 456 Oak Avenue</p>
                  </div>
                </div>
                
                {/* Evento 4 */}
                <div className="flex gap-4 items-start">
                  <div className="rounded-full bg-purple-100 text-purple-700 p-2 mt-1">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">Presentación de presupuesto</p>
                      <Badge variant="outline">{format(new Date(2023, 6, 25, 16, 0), "HH:mm", { locale: es })}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(2023, 6, 25), "PPP", { locale: es })}
                    </p>
                    <p className="text-sm mt-1">Renovación de cocina - Robert Davis</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Ver Calendario Completo
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas actualizaciones del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {/* Actividad 1 */}
                <div className="flex gap-4 items-start">
                  <div className="rounded-full bg-green-100 text-green-700 p-2 mt-1">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Pago recibido</p>
                    <p className="text-sm text-gray-500">Hace 2 horas</p>
                    <p className="text-sm mt-1">Robert Davis - $1,250.00 por Factura #INV-1234</p>
                  </div>
                </div>
                
                {/* Actividad 2 */}
                <div className="flex gap-4 items-start">
                  <div className="rounded-full bg-blue-100 text-blue-700 p-2 mt-1">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Presupuesto aprobado</p>
                    <p className="text-sm text-gray-500">Ayer</p>
                    <p className="text-sm mt-1">John Smith - Presupuesto #1001 por $5,840.00</p>
                  </div>
                </div>
                
                {/* Actividad 3 */}
                <div className="flex gap-4 items-start">
                  <div className="rounded-full bg-amber-100 text-amber-700 p-2 mt-1">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Proyecto actualizado</p>
                    <p className="text-sm text-gray-500">Ayer</p>
                    <p className="text-sm mt-1">Instalación de Ventanas - Estado cambiado a "En Progreso"</p>
                  </div>
                </div>
                
                {/* Actividad 4 */}
                <div className="flex gap-4 items-start">
                  <div className="rounded-full bg-purple-100 text-purple-700 p-2 mt-1">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Nuevo cliente agregado</p>
                    <p className="text-sm text-gray-500">26 Jun 2023</p>
                    <p className="text-sm mt-1">Sarah Wilson - sarah@example.com</p>
                  </div>
                </div>
                
                {/* Actividad 5 */}
                <div className="flex gap-4 items-start">
                  <div className="rounded-full bg-red-100 text-red-700 p-2 mt-1">
                    <Send className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Factura enviada</p>
                    <p className="text-sm text-gray-500">25 Jun 2023</p>
                    <p className="text-sm mt-1">Mary Johnson - Factura #INV-1235 por $1,625.00</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              <Activity className="mr-2 h-4 w-4" />
              Ver Todo el Historial
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Proyectos en progreso */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Proyectos en Progreso</CardTitle>
              <CardDescription>Visión general de los proyectos activos</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Instalación de Ventanas</TableCell>
                <TableCell>John Smith</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <span className="text-xs whitespace-nowrap">65%</span>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(2023, 3, 18), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(2023, 7, 15), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge className="bg-blue-600">En Progreso</Badge></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Actualizar Estado</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Finalizar Proyecto</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Reparación de Techo</TableCell>
                <TableCell>Mary Johnson</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    <span className="text-xs whitespace-nowrap">25%</span>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(2023, 6, 10), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(2023, 8, 5), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge className="bg-blue-600">En Progreso</Badge></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Actualizar Estado</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Finalizar Proyecto</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Renovación de Cocina</TableCell>
                <TableCell>Robert Davis</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                    <span className="text-xs whitespace-nowrap">10%</span>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(2023, 6, 15), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(2023, 9, 30), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge className="bg-amber-500">Iniciando</Badge></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Actualizar Estado</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Finalizar Proyecto</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            Ver Todos los Proyectos
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // Componente para lista de clientes
  const ClientsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Gestión de Clientes</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input type="text" placeholder="Buscar clientes..." className="pl-8" />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Proyectos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">John Smith</TableCell>
                <TableCell>john@example.com</TableCell>
                <TableCell>(555) 123-4567</TableCell>
                <TableCell className="max-w-[200px] truncate">123 Main St, Anytown, CA 12345</TableCell>
                <TableCell>2 Activos, 3 Completados</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Activo</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuItem>Crear Presupuesto</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Generar Portal</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Mary Johnson</TableCell>
                <TableCell>mary@example.com</TableCell>
                <TableCell>(555) 234-5678</TableCell>
                <TableCell className="max-w-[200px] truncate">456 Oak Ave, Somewhere, NY 54321</TableCell>
                <TableCell>1 Activo, 1 Completado</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Activo</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuItem>Crear Presupuesto</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Generar Portal</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Robert Davis</TableCell>
                <TableCell>robert@example.com</TableCell>
                <TableCell>(555) 345-6789</TableCell>
                <TableCell className="max-w-[200px] truncate">789 Pine St, Elsewhere, TX 67890</TableCell>
                <TableCell>1 Activo</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Activo</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuItem>Crear Presupuesto</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Generar Portal</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Sarah Wilson</TableCell>
                <TableCell>sarah@example.com</TableCell>
                <TableCell>(555) 456-7890</TableCell>
                <TableCell className="max-w-[200px] truncate">321 Cedar Rd, Nowhere, FL 13579</TableCell>
                <TableCell>0 Activos</TableCell>
                <TableCell>
                  <Badge variant="outline">Potencial</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuItem>Crear Presupuesto</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Generar Portal</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Mostrando 4 de 24 clientes
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Siguiente</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  // Componente para estimaciones
  const EstimatesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Gestión de Presupuestos</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Presupuesto
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Presupuesto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">#1001</TableCell>
                <TableCell>John Smith</TableCell>
                <TableCell>Reparación de Techo</TableCell>
                <TableCell>{format(new Date(2023, 6, 15), "dd/MM/yyyy")}</TableCell>
                <TableCell>$5,840.00</TableCell>
                <TableCell>
                  <Badge className="bg-amber-500">Pendiente</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Enviar al Cliente</DropdownMenuItem>
                      <DropdownMenuItem>Crear Factura</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Marcar Aprobado</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">#1000</TableCell>
                <TableCell>Robert Davis</TableCell>
                <TableCell>Renovación de Cocina</TableCell>
                <TableCell>{format(new Date(2023, 6, 10), "dd/MM/yyyy")}</TableCell>
                <TableCell>$12,450.00</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Aprobado</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Enviar al Cliente</DropdownMenuItem>
                      <DropdownMenuItem>Crear Factura</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">#982</TableCell>
                <TableCell>John Smith</TableCell>
                <TableCell>Instalación de Ventanas</TableCell>
                <TableCell>{format(new Date(2023, 3, 15), "dd/MM/yyyy")}</TableCell>
                <TableCell>$3,250.00</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Aprobado</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Enviar al Cliente</DropdownMenuItem>
                      <DropdownMenuItem>Crear Factura</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">#975</TableCell>
                <TableCell>Sarah Wilson</TableCell>
                <TableCell>Cercado de Jardín</TableCell>
                <TableCell>{format(new Date(2023, 3, 5), "dd/MM/yyyy")}</TableCell>
                <TableCell>$2,180.00</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-red-600 border-red-300">Rechazado</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Crear Nuevo</DropdownMenuItem>
                      <DropdownMenuItem>Contactar Cliente</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Mostrando 4 de 15 presupuestos
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Siguiente</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  // Componente para facturas
  const InvoicesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Gestión de Facturas</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">#INV-1235</TableCell>
                <TableCell>John Smith</TableCell>
                <TableCell>Instalación de Ventanas</TableCell>
                <TableCell>{format(new Date(2023, 6, 18), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(2023, 6, 30), "dd/MM/yyyy")}</TableCell>
                <TableCell>$1,625.00</TableCell>
                <TableCell>
                  <Badge className="bg-amber-500">Pendiente Firma</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Reenviar</DropdownMenuItem>
                      <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Registrar Pago</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">#INV-1234</TableCell>
                <TableCell>Robert Davis</TableCell>
                <TableCell>Renovación de Cocina</TableCell>
                <TableCell>{format(new Date(2023, 6, 15), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(2023, 6, 29), "dd/MM/yyyy")}</TableCell>
                <TableCell>$1,250.00</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Pagada</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Recibo</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">#INV-1180</TableCell>
                <TableCell>Mary Johnson</TableCell>
                <TableCell>Reparación de Baño</TableCell>
                <TableCell>{format(new Date(2023, 3, 15), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(2023, 3, 29), "dd/MM/yyyy")}</TableCell>
                <TableCell>$2,750.00</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Pagada</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Recibo</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">#INV-1153</TableCell>
                <TableCell>John Smith</TableCell>
                <TableCell>Reparación de Techo</TableCell>
                <TableCell>{format(new Date(2023, 2, 10), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(2023, 2, 24), "dd/MM/yyyy")}</TableCell>
                <TableCell>$1,750.00</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-red-600 border-red-300">Vencida</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Recordatorio</DropdownMenuItem>
                      <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Registrar Pago</DropdownMenuItem>
                      <DropdownMenuItem>Marcar Como Perdida</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Mostrando 4 de 32 facturas
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Siguiente</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-gray-500">Bienvenido a ContractorHub, {companyInfo.name}</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto md:h-10">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden md:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="estimates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Presupuestos</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden md:inline">Facturas</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Calendario</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Configuración</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="clients">
          <ClientsTab />
        </TabsContent>
        <TabsContent value="estimates">
          <EstimatesTab />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>
        <TabsContent value="calendar">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">Funcionalidad de Calendario</h3>
            <p className="text-gray-500 mt-2">Calendario interactivo para gestionar citas y eventos</p>
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">Configuración de la Cuenta</h3>
            <p className="text-gray-500 mt-2">Ajustes de la empresa, perfil, notificaciones y preferencias</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}