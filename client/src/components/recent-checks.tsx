import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { History, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UsernameCheck {
  id: number;
  username: string;
  isAvailable: boolean;
  checkedAt: string;
}

export default function RecentChecks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: recentChecks = [], isLoading } = useQuery<UsernameCheck[]>({
    queryKey: ['/api/username/recent'],
    refetchInterval: 3000, // Real-time updates every 3 seconds
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/username/recent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear history');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch recent checks and stats
      queryClient.invalidateQueries({ queryKey: ['/api/username/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/username/stats'] });
      
      toast({
        title: "History cleared",
        description: "All username check history has been cleared successfully.",
      });
    },
    onError: (error) => {
      console.error('Clear history error:', error);
      toast({
        title: "Error",
        description: "Failed to clear history. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="enhanced-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <History className="text-roblox-blue mr-2" size={20} />
            Recent Checks
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="w-24 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-3 bg-gray-300 rounded"></div>
                    <div className="w-12 h-5 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="enhanced-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <History className="text-white" size={16} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Checks</h3>
          </div>
          {recentChecks.length > 0 && (
            <Button
              onClick={() => clearHistoryMutation.mutate()}
              disabled={clearHistoryMutation.isPending}
              variant="outline"
              size="sm"
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            >
              Clear History
            </Button>
          )}
        </div>
        
        {recentChecks.length === 0 ? (
          <div className="text-center py-8">
            <History className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">No recent checks</h4>
            <p className="mt-1 text-sm text-gray-500">
              Username checks will appear here after you start checking.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentChecks.map((check) => (
              <div 
                key={check.id} 
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {check.isAvailable ? (
                    <Check className="text-success" size={16} />
                  ) : (
                    <X className="text-error" size={16} />
                  )}
                  <span className="text-sm text-gray-900">{check.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(check.checkedAt), { addSuffix: true })}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    check.isAvailable 
                      ? 'bg-green-100 text-success'
                      : 'bg-red-100 text-error'
                  }`}>
                    {check.isAvailable ? 'Available' : 'Taken'}
                  </span>
                </div>
              </div>
            ))}
            
            {recentChecks.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                className="mt-4 text-sm text-roblox-blue hover:text-blue-700 font-medium"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
              >
                Clear History
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
