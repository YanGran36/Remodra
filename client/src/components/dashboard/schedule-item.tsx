import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, MessageSquare, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ScheduleItemProps {
  time: string;
  timeColor: string;
  title: string;
  location: string;
  contact?: {
    name: string;
    avatar?: string;
    initials?: string;
    id?: number;
  };
  orderNumber?: string;
  onPhoneClick?: () => void;
  onMessageClick?: () => void;
  onMapClick?: () => void;
  onCreateEstimateClick?: () => void;
}

export default function ScheduleItem({
  time,
  timeColor,
  title,
  location,
  contact,
  orderNumber,
  onPhoneClick,
  onMessageClick,
  onMapClick,
  onCreateEstimateClick
}: ScheduleItemProps) {
  return (
    <div className="p-4 flex items-start">
      <div className="flex-shrink-0 mr-4">
        <div className={`${timeColor} font-medium rounded px-2.5 py-0.5 text-xs`}>
          {time}
        </div>
      </div>
      
      <div className="flex-grow">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{location}</p>
        
        <div className="flex items-center mt-2">
          {contact && (
            <>
              <Avatar className="w-6 h-6">
                <AvatarImage src={contact.avatar} alt={contact.name} />
                <AvatarFallback className="text-xs">{contact.initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm ml-2 text-gray-700">{contact.name}</span>
            </>
          )}
          
          {orderNumber && (
            <span className="text-sm text-gray-700">Order #{orderNumber}</span>
          )}
        </div>
      </div>
      
      <div className="flex-shrink-0 ml-4">
        <div className="flex space-x-2">
          {onPhoneClick && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700" onClick={onPhoneClick}>
              <Phone className="h-4 w-4" />
            </Button>
          )}
          
          {onMessageClick && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700" onClick={onMessageClick}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          
          {onMapClick && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700" onClick={onMapClick}>
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          
          {onCreateEstimateClick && contact?.id && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-green-700" onClick={onCreateEstimateClick} title="Create estimate">
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
