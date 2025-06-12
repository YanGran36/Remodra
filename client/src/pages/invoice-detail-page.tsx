import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Loader2, ChevronLeft, FileText, Send, Printer, Check, DollarSign, Receipt, Ban } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Schema for payment form
const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function InvoiceDetailPage() {
  const [, params] = useRoute("/invoices/:id");
  const invoiceId = params?.id ? parseInt(params.id) : 0;
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelNotes, setCancelNotes] = useState("");
  
  const { toast } = useToast();
  const { 
    getInvoice, 
    registerPaymentMutation, 
    updateInvoiceStatusMutation,
    cancelInvoiceMutation
  } = useInvoices();
  const { data: invoice, isLoading, error } = getInvoice(invoiceId);

  // Payment registration form
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Function to format dates
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "Not specified";
    return format(new Date(dateString), "MMMM d, yyyy", { locale: enUS });
  };

  // Get class for badge according to invoice status
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "partially_paid":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Readable text for status
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "Paid";
      case "pending":
        return "Pending";
      case "overdue":
        return "Overdue";
      case "partially_paid":
        return "Partial Paid";
      case "cancelled":
        return "Cancelled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Register a payment
  const handlePaymentSubmit = (data: PaymentFormValues) => {
    registerPaymentMutation.mutate(
      {
        id: invoiceId,
        data: {
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate || new Date().toISOString(),
          notes: data.notes,
        },
      },
      {
        onSuccess: () => {
          setIsPaymentModalOpen(false);
          form.reset();
        },
      }
    );
  };

  // Mark as paid
  const handleMarkAsPaid = () => {
    updateInvoiceStatusMutation.mutate(
      { id: invoiceId, status: "paid" },
      {
        onSuccess: () => {
          toast({
            title: "Status updated",
            description: "The invoice has been marked as paid.",
          });
        },
      }
    );
  };
  
  // Cancel invoice
  const handleCancelInvoice = () => {
    cancelInvoiceMutation.mutate(
      { 
        id: invoiceId, 
        notes: cancelNotes 
      },
      {
        onSuccess: () => {
          setIsCancelModalOpen(false);
          setCancelNotes("");
          toast({
            title: "Invoice cancelled",
            description: "The invoice has been cancelled successfully.",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/invoices">
            <Button variant="ghost" className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to invoices
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold">Invoice not found</h1>
          <p className="text-gray-600 mt-2">
            {error 
              ? `An error occurred: ${error.message}` 
              : "The requested invoice could not be found. The invoice may have been deleted or not yet created."
            }
          </p>
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2">Suggestions:</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Verify that you are accessing an existing invoice</li>
              <li>To create a new invoice, you can convert an accepted estimate to an invoice</li>
              <li>Check the estimates page to see if there are any that can be converted to invoices</li>
            </ul>
            <div className="mt-6">
              <Link href="/estimates">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  View estimates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate if it's overdue
  const isDueDate = invoice.dueDate ? new Date(invoice.dueDate) < new Date() : false;
  const isPending = invoice.status === "pending";
  const isOverdue = isPending && isDueDate;

  // Calculate pending amount
  const amountPaid = parseFloat(invoice.amountPaid || "0");
  const total = parseFloat(invoice.total || "0");
  const pendingAmount = total - amountPaid;
  const isPaidInFull = pendingAmount <= 0;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/invoices">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to invoices
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Invoice {invoice.invoiceNumber || `#${invoice.id}`}
            </h1>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusClass(isOverdue ? "overdue" : invoice.status)}>
                {getStatusText(isOverdue ? "overdue" : invoice.status)}
              </Badge>
              {invoice.total && (
                <Badge variant="outline">
                  {formatCurrency(Number(invoice.total))}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              toast({
                title: "Feature in development",
                description: "Print functionality will be implemented soon.",
              });
            }}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            
            {/* Cancel button, only visible if invoice is not cancelled or paid */}
            {invoice.status !== "cancelled" && invoice.status !== "paid" && (
              <Button 
                variant="outline" 
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => setIsCancelModalOpen(true)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Cancel invoice
              </Button>
            )}
            
            {!isPaidInFull && (
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Register payment
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{invoice.client?.firstName} {invoice.client?.lastName}</p>
              <p className="text-sm text-gray-600">{invoice.client?.email}</p>
              <p className="text-sm text-gray-600">{invoice.client?.phone}</p>
            </div>
            {invoice.client?.address && (
              <div>
                <p className="text-sm text-gray-600">{invoice.client?.address}</p>
                <p className="text-sm text-gray-600">
                  {invoice.client?.city}, {invoice.client?.state} {invoice.client?.zip}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{invoice.project?.title || "Not specified"}</p>
              <p className="text-sm text-gray-600">{invoice.project?.description || ""}</p>
            </div>
            {invoice.project?.address && (
              <div>
                <p className="text-sm text-gray-600 font-medium mt-2">Project address:</p>
                <p className="text-sm text-gray-600">{invoice.project?.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Important Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Issue date:</span>
              <span className="text-sm">{formatDate(invoice.issueDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Due date:</span>
                <span className={`text-sm ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="items" className="mb-6">
        <TabsList>
          <TabsTrigger value="items">Invoice Items</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="terms">Terms and Conditions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.description}
                          {item.notes && <p className="text-sm text-gray-500 mt-1">{item.notes}</p>}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                        <TableCell>{formatCurrency(Number(item.amount))}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No items in this invoice
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                    <TableCell>{formatCurrency(Number(invoice.subtotal) || 0)}</TableCell>
                  </TableRow>
                  {Number(invoice.tax) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Tax ({invoice.tax}%)</TableCell>
                      <TableCell>{formatCurrency((Number(invoice.subtotal) * Number(invoice.tax)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  {Number(invoice.discount) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Discount ({invoice.discount}%)</TableCell>
                      <TableCell>-{formatCurrency((Number(invoice.subtotal) * Number(invoice.discount)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                    <TableCell className="font-bold">{formatCurrency(Number(invoice.total) || 0)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Payment Status</h3>
                  <p className="text-sm text-gray-600">Track and manage payments for this invoice</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total: {formatCurrency(total)}</p>
                  <p className="text-sm text-gray-600">Paid: {formatCurrency(amountPaid)}</p>
                  <p className={`text-sm font-medium ${pendingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                    Pending: {formatCurrency(pendingAmount)}
                  </p>
                </div>
              </div>
              
              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium">Payment History</h4>
                  {invoice.payments.map((payment: any) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                        <p className="text-sm text-gray-600">{payment.paymentMethod} - {formatDate(payment.paymentDate)}</p>
                        {payment.notes && <p className="text-sm text-gray-500">{payment.notes}</p>}
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Received
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No payments recorded yet</p>
                  <p className="text-sm">Register a payment to track invoice status</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="terms">
          <Card>
            <CardContent className="py-4">
              <h3 className="text-lg font-semibold mb-4">Terms and Conditions</h3>
              {invoice.terms ? (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No terms and conditions specified</p>
                  <p className="text-sm">Terms can be added when editing the invoice</p>
                </div>
              )}
              
              {invoice.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-2">Additional Notes</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Registration Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Payment</DialogTitle>
            <DialogDescription>
              Record a payment received for this invoice
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handlePaymentSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter payment amount"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select id="paymentMethod" className="w-full p-2 border rounded-md" {...form.register("paymentMethod")}>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                {...form.register("paymentDate")}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Additional notes about this payment"
                {...form.register("notes")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={registerPaymentMutation.isPending}>
                {registerPaymentMutation.isPending ? "Registering..." : "Register Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Modal */}
      <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="cancelNotes">Cancellation Reason (Optional)</Label>
            <Input
              id="cancelNotes"
              placeholder="Enter reason for cancellation"
              value={cancelNotes}
              onChange={(e) => setCancelNotes(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvoice}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelInvoiceMutation.isPending}
            >
              {cancelInvoiceMutation.isPending ? "Cancelling..." : "Cancel Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}