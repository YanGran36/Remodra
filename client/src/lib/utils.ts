import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha en una cadena de texto localizada
 * @param date - Fecha a formatear (puede ser string, Date o undefined)
 * @param options - Opciones de formato para Intl.DateTimeFormat
 * @returns Cadena de texto con la fecha formateada o cadena vacía si date es undefined o inválido
 */
export function formatDate(
  date?: string | Date | null,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "";
    
    return new Intl.DateTimeFormat('es-ES', options).format(dateObj);
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "";
  }
}

/**
 * Formatea un número como moneda ($)
 * @param amount - Cantidad a formatear
 * @param options - Opciones de formato para Intl.NumberFormat
 * @returns Cadena de texto con la cantidad formateada como moneda
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  options: Intl.NumberFormatOptions = { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
): string {
  if (amount === undefined || amount === null) return "$0.00";
  
  try {
    const numericAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[$,]/g, '')) 
      : amount;
    
    if (isNaN(numericAmount)) return "$0.00";
    
    return new Intl.NumberFormat('en-US', options).format(numericAmount);
  } catch (error) {
    console.error("Error al formatear moneda:", error);
    return "$0.00";
  }
}
