import { cn } from "@/lib/utils";
import React from "react";

interface ArchitecturalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "outline";
  isHoverable?: boolean;
  hasPattern?: boolean;
  children: React.ReactNode;
}

/**
 * Tarjeta con diseño arquitectónico futurista
 */
export function ArchitecturalCard({
  variant = "primary",
  isHoverable = true,
  hasPattern = false,
  className,
  children,
  ...props
}: ArchitecturalCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border shadow-md transition-all duration-300",
        
        // Variantes de diseño
        variant === "primary" && "border-primary/20 bg-white dark:bg-black dark:bg-opacity-20 dark:backdrop-blur-md",
        variant === "secondary" && "border-secondary/20 bg-secondary/5 dark:bg-black dark:bg-opacity-10 dark:backdrop-blur-md",
        variant === "outline" && "border-border bg-card dark:bg-black dark:bg-opacity-5 dark:backdrop-blur-md",
        
        // Efectos interactivos
        isHoverable && "hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
        
        className
      )}
      {...props}
    >
      {/* Elementos decorativos arquitectónicos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Líneas diagonales de fondo */}
        {hasPattern && (
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent"></div>
            <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 rotate-45 bg-primary/10 filter blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 rotate-45 bg-secondary/10 filter blur-3xl"></div>
          </div>
        )}
        
        {/* Elementos de esquina para un aspecto arquitectónico */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/20"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/20"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/20"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/20"></div>
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Contenedor con fondo arquitectónico
 */
export function ArchitecturalContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-background to-background/95 relative overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Patrones de fondo arquitectónicos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid de fondo */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary)/0.2) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary)/0.2) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        ></div>
        
        {/* Líneas diagonales decorativas */}
        <div className="absolute -left-40 top-1/4 w-80 h-80 bg-primary/5 rounded-full filter blur-[100px]"></div>
        <div className="absolute -right-40 top-2/4 w-80 h-80 bg-secondary/5 rounded-full filter blur-[100px]"></div>
        <div className="absolute left-1/3 -top-40 w-80 h-80 bg-primary/5 rounded-full filter blur-[100px]"></div>
      </div>
      
      {/* Contenido */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Cabecera de página arquitectónica
 */
export function ArchitecturalHeader({
  title,
  description,
  className,
  children,
  ...props
}: {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative py-12 mb-8 bg-luxury-gradient shadow-lg",
        className
      )}
      {...props}
    >
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
        {/* Formas geométricas arquitectónicas que simulan estructuras */}
        <div className="absolute -top-10 right-20 w-40 h-40 border-r border-t border-white/10 rounded-tr-3xl"></div>
        <div className="absolute -bottom-20 left-40 w-60 h-60 border-l border-b border-white/5 rounded-bl-3xl"></div>
        
        {/* Efectos de luz difuminados */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl"></div>
      </div>
      
      {/* Contenido */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 animate-float">
          {title}
        </h1>
        {description && (
          <p className="text-white/70 text-lg max-w-3xl">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

export function ArchitecturalGrid({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid gap-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ArchitecturalStat({
  title,
  value,
  icon,
  trend,
  percentage,
  className,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  percentage?: number;
  className?: string;
}) {
  return (
    <ArchitecturalCard className={cn("p-6", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold mt-2 text-blue-gradient">{value}</h3>
          
          {trend && percentage && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" ? (
                <div className="flex items-center text-green-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.77 4.21a.75.75 0 01.02 1.06l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 011.08-1.04L10 8.168l3.71-3.938a.75.75 0 011.06-.02zm0 6a.75.75 0 01.02 1.06l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 111.08-1.04L10 14.168l3.71-3.938a.75.75 0 011.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium">{percentage}%</span>
                </div>
              ) : trend === "down" ? (
                <div className="flex items-center text-red-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 15.79a.75.75 0 01-.02-1.06l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 11-1.08 1.04L10 11.832l-3.71 3.938a.75.75 0 01-1.06.02zm0-6a.75.75 0 01-.02-1.06l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-1.08 1.04L10 5.832 6.29 9.77a.75.75 0 01-1.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium">{percentage}%</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-500">
                  <span className="text-xs font-medium">{percentage}%</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">vs mes anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-lg p-2.5 bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </ArchitecturalCard>
  );
}