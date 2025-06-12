import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureDisplayProps {
  title: string;
  signature?: string | null;
  date?: Date;
  className?: string;
}

export function SignatureDisplay({
  title,
  signature,
  date,
  className,
}: SignatureDisplayProps) {
  return (
    <div className={cn("signature-display flex flex-col items-center", className)}>
      <p className="text-sm font-medium mb-2 text-muted-foreground">{title}</p>
      
      {signature ? (
        <div className="w-full">
          <div className="signature-image w-full h-24 mb-2 bg-white flex items-center justify-center rounded border border-input overflow-hidden">
            <img 
              src={signature} 
              alt={`${title} signature`} 
              className="max-h-full" 
            />
          </div>
          {date && (
            <p className="text-xs text-center text-muted-foreground">
              {format(date, "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          )}
        </div>
      ) : (
        <div className="signature-empty w-full h-24 flex flex-col items-center justify-center rounded border border-dashed border-muted-foreground/30 bg-muted/50">
          <Pen className="h-5 w-5 text-muted-foreground/50 mb-1" />
          <p className="text-xs text-muted-foreground/70">Firma no disponible</p>
        </div>
      )}
    </div>
  );
}