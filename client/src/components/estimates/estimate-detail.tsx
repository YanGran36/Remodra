import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useEstimates } from "@/hooks/use-estimates";
import { formatCurrency } from "@/lib/utils";
import { 
  Check, Edit, Loader2, FileText, Send, X, 
  Printer, Download, FilePlus, BanknoteIcon, AlertTriangle 
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface EstimateDetailProps {
  estimateId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function EstimateDetail({ estimateId, isOpen, onClose }: EstimateDetailProps) {
  const [isConfirmAccept, setIsConfirmAccept] = useState(false);
  const [isConfirmReject, setIsConfirmReject] = useState(false);
  const [isConfirmConvert, setIsConfirmConvert] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getEstimate, updateEstimateStatusMutation, convertToInvoiceMutation } = useEstimates();

  // Get estimate data
  const { data: estimate, isLoading, error } = getEstimate(estimateId);

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="sr-only">Loading Estimate</DialogTitle>
            <DialogDescription className="sr-only">Please wait while we load the estimate data</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !estimate) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              {error ? error.message : "Unable to load the estimate."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Function to format dates in MONTH/DAY/YEAR format
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "Not specified";
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  // Get badge class based on estimate status
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
      case "aceptado":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "pendiente":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
      case "rechazado":
        return "bg-red-100 text-red-800 border-red-200";
      case "sent":
      case "enviado":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "draft":
      case "borrador":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get readable text for status (English by default)
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
      case "aceptado":
        return "Accepted";
      case "pending":
      case "pendiente":
        return "Pending";
      case "rejected":
      case "rechazado":
        return "Rejected";
      case "sent":
      case "enviado":
        return "Sent";
      case "draft":
      case "borrador":
        return "Draft";
      default:
        return status;
    }
  };

  // Function to accept the estimate
  const handleAcceptEstimate = () => {
    setIsConfirmAccept(true);
  };

  // Function to reject the estimate
  const handleRejectEstimate = () => {
    setIsConfirmReject(true);
  };

  // Function to convert to work order
  const handleConvertToWorkOrder = () => {
    setIsConfirmConvert(true);
  };

  // Confirm estimate acceptance
  const confirmAcceptEstimate = () => {
    updateEstimateStatusMutation.mutate(
      { id: estimateId, status: "accepted" },
      {
        onSuccess: () => {
          setIsConfirmAccept(false);
          toast({
            title: "Estimate Accepted",
            description: "The estimate has been marked as accepted.",
          });
        }
      }
    );
  };

  // Confirm estimate rejection
  const confirmRejectEstimate = () => {
    updateEstimateStatusMutation.mutate(
      { id: estimateId, status: "rejected" },
      {
        onSuccess: () => {
          setIsConfirmReject(false);
          toast({
            title: "Estimate Rejected",
            description: "The estimate has been marked as rejected.",
          });
        }
      }
    );
  };

  // Confirm conversion to work order
  const confirmConvertToWorkOrder = () => {
    convertToInvoiceMutation.mutate(
      estimateId,
      {
        onSuccess: (invoice) => {
          setIsConfirmConvert(false);
          toast({
            title: "Work Order Created",
            description: `Work order ${invoice.invoiceNumber} has been created from this estimate.`,
          });
          // Here we could redirect to the work order page
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Estimate {estimate.estimateNumber || `#${estimate.id}`}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusClass(estimate.status)}>
                {getStatusText(estimate.status)}
              </Badge>
              {estimate.total && (
                <Badge variant="outline">
                  {formatCurrency(Number(estimate.total))}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="terms">Terms</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">General Information</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span>{formatDate(estimate.issueDate)}</span>
                    </div>
                    {estimate.expiryDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expiry Date:</span>
                        <span>{formatDate(estimate.expiryDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client:</span>
                      <span>{estimate.client?.firstName} {estimate.client?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project:</span>
                      <span>{estimate.project?.title || "Not specified"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Financial</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>{formatCurrency(Number(estimate.subtotal) || 0)}</span>
                    </div>
                    {Number(estimate.tax) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax:</span>
                        <span>{formatCurrency((Number(estimate.subtotal) * Number(estimate.tax)) / 100)}</span>
                      </div>
                    )}
                    {Number(estimate.discount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span>-{formatCurrency((Number(estimate.subtotal) * Number(estimate.discount)) / 100)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total:</span>
                      <span>{formatCurrency(Number(estimate.total) || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {estimate.status !== "rejected" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Implement email functionality
                          toast({
                            title: "Feature in development",
                            description: "Email sending functionality will be implemented soon.",
                          });
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send by Email
                      </Button>

                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            // Import the PDF generation function
                            const { downloadEstimatePDF } = await import("@/lib/pdf-generator");
                            
                            // Convert estimate data to the format expected by the PDF generator
                            const pdfEstimate = {
                              ...estimate,
                              estimateNumber: estimate.estimateNumber || `EST-${estimate.id}`,
                              client: {
                                firstName: estimate.client?.firstName || "",
                                lastName: estimate.client?.lastName || "",
                                email: estimate.client?.email,
                                phone: estimate.client?.phone,
                                address: estimate.client?.address,
                                city: estimate.client?.city,
                                state: estimate.client?.state,
                                zip: estimate.client?.zip
                              },
                              contractor: {
                                businessName: "Your Business Name", // Use your actual business name
                                email: "contact@yourbusiness.com", // Use your actual email
                                phone: "(123) 456-7890", // Use your actual phone
                                address: "123 Business St", // Use your actual address
                              },
                              items: (estimate.items || []).map(item => ({
                                ...item,
                                // Incluir el tipo de servicio en cada item
                                service: item.service || "General Service"
                              }))
                            };
                            
                            // Generate and download the PDF
                            await downloadEstimatePDF(pdfEstimate);
                            
                            toast({
                              title: "PDF Generated",
                              description: "The estimate PDF has been downloaded."
                            });
                          } catch (error) {
                            console.error("Error generating PDF:", error);
                            toast({
                              title: "PDF Generation Failed",
                              description: "There was an error generating the PDF. Please try again.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Generate PDF
                      </Button>

                      {estimate.status === "pending" && (
                        <>
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleAcceptEstimate}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={handleRejectEstimate}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}

                      {(estimate.status === "accepted" || estimate.status === "draft" || estimate.status === "sent") && (
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleConvertToWorkOrder}
                        >
                          <BanknoteIcon className="h-4 w-4 mr-2" />
                          Convert to Work Order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estimate Items</CardTitle>
              </CardHeader>
              <CardContent>
                {estimate.items && estimate.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estimate.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                          <TableCell>{formatCurrency(Number(item.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No items registered in this estimate.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Terms and Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {estimate.terms ? (
                  <div className="text-sm whitespace-pre-line">{estimate.terms}</div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No terms have been specified for this estimate.</p>
                )}

                {estimate.notes && (
                  <>
                    <h3 className="font-medium mt-6 mb-2">Additional Notes</h3>
                    <div className="text-sm whitespace-pre-line">{estimate.notes}</div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Accept Estimate confirmation dialog */}
      <AlertDialog open={isConfirmAccept} onOpenChange={setIsConfirmAccept}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              By accepting this estimate, it will be marked as approved. You can convert it to a work order later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateEstimateStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmAcceptEstimate();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={updateEstimateStatusMutation.isPending}
            >
              {updateEstimateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Estimate confirmation dialog */}
      <AlertDialog open={isConfirmReject} onOpenChange={setIsConfirmReject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              By rejecting this estimate, it will be marked as not approved and you will not be able to convert it to a work order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateEstimateStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRejectEstimate();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={updateEstimateStatusMutation.isPending}
            >
              {updateEstimateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Work Order confirmation dialog */}
      <AlertDialog open={isConfirmConvert} onOpenChange={setIsConfirmConvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Work Order?</AlertDialogTitle>
            <AlertDialogDescription>
              By converting this estimate into a work order, a new invoice will be created with the same details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={convertToInvoiceMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmConvertToWorkOrder();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={convertToInvoiceMutation.isPending}
            >
              {convertToInvoiceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}