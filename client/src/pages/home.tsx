import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCheck, Clock, Shield } from "lucide-react";
import UsernameChecker from "@/components/username-checker";
import BulkChecker from "@/components/bulk-checker";
import RecentChecks from "@/components/recent-checks";
import UsageStats from "@/components/usage-stats";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<"Connected" | "Disconnected">("Connected");

  // Check API status
  const { data: statusData } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    if (statusData) {
      setApiStatus("Connected");
    }
  }, [statusData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-roblox-blue rounded-lg flex items-center justify-center">
                <UserCheck className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Roblox Username Checker</h1>
                <p className="text-sm text-gray-500">Check username availability instantly</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-500">API Status:</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${apiStatus === "Connected" ? "bg-success" : "bg-error"}`}></div>
                <span className={`text-sm font-medium ${apiStatus === "Connected" ? "text-success" : "text-error"}`}>
                  {apiStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Single Username Checker */}
          <div className="lg:col-span-2 space-y-8">
            <UsernameChecker />
            <RecentChecks />
          </div>

          {/* Bulk Checker */}
          <div className="lg:col-span-1 space-y-6">
            <BulkChecker />
            
            {/* Rate Limit Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Shield className="text-warning mt-0.5" size={18} />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800">Rate Limiting</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    To respect Roblox's API limits, bulk checks are processed with delays. 
                    Please be patient during large batch operations.
                  </p>
                  <div className="mt-2 text-xs text-amber-600">
                    <span className="font-medium">Current limit:</span> 10 requests per minute
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <UsageStats />
      </main>
    </div>
  );
}
