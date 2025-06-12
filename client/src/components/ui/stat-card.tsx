import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className 
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-muted-foreground font-medium text-sm">{title}</h3>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold">{value}</div>
          
          {trend && (
            <div className={cn(
              "text-xs font-medium flex items-center",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              <div className={cn(
                "rounded-full w-4 h-4 flex items-center justify-center mr-1",
                trend.isPositive ? "bg-green-100" : "bg-red-100"
              )}>
                <span>{trend.isPositive ? "↑" : "↓"}</span>
              </div>
              {trend.value}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}