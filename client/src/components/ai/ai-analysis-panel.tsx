import { useState } from "react";
import { Loader2, BarChart2, ClipboardList, DollarSign, PlusCircle, FileText, FileCheck, AlertTriangle } from "lucide-react";
import { useAiCostAnalysis, AiAnalysisParams, AiAnalysisResult, MaterialInput } from "@/hooks/use-ai-cost-analysis";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

// Componentes UI
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

interface AiAnalysisPanelProps {
  serviceType: string;
  materials: MaterialInput[];
  propertySize?: {
    squareFeet?: number;
    linearFeet?: number;
    units?: number;
  };
  difficulty?: "easy" | "medium" | "complex";
  additionalInfo?: string;
  onCreateEstimate?: (analysisResult: AiAnalysisResult) => void;
  onCreateInvoice?: (analysisResult: AiAnalysisResult) => void;
}

export default function AiAnalysisPanel({
  serviceType,
  materials,
  propertySize,
  difficulty = "medium",
  additionalInfo,
  onCreateEstimate,
  onCreateInvoice
}: AiAnalysisPanelProps) {
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("sales");
  
  const { toast } = useToast();
  const { 
    analyzeJobCost, 
    generateJobDescription, 
    isAnalyzing, 
    isGeneratingDescription 
  } = useAiCostAnalysis();
  
  // Perform cost analysis
  const handleAnalyze = async () => {
    if (!serviceType) {
      toast({
        title: "Error",
        description: "Must select un tipo de servicio",
        variant: "destructive",
      });
      return;
    }
    
    if (!materials || materials.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un material",
        variant: "destructive",
      });
      return;
    }
    
    // Show toast for analysis start
    toast({
      title: "Analizando",
      description: "Estamos analizando los datos. Esto puede tomar un momento...",
    });
    
    const params: AiAnalysisParams = {
      serviceType,
      materials,
      propertySize,
      difficulty,
      additionalInfo,
    };
    
    // Paso 1: Análisis de costos
    try {
      const result = await analyzeJobCost(params);
      setAnalysisResult(result);
      
      // Análisis de costos exitoso, intentar generar descripción
      try {
        const description = await generateJobDescription(params);
        setJobDescription(description);
        
        // Todo exitoso
        toast({
          title: "Análisis completado",
          description: "The cost analysis and description have been successfully generated.",
        });
      } catch (descError) {
        // Análisis exitoso pero falló la descripción
        console.error("Error al generar descripción:", descError);
        toast({
          title: "Análisis parcial",
          description: "The cost analysis was completed, but the description could not be generated.",
          variant: "default",
        });
      }
      
      // Switch to analysis tab in any case
      setActiveTab("analysis");
    } catch (analyzeError) {
      // Cost analysis failed
      console.error("Error in cost analysis:", analyzeError);
      toast({
        title: "Analysis Error",
        description: analyzeError instanceof Error ? analyzeError.message : "Could not complete the analysis. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Create estimate from analysis
  const handleCreateEstimate = () => {
    if (!analysisResult) return;
    
    if (onCreateEstimate) {
      onCreateEstimate(analysisResult);
    }
  };
  
  // Create invoice from analysis
  const handleCreateInvoice = () => {
    if (!analysisResult) return;
    
    if (onCreateInvoice) {
      onCreateInvoice(analysisResult);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Análisis Inteligente
          </CardTitle>
          <CardDescription>
            Utilice IA para analizar los costos y generar recomendaciones para este trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysisResult ? (
            <div className="space-y-4">
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  <InfoIcon className="h-4 w-4" />
                  Analysis Information
                </AlertTitle>
                <AlertDescription>
                  The analysis will use the service type, materials, sizes, and other information 
                  proporcionada para generar un estimado detallado y recomendaciones para este trabajo.
                </AlertDescription>
              </Alert>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleAnalyze}
                disabled={isAnalyzing || materials.length === 0}
                type="button"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Analizando...
                  </>
                ) : (
                  <>
                    <BarChart2 className="mr-2 h-4 w-4" /> 
                    Analizar trabajo
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analysis">Análisis</TabsTrigger>
                <TabsTrigger value="breakdown">Desglose</TabsTrigger>
                <TabsTrigger value="sales">Ventas Pro</TabsTrigger>
                <TabsTrigger value="description">Descripción</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis" className="space-y-4 pt-4">
                <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Total Recomendado</h3>
                    <span className="text-xl font-bold">{formatCurrency(analysisResult.recommendedTotal)}</span>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Materiales</span>
                      <span className="font-semibold">{formatCurrency(analysisResult.breakdown.materials.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mano de obra</span>
                      <span className="font-semibold">{formatCurrency(analysisResult.breakdown.labor.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Gastos generales ({analysisResult.breakdown.overhead.percentage}%)</span>
                      <span className="font-semibold">{formatCurrency(analysisResult.breakdown.overhead.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Ganancia ({analysisResult.breakdown.profit.percentage}%)</span>
                      <span className="font-semibold">{formatCurrency(analysisResult.breakdown.profit.total)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Recomendaciones</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {analysisResult.breakdown.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm">{recommendation}</li>
                    ))}
                  </ul>
                </div>
                
                {analysisResult.breakdown.potentialIssues && analysisResult.breakdown.potentialIssues.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Posibles Problemas
                    </h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisResult.breakdown.potentialIssues.map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="breakdown" className="space-y-4 pt-4">
                <div>
                  <h3 className="font-semibold mb-2">Desglose de Materiales</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Costo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisResult.breakdown.materials.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.estimatedCost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell>Total Materiales</TableCell>
                        <TableCell className="text-right">{formatCurrency(analysisResult.breakdown.materials.total)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Mano de Obra</h3>
                  <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between">
                      <span>Horas estimadas:</span>
                      <span>{analysisResult.breakdown.labor.estimatedHours} horas</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tarifa por hora:</span>
                      <span>{formatCurrency(analysisResult.breakdown.labor.hourlyRate)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total mano de obra:</span>
                      <span>{formatCurrency(analysisResult.breakdown.labor.total)}</span>
                    </div>
                    {analysisResult.breakdown.labor.notes && (
                      <p className="text-sm mt-2 pt-2 border-t">{analysisResult.breakdown.labor.notes}</p>
                    )}
                  </div>
                </div>
                
                {analysisResult.breakdown.competitiveAnalysis && (
                  <div>
                    <h3 className="font-semibold mb-2">Análisis Competitivo</h3>
                    <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Market price range:</span>
                          <span className="text-sm">
                            {formatCurrency(analysisResult.breakdown.competitiveAnalysis.lowRange)} - {formatCurrency(analysisResult.breakdown.competitiveAnalysis.highRange)}
                          </span>
                        </div>
                        <Progress 
                          value={((analysisResult.recommendedTotal - analysisResult.breakdown.competitiveAnalysis.lowRange) / 
                            (analysisResult.breakdown.competitiveAnalysis.highRange - analysisResult.breakdown.competitiveAnalysis.lowRange)) * 100} 
                          className="h-2"
                        />
                      </div>
                      <p className="text-sm mt-2">{analysisResult.breakdown.competitiveAnalysis.notes}</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="sales" className="space-y-4 pt-4">
                {analysisResult.breakdown.competitiveAnalysis && (
                  <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                    <h3 className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> 
                      Posicionamiento de Mercado
                    </h3>
                    <div className="mb-2">
                      <div className="flex justify-between my-2">
                        <span className="text-sm">Rango de precios del mercado:</span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(analysisResult.breakdown.competitiveAnalysis.lowRange)} - {formatCurrency(analysisResult.breakdown.competitiveAnalysis.highRange)}
                        </span>
                      </div>
                      <Progress 
                        value={((analysisResult.recommendedTotal - analysisResult.breakdown.competitiveAnalysis.lowRange) / 
                          (analysisResult.breakdown.competitiveAnalysis.highRange - analysisResult.breakdown.competitiveAnalysis.lowRange)) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>Económico</span>
                        <span>Promedio</span>
                        <span>Premium</span>
                      </div>
                    </div>
                    {analysisResult.breakdown.competitiveAnalysis.marketPosition && (
                      <div className="mt-3 p-2 bg-primary/10 rounded-md text-sm">
                        <p><strong>Posición en el mercado:</strong> {analysisResult.breakdown.competitiveAnalysis.marketPosition}</p>
                      </div>
                    )}
                  </div>
                )}

                {analysisResult.breakdown.salesPoints && analysisResult.breakdown.salesPoints.length > 0 && (
                  <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                    <h3 className="font-semibold mb-2">Puntos Clave de Venta</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisResult.breakdown.salesPoints.map((point, index) => (
                        <li key={index} className="text-sm">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.breakdown.objectionHandling && analysisResult.breakdown.objectionHandling.length > 0 && (
                  <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                    <h3 className="font-semibold mb-2">Cómo Manejar Objeciones</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {analysisResult.breakdown.objectionHandling.map((strategy, index) => (
                        <li key={index} className="text-sm">{strategy}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.breakdown.premiumUpgrades && analysisResult.breakdown.premiumUpgrades.length > 0 && (
                  <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                    <h3 className="font-semibold mb-2">Mejoras Premium Sugeridas</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisResult.breakdown.premiumUpgrades.map((upgrade, index) => (
                        <li key={index} className="text-sm">{upgrade}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.breakdown.closingStrategy && (
                  <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                    <h3 className="font-semibold mb-2">Estrategia de Cierre</h3>
                    <p className="text-sm">{analysisResult.breakdown.closingStrategy}</p>
                  </div>
                )}

                {analysisResult.breakdown.testimonialTemplates && analysisResult.breakdown.testimonialTemplates.length > 0 && (
                  <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                    <h3 className="font-semibold mb-2">Plantillas de Testimonios</h3>
                    <div className="space-y-3">
                      {analysisResult.breakdown.testimonialTemplates.map((template, index) => (
                        <div key={index} className="text-sm italic border-l-2 border-primary/30 pl-3 py-1">
                          "{template}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.breakdown.presentationTips && analysisResult.breakdown.presentationTips.length > 0 && (
                  <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                    <h3 className="font-semibold mb-2">Consejos para Presentar el Presupuesto</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisResult.breakdown.presentationTips.map((tip, index) => (
                        <li key={index} className="text-sm">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="description" className="space-y-4 pt-4">
                {isGeneratingDescription ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                    <h3 className="font-semibold mb-3">Descripción del Trabajo</h3>
                    <div className="text-sm whitespace-pre-line">
                      {jobDescription}
                    </div>
                  </div>
                )}
                
                <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                  <h3 className="font-semibold mb-3">Resumen</h3>
                  <div className="text-sm">
                    {analysisResult.summary}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        
        {analysisResult && (
          <CardFooter className="flex flex-col space-y-2">
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCreateEstimate}
                title="This only transfers the analysis to the form, it does not create the estimate directly"
                type="button"
              >
                <FileText className="h-4 w-4 mr-2" />
                Incluir en Estimado
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={handleCreateInvoice}
                title="This only transfers the analysis to the form, it does not create the invoice directly"
                type="button"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Incluir en Factura
              </Button>
            </div>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={handleAnalyze}
              type="button"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Iconos personalizados
function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}