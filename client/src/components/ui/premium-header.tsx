import React from "react";
import { cn } from "@/lib/utils";

interface PremiumHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PremiumHeader({
  title,
  subtitle,
  className,
  children,
}: PremiumHeaderProps) {
  return (
    <div className={cn("premium-header relative overflow-hidden rounded-lg", className)}>
      <div className="premium-header-background absolute inset-0 bg-gradient-to-r from-primary/80 to-indigo-500/80 opacity-95"></div>
      <div className="premium-header-content relative z-10 p-6 md:p-8">
        <h1 className="premium-title text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="premium-subtitle text-white/90 max-w-3xl">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 h-24 w-24 -mt-6 -mr-6 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 h-16 w-16 -mb-4 -ml-4 bg-white/10 rounded-full blur-lg"></div>
      <div className="absolute top-1/2 right-1/4 h-8 w-8 bg-white/20 rounded-full blur-sm"></div>
    </div>
  );
}