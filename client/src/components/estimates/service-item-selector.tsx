import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface ServiceItemSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ServiceItemSelector({ value, onChange }: ServiceItemSelectorProps) {
  const { 
    data: services, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/direct/services'],
    retry: 1,
  });

  // Mostrar loading mientras se cargan los servicios
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="text-lg font-semibold mb-2">Multi Services</div>
        <div className="text-gray-500">Loading services...</div>
      </div>
    );
  }

  // Mostrar error si hay problemas
  if (error) {
    return (
      <div className="mb-6">
        <div className="text-lg font-semibold mb-2">Multi Services</div>
        <div className="text-red-500">Error loading services. Please try again.</div>
      </div>
    );
  }

  // Asegurar que services es un array
  const servicesArray = Array.isArray(services) ? services : [];
  
  // Mostrar mensaje si no hay servicios
  if (servicesArray.length === 0) {
    return (
      <div className="mb-6">
        <div className="text-lg font-semibold mb-2">Multi Services</div>
        <div className="text-gray-500">
          No services configured. Please add services in your pricing configuration first.
        </div>
      </div>
    );
  }

  // Renderizar las tarjetas de servicios
  return (
    <div className="mb-6">
      <div className="text-lg font-semibold mb-2">Multi Services</div>
      
      <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg mb-4">
        <div className="text-center text-blue-700 font-medium">
          ✅ Found {servicesArray.length} services configured
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {servicesArray.map((service: any) => {
          const isSelected = value === service.serviceType;
          const laborRate = parseFloat(service.laborRate || "0");
          
          // Get service icon based on type
          const getServiceIcon = (serviceType: string) => {
            switch(serviceType) {
              case 'roof': return '🏠';
              case 'fence': return '🔧';
              case 'deck': return '🪵';
              case 'windows': return '🪟';
              default: return '⚒️';
            }
          };
          
          return (
            <Card 
              key={service.id}
              className={cn(
                "transition-all relative overflow-hidden border-2 cursor-pointer hover:shadow-lg",
                isSelected 
                  ? "border-blue-500 bg-blue-50 shadow-lg scale-105" 
                  : "border-gray-200 hover:border-blue-300"
              )}
              onClick={() => onChange(service.serviceType)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">{getServiceIcon(service.serviceType)}</span>
                  {service.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>Labor Rate:</strong> ${laborRate.toFixed(2)}/{service.unit}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Service Type:</strong> {service.serviceType}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Method:</strong> {service.laborMethod || service.laborCalculationMethod || 'by_area'}
                  </div>
                </div>
                
                {/* Professional descriptions based on service type */}
                <div className="mt-3 pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    {service.serviceType === 'roof' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Complete roof installation and replacement</li>
                        <li>Shingle, tile, and metal roofing options</li>
                        <li>Weatherproofing and insulation included</li>
                      </ul>
                    )}
                    {service.serviceType === 'fence' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Custom fence design and installation</li>
                        <li>Wood, vinyl, aluminum materials available</li>
                        <li>Gate installation and hardware included</li>
                      </ul>
                    )}
                    {service.serviceType === 'deck' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Custom deck construction and design</li>
                        <li>Composite, wood, and PVC materials</li>
                        <li>Railings, stairs, and lighting options</li>
                      </ul>
                    )}
                    {service.serviceType === 'windows' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Energy-efficient window installation</li>
                        <li>Double and triple-pane options</li>
                        <li>Custom sizes and styles available</li>
                      </ul>
                    )}
                  </div>
                </div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Helpful message */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          💡 <strong>Tip:</strong> Select a service to see pricing details and configure labor calculations for your estimate.
        </p>
      </div>
    </div>
  );
}

export default ServiceItemSelector;