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
  Building, 
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
  UserCheck,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";

// Componente para el panel super admin (dueño del SaaS)
export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Estadísticas simuladas para el panel
  const platformStats = {
    totalContractors: 56,
    activeContractors: 48,
    monthlyRevenue: 5600,
    yearToDateRevenue: 47500,
    newContractorsThisMonth: 8,
    contractorRetentionRate: 92
  };
  
  const recentActivities = [
    { 
      id: 1, 
      type: 'new_contractor', 
      contractor: 'Garcia Construction LLC', 
      time: '2 horas', 
      plan: 'Professional',
      data: { email: 'contact@garciaconstruction.com' }
    },
    { 
      id: 2, 
      type: 'payment_success', 
      contractor: 'Smith Home Improvement', 
      time: '5 horas', 
      plan: 'Premium',
      data: { amount: 49.99, invoiceId: 'INV-1289' }
    },
    { 
      id: 3, 
      type: 'plan_upgraded', 
      contractor: 'Renovations Pro', 
      time: '12 horas', 
      plan: 'Professional',
      data: { oldPlan: 'Basic', newPlan: 'Professional' }
    },
    { 
      id: 4, 
      type: 'support_request', 
      contractor: 'Elite Roofing', 
      time: 'Ayer', 
      plan: 'Professional',
      data: { ticketId: 'T-4582', subject: 'Problema con facturación' }
    },
    { 
      id: 5, 
      type: 'account_cancelled', 
      contractor: 'Budget Handyman', 
      time: 'Ayer', 
      plan: 'Basic',
      data: { reason: 'Cambio a otro sistema' }
    }
  ];
  
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
  
  // Componente para la actividad reciente
  const ActivityItem = ({ activity }: { activity: any }) => {
    let icon;
    let title;
    let description;
    let badgeColor;

    switch (activity.type) {
      case 'new_contractor':
        icon = <UserPlus className="h-5 w-5 text-blue-500" />;
        title = `Nuevo contratista registrado`;
        description = `${activity.contractor} (${activity.data.email})`;
        badgeColor = "bg-blue-100 text-blue-800";
        break;
      case 'payment_success':
        icon = <DollarSign className="h-5 w-5 text-green-500" />;
        title = `Pago recibido`;
        description = `${activity.contractor} - $${activity.data.amount} - #${activity.data.invoiceId}`;
        badgeColor = "bg-green-100 text-green-800";
        break;
      case 'plan_upgraded':
        icon = <ArrowUpRight className="h-5 w-5 text-purple-500" />;
        title = `Plan actualizado`;
        description = `${activity.contractor}: ${activity.data.oldPlan} → ${activity.data.newPlan}`;
        badgeColor = "bg-purple-100 text-purple-800";
        break;
      case 'support_request':
        icon = <Mail className="h-5 w-5 text-amber-500" />;
        title = `Solicitud de soporte`;
        description = `${activity.contractor} - ${activity.data.subject}`;
        badgeColor = "bg-amber-100 text-amber-800";
        break;
      case 'account_cancelled':
        icon = <XCircle className="h-5 w-5 text-red-500" />;
        title = `Cuenta cancelada`;
        description = `${activity.contractor} - Razón: ${activity.data.reason}`;
        badgeColor = "bg-red-100 text-red-800";
        break;
      default:
        icon = <Activity className="h-5 w-5 text-gray-500" />;
        title = `Actividad`;
        description = `${activity.contractor}`;
        badgeColor = "bg-gray-100 text-gray-800";
    }
    
    return (
      <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
        <div className="bg-white p-2 rounded-full shadow-sm border">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <Badge className={`${badgeColor} ml-2`}>{activity.plan}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">Hace {activity.time}</p>
        </div>
      </div>
    );
  };

  // Componente de resumen general
  const OverviewTab = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Contratistas Totales" 
          value={platformStats.totalContractors} 
          icon={<Users className="h-6 w-6 text-primary" />}
          trend="up"
          percentage={12}
        />
        <SummaryCard 
          title="Contratistas Activos" 
          value={platformStats.activeContractors} 
          icon={<UserCheck className="h-6 w-6 text-primary" />}
          trend="up"
          percentage={8}
        />
        <SummaryCard 
          title="Ingresos Mensuales" 
          value={`$${platformStats.monthlyRevenue.toLocaleString()}`} 
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          trend="up"
          percentage={15}
        />
        <SummaryCard 
          title="Tasa de Retención" 
          value={`${platformStats.contractorRetentionRate}%`} 
          icon={<Activity className="h-6 w-6 text-primary" />}
          trend="down"
          percentage={2}
        />
      </div>
      
      {/* Actividad reciente */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Últimas actualizaciones en la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            <Activity className="mr-2 h-4 w-4" />
            Ver Todas las Actividades
          </Button>
        </CardFooter>
      </Card>
      
      {/* Próximos vencimientos de suscripción */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Próximos Vencimientos de Suscripción</CardTitle>
              <CardDescription>Contratistas con suscripciones a vencer en los próximos 15 días</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contratista</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Facturación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Lopez Contractors Inc.</TableCell>
                <TableCell>Premium</TableCell>
                <TableCell>{format(new Date(2023, 6, 22), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge className="bg-amber-500">Por vencer</Badge></TableCell>
                <TableCell>$99.99/mes</TableCell>
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
                      <DropdownMenuItem>Extender Suscripción</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Dar de Baja</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Martinez Home Services</TableCell>
                <TableCell>Professional</TableCell>
                <TableCell>{format(new Date(2023, 6, 24), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge className="bg-amber-500">Por vencer</Badge></TableCell>
                <TableCell>$49.99/mes</TableCell>
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
                      <DropdownMenuItem>Extender Suscripción</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Dar de Baja</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Premium Construction Co.</TableCell>
                <TableCell>Basic</TableCell>
                <TableCell>{format(new Date(2023, 6, 28), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge className="bg-amber-500">Por vencer</Badge></TableCell>
                <TableCell>$24.99/mes</TableCell>
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
                      <DropdownMenuItem>Extender Suscripción</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Dar de Baja</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Mostrando 3 de 12 vencimientos próximos
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm">Ver Todos</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  // Componente para la gestión de contratistas
  const ContractorsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Gestión de Contratistas</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input type="text" placeholder="Buscar contratistas..." className="pl-8" />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contratista
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compañía</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ingresos/mes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">ABC Construction</TableCell>
                <TableCell><Badge className="bg-purple-600">Premium</Badge></TableCell>
                <TableCell>{format(new Date(2022, 3, 15), "dd/MM/yyyy")}</TableCell>
                <TableCell>32</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Activo</Badge>
                </TableCell>
                <TableCell>$99.99</TableCell>
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
                      <DropdownMenuItem>Editar Plan</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Suspender Cuenta</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Smith Home Improvement</TableCell>
                <TableCell><Badge className="bg-blue-600">Professional</Badge></TableCell>
                <TableCell>{format(new Date(2022, 6, 10), "dd/MM/yyyy")}</TableCell>
                <TableCell>18</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Activo</Badge>
                </TableCell>
                <TableCell>$49.99</TableCell>
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
                      <DropdownMenuItem>Editar Plan</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Suspender Cuenta</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Roberts Renovations</TableCell>
                <TableCell><Badge className="bg-gray-600">Basic</Badge></TableCell>
                <TableCell>{format(new Date(2023, 1, 5), "dd/MM/yyyy")}</TableCell>
                <TableCell>8</TableCell>
                <TableCell>
                  <Badge className="bg-green-600">Activo</Badge>
                </TableCell>
                <TableCell>$24.99</TableCell>
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
                      <DropdownMenuItem>Editar Plan</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Suspender Cuenta</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium">Elite Roofing</TableCell>
                <TableCell><Badge className="bg-blue-600">Professional</Badge></TableCell>
                <TableCell>{format(new Date(2023, 2, 20), "dd/MM/yyyy")}</TableCell>
                <TableCell>14</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">Suspendido</Badge>
                </TableCell>
                <TableCell>$0.00</TableCell>
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
                      <DropdownMenuItem>Editar Plan</DropdownMenuItem>
                      <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-green-600">Reactivar Cuenta</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Mostrando 4 de 56 contratistas
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Siguiente</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  // Componente para la gestión de suscripciones
  const SubscriptionsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Planes y Suscripciones</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Plan Básico</CardTitle>
            <CardDescription>Para contratistas individuales o que recién comienzan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">$24.99 <span className="text-base font-normal text-gray-500">/mes</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Hasta 10 clientes</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Estimaciones y facturas ilimitadas</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Portal de cliente</span>
              </li>
              <li className="flex items-center">
                <XCircle className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-500">Análisis de costos con IA</span>
              </li>
              <li className="flex items-center">
                <XCircle className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-500">Integración con Stripe</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-gray-500">18 contratistas activos</div>
            <Button variant="outline" size="sm">Editar</Button>
          </CardFooter>
        </Card>
        
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <Badge className="bg-primary mb-2 self-start">Popular</Badge>
            <CardTitle>Plan Profesional</CardTitle>
            <CardDescription>Para contratistas con volumen medio de clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">$49.99 <span className="text-base font-normal text-gray-500">/mes</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Hasta 50 clientes</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Estimaciones y facturas ilimitadas</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Portal de cliente personalizable</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Análisis de costos con IA (10/mes)</span>
              </li>
              <li className="flex items-center">
                <XCircle className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-500">Integración con Stripe</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-gray-500">26 contratistas activos</div>
            <Button variant="outline" size="sm">Editar</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Plan Premium</CardTitle>
            <CardDescription>Para negocios establecidos con gran volumen de clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">$99.99 <span className="text-base font-normal text-gray-500">/mes</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Clientes ilimitados</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Estimaciones y facturas ilimitadas</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Portal de cliente con marca personalizada</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Análisis de costos con IA ilimitado</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span>Integración con Stripe</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-gray-500">12 contratistas activos</div>
            <Button variant="outline" size="sm">Editar</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="bg-pattern-grid min-h-screen pb-12">
      <div className="bg-luxury-gradient py-12 mb-8 shadow-lg relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white animate-float">Panel de Super Administrador</h1>
          <p className="text-white/70 text-lg max-w-3xl">Bienvenido al panel de gestión de ContractorHub. Administra contratistas, suscripciones y datos de toda la plataforma.</p>
        </div>
      </div>
      
      <div className="container mx-auto p-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto md:h-12 p-1 glass-overlay shadow-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="contractors" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Contratistas</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">Suscripciones</span>
            </TabsTrigger>
            <TabsTrigger value="reporting" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Configuración</span>
            </TabsTrigger>
          </TabsList>
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="contractors">
          <ContractorsTab />
        </TabsContent>
        <TabsContent value="subscriptions">
          <SubscriptionsTab />
        </TabsContent>
        <TabsContent value="reporting">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">Informes y Analíticas</h3>
            <p className="text-gray-500 mt-2">Visualización de datos de rendimiento y uso de la plataforma</p>
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">Configuración de la Plataforma</h3>
            <p className="text-gray-500 mt-2">Ajustes generales, personalización y opciones avanzadas</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}