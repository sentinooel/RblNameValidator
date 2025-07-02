import { useQuery } from "@tanstack/react-query";
import { Search, Check, X, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UsageStats {
  totalChecks: number;
  availableCount: number;
  takenCount: number;
  avgResponseTime: number;
}

export default function UsageStats() {
  const { data: stats, isLoading } = useQuery<UsageStats>({
    queryKey: ['/api/username/stats'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const statItems = [
    {
      icon: Search,
      label: "Total Checks",
      value: stats?.totalChecks?.toLocaleString() || "0",
      bgColor: "bg-roblox-light",
      iconColor: "text-roblox-blue",
    },
    {
      icon: Check,
      label: "Available",
      value: stats?.availableCount?.toLocaleString() || "0",
      bgColor: "bg-green-100",
      iconColor: "text-success",
    },
    {
      icon: X,
      label: "Taken",
      value: stats?.takenCount?.toLocaleString() || "0",
      bgColor: "bg-red-100",
      iconColor: "text-error",
    },
    {
      icon: Clock,
      label: "Avg Response",
      value: stats ? `${stats.avgResponseTime}s` : "0s",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <Card key={index} className="enhanced-card text-center">
          <CardContent className="p-6">
            <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
              <item.icon className={item.iconColor} size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {isLoading ? (
                <div className="w-12 h-8 bg-gray-300 rounded mx-auto animate-pulse"></div>
              ) : (
                item.value
              )}
            </div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
