import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Package2 } from "lucide-react";

interface Item {
  id: number;
  description: string;
  quantity: number;
  price: number;
  amount: number;
  unit?: string;
}

interface ItemTableProps {
  items: Item[];
  subtotal: number | string;
  tax: number | string;
  discount: number | string;
  total: number | string;
  emptyMessage?: string;
}

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

export function ItemTable({
  items,
  subtotal,
  tax,
  discount,
  total,
  emptyMessage = "No items to display",
}: ItemTableProps) {
  // Convert string values to numbers for calculations if needed
  const taxValue = typeof tax === 'string' ? parseFloat(tax) : tax;
  const discountValue = typeof discount === 'string' ? parseFloat(discount) : discount;
  const subtotalValue = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
  const totalValue = typeof total === 'string' ? parseFloat(total) : total;

  return (
    <div className="item-table-container">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[400px]">Descripción</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">Importe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium align-top">{item.description}</TableCell>
                <TableCell className="text-right">{item.quantity} {item.unit || ""}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-10">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Package2 className="h-10 w-10 mb-2 opacity-20" />
                  <p>{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {items.length > 0 && (
          <TableFooter className="bg-white">
            <TableRow className="border-t-0">
              <TableCell colSpan={2} />
              <TableCell className="text-right font-medium">Subtotal</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(subtotalValue)}</TableCell>
            </TableRow>
            {taxValue > 0 && (
              <TableRow className="border-t-0">
                <TableCell colSpan={2} />
                <TableCell className="text-right font-medium">Tax</TableCell>
                <TableCell className="text-right">{formatCurrency(taxValue)}</TableCell>
              </TableRow>
            )}
            {discountValue > 0 && (
              <TableRow className="border-t-0">
                <TableCell colSpan={2} />
                <TableCell className="text-right font-medium">Discount</TableCell>
                <TableCell className="text-right text-red-600">-{formatCurrency(discountValue)}</TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={2} />
              <TableCell className="text-right font-bold border-t">Total</TableCell>
              <TableCell className="text-right font-bold border-t text-lg bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">{formatCurrency(totalValue)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}