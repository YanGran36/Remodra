import React from "react";
import { cn } from "@/lib/utils";
import { Check, Clock, Mail, X, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({
  status,
  className,
  showIcon = true,
  size = "md",
}: StatusBadgeProps) {
  const badgeConfig: Record<string, { icon: any; bg: string; text: string; label: string }> = {
    draft: {
      icon: <Clock className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Borrador",
    },
    sent: {
      icon: <Mail className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Enviado",
    },
    accepted: {
      icon: <Check className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
      bg: "bg-green-100", 
      text: "text-green-800",
      label: "Aceptado",
    },
    rejected: {
      icon: <X className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Rechazado", 
    },
    expired: {
      icon: <AlertTriangle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
      bg: "bg-orange-100",
      text: "text-orange-800",
      label: "Vencido",
    },
    paid: {
      icon: <Check className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Pagado",
    },
    "partial-paid": {
      icon: <Clock className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      label: "Pago Parcial",
    },
    unpaid: {
      icon: <AlertTriangle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
      bg: "bg-red-100",
      text: "text-red-800",
      label: "No Pagado",
    },
  };

  const config = badgeConfig[status] || {
    icon: null,
    bg: "bg-gray-100",
    text: "text-gray-800",
    label: status,
  };

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.bg,
        config.text,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}

export function getEstimateStatusBadge(status: string) {
  return <StatusBadge status={status} />;
}

export function getInvoiceStatusBadge(status: string) {
  return <StatusBadge status={status} />;
}