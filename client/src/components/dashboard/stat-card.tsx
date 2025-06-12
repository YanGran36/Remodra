import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatDetail {
  label: string;
  value: string | number;
  className?: string;
}

interface StatCardProps {
  icon: ReactNode;
  iconColor: string;
  iconBgColor: string;
  title: string;
  value: string | number;
  details?: StatDetail[];
}

export default function StatCard({
  icon,
  iconColor,
  iconBgColor,
  title,
  value,
  details = []
}: StatCardProps) {
  return (
    <Card className="shadow-sm border border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`rounded-full p-3 mr-4 ${iconBgColor}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
        </div>
        
        {details.length > 0 && (
          <div className="mt-4">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{detail.label}</span>
                <span className={`text-gray-900 font-medium ${detail.className || ''}`}>{detail.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
