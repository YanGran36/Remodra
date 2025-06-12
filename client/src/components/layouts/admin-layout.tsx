import React from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [location, navigate] = useLocation();

  // Podemos agregar lógica de autenticación o navegación aquí
  
  return (
    <div className="flex min-h-screen bg-background">
      <Helmet>
        <title>Admin Dashboard | ContractorHub</title>
      </Helmet>
      
      {/* Barra lateral - esto se puede expandir a un componente completo */}
      <aside className="hidden md:flex md:w-64 border-r bg-muted/20 flex-col fixed inset-y-0">
        <div className="p-6">
          <h2 className="text-xl font-bold">ContractorHub</h2>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <a 
                href="/dashboard" 
                className={`flex items-center p-2 rounded-md ${location === '/dashboard' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Dashboard
              </a>
            </li>
            <li>
              <a 
                href="/clients" 
                className={`flex items-center p-2 rounded-md ${location === '/clients' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Clientes
              </a>
            </li>
            <li>
              <a 
                href="/estimates" 
                className={`flex items-center p-2 rounded-md ${location === '/estimates' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Estimados
              </a>
            </li>
            <li>
              <a 
                href="/pricing" 
                className={`flex items-center p-2 rounded-md ${location === '/pricing' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Configuración de Precios
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      
      <div className="flex-1 md:ml-64">
        <header className="border-b h-14 flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-lg font-medium">Panel de Administración</h1>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;