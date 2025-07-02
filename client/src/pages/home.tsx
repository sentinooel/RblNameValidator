import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCheck, Clock, Shield, Settings } from "lucide-react";
import { RobloxLogo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <RobloxLogo size={48} className="drop-shadow-lg" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">API Status:</span>
                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                  <div className={`w-2 h-2 rounded-full ${apiStatus === "Connected" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></div>
                  <span className={`text-sm font-medium ${apiStatus === "Connected" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {apiStatus}
                  </span>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Single Username Checker */}
          <div className="lg:col-span-2 space-y-6">
            <UsernameChecker />
            <RecentChecks />
          </div>

          {/* Bulk Checker */}
          <div className="lg:col-span-1">
            <BulkChecker />
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mt-8">
          <UsageStats />
        </div>
      </main>
    </div>
  );
}
