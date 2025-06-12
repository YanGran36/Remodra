import React from 'react';
import { useLocation, Link } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  Calendar, 
  Settings, 
  LogOut,
  Clock
} from 'lucide-react';

const AdminSidebar = () => {
  const [location] = useLocation();

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/dashboard', 
      active: location === '/dashboard' 
    },
    { 
      icon: Users, 
      label: 'Clients', 
      href: '/clients', 
      active: location === '/clients' 
    },
    { 
      icon: FileText, 
      label: 'Estimates', 
      href: '/estimates', 
      active: location === '/estimates' || location.startsWith('/vendor-service-estimate')
    },
    { 
      icon: DollarSign, 
      label: 'Pricing Setup', 
      href: '/pricing', 
      active: location === '/pricing' 
    },
    { 
      icon: Calendar, 
      label: 'Calendar', 
      href: '/calendar', 
      active: location === '/calendar' 
    },
    { 
      icon: Clock, 
      label: 'Time Control', 
      href: '/time-tracking', 
      active: location === '/time-tracking' 
    },
    { 
      icon: Settings, 
      label: 'Configuración', 
      href: '/settings', 
      active: location === '/settings' 
    }
  ];

  return (
    <aside className="hidden md:flex md:w-64 border-r flex-col fixed inset-y-0">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">ContractorHub</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link key={index} href={item.href}>
              <a className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                item.active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <a 
          href="/api/logout" 
          className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </a>
      </div>
    </aside>
  );
};

export default AdminSidebar;