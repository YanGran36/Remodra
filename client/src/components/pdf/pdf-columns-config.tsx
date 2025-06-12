import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormItem, FormLabel } from "@/components/ui/form";
import { PdfTemplateConfig } from './pdf-template-settings';

interface PdfColumnsConfigProps {
  config: PdfTemplateConfig;
  onChange: (config: PdfTemplateConfig) => void;
}

export default function PdfColumnsConfig({ config, onChange }: PdfColumnsConfigProps) {
  // Handle toggling a column's visibility
  const handleColumnToggle = (columnName: keyof PdfTemplateConfig['showColumns'], checked: boolean) => {
    const updatedConfig = {
      ...config,
      showColumns: {
        ...config.showColumns,
        [columnName]: checked
      }
    };
    onChange(updatedConfig);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Columns</CardTitle>
        <CardDescription>
          Select which columns to display in document tables
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <Checkbox 
              id="service-column"
              checked={config.showColumns.service}
              onCheckedChange={(checked) => 
                handleColumnToggle('service', checked as boolean)
              }
            />
            <FormLabel htmlFor="service-column" className="font-normal cursor-pointer">
              Service
            </FormLabel>
          </FormItem>
          
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <Checkbox 
              id="description-column"
              checked={config.showColumns.description}
              onCheckedChange={(checked) => 
                handleColumnToggle('description', checked as boolean)
              }
            />
            <FormLabel htmlFor="description-column" className="font-normal cursor-pointer">
              Description
            </FormLabel>
          </FormItem>
          
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <Checkbox 
              id="quantity-column"
              checked={config.showColumns.quantity}
              onCheckedChange={(checked) => 
                handleColumnToggle('quantity', checked as boolean)
              }
            />
            <FormLabel htmlFor="quantity-column" className="font-normal cursor-pointer">
              Quantity
            </FormLabel>
          </FormItem>
          
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <Checkbox 
              id="unit-price-column"
              checked={config.showColumns.unitPrice}
              onCheckedChange={(checked) => 
                handleColumnToggle('unitPrice', checked as boolean)
              }
            />
            <FormLabel htmlFor="unit-price-column" className="font-normal cursor-pointer">
              Unit Price
            </FormLabel>
          </FormItem>
          
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <Checkbox 
              id="amount-column"
              checked={config.showColumns.amount}
              onCheckedChange={(checked) => 
                handleColumnToggle('amount', checked as boolean)
              }
            />
            <FormLabel htmlFor="amount-column" className="font-normal cursor-pointer">
              Total Amount
            </FormLabel>
          </FormItem>
          
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <Checkbox 
              id="notes-column"
              checked={config.showColumns.notes}
              disabled={!config.showItemNotes}
              onCheckedChange={(checked) => 
                handleColumnToggle('notes', checked as boolean)
              }
            />
            <FormLabel 
              htmlFor="notes-column" 
              className={`font-normal cursor-pointer ${!config.showItemNotes ? 'text-muted-foreground' : ''}`}
            >
              Notes {!config.showItemNotes && "(Enable Item Notes first)"}
            </FormLabel>
          </FormItem>
        </div>
      </CardContent>
    </Card>
  );
}