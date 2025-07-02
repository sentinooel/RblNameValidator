import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      
      toast({
        title: data.isAvailable ? "Username Available!" : "Username Taken",
        description: data.isAvailable 
          ? `${data.username} is available for use!` 
          : data.message || `${data.username} is already taken`,
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

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Check Username Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex space-x-2">
                      <Input
                        {...field}
                        placeholder="Enter username..."
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={checkMutation.isPending}
                        className="px-6"
                      >
                        {checkMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Check"
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.isAvailable 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
          }`}>
            <div className="flex items-center space-x-3">
              {result.isAvailable ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{result.username}</p>
                <p className={`text-sm ${
                  result.isAvailable 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {result.isAvailable ? 'Available' : result.message || 'Not available'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}