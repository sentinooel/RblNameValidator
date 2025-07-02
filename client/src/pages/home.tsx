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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-roblox-blue to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserCheck className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-roblox-blue to-purple-600 bg-clip-text text-transparent">
                  Roblox Username Checker
                </h1>
                <p className="text-sm text-gray-600">Check username availability instantly with enhanced features</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-500">API Status:</span>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full">
                <div className={`w-2 h-2 rounded-full ${apiStatus === "Connected" ? "bg-success animate-pulse" : "bg-error"}`}></div>
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
            
            {/* Enhanced Features Info */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Shield className="text-white" size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-800 mb-2">Enhanced Features</h4>
                  <div className="space-y-1 text-xs text-green-700">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Unlimited bulk checking (no limits!)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>File upload support (.txt files up to 5MB)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Download available usernames as .txt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>5x faster processing (0.2s delays)</span>
                    </div>
                  </div>
                  <div className="mt-3 px-3 py-1.5 bg-green-100 rounded-lg">
                    <span className="text-xs font-medium text-green-800">⚡ Lightning Fast</span>
                    <span className="text-xs text-green-600 ml-2">Respects Roblox API limits</span>
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
