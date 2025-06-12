// Performance optimization utilities

// Custom debounce implementation
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Debounced search function
export const debouncedSearch = debounce((callback: (term: string) => void, term: string) => {
  callback(term);
}, 300);

// Optimized image loading
export const optimizeImageLoad = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
};

// Local storage with error handling
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576),
      total: Math.round(memory.totalJSHeapSize / 1048576),
      limit: Math.round(memory.jsHeapSizeLimit / 1048576)
    };
  }
  return null;
};

// Connection quality detection
export const getConnectionQuality = (): 'slow' | 'fast' | 'unknown' => {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
      return 'slow';
    }
    return 'fast';
  }
  return 'unknown';
};