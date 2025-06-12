import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  title: string;
  content: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function InfoCard({ title, content, icon, className }: InfoCardProps) {
  return (
    <Card className={cn("h-full overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {icon && <span className="mr-2 text-muted-foreground">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}