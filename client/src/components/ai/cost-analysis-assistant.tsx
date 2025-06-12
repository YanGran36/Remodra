import { useState, useEffect } from "react";
import {
  useAiCostAnalysis,
  AiAnalysisParams,
  AiAnalysisResult,
} from "@/hooks/use-ai-cost-analysis";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronsUpDown,
  DollarSign,
  FileText,
  Lightbulb,
  Loader2,
  Package,
  PieChart,
  ShoppingCart,
  Triangle,
  Wrench,
} from "lucide-react";

interface CostAnalysisAssistantProps {
  initialParams?: Partial<AiAnalysisParams>;
  onAnalysisComplete?: (result: AiAnalysisResult) => void;
  onDescriptionGenerated?: (description: string) => void;
}

export default function CostAnalysisAssistant({
  initialParams,
  onAnalysisComplete,
  onDescriptionGenerated,
}: CostAnalysisAssistantProps) {
  const { toast } = useToast();
  const [params, setParams] = useState<AiAnalysisParams>({
    serviceType: initialParams?.serviceType || "",
    materials: initialParams?.materials || [],
    laborHours: initialParams?.laborHours,
    propertySize: initialParams?.propertySize || {},
    address: initialParams?.address || "",
    city: initialParams?.city || "",
    state: initialParams?.state || "",
    zip: initialParams?.zip || "",
    difficulty: initialParams?.difficulty || "medium",
    additionalInfo: initialParams?.additionalInfo || "",
  });

  const [currentMaterial, setCurrentMaterial] = useState({
    name: "",
    quantity: 1,
    unit: "unit",
    unitPrice: 0,
  });

  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(
    null,
  );
  const [jobDescription, setJobDescription] = useState<string>("");
  const [activeTab, setActiveTab] = useState("analysis");

  const {
    analyzeJobCost,
    generateJobDescription,
    isAnalyzing,
    isGeneratingDescription,
    analysisError,
    descriptionError,
  } = useAiCostAnalysis();

  // Función para agregar un material
  const addMaterial = () => {
    if (
      !currentMaterial.name ||
      currentMaterial.quantity <= 0 ||
      currentMaterial.unitPrice <= 0
    ) {
      return;
    }

    setParams((prev) => ({
      ...prev,
      materials: [...prev.materials, { ...currentMaterial }],
    }));

    // Reiniciar el formulario de material
    setCurrentMaterial({
      name: "",
      quantity: 1,
      unit: "unit",
      unitPrice: 0,
    });
  };

  // Eliminar un material
  const removeMaterial = (index: number) => {
    setParams((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  // Perform the analysis
  const runAnalysis = async () => {
    try {
      // Validate that at least one material has been added
      if (params.materials.length === 0) {
        toast({
          title: "Error in cost analysis",
          description: "Must add at least one material",
          variant: "destructive",
        });
        return;
      }

      // Validate that a service type has been selected
      if (!params.serviceType) {
        toast({
          title: "Error in cost analysis",
          description: "Must select a service type",
          variant: "destructive",
        });
        return;
      }

      const result = await analyzeJobCost(params);
      setAnalysisResult(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      // Show positive feedback
      toast({
        title: "Analysis completed",
        description: "Cost analysis has been successfully generated",
      });
    } catch (error) {
      console.error("Error in analysis:", error);
      toast({
        title: "Error in cost analysis",
        description:
          "An error occurred while processing the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate job description
  const generateDescription = async () => {
    try {
      // Validate that at least one material has been added
      if (params.materials.length === 0) {
        toast({
          title: "Error generating description",
          description: "Must add at least one material",
          variant: "destructive",
        });
        return;
      }

      // Validate that a service type has been selected
      if (!params.serviceType) {
        toast({
          title: "Error generating description",
          description: "Must select a service type",
          variant: "destructive",
        });
        return;
      }

      // Show analysis automatically if it does not exist
      if (!analysisResult) {
        try {
          const result = await analyzeJobCost(params);
          setAnalysisResult(result);
          if (onAnalysisComplete) {
            onAnalysisComplete(result);
          }
        } catch (analyzeError) {
          console.error("Error in previous analysis:", analyzeError);
          // Continue with description generation even if analysis fails
        }
      }

      const description = await generateJobDescription(params);
      setJobDescription(description);
      if (onDescriptionGenerated) {
        onDescriptionGenerated(description);
      }

      // Go automatically to the description tab
      setActiveTab("description");

      // Show positive feedback
      toast({
        title: "Description generated",
        description: "Job description has been successfully created",
      });
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        title: "Error generating description",
        description:
          "An error occurred while processing the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format number as currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate materials subtotal
  const materialSubtotal = params.materials.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return (
    <Card className="w-full shadow-md border-t-4 border-primary/60">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="flex items-center text-lg md:text-xl">
          <PieChart className="w-6 h-6 mr-2 text-primary" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">
            AI Cost Analysis Assistant
          </span>
        </CardTitle>
        <CardDescription className="text-base">
          Enter project details to receive cost analysis and recommendations
          based on artificial intelligence
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 pt-2">
          <TabsList className="w-full grid grid-cols-3 p-1 rounded-lg bg-muted/50">
            <TabsTrigger
              value="analysis"
              className="flex items-center justify-center rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/80 data-[state=active]:to-secondary/80 data-[state=active]:text-white"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Project Data
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="flex items-center justify-center rounded-md"
              disabled={!analysisResult}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger
              value="description"
              className="flex items-center justify-center rounded-md"
              disabled={!jobDescription}
            >
              <FileText className="w-4 h-4 mr-2" />
              Description
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analysis" className="m-0">
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service type */}
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type*</Label>
                <Select
                  value={params.serviceType}
                  onValueChange={(value) =>
                    setParams((prev) => ({ ...prev, serviceType: value }))
                  }
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fence">Fence</SelectItem>
                    <SelectItem value="deck">Deck</SelectItem>
                    <SelectItem value="roof">Roofing</SelectItem>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="gutters">
                      Gutters & Downspouts
                    </SelectItem>
                    <SelectItem value="siding">Siding</SelectItem>
                    <SelectItem value="flooring">Flooring</SelectItem>
                    <SelectItem value="painting">Painting</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="concrete">Concrete</SelectItem>
                    <SelectItem value="landscaping">Landscaping</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="other">Other Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estimated labor hours */}
              <div className="space-y-2">
                <Label htmlFor="laborHours">Estimated Labor Hours</Label>
                <Input
                  id="laborHours"
                  type="number"
                  min="0"
                  value={params.laborHours || ""}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      laborHours: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Property size: square feet */}
              <div className="space-y-2">
                <Label htmlFor="squareFeet">Square Feet</Label>
                <Input
                  id="squareFeet"
                  type="number"
                  min="0"
                  value={params.propertySize?.squareFeet || ""}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      propertySize: {
                        ...prev.propertySize,
                        squareFeet: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                />
              </div>

              {/* Property size: linear feet */}
              <div className="space-y-2">
                <Label htmlFor="linearFeet">Linear Feet</Label>
                <Input
                  id="linearFeet"
                  type="number"
                  min="0"
                  value={params.propertySize?.linearFeet || ""}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      propertySize: {
                        ...prev.propertySize,
                        linearFeet: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                />
              </div>

              {/* Property size: units */}
              <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <Input
                  id="units"
                  type="number"
                  min="0"
                  value={params.propertySize?.units || ""}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      propertySize: {
                        ...prev.propertySize,
                        units: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                />
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Project Address</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St"
                    value={params.address || ""}
                    onChange={(e) =>
                      setParams((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={params.city || ""}
                      onChange={(e) =>
                        setParams((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={params.state || ""}
                      onChange={(e) =>
                        setParams((prev) => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip Code</Label>
                    <Input
                      id="zip"
                      placeholder="12345"
                      value={params.zip || ""}
                      onChange={(e) =>
                        setParams((prev) => ({
                          ...prev,
                          zip: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Work Difficulty</Label>
              <Select
                value={params.difficulty || "medium"}
                onValueChange={(value: "easy" | "medium" | "complex") =>
                  setParams((prev) => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional information */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Specific project details..."
                value={params.additionalInfo || ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    additionalInfo: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <Separator className="my-4" />

            {/* Materials section */}
            <div>
              <h3 className="text-base font-medium mb-2 flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Materials*
              </h3>

              {/* List of added materials */}
              {params.materials.length > 0 && (
                <div className="border rounded-md p-3 mb-4 bg-muted/40">
                  <div className="text-sm font-medium mb-2 text-muted-foreground flex justify-between">
                    <span>Material</span>
                    <span>Quantity</span>
                    <span>Price</span>
                    <span>Total</span>
                    <span></span>
                  </div>
                  <div className="space-y-2">
                    {params.materials.map((material, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="w-1/4 truncate">{material.name}</span>
                        <span className="w-1/5 text-center">
                          {material.quantity} {material.unit}
                        </span>
                        <span className="w-1/5 text-center">
                          {formatCurrency(material.unitPrice)}
                        </span>
                        <span className="w-1/5 text-center">
                          {formatCurrency(
                            material.quantity * material.unitPrice,
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeMaterial(index)}
                        >
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center border-t pt-2 mt-2">
                      <span className="font-medium">Materials Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(materialSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form to add materials */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Material name"
                    value={currentMaterial.name}
                    onChange={(e) =>
                      setCurrentMaterial((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Quantity"
                    value={currentMaterial.quantity || ""}
                    onChange={(e) =>
                      setCurrentMaterial((prev) => ({
                        ...prev,
                        quantity: e.target.value ? Number(e.target.value) : 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Select
                    value={currentMaterial.unit}
                    onValueChange={(value) =>
                      setCurrentMaterial((prev) => ({
                        ...prev,
                        unit: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unit</SelectItem>
                      <SelectItem value="meter">Meter</SelectItem>
                      <SelectItem value="m2">Meter²</SelectItem>
                      <SelectItem value="foot">Foot</SelectItem>
                      <SelectItem value="ft2">Foot²</SelectItem>
                      <SelectItem value="gallon">Gallon</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="lb">Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Unit price"
                    value={currentMaterial.unitPrice || ""}
                    onChange={(e) =>
                      setCurrentMaterial((prev) => ({
                        ...prev,
                        unitPrice: e.target.value ? Number(e.target.value) : 0,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addMaterial}
                disabled={
                  !currentMaterial.name ||
                  currentMaterial.quantity <= 0 ||
                  currentMaterial.unitPrice <= 0
                }
                className="w-full"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            </div>

            {analysisError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                <div className="font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Analysis Error
                </div>
                <p>{analysisError.message}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t p-6 bg-muted/30">
            <Button
              variant="secondary"
              disabled={isAnalyzing || isGeneratingDescription}
              onClick={generateDescription}
            >
              {isGeneratingDescription ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Description
                </>
              )}
            </Button>

            <Button
              disabled={
                !params.serviceType ||
                params.materials.length === 0 ||
                isAnalyzing
              }
              onClick={runAnalysis}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <PieChart className="w-4 h-4 mr-2" />
                  Analyze Costs
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>

        <TabsContent value="results" className="m-0">
          {analysisResult && (
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* General summary */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20 shadow-sm">
                  <h3 className="text-xl font-bold flex items-center mb-3 text-primary">
                    <DollarSign className="w-6 h-6 mr-2 text-primary" />
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Recommended Price:{" "}
                      {formatCurrency(analysisResult.recommendedTotal)}
                    </span>
                  </h3>
                  <p className="text-base italic">{analysisResult.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cost breakdown */}
                  <div className="space-y-3">
                    <h3 className="text-base font-medium">
                      Cost Breakdown
                    </h3>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Materials:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            analysisResult.breakdown.materials.total,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Labor:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(analysisResult.breakdown.labor.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Overhead:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            analysisResult.breakdown.overhead.total,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Profit:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            analysisResult.breakdown.profit.total,
                          )}
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total:</span>
                        <span className="font-semibold">
                          {formatCurrency(analysisResult.recommendedTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Competitive analysis if exists */}
                    {analysisResult.breakdown.competitiveAnalysis && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2 flex items-center text-primary">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Competitive Analysis
                        </h4>
                        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-md border border-muted">
                          <div className="flex justify-between mb-2 text-sm">
                            <span className="font-medium">
                              Low range:{" "}
                              {formatCurrency(
                                analysisResult.breakdown.competitiveAnalysis
                                  .lowRange,
                              )}
                            </span>
                            <span className="font-medium">
                              High range:{" "}
                              {formatCurrency(
                                analysisResult.breakdown.competitiveAnalysis
                                  .highRange,
                              )}
                            </span>
                          </div>

                          <div className="relative h-6 bg-muted rounded-full overflow-hidden mb-3">
                            <div className="absolute inset-0 flex">
                              <div className="h-full bg-red-400/20 flex-1" />
                              <div className="h-full bg-yellow-400/20 flex-1" />
                              <div className="h-full bg-green-400/20 flex-1" />
                              <div className="h-full bg-blue-400/20 flex-1" />
                            </div>

                            {/* Recommended price marker */}
                            <div
                              className="absolute top-0 h-full w-4 bg-primary rounded-full shadow-md"
                              style={{
                                left: `calc(${
                                  ((analysisResult.recommendedTotal -
                                    analysisResult.breakdown.competitiveAnalysis
                                      .lowRange) /
                                    (analysisResult.breakdown
                                      .competitiveAnalysis.highRange -
                                      analysisResult.breakdown
                                        .competitiveAnalysis.lowRange)) *
                                  100
                                }% - 8px)`,
                                transition: "left 0.5s ease-in-out",
                              }}
                            />
                          </div>

                          <div className="flex justify-between text-xs mb-2">
                            <span>Very Budget</span>
                            <span>Budget</span>
                            <span>Standard</span>
                            <span>Premium</span>
                          </div>

                          <div className="mt-3 text-sm bg-white/80 p-2 rounded border">
                            <p className="text-sm">
                              <span className="font-semibold">
                                Your recommended price:{" "}
                              </span>
                              <span className="font-bold text-primary">
                                {formatCurrency(
                                  analysisResult.recommendedTotal,
                                )}
                              </span>
                            </p>
                            <p className="text-xs mt-1 text-muted-foreground">
                              {
                                analysisResult.breakdown.competitiveAnalysis
                                  .notes
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional details */}
                  <div className="space-y-4">
                    {/* Labor details */}
                    <div className="border rounded-lg p-4 shadow-sm bg-card overflow-hidden">
                      <h4 className="text-sm font-medium mb-3 flex items-center text-primary">
                        <Wrench className="w-4 h-4 mr-2" />
                        Labor
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="bg-muted/30 p-3 rounded-md flex justify-between items-center">
                          <div>
                            <span className="text-muted-foreground block">
                              Estimated hours:
                            </span>
                            <span className="text-xl font-bold">
                              {analysisResult.breakdown.labor.estimatedHours}
                            </span>
                            <span className="text-xs ml-1">hours</span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground block">
                              Hourly rate:
                            </span>
                            <span className="text-xl font-bold">
                              {formatCurrency(
                                analysisResult.breakdown.labor.hourlyRate,
                              )}
                            </span>
                            <span className="text-xs ml-1">/hr</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-primary/5 p-3 rounded-md">
                          <span className="font-medium">
                            Total Labor:
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(
                              analysisResult.breakdown.labor.total,
                            )}
                          </span>
                        </div>

                        {analysisResult.breakdown.labor.notes && (
                          <div className="p-2 border-l-2 border-primary/30 bg-muted/10 rounded-r-md">
                            <p className="text-xs text-muted-foreground italic">
                              {analysisResult.breakdown.labor.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Overhead and profit percentages */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 shadow-sm bg-gradient-to-br from-transparent to-muted/10">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <PieChart className="w-4 h-4 mr-2 text-primary" />
                          Overhead
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center">
                            <div className="text-2xl font-bold text-center">
                              {analysisResult.breakdown.overhead.percentage}%
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-muted-foreground">
                              Total:
                            </span>
                            <div className="text-lg font-bold">
                              {formatCurrency(
                                analysisResult.breakdown.overhead.total,
                              )}
                            </div>
                          </div>
                        </div>
                        {analysisResult.breakdown.overhead.notes && (
                          <div className="mt-2 p-2 border-t text-xs text-muted-foreground">
                            {analysisResult.breakdown.overhead.notes}
                          </div>
                        )}
                      </div>

                      <div className="border rounded-lg p-4 shadow-sm bg-gradient-to-br from-transparent to-primary/5">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <ShoppingCart className="w-4 h-4 mr-2 text-primary" />
                          Profit Margin
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="bg-primary/20 h-16 w-16 rounded-full flex items-center justify-center">
                            <div className="text-2xl font-bold text-center text-primary">
                              {analysisResult.breakdown.profit.percentage}%
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-muted-foreground">
                              Total:
                            </span>
                            <div className="text-lg font-bold text-primary">
                              {formatCurrency(
                                analysisResult.breakdown.profit.total,
                              )}
                            </div>
                          </div>
                        </div>
                        {analysisResult.breakdown.profit.notes && (
                          <div className="mt-2 p-2 border-t text-xs text-muted-foreground">
                            {analysisResult.breakdown.profit.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations and potential issues */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Recommendations */}
                  <div className="border rounded-lg p-5 shadow-sm bg-gradient-to-br from-transparent to-green-50/30">
                    <h3 className="text-base font-semibold flex items-center mb-4 text-primary">
                      <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                      Recommendations
                    </h3>
                    <ul className="space-y-3">
                      {analysisResult.breakdown.recommendations.map(
                        (rec, index) => (
                          <li
                            key={index}
                            className="flex items-start text-sm bg-white/80 p-3 rounded-md border border-green-100/50 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <CheckCircle2 className="w-5 h-5 mr-3 text-green-500 shrink-0 mt-0.5" />
                            <span className="font-medium text-slate-700">
                              {rec}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Potential issues */}
                  <div className="border rounded-lg p-5 shadow-sm bg-gradient-to-br from-transparent to-amber-50/30">
                    <h3 className="text-base font-semibold flex items-center mb-4 text-primary">
                      <Triangle className="w-5 h-5 mr-2 text-destructive" />
                      Potential Issues
                    </h3>
                    <ul className="space-y-3">
                      {analysisResult.breakdown.potentialIssues.map(
                        (issue, index) => (
                          <li
                            key={index}
                            className="flex items-start text-sm bg-white/80 p-3 rounded-md border border-amber-100/50 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <AlertCircle className="w-5 h-5 mr-3 text-amber-500 shrink-0 mt-0.5" />
                            <span className="font-medium text-slate-700">
                              {issue}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </TabsContent>

        <TabsContent value="description" className="m-0">
          {jobDescription ? (
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-lg border border-primary/20 shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center text-primary">
                  <FileText className="w-6 h-6 mr-2 text-primary" />
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Job Description
                  </span>
                </h3>
                <ScrollArea className="max-h-[400px] pr-4">
                  <div className="whitespace-pre-line text-base leading-relaxed bg-white/80 p-5 rounded-md border shadow-sm">
                    {jobDescription}
                  </div>
                </ScrollArea>
                <div className="flex justify-between mt-6">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
                    <span className="italic">
                      This description was generated by AI and can be
                      customized
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm flex items-center bg-white"
                    onClick={() => {
                      if (onDescriptionGenerated) {
                        onDescriptionGenerated(jobDescription);
                      }
                      navigator.clipboard.writeText(jobDescription);
                      toast({
                        title: "Description copied",
                        description:
                          "The description has been copied to the clipboard.",
                      });
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Copy to clipboard
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-muted/10 to-muted/20 p-6 rounded-lg flex items-center justify-center text-center min-h-[300px] border border-dashed">
                <div>
                  <FileText className="w-16 h-16 mx-auto text-muted mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-3">
                    No description generated
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Complete the cost analysis in the "Project Data"
                    tab to automatically generate a professional job
                    description.
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
