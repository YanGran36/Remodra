import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface AddressInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AddressInput({ value, onChange, placeholder = "Enter address or location" }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize Google Places service when component mounts
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps) {
      // Google Maps is already loaded
      return;
    }
    
    // Load Google Maps API if not already loaded
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.length > 2) {
      // Simple address suggestions - you can enhance this with Google Places API
      const mockSuggestions = [
        `${newValue} Street, City, State`,
        `${newValue} Avenue, City, State`,
        `${newValue} Drive, City, State`,
        `${newValue} Boulevard, City, State`,
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(newValue.toLowerCase())
      );
      
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => inputValue.length > 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}