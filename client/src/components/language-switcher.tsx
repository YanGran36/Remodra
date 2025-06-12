import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Globe, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// English only - removed Spanish language support
const languageFlags: Record<string, string> = {
  en: "🇺🇸", // US flag for English only
};

export function LanguageSwitcher({ variant = "ghost", showText = true, size = "sm" }: { 
  variant?: "ghost" | "outline" | "secondary" | "default"; 
  showText?: boolean;
  size?: "sm" | "default" | "lg";
}) {
  const { language, changeLanguage, supportedLanguages, isLoading, t } = useLanguage();

  // Get the current language name to display
  const currentLanguageName = supportedLanguages.find(lang => lang.code === language)?.name || '';
  const currentFlag = languageFlags[language] || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="flex items-center gap-2 rounded-full hover:bg-primary/10"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span className="text-lg">{currentFlag}</span>
              <Globe className="h-4 w-4" />
            </>
          )}
          {showText && (
            <span className="hidden md:inline-block">
              {currentLanguageName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>{t('settings.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`flex items-center justify-between ${language === lang.code ? "font-medium" : ""}`}
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{languageFlags[lang.code] || ''}</span>
              <span>{lang.name}</span>
            </div>
            {language === lang.code && (
              isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin ml-2" />
              ) : (
                <Check className="h-4 w-4 text-primary ml-2" />
              )
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}