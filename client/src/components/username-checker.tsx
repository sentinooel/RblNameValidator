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
      
      toast({
        title: data.isAvailable ? "Username Available!" : "Username Taken",
        description: data.isAvailable 
          ? `${data.username} is available for registration`
          : `${data.username} is already taken`,
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Checking...</p>
                <p className="text-xs text-blue-600">Please wait while we check availability</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-200 text-blue-700 text-xs font-medium rounded-full">
              In Progress
            </span>
          </div>
        </div>
      );
    }

    if (result) {
      return (
        <div className={`${result.isAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 ${result.isAvailable ? 'bg-success' : 'bg-error'} rounded-full flex items-center justify-center`}>
                {result.isAvailable ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <X className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{result.username}</p>
                <p className={`text-xs ${result.isAvailable ? 'text-success' : 'text-error'}`}>
                  {result.isAvailable ? 'This username is available!' : 'This username is already taken'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 ${result.isAvailable ? 'bg-success text-white' : 'bg-error text-white'} text-xs font-medium rounded-full`}>
              {result.isAvailable ? 'Available' : 'Taken'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Ready to check</p>
              <p className="text-xs text-gray-500">Enter a username above</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
            Waiting
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Search className="text-roblox-blue" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Single Username Check</h2>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Enter Username
                  </Label>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        id="username"
                        placeholder="Enter a Roblox username..."
                        className="pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {checkMutation.isPending && (
                          <Loader2 className="h-5 w-5 text-roblox-blue animate-spin" />
                        )}
                        {result && !checkMutation.isPending && (
                          result.isAvailable ? (
                            <Check className="h-5 w-5 text-success" />
                          ) : (
                            <X className="h-5 w-5 text-error" />
                          )
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Username must be 3-20 characters, alphanumeric and underscores only
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {getStatusDisplay()}

            <Button 
              type="submit"
              className="w-full bg-roblox-blue text-white hover:bg-roblox-blue/90"
              disabled={checkMutation.isPending}
            >
              {checkMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
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
