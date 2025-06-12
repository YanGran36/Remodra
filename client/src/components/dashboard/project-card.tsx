import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export interface TeamMember {
  name: string;
  avatar?: string;
  initials?: string;
}

export interface ProjectCardProps {
  title: string;
  startDate: string;
  status: "In Progress" | "On Schedule" | "Materials Pending" | "Completed" | "Delayed";
  progress: number;
  team: TeamMember[];
  onViewDetails: () => void;
}

export default function ProjectCard({
  title,
  startDate,
  status,
  progress,
  team,
  onViewDetails
}: ProjectCardProps) {
  const getStatusClass = () => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Materials Pending":
        return "bg-yellow-100 text-yellow-800";
      case "On Schedule":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-success/15 text-success";
      case "Delayed":
        return "bg-destructive/15 text-destructive";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case "In Progress":
        return "bg-blue-600";
      case "Materials Pending":
        return "bg-yellow-500";
      case "On Schedule":
        return "bg-green-600";
      case "Completed":
        return "bg-success";
      case "Delayed":
        return "bg-destructive";
      default:
        return "bg-blue-600";
    }
  };

  return (
    <Card className="border border-gray-100">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">Started {startDate}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getStatusClass()}`}>
            {status}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1 text-sm">
            <span className="text-gray-700">Progress</span>
            <span className="text-gray-900 font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2.5 bg-gray-200" indicatorClassName={getProgressBarColor()} />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {team.map((member, index) => (
              <Avatar key={index} className="w-7 h-7 border-2 border-white">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="text-xs bg-primary text-white">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Button 
            variant="ghost" 
            className="text-sm text-primary hover:text-primary/80 font-medium"
            onClick={onViewDetails}
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
