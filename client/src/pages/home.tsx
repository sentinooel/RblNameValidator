import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCheck, Clock, Shield } from "lucide-react";
import { RobloxLogo } from "@/components/logo";
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
              <RobloxLogo size={48} className="drop-shadow-lg" />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Single Username Checker */}
          <div className="lg:col-span-2 space-y-8">
            <UsernameChecker />
            <RecentChecks />
          </div>

          {/* Bulk Checker */}
          <div className="lg:col-span-1 space-y-6">
            <BulkChecker />
            

          </div>
        </div>

        {/* Usage Stats */}
        <UsageStats />
      </main>
    </div>
  );
}
