import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useEstimates } from "@/hooks/use-estimates";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

// Función de utilidad para formatear moneda
const formatCurrency = (amount: number | string = 0) => {
  if (typeof amount === 'string') amount = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(amount);
};

export default function EstimatePrintPage() {
  const [, params] = useRoute("/estimates/:id/print");
  const estimateId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const { getEstimate } = useEstimates();
  const { data: estimate, isLoading } = getEstimate(estimateId);
  
  // Función para imprimir automáticamente la página
  useEffect(() => {
    // Un breve tiempo de espera para asegurar que todo el contenido esté renderizado
    if (!isLoading && estimate) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, estimate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Estimado no encontrado</h1>
        <p className="text-muted-foreground mb-6">No se pudo encontrar el estimado solicitado.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl bg-white">
      {/* Botón de impresión (visible solo en pantalla, no al imprimir) */}
      <div className="print:hidden mb-4 flex justify-end">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>
      
      <Card className="shadow-none border-none print:shadow-none">
        <CardContent className="p-0">
          {/* Encabezado */}
          <div className="flex justify-between items-start mb-6 border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold">ESTIMADO</h1>
              <p className="text-lg text-muted-foreground"># {estimate.estimateNumber || estimate.id}</p>
            </div>
            <div className="text-right">
              {user?.companyName && (
                <h2 className="text-xl font-bold">{user.companyName}</h2>
              )}
              <p>
                {user?.firstName} {user?.lastName}
              </p>
              {user?.email && <p>{user.email}</p>}
              {user?.phone && <p>{user.phone}</p>}
              {user?.address && <p>{user.address}</p>}
            </div>
          </div>
          
          {/* Información del cliente y detalles del estimado */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Cliente</h3>
              <p className="font-bold">
                {estimate.client?.firstName} {estimate.client?.lastName}
              </p>
              {estimate.client?.email && <p>{estimate.client.email}</p>}
              {estimate.client?.phone && <p>{estimate.client.phone}</p>}
              {estimate.client?.address && <p>{estimate.client.address}</p>}
              {estimate.client?.city && estimate.client?.state && (
                <p>
                  {estimate.client.city}, {estimate.client.state} {estimate.client?.zip}
                </p>
              )}
            </div>
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Fecha de Emisión</h3>
                  <p>{formatDate(estimate.issueDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Fecha de Expiración</h3>
                  <p>{formatDate(estimate.expiryDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Estado</h3>
                  <p className="font-medium">
                    {estimate.status === "pending" && "Pendiente"}
                    {estimate.status === "accepted" && "Aceptado"}
                    {estimate.status === "rejected" && "Rechazado"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Método de Pago</h3>
                  <p>{estimate.paymentMethod || "Por determinar"}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Información del proyecto */}
          {estimate.project && (
            <div className="mb-6 border-t border-b py-4">
              <h3 className="text-lg font-medium mb-2">Proyecto</h3>
              <p className="font-bold">{estimate.project.title}</p>
              <p className="text-muted-foreground">{estimate.project.description}</p>
            </div>
          )}
          
          {/* Tabla de ítems */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Detalle de Servicios</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 border">Descripción</th>
                  <th className="text-center p-2 border">Cantidad</th>
                  <th className="text-right p-2 border">Precio Unitario</th>
                  <th className="text-right p-2 border">Total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.items && estimate.items.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 border">
                      <div className="font-medium">{item.description}</div>
                      {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
                    </td>
                    <td className="text-center p-2 border">{item.quantity}</td>
                    <td className="text-right p-2 border">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-right p-2 border font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={3} className="text-right p-2 font-medium">Subtotal:</td>
                  <td className="text-right p-2 font-medium">{formatCurrency(estimate.subtotal)}</td>
                </tr>
                {parseFloat(String(estimate.tax)) > 0 && (
                  <tr>
                    <td colSpan={3} className="text-right p-2 font-medium">Impuestos:</td>
                    <td className="text-right p-2">{formatCurrency(estimate.tax)}</td>
                  </tr>
                )}
                {parseFloat(String(estimate.discount)) > 0 && (
                  <tr>
                    <td colSpan={3} className="text-right p-2 font-medium">Descuento:</td>
                    <td className="text-right p-2">-{formatCurrency(estimate.discount)}</td>
                  </tr>
                )}
                <tr className="bg-muted/20">
                  <td colSpan={3} className="text-right p-2 font-bold">TOTAL:</td>
                  <td className="text-right p-2 font-bold text-lg">{formatCurrency(estimate.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Términos y notas */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {estimate.terms && (
              <div>
                <h3 className="text-lg font-medium mb-2">Términos</h3>
                <p className="text-sm whitespace-pre-line">{estimate.terms}</p>
              </div>
            )}
            {estimate.notes && (
              <div>
                <h3 className="text-lg font-medium mb-2">Notas</h3>
                <p className="text-sm whitespace-pre-line">{estimate.notes}</p>
              </div>
            )}
          </div>
          
          {/* Información de aceptación/rechazo */}
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between">
              <div>
                <h3 className="text-base font-medium mb-2">Aceptación del Cliente</h3>
                <p className="text-sm">
                  Al firmar este documento, usted acepta los términos y condiciones del estimado.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Documento generado el {formatDate(new Date())}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}