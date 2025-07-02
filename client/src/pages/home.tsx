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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RobloxLogo size={32} />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">RobloxCheck</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${apiStatus === "Connected" ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-gray-600 dark:text-gray-300">{apiStatus}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Username Checker - Takes up more space */}
          <div className="lg:col-span-3">
            <UsernameChecker />
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-1">
            <UsageStats />
          </div>
        </div>

        {/* Secondary Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <BulkChecker />
          <RecentChecks />
        </div>
      </main>
    </div>
  );
}
