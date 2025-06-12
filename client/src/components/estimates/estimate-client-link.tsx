import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clipboard, Link, Check, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EstimateClientLinkProps {
  estimateId: number;
  estimateNumber: string;
  clientEmail?: string | null;
  onSendEmail?: () => void;
}

export function EstimateClientLink({ 
  estimateId, 
  estimateNumber,
  clientEmail,
  onSendEmail
}: EstimateClientLinkProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Construir la URL completa para el cliente
  const publicUrl = `${window.location.origin}/public/estimates/${estimateId}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: "Success",
        description: "Link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Error",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full shadow-xl border-2 border-blue-400 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-4 bg-blue-100">
        <CardTitle className="text-xl flex items-center gap-2 text-blue-700">
          <Link className="h-6 w-6 text-blue-600" />
          Client Link
        </CardTitle>
        <CardDescription className="text-blue-700 font-medium">
          Share this link with your client so they can review and approve this estimate
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6 pt-4">
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="clientLink" className="text-blue-700 font-medium text-lg">Estimate Link:</Label>
            <div className="flex space-x-2">
              <Input
                id="clientLink"
                value={publicUrl}
                readOnly
                className="flex-grow font-mono text-sm border-blue-300 bg-white"
              />
              <Button 
                variant={copied ? "outline" : "default"} 
                onClick={handleCopy}
                className={`flex items-center gap-2 min-w-28 ${copied ? 'border-green-400 text-green-600' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Clipboard className="h-5 w-5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      {onSendEmail && clientEmail && (
        <CardFooter className="flex justify-between pt-0 bg-blue-50">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-blue-400 text-blue-700 hover:bg-blue-100"
            onClick={onSendEmail}
          >
            <Mail className="h-4 w-4" />
            Send to Client
          </Button>
          <div className="text-sm text-blue-700">
            <span>{clientEmail}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}