import React from 'react';
import { useToast } from '@/hooks/use-toast';
import SimplifiedPdfTemplateEditor from '@/components/pdf/simplified-pdf-template-editor';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';

/**
 * PDF Template Editor Page for Estimates and Invoices
 * This is the only template editing page that should be used in the application.
 */
export default function PdfTemplateEditorPage() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handleSave = (config: any) => {
    // Save configuration and show success toast
    localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
    
    toast({
      title: 'Configuration Saved',
      description: 'The template has been saved successfully.',
    });
  };

  const handleBack = () => {
    navigate('/settings');
  };

  const handleNavToServices = () => {
    navigate('/company-services');
  };
  
  return (
    <>
      <Helmet>
        <title>PDF Template Editor | ContractorHub</title>
        <meta name="description" content="Customize your estimate and invoice templates with design options" />
      </Helmet>
      
      <SimplifiedPdfTemplateEditor 
        onSave={handleSave} 
        onBack={handleBack}
        onHome={handleNavToServices}
      />
    </>
  );
}