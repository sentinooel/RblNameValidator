import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ListChecks, Play, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const bulkFormSchema = z.object({
  usernames: z.string()
    .min(1, "Please enter at least one username")
    .transform(val => val.split('\n').map(u => u.trim()).filter(u => u.length > 0))
    .refine(usernames => usernames.length <= 10, "Maximum 10 usernames allowed")
    .refine(usernames => usernames.length > 0, "Please enter at least one username"),
});

type FormData = z.infer<typeof bulkFormSchema>;

interface BulkResult {
  username: string;
  isAvailable: boolean | null;
  error?: string;
  timestamp: string;
}

export default function BulkChecker() {
  const [results, setResults] = useState<BulkResult[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      usernames: "",
    },
  });

  const bulkCheckMutation = useMutation({
    mutationFn: async (data: { usernames: string[] }) => {
      const response = await apiRequest("POST", "/api/username/bulk-check", data);
      return response.json();
    },
    onSuccess: (data: { results: BulkResult[] }) => {
      setResults(data.results);
      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ['/api/username/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/username/stats'] });
      
      const availableCount = data.results.filter(r => r.isAvailable === true).length;
      const takenCount = data.results.filter(r => r.isAvailable === false).length;
      const errorCount = data.results.filter(r => r.isAvailable === null).length;
      
      toast({
        title: "Bulk Check Complete",
        description: `${availableCount} available, ${takenCount} taken${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
      });
    },
    onError: (error: any) => {
      setProgress(0);
      toast({
        title: "Bulk Check Failed",
        description: error.message || "Failed to check usernames",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    setResults([]);
    setProgress(0);
    bulkCheckMutation.mutate({ usernames: data.usernames });
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    const csv = [
      'Username,Status,Timestamp',
      ...results.map(r => 
        `${r.username},${r.isAvailable === null ? 'Error' : r.isAvailable ? 'Available' : 'Taken'},${r.timestamp}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roblox-username-check-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ListChecks className="text-roblox-blue" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Bulk Check</h2>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="usernames"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="bulk-usernames" className="text-sm font-medium text-gray-700">
                    Multiple Usernames
                  </Label>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="bulk-usernames"
                      rows={6}
                      placeholder="Enter usernames (one per line)&#10;Example:&#10;Username1&#10;CoolPlayer&#10;GamerTag123"
                      className="resize-none"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Maximum 10 usernames at once
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit"
              className="w-full bg-roblox-blue text-white hover:bg-roblox-blue/90"
              disabled={bulkCheckMutation.isPending}
            >
              {bulkCheckMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Check All
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Progress indicator */}
        <div className="bg-gray-50 rounded-lg p-3 mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="text-gray-900 font-medium">
              {results.length}/{form.watch('usernames') ? form.watch('usernames').split('\n').filter(u => u.trim()).length : 0}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Results */}
        {(results.length > 0 || bulkCheckMutation.isPending) && (
          <div className="space-y-2 max-h-60 overflow-y-auto mt-4">
            <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Results</h4>
            
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-900">{result.username}</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    result.isAvailable === null 
                      ? 'bg-yellow-100 text-warning'
                      : result.isAvailable 
                        ? 'bg-green-100 text-success'
                        : 'bg-red-100 text-error'
                  }`}>
                    {result.isAvailable === null 
                      ? result.error ? 'Error' : 'Checking...'
                      : result.isAvailable 
                        ? 'Available'
                        : 'Taken'
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <Button 
            onClick={exportResults}
            variant="outline"
            className="w-full mt-4"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
