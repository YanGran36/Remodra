import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Detector más sofisticado que analiza tamaño de pantalla y características de dispositivos móviles
export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const checkMobile = () => {
      // Verifica tamaño de pantalla
      const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
      
      // Verifica si es un dispositivo táctil o tiene capacidades móviles
      const hasTouchCapability = 'ontouchstart' in window || 
                              navigator.maxTouchPoints > 0 || 
                              (navigator as any).msMaxTouchPoints > 0;
      
      // Verifica si el user agent indica un dispositivo móvil
      const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Verifica si tiene orientación (característica típica de móviles)
      const hasOrientation = typeof window.orientation !== 'undefined';
      
      // Algoritmo de decisión:
      // - Si la pantalla es pequeña Y tiene al menos una característica móvil, es móvil
      // - Si tiene al menos dos características móviles (incluso con pantalla grande), es móvil
      const mobileFeatures = [hasTouchCapability, mobileUserAgent, hasOrientation].filter(Boolean).length;
      
      return isSmallScreen && mobileFeatures > 0 || mobileFeatures >= 2;
    };

    // Configurar listener para cambios de tamaño
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(checkMobile());
    };
    
    // Agregar event listener
    mql.addEventListener("change", onChange);
    
    // Comprobar inicialmente
    setIsMobile(checkMobile());
    
    // Limpiar
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
