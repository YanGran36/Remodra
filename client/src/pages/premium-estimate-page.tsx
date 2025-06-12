import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Check, 
  X, 
  FileEdit, 
  Download, 
  Printer, 
  Mail, 
  ArrowLeft, 
  BanknoteIcon,
  Building,
  User,
  Briefcase,
  CalendarRange,
  FileSpreadsheet,
} from "lucide-react";

import { PremiumHeader } from "@/components/ui/premium-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { StatusBadge, getEstimateStatusBadge } from "@/components/ui/status-badge";
import { ItemTable } from "@/components/ui/item-table";
import { InfoCard } from "@/components/ui/info-card";
import { DateDisplay } from "@/components/ui/date-display";
import { SignatureDisplay } from "@/components/ui/signature-display";
import { StatCard } from "@/components/ui/stat-card";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Import form component for editing
import EstimateForm from "@/components/estimates/estimate-form";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

export default function PremiumEstimatePage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const estimateId = parseInt(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertingToInvoice, setIsConvertingToInvoice] = useState(false);

  // Fetch estimate data
  const { 
    data: estimate, 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: [`/api/protected/estimates/${estimateId}`],
    enabled: !isNaN(estimateId),
  });

  // Get days until expiry
  const daysUntilExpiry = estimate?.expiryDate 
    ? differenceInDays(new Date(estimate.expiryDate), new Date()) 
    : null;

  // Calculate if expired
  const isExpired = estimate?.expiryDate && daysUntilExpiry !== null && daysUntilExpiry < 0;

  // Update estimate status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/protected/estimates/${estimateId}`, 
        { status }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/protected/estimates/${estimateId}`] });
      toast({
        title: "¡Estado actualizado!",
        description: "El estado del estimado ha sido actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convert to invoice mutation
  const convertToInvoiceMutation = useMutation({
    mutationFn: async () => {
      setIsConvertingToInvoice(true);
      const res = await apiRequest(
        "POST", 
        `/api/protected/estimates/${estimateId}/convert-to-invoice`, 
        {}
      );
      return await res.json();
    },
    onSuccess: (data) => {
      setIsConvertingToInvoice(false);
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "¡Orden de trabajo creada!",
        description: "El estimado ha sido convertido en una orden de trabajo exitosamente.",
      });
      // Navigate to invoice page
      setLocation(`/invoices/${data.id}`);
    },
    onError: (error: Error) => {
      setIsConvertingToInvoice(false);
      toast({
        title: "Error al crear orden de trabajo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle status change
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  // Handle convert to invoice
  const handleConvertToInvoice = () => {
    if (estimate?.status !== 'accepted') {
      toast({
        title: "Acción no permitida",
        description: "Solo los estimados aceptados pueden ser convertidos a órdenes de trabajo.",
        variant: "destructive",
      });
      return;
    }
    
    convertToInvoiceMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="loading-spinner"></div>
          <p className="mt-4 text-muted-foreground">Cargando estimado...</p>
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Could not load the estimate</h2>
            <p className="mt-2 text-muted-foreground">
              {error instanceof Error ? error.message : "Ha ocurrido un error"}
            </p>
            <Button 
              variant="default" 
              onClick={() => refetch()} 
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/estimates')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Estimates
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          {estimate.status !== 'rejected' && estimate.status !== 'expired' && (
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Send by Email
            </Button>
          )}
        </div>
      </div>

      {/* Premium header */}
      <PremiumHeader 
        title={`Estimate #${estimate.estimateNumber}`}
        subtitle="Review the estimate details and confirm your approval or make necessary changes."
        className="mb-6"
      />
      
      {/* Status and main actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Estimate Status</span>
              {getEstimateStatusBadge(estimate.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {estimate.status === 'draft' && (
                <>
                  <PremiumButton
                    variant="default"
                    onClick={() => handleStatusChange('sent')}
                    icon={<Mail className="h-4 w-4" />}
                    loading={updateStatusMutation.isPending}
                  >
                    Mark as Sent
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                    icon={<FileEdit className="h-4 w-4" />}
                  >
                    Edit Estimate
                  </PremiumButton>
                </>
              )}
              
              {estimate.status === 'sent' && (
                <>
                  <PremiumButton
                    variant="success"
                    onClick={() => handleStatusChange('accepted')}
                    icon={<Check className="h-4 w-4" />}
                    loading={updateStatusMutation.isPending && updateStatusMutation.variables === 'accepted'}
                  >
                    Mark as Accepted
                  </PremiumButton>
                  <PremiumButton
                    variant="destructive"
                    onClick={() => handleStatusChange('rejected')}
                    icon={<X className="h-4 w-4" />}
                    loading={updateStatusMutation.isPending && updateStatusMutation.variables === 'rejected'}
                  >
                    Mark as Rejected
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                    icon={<FileEdit className="h-4 w-4" />}
                  >
                    Edit Estimate
                  </PremiumButton>
                </>
              )}
              
              {estimate.status === 'accepted' && (
                <PremiumButton
                  variant="default"
                  onClick={handleConvertToInvoice}
                  icon={<BanknoteIcon className="h-4 w-4" />}
                  loading={isConvertingToInvoice}
                >
                  Create Work Order
                </PremiumButton>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Financial Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(estimate.subtotal)}</span>
              </div>
              {parseFloat(estimate.tax) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes:</span>
                  <span>{formatCurrency(estimate.tax)}</span>
                </div>
              )}
              {parseFloat(estimate.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span>-{formatCurrency(estimate.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-lg bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                  {formatCurrency(estimate.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Client and Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <InfoCard
          title="Client Information"
          icon={<User className="h-4 w-4" />}
          content={
            <div className="mt-2">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {estimate.client?.firstName?.[0]}{estimate.client?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{estimate.client?.firstName} {estimate.client?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{estimate.client?.company || "Individual Client"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 text-sm">
                <div className="flex items-center">
                  <span className="text-muted-foreground w-20">Email:</span>
                  <span>{estimate.client?.email}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground w-20">Phone:</span>
                  <span>{estimate.client?.phone}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground w-20">Address:</span>
                  <span>{estimate.client?.address}</span>
                </div>
              </div>
            </div>
          }
        />
        
        {estimate.project && (
          <InfoCard
            title="Project Information"
            icon={<Briefcase className="h-4 w-4" />}
            content={
              <div className="mt-2">
                <h3 className="font-medium">{estimate.project?.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                  {estimate.project?.description}
                </p>
                <div className="mt-2 text-sm">
                  <div className="flex items-center">
                    <CalendarRange className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                    <span className="text-muted-foreground">Periodo: </span>
                    <span className="ml-1">
                      {estimate.project?.startDate && format(new Date(estimate.project.startDate), 'dd MMM yyyy', { locale: es })}
                      {estimate.project?.endDate && ` - ${format(new Date(estimate.project.endDate), 'dd MMM yyyy', { locale: es })}`}
                    </span>
                  </div>
                </div>
              </div>
            }
          />
        )}
        
        <InfoCard
          title="Important Dates"
          icon={<CalendarRange className="h-4 w-4" />}
          content={
            <div className="mt-2 space-y-2">
              <DateDisplay 
                label="Issue Date" 
                date={estimate.issueDate}
              />
              
              {estimate.expiryDate && (
                <DateDisplay 
                  label="Expiration" 
                  date={estimate.expiryDate}
                  isPast={isExpired}
                  isFuture={!isExpired}
                  daysRemaining={daysUntilExpiry || undefined}
                />
              )}
            </div>
          }
        />
      </div>
      
      {/* Estimate Items */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Detalle del Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemTable
              items={estimate.items || []}
              subtotal={estimate.subtotal}
              tax={estimate.tax}
              discount={estimate.discount}
              total={estimate.total}
              emptyMessage="Este estimado no tiene artículos"
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Terms, Notes and Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="md:h-full flex flex-col">
          <CardHeader>
            <CardTitle>Términos y Condiciones</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="rounded-md bg-muted/50 p-4 h-full">
              <p className="whitespace-pre-line">
                {estimate.terms || "No se han especificado términos y condiciones."}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted/50 p-4">
                <p className="whitespace-pre-line">
                  {estimate.notes || "No hay notas adicionales para este estimado."}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Firmas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <SignatureDisplay
                  title="Firma del Contratista"
                  signature={estimate.contractorSignature}
                  date={estimate.issueDate ? new Date(estimate.issueDate) : undefined}
                />
                
                <SignatureDisplay
                  title="Firma del Cliente"
                  signature={estimate.clientSignature}
                  date={estimate.status === 'accepted' ? estimate.updatedAt ? new Date(estimate.updatedAt) : undefined : undefined}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modal for editing */}
      {isEditModalOpen && (
        <EstimateForm
          estimateToEdit={estimate}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}