import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Check, X, Loader2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usernameValidationSchema } from "@shared/schema";
import { z } from "zod";

type FormData = z.infer<typeof usernameValidationSchema>;

interface CheckResult {
  username: string;
  isAvailable: boolean;
  status?: string;
  message?: string;
  timestamp: string;
}

export default function UsernameChecker() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(usernameValidationSchema),
    defaultValues: {
      username: "",
    },
  });

  const checkMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/username/check", data);
      return response.json();
    },
    onSuccess: (data: CheckResult) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/username/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/username/stats'] });
      
      const getStatusTitle = () => {
        if (data.isAvailable) return "Username Available!";
        if (data.status === 'censored') return "Username Censored";
        if (data.status === 'too_short') return "Username Too Short";
        if (data.status === 'too_long') return "Username Too Long";
        if (data.status === 'invalid_characters') return "Invalid Characters";
        return "Username Taken";
      };

      const getStatusDescription = () => {
        if (data.isAvailable) return `${data.username} is available for registration`;
        if (data.message) return `${data.username}: ${data.message}`;
        return `${data.username} is already taken`;
      };

      toast({
        title: getStatusTitle(),
        description: getStatusDescription(),
        variant: data.isAvailable ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Check Failed",
        description: error.message || "Failed to check username availability",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    checkMutation.mutate(data);
  };

  const getStatusDisplay = () => {
    if (checkMutation.isPending) {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Checking availability...</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Connecting to Roblox servers</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs font-medium rounded-full animate-pulse">
              In Progress
            </span>
          </div>
        </div>
      );
    }

    if (result) {
      const isAvailable = result.isAvailable;
      const isCensored = result.status === 'censored';
      const isInvalid = ['too_short', 'too_long', 'invalid_characters'].includes(result.status || '');
      
      return (
        <div className={`${
          isAvailable 
            ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-emerald-200 dark:border-emerald-700' 
            : isCensored
              ? 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 border-orange-200 dark:border-orange-700'
              : isInvalid
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-700'
                : 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-700'
        } border rounded-xl p-4 backdrop-blur-sm shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${
                isAvailable 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-500' 
                  : isCensored
                    ? 'bg-gradient-to-br from-orange-500 to-yellow-500'
                    : isInvalid
                      ? 'bg-gradient-to-br from-yellow-500 to-amber-500'
                      : 'bg-gradient-to-br from-red-500 to-pink-500'
              } rounded-full flex items-center justify-center shadow-lg`}>
                {isAvailable ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <X className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{result.username}</p>
                <p className={`text-sm ${
                  isAvailable 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : isCensored 
                      ? 'text-orange-700 dark:text-orange-300' 
                      : isInvalid
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-red-700 dark:text-red-300'
                }`}>
                  {result.isAvailable 
                    ? 'This username is available for use!' 
                    : result.message || 'This username is already taken'
                  }
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 text-sm font-bold rounded-full shadow-md ${
              isAvailable 
                ? 'bg-emerald-500 text-white' 
                : isCensored
                  ? 'bg-orange-500 text-white'
                  : isInvalid
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
            }`}>
              {isAvailable 
                ? 'Available' 
                : isCensored
                  ? 'Censored'
                  : result.status === 'too_short'
                    ? 'Too Short'
                    : result.status === 'too_long'
                      ? 'Too Long'
                      : result.status === 'invalid_characters'
                        ? 'Invalid'
                        : 'Taken'
              }
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Ready to check</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enter a Roblox username above to get started</p>
            </div>
          </div>
          <span className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-full shadow-md">
            Waiting
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="enhanced-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Search className="text-white" size={16} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Single Username Check</h2>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Enter Username
                  </Label>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        id="username"
                        placeholder="Enter a Roblox username..."
                        className="pl-4 pr-12 h-12 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 shadow-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {checkMutation.isPending && (
                          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                        )}
                        {result && !checkMutation.isPending && (
                          result.isAvailable ? (
                            <Check className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <X className="h-6 w-6 text-red-500" />
                          )
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Username must be 3-20 characters, alphanumeric and underscores only
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {getStatusDisplay()}

            <Button 
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              disabled={checkMutation.isPending}
            >
              {checkMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Check Username
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
