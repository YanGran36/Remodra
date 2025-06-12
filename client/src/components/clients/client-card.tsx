import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin } from "lucide-react";
import { ClientWithProjects } from "@/hooks/use-clients";
import { formatDate } from "@/lib/utils";

type ClientCardProps = {
  client: ClientWithProjects;
  onViewDetails: (client: ClientWithProjects) => void;
  onNewEstimate: (client: ClientWithProjects) => void;
};

export default function ClientCard({ 
  client, 
  onViewDetails, 
  onNewEstimate 
}: ClientCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const clientSince = formatDate(client.createdAt);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {getInitials(client.firstName, client.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{client.firstName} {client.lastName}</h3>
              <p className="text-sm text-gray-500">Client since {clientSince}</p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {client.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-3.5 w-3.5 text-gray-500 mr-2" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center text-sm">
                <Mail className="h-3.5 w-3.5 text-gray-500 mr-2" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center text-sm">
                <MapPin className="h-3.5 w-3.5 text-gray-500 mr-2" />
                <span className="truncate">
                  {client.address}
                  {client.city && `, ${client.city}`}
                  {client.state && `, ${client.state}`}
                  {client.zip && ` ${client.zip}`}
                </span>
              </div>
            )}
          </div>

          {client.projects && Array.isArray(client.projects) && client.projects.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium">Projects</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {client.projects.slice(0, 3).map((project) => (
                  <Badge key={project.id} variant="outline" className="font-normal">
                    {project.title}
                  </Badge>
                ))}
                {client.projects.length > 3 && (
                  <Badge variant="outline" className="font-normal">
                    +{client.projects.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex border-t border-gray-100">
          <Button 
            variant="ghost" 
            className="flex-1 rounded-none text-xs text-gray-500 h-10"
            onClick={() => onViewDetails(client)}
          >
            View Details
          </Button>
          <div className="w-px bg-gray-100" />
          <Button 
            variant="ghost" 
            className="flex-1 rounded-none text-xs text-gray-500 h-10"
            onClick={() => onNewEstimate(client)}
          >
            New Estimate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}