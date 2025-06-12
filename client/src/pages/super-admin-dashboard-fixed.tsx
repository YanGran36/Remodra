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
  Shield,
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

// Component for super admin panel (SaaS owner)
export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Simulated statistics for the dashboard
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
      time: '2 hours ago', 
      plan: 'Professional',
      data: { email: 'contact@garciaconstruction.com' }
    },
    { 
      id: 2, 
      type: 'payment_success', 
      contractor: 'Smith Home Improvement', 
      time: '5 hours ago', 
      plan: 'Premium',
      data: { amount: 49.99, invoiceId: 'INV-1289' }
    },
    { 
      id: 3, 
      type: 'plan_upgraded', 
      contractor: 'Renovations Pro', 
      time: '12 hours ago', 
      plan: 'Professional',
      data: { oldPlan: 'Basic', newPlan: 'Professional' }
    },
    { 
      id: 4, 
      type: 'support_request', 
      contractor: 'Elite Roofing', 
      time: 'Yesterday', 
      plan: 'Professional',
      data: { ticketId: 'T-4582', subject: 'Billing issue' }
    },
    { 
      id: 5, 
      type: 'account_cancelled', 
      contractor: 'Budget Handyman', 
      time: 'Yesterday', 
      plan: 'Basic',
      data: { reason: 'Switched to another system' }
    }
  ];
  
  // Summary card component with luxury styling
  const SummaryCard = ({ title, value, icon, trend, percentage }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    trend?: 'up' | 'down'; 
    percentage?: number;
  }) => (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-700 backdrop-blur-sm border-2 border-amber-500 shadow-lg hover:shadow-2xl hover:border-amber-400 transition-all duration-300 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-amber-400">{title}</p>
            <h3 className="text-2xl font-bold mt-2 text-white">{value}</h3>
            
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
                <span className="text-xs text-gray-400">vs previous month</span>
              </div>
            )}
          </div>
          <div className="rounded-lg p-2 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Componente para la actividad reciente con animación
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
      <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors">
        <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm border animate-pulse-slow">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
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
      <Card className="card-luxury animate-float">
        <CardHeader>
          <CardTitle className="text-blue-gradient">Actividad Reciente</CardTitle>
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
          <Button variant="outline" size="sm" className="w-full border-gradient">
            <Activity className="mr-2 h-4 w-4" />
            Ver Todas las Actividades
          </Button>
        </CardFooter>
      </Card>
      
      {/* Próximos vencimientos de suscripción */}
      <Card className="card-luxury">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-blue-gradient">Próximos Vencimientos de Suscripción</CardTitle>
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
                <TableCell><Badge className="bg-amber-500">Premium</Badge></TableCell>
                <TableCell>{format(new Date(2023, 6, 22), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Por vencer</Badge></TableCell>
                <TableCell>$99.99/mes</TableCell>
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
                <TableCell><Badge className="bg-blue-500">Professional</Badge></TableCell>
                <TableCell>{format(new Date(2023, 6, 24), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Por vencer</Badge></TableCell>
                <TableCell>$49.99/mes</TableCell>
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
                <TableCell><Badge className="bg-gray-500">Basic</Badge></TableCell>
                <TableCell>{format(new Date(2023, 6, 28), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Por vencer</Badge></TableCell>
                <TableCell>$24.99/mes</TableCell>
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
            <Button variant="outline" size="sm" className="border-gradient">Ver Todos</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  // Componente para la gestión de contratistas
  const ContractorsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-blue-gradient">Gestión de Contratistas</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input type="text" placeholder="Buscar contratistas..." className="pl-8 border-gradient" />
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 transition-all"
            onClick={() => window.location.href = '/super-admin/add-contractor'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contratista
          </Button>
        </div>
      </div>

      <Card className="card-luxury">
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
                    <DropdownMenuContent align="end" className="glass-overlay">
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
                    <DropdownMenuContent align="end" className="glass-overlay">
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
                    <DropdownMenuContent align="end" className="glass-overlay">
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
                    <DropdownMenuContent align="end" className="glass-overlay">
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

  // Subscription management component
  const SubscriptionsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-yellow-500">Remodra Subscription Plans</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-yellow-600 text-gray-300 hover:bg-slate-600">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-yellow-900 hover:from-yellow-400 hover:to-yellow-600">
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Plan */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="border-b border-slate-600">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <CardTitle className="text-white text-xl">Basic Plan</CardTitle>
            </div>
            <CardDescription className="text-gray-300">For individual contractors just starting out</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold mb-6 text-blue-400">
              $29<span className="text-lg font-normal text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Up to 10 clients</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Unlimited estimates & invoices</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Client portal access</span>
              </li>
              <li className="flex items-center">
                <XCircle className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-gray-400">AI cost analysis</span>
              </li>
              <li className="flex items-center">
                <XCircle className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-gray-400">Time clock</span>
              </li>
              <li className="flex items-center">
                <XCircle className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-gray-400">Stripe payments</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="border-t border-slate-600 pt-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium transition-colors">
              Start with Basic
            </Button>
          </CardFooter>
        </Card>
        
        {/* Pro Plan - Most Popular */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-yellow-500 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative ring-2 ring-yellow-400/50">
          <CardHeader className="border-b border-slate-600 relative">
            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 mb-3 self-start font-bold px-3 py-1">
              Most Popular
            </Badge>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <CardTitle className="text-white text-xl">Pro Plan</CardTitle>
            </div>
            <CardDescription className="text-gray-300">For growing teams and contractors</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold mb-6 text-yellow-400">
              $59<span className="text-lg font-normal text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Up to 50 clients</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Unlimited estimates & invoices</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Custom client portal</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">AI-generated estimates (10/month)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Time clock</span>
              </li>
              <li className="flex items-center">
                <XCircle className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-gray-400">Stripe payments</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="border-t border-slate-600 pt-4">
            <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-yellow-900 font-bold rounded-lg py-2 transition-all">
              Start with Pro
            </Button>
          </CardFooter>
        </Card>
        
        {/* Business Plan */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-green-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="border-b border-slate-600">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <CardTitle className="text-white text-xl">Business Plan</CardTitle>
            </div>
            <CardDescription className="text-gray-300">For established remodeling companies</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold mb-6 text-green-400">
              $99<span className="text-lg font-normal text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Unlimited clients</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Unlimited estimates & invoices</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Fully branded client portal</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Unlimited AI cost analysis</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Time clock</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-white">Stripe integration</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="border-t border-slate-600 pt-4">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 font-medium transition-colors">
              Start with Business
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 pb-12">
      {/* Header with Remodra Branding */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 shadow-xl border-b-4 border-yellow-600">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Remodra Logo Image */}
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-yellow-500/50 border-2 border-yellow-600 bg-slate-900">
                <img 
                  src="/remodra-logo.png" 
                  alt="Remodra Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white tracking-wide" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Remodra
                </h1>
                <p className="text-yellow-200 text-lg font-medium">Super Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 p-3 rounded-xl shadow-lg border-2 border-yellow-400">
                <Shield className="h-6 w-6 text-yellow-900" />
              </div>
              <div className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 text-yellow-900 hover:from-yellow-400 hover:via-yellow-500 hover:to-yellow-600 text-lg px-6 py-3 rounded-lg font-bold shadow-xl border-2 border-yellow-400 transition-all duration-300">
                Super Admin
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto md:h-12 p-1 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 backdrop-blur-sm border-2 border-yellow-600 shadow-xl">
            <TabsTrigger value="overview" className="flex items-center gap-2 text-gray-300 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-700 data-[state=active]:text-yellow-900 data-[state=active]:shadow-lg hover:bg-slate-600 hover:text-white">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="contractors" className="flex items-center gap-2 text-gray-300 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-700 data-[state=active]:text-yellow-900 data-[state=active]:shadow-lg hover:bg-slate-600 hover:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Contractors</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2 text-gray-300 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-700 data-[state=active]:text-yellow-900 data-[state=active]:shadow-lg hover:bg-slate-600 hover:text-white">
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="reporting" className="flex items-center gap-2 text-gray-300 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-700 data-[state=active]:text-yellow-900 data-[state=active]:shadow-lg hover:bg-slate-600 hover:text-white">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 text-gray-300 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-700 data-[state=active]:text-yellow-900 data-[state=active]:shadow-lg hover:bg-slate-600 hover:text-white">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Settings</span>
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
              <h3 className="text-lg font-medium text-blue-gradient">Informes y Analíticas</h3>
              <p className="text-gray-500 mt-2">Visualización de datos de rendimiento y uso de la plataforma</p>
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-blue-gradient">Configuración de la Plataforma</h3>
              <p className="text-gray-500 mt-2">Ajustes generales, personalización y opciones avanzadas</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}