import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ServicesConfig from "@/components/pdf/services-config";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function CompanyServicesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/settings")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Configuración
          </Button>
          <h1 className="text-2xl font-bold">Servicios de la Compañía</h1>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Administrar Servicios</CardTitle>
          <CardDescription>
            Configure los servicios que su compañía ofrece para incluirlos en estimaciones e invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServicesConfig 
            contractorId={1} 
            onSave={() => {
              // Si es necesario, redirigir a otra página después de guardar
            }} 
          />
        </CardContent>
      </Card>
    </div>
  );
}