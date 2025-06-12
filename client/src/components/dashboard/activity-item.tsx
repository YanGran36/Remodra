import { ReactNode } from "react";

export interface ActivityItemProps {
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  title: ReactNode;
  description: string;
  timestamp: string;
}

export default function ActivityItem({
  icon,
  iconBgColor,
  iconColor,
  title,
  description,
  timestamp
}: ActivityItemProps) {
  return (
    <div className="p-4 flex">
      <div className="flex-shrink-0 mr-4">
        <div className={`${iconBgColor} p-2 rounded-full`}>
          <div className={`${iconColor}`}>{icon}</div>
        </div>
      </div>
      
      <div>
        <p className="text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{timestamp}</p>
      </div>
    </div>
  );
}
