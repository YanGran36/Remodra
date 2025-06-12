import { useState } from "react";
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
  Users, 
  Home,
  User,
  CreditCard, 
  Settings,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Plus,
  Activity,
  Search,
  Filter,
  Download,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Ruler,
  HardDrive,
  FileText,
  CheckSquare,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArchitecturalCard, 
  ArchitecturalContainer, 
  ArchitecturalHeader,
  ArchitecturalGrid,
  ArchitecturalStat
} from "@/components/ui/architectural-card";

export default function AdminDashboardArchitectural() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();

  // Datos simulados para el dashboard
  const dashboardData = {
    clientsCount: 24,
    activeProjectsCount: 8,
    totalEstimates: 18,
    pendingEstimates: 3,
    acceptedEstimates: 12,
    rejectedEstimates: 3,
    upcomingAppointments: [
      {
        id: 1,
        client: "Ana García",
        property: "1234 Maple Avenue",
        date: new Date(2023, 6, 22, 10, 30),
        service: "Evaluación de Techo",
        status: "scheduled"
      },
      {
        id: 2,
        client: "Carlos Méndez",
        property: "567 Pine Street",
        date: new Date(2023, 6, 23, 14, 0),
        service: "Medición para Cerca",
        status: "confirmed"
      },
      {
        id: 3,
        client: "María Rodríguez",
        property: "890 Oak Road",
        date: new Date(2023, 6, 24, 9, 0),
        service: "Presupuesto Ventanas",
        status: "pending"
      }
    ],
    recentProjects: [
      {
        id: 1,
        client: "Roberto Torres",
        address: "1470 Cedar Lane",
        service: "Instalación de Techo",
        status: "in_progress",
        completion: 65,
        lastUpdate: new Date(2023, 6, 20)
      },
      {
        id: 2,
        client: "Elena Vargas",
        address: "892 Birch Street",
        service: "Renovación de Deck",
        status: "completed",
        completion: 100,
        lastUpdate: new Date(2023, 6, 18)
      },
      {
        id: 3,
        client: "Pedro Sánchez",
        address: "345 Willow Drive",
        service: "Instalación de Verja",
        status: "planning",
        completion: 15,
        lastUpdate: new Date(2023, 6, 21)
      }
    ],
    recentClientActivity: [
      {
        id: 1,
        client: "Javier Morales",
        action: "Firmó una factura",
        item: "Invoice #3592",
        time: "Hace 3 horas"
      },
      {
        id: 2,
        client: "Laura Díaz",
        action: "Aceptó estimación",
        item: "Estimate #1243",
        time: "Hace 6 horas"
      },
      {
        id: 3,
        client: "Miguel Ortiz",
        action: "Vio estimación",
        item: "Estimate #1245",
        time: "Hace 1 día"
      }
    ]
  };

  // Componente para la actividad reciente
  const ActivityItem = ({ activity }: { activity: any }) => {
    return (
      <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors">
        <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm border">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div>
              <p className="font-medium">{activity.client}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activity.action}: <span className="font-medium">{activity.item}</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
        </div>
      </div>
    );
  };

  // Proyectos recientes
  const ProjectItem = ({ project }: { project: any }) => {
    let statusBadge;
    switch (project.status) {
      case 'in_progress':
        statusBadge = <Badge className="bg-blue-500">En Progreso</Badge>;
        break;
      case 'completed':
        statusBadge = <Badge className="bg-green-500">Completado</Badge>;
        break;
      case 'planning':
        statusBadge = <Badge className="bg-amber-500">Planificación</Badge>;
        break;
      default:
        statusBadge = <Badge className="bg-gray-500">Pendiente</Badge>;
    }
    
    return (
      <ArchitecturalCard className="p-5">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{project.client}</h3>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <Home className="mr-1 h-3.5 w-3.5" /> 
                {project.address}
              </p>
            </div>
            {statusBadge}
          </div>
          
          <p className="text-sm">{project.service}</p>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full" 
              style={{ width: `${project.completion}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-muted-foreground">
              {project.completion}% Completado
            </span>
            <span className="text-xs text-muted-foreground">
              Actualizado: {format(project.lastUpdate, "dd/MM/yyyy")}
            </span>
          </div>
        </div>
      </ArchitecturalCard>
    );
  };

  // Vista de Resumen/Dashboard
  const OverviewTab = () => (
    <div className="space-y-6">
      <ArchitecturalGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <ArchitecturalStat
          title="Clientes Totales"
          value={dashboardData.clientsCount}
          icon={<Users className="h-5 w-5" />}
          trend="up"
          percentage={8}
        />
        <ArchitecturalStat
          title="Proyectos Activos"
          value={dashboardData.activeProjectsCount}
          icon={<HardDrive className="h-5 w-5" />}
          trend="up"
          percentage={12}
        />
        <ArchitecturalStat
          title="Estimaciones Pendientes"
          value={dashboardData.pendingEstimates}
          icon={<FileText className="h-5 w-5" />}
          trend="down"
          percentage={5}
        />
        <ArchitecturalStat
          title="Aceptación Estimaciones"
          value={`${Math.round((dashboardData.acceptedEstimates / dashboardData.totalEstimates) * 100)}%`}
          icon={<CheckSquare className="h-5 w-5" />}
          trend="up"
          percentage={3}
        />
      </ArchitecturalGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Citas */}
        <ArchitecturalCard hasPattern={true}>
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-gradient flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Próximas Citas
            </CardTitle>
            <CardDescription>
              Visitas programadas para los próximos días
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-4">
              {dashboardData.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium">{appointment.client}</p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Home className="mr-1 h-3.5 w-3.5" /> 
                      {appointment.property}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Clock className="mr-1 h-3.5 w-3.5" /> 
                      {format(appointment.date, "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end">
                    <Badge 
                      className={`
                        ${appointment.status === 'confirmed' ? 'bg-green-500' : 
                          appointment.status === 'scheduled' ? 'bg-blue-500' : 'bg-amber-500'}
                      `}
                    >
                      {appointment.status === 'confirmed' ? 'Confirmada' : 
                       appointment.status === 'scheduled' ? 'Programada' : 'Pendiente'}
                    </Badge>
                    <span className="text-sm mt-2">{appointment.service}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Ver todas las citas
            </Button>
          </CardFooter>
        </ArchitecturalCard>

        {/* Actividad de Clientes */}
        <ArchitecturalCard hasPattern={true}>
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-gradient flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Interacciones recientes de clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-1">
                {dashboardData.recentClientActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              <Activity className="mr-2 h-4 w-4" />
              Ver toda la actividad
            </Button>
          </CardFooter>
        </ArchitecturalCard>
      </div>

      {/* Proyectos Recientes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-gradient flex items-center">
            <HardHat className="mr-2 h-5 w-5" />
            Proyectos Recientes
          </h2>
          <Button variant="outline" size="sm">
            Ver todos
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboardData.recentProjects.map((project) => (
            <ProjectItem key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );

  // Vista de Clientes
  const ClientsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-blue-gradient flex items-center">
          <Users className="mr-2 h-6 w-6" />
          Gestión de Clientes
        </h2>
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

      <ArchitecturalCard>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Proyectos</TableHead>
                <TableHead>Estimaciones</TableHead>
                <TableHead>Facturas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">María Fernandez</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> 
                      maria@example.com
                    </span>
                    <span className="flex items-center text-sm mt-1">
                      <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> 
                      555-1234
                    </span>
                  </div>
                </TableCell>
                <TableCell>3</TableCell>
                <TableCell>2</TableCell>
                <TableCell>5</TableCell>
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
                    <DropdownMenuContent align="end" className="glass-overlay">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar Cliente</DropdownMenuItem>
                      <DropdownMenuItem>Crear Estimación</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Roberto Sánchez</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> 
                      roberto@example.com
                    </span>
                    <span className="flex items-center text-sm mt-1">
                      <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> 
                      555-5678
                    </span>
                  </div>
                </TableCell>
                <TableCell>1</TableCell>
                <TableCell>1</TableCell>
                <TableCell>2</TableCell>
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
                    <DropdownMenuContent align="end" className="glass-overlay">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar Cliente</DropdownMenuItem>
                      <DropdownMenuItem>Crear Estimación</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Ana López</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> 
                      ana@example.com
                    </span>
                    <span className="flex items-center text-sm mt-1">
                      <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> 
                      555-9012
                    </span>
                  </div>
                </TableCell>
                <TableCell>0</TableCell>
                <TableCell>1</TableCell>
                <TableCell>0</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-amber-500 text-amber-600">Prospecto</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-overlay">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar Cliente</DropdownMenuItem>
                      <DropdownMenuItem>Crear Estimación</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Mostrando 3 de 24 clientes
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Siguiente</Button>
          </div>
        </CardFooter>
      </ArchitecturalCard>
    </div>
  );

  return (
    <ArchitecturalContainer>
      <ArchitecturalHeader 
        title="Panel de Administración"
        description={`Bienvenido, ${user?.firstName || 'Contratista'}. Gestiona tus proyectos, clientes y estimaciones desde este panel.`}
      >
        <div className="flex flex-wrap gap-4 mt-6">
          <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
          <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <FileText className="mr-2 h-4 w-4" />
            Nueva Estimación
          </Button>
          <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </ArchitecturalHeader>
      
      <div className="container mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto md:h-12 p-1 glass-overlay shadow-lg border border-border/30">
            <TabsTrigger value="overview" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <HardHat className="h-4 w-4" />
              <span className="hidden md:inline">Proyectos</span>
            </TabsTrigger>
            <TabsTrigger value="estimates" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Estimaciones</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">Facturas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
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
          
          <TabsContent value="projects">
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold text-blue-gradient">Gestión de Proyectos</h3>
              <p className="text-gray-500 mt-2">Administra todos tus proyectos activos y finalizados</p>
            </div>
          </TabsContent>
          
          <TabsContent value="estimates">
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold text-blue-gradient">Gestión de Estimaciones</h3>
              <p className="text-gray-500 mt-2">Crea y gestiona estimaciones para tus clientes</p>
            </div>
          </TabsContent>
          
          <TabsContent value="invoices">
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold text-blue-gradient">Gestión de Facturas</h3>
              <p className="text-gray-500 mt-2">Administra tus facturas y pagos</p>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold text-blue-gradient">Configuración</h3>
              <p className="text-gray-500 mt-2">Administra tus preferencias y ajustes de cuenta</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ArchitecturalContainer>
  );
}