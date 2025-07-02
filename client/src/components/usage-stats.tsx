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
    refetchInterval: 3000, // Real-time updates every 3 seconds
  });

  const statItems = [
    {
      icon: Search,
      label: "Total Checks",
      value: stats?.totalChecks?.toLocaleString() || "0",
      gradient: "from-blue-500 to-purple-600",
      bgGradient: "from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30",
    },
    {
      icon: Check,
      label: "Available",
      value: stats?.availableCount?.toLocaleString() || "0",
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30",
    },
    {
      icon: X,
      label: "Taken",
      value: stats?.takenCount?.toLocaleString() || "0",
      gradient: "from-red-500 to-pink-600",
      bgGradient: "from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30",
    },
    {
      icon: Clock,
      label: "Avg Response",
      value: stats ? `${stats.avgResponseTime}s` : "0s",
      gradient: "from-orange-500 to-amber-600",
      bgGradient: "from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <Card key={index} className="enhanced-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 text-center">
          <CardContent className="p-6">
            <div className={`w-16 h-16 bg-gradient-to-br ${item.bgGradient} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center`}>
                <item.icon className="text-white" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isLoading ? (
                <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded mx-auto animate-pulse"></div>
              ) : (
                item.value
              )}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
