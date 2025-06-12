import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, Translation, translations, getTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the context type
type LanguageContextType = {
  language: Language;
  t: (key: string) => string;
  changeLanguage: (language: Language) => void;
  supportedLanguages: { code: Language; name: string }[];
  isLoading: boolean;
};

// Create context
export const LanguageContext = createContext<LanguageContextType | null>(null);

// English only
const supportedLanguages = [
  { code: 'en' as Language, name: 'English' },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Always use English
  const getUserLanguage = (): Language => {
    // Always return English
    return 'en';
  };
  
  const [language, setLanguage] = useState<Language>(getUserLanguage());

  // Translation function
  const t = (key: string): string => {
    // Make sure the language exists in translations
    if (translations[language]) {
      const result = getTranslation(translations[language] as Translation, key, language);
      // If translation is missing, fallback to English
      if (result === key && language !== 'en') {
        return getTranslation(translations.en as Translation, key, 'en');
      }
      return result;
    }
    // Fallback to English if the selected language is not available
    return getTranslation(translations.en as Translation, key, 'en');
  };

  // Function to change the language
  const changeLanguage = async (newLanguage: Language) => {
    if (!supportedLanguages.some(lang => lang.code === newLanguage)) {
      console.warn(`Language ${newLanguage} is not supported`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Save the preference to localStorage
      localStorage.setItem('preferredLanguage', newLanguage);
      
      // Update language in state
      setLanguage(newLanguage);
      
      // If user is logged in, save preference to database
      if (user) {
        try {
          await apiRequest("PATCH", "/api/user/preferences", { 
            language: newLanguage 
          });
        } catch (error) {
          console.error("Failed to update language preference on server", error);
        }
      }
      
      toast({
        title: "Language changed",
        description: "Your language preference has been updated",
      });
    } catch (error) {
      console.error("Error changing language:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, supportedLanguages, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}