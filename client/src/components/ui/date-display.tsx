import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateDisplayProps {
  label: string;
  date?: string | Date;
  isPast?: boolean;
  isFuture?: boolean;
  daysRemaining?: number;
  className?: string;
}

export function DateDisplay({
  label,
  date,
  isPast = false,
  isFuture = false,
  daysRemaining,
  className,
}: DateDisplayProps) {
  if (!date) return null;
  
  const formattedDate = typeof date === 'string' 
    ? format(new Date(date), 'dd MMM yyyy')
    : format(date, 'dd MMM yyyy');
  
  const relativeTime = typeof date === 'string'
    ? formatDistanceToNow(new Date(date), { addSuffix: true })
    : formatDistanceToNow(date, { addSuffix: true });
  
  return (
    <div className={cn("flex items-start space-x-3", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-full p-2 mt-0.5",
        isPast ? "bg-red-100" : isFuture ? "bg-green-100" : "bg-gray-100"
      )}>
        {isPast ? (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        ) : isFuture ? (
          <Clock className="h-4 w-4 text-green-600" />
        ) : (
          <Calendar className="h-4 w-4 text-gray-600" />
        )}
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{formattedDate}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {relativeTime}
          {daysRemaining !== undefined && (
            <span className={cn(
              "ml-2 px-1.5 py-0.5 rounded-sm text-xs font-medium",
              daysRemaining < 0 
                ? "bg-red-100 text-red-800" 
                : daysRemaining < 3 
                  ? "bg-amber-100 text-amber-800" 
                  : "bg-green-100 text-green-800"
            )}>
              {daysRemaining < 0 
                ? `Vencido hace ${Math.abs(daysRemaining)} días` 
                : daysRemaining === 0 
                  ? "Vence hoy"
                  : daysRemaining === 1 
                    ? "Vence mañana" 
                    : `${daysRemaining} días restantes`}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}