import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UsageStats {
  totalChecks: number;
  availableCount: number;
  takenCount: number;
  avgResponseTime: number;
}

export default function UsageStats() {
  const { data: stats } = useQuery<UsageStats>({
    queryKey: ['/api/username/stats'],
    refetchInterval: 30000, // Check every 30 seconds instead of 3
  });

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.totalChecks || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Checks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {stats?.availableCount || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {stats?.takenCount || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Taken</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.avgResponseTime || 0}s
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
