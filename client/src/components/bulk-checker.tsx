import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ListChecks, Play, Download, Loader2, Upload, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const bulkFormSchema = z.object({
  usernames: z.string()
    .min(1, "Please enter at least one username"),
});

type FormData = z.infer<typeof bulkFormSchema>;

interface BulkResult {
  username: string;
  isAvailable: boolean | null;
  status?: string;
  message?: string;
  error?: string;
  timestamp: string;
}

interface BulkResponse {
  results: BulkResult[];
  summary?: {
    total: number;
    processed: number;
    errors: number;
    available: number;
    taken: number;
  };
  filename?: string;
}

export default function BulkChecker() {
  const [results, setResults] = useState<BulkResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<BulkResponse['summary'] | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    onSuccess: (data: BulkResponse) => {
      setResults(data.results);
      setSummary(data.summary || null);
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
      setSummary(null);
      toast({
        title: "Bulk Check Failed",
        description: error.message || "Failed to check usernames",
        variant: "destructive",
      });
    },
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch("/api/username/bulk-check-file", {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process file');
      }
      
      return response.json();
    },
    onSuccess: (data: BulkResponse) => {
      setResults(data.results);
      setSummary(data.summary || null);
      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ['/api/username/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/username/stats'] });
      
      const availableCount = data.results.filter(r => r.isAvailable === true).length;
      const takenCount = data.results.filter(r => r.isAvailable === false).length;
      const errorCount = data.results.filter(r => r.isAvailable === null).length;
      
      toast({
        title: "File Processing Complete",
        description: `${availableCount} available, ${takenCount} taken${errorCount > 0 ? `, ${errorCount} errors` : ''}${data.filename ? ` from ${data.filename}` : ''}`,
      });
    },
    onError: (error: any) => {
      setProgress(0);
      setSummary(null);
      setUploadedFile(null);
      toast({
        title: "File Processing Failed",
        description: error.message || "Failed to process file",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const usernames = data.usernames.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    if (usernames.length === 0) {
      toast({
        title: "No usernames found",
        description: "Please enter at least one username",
        variant: "destructive",
      });
      return;
    }
    
    setResults([]);
    setProgress(0);
    setSummary(null);
    bulkCheckMutation.mutate({ usernames });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
        toast({
          title: "Invalid file type",
          description: "Please select a .txt file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const handleFileUpload = () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select a .txt file first",
        variant: "destructive",
      });
      return;
    }
    
    setResults([]);
    setProgress(0);
    setSummary(null);
    fileUploadMutation.mutate(uploadedFile);
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    const csv = [
      'Username,Status,Error,Timestamp',
      ...results.map(r => 
        `${r.username},${r.isAvailable === null ? 'Error' : r.isAvailable ? 'Available' : 'Taken'},${r.error || ''},${r.timestamp}`
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

  const downloadAvailableUsernames = () => {
    const availableUsernames = results
      .filter(r => r.isAvailable === true)
      .map(r => r.username);
    
    if (availableUsernames.length === 0) {
      toast({
        title: "No available usernames",
        description: "There are no available usernames to download",
        variant: "destructive",
      });
      return;
    }
    
    const content = availableUsernames.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `available-roblox-usernames-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Complete",
      description: `Downloaded ${availableUsernames.length} available usernames`,
    });
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ListChecks className="w-5 h-5" />
          <h2 className="text-xl font-bold">Bulk Check</h2>
        </div>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText size={16} />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload size={16} />
              File Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="usernames"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="bulk-usernames" className="text-sm font-bold text-gray-800 dark:text-white mb-2 block">
                        Multiple Usernames
                      </Label>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            id="bulk-usernames"
                            rows={8}
                            placeholder="Enter usernames (one per line)&#10;Example:&#10;Username1&#10;CoolPlayer&#10;GamerTag123&#10;&#10;No limit on number of usernames!"
                            className="resize-none border-2 border-purple-200 dark:border-purple-600 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 focus:border-purple-400 dark:focus:border-purple-500 transition-all duration-300 backdrop-blur-sm shadow-inner"
                          />
                          <div className="absolute top-3 right-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                              <FileText className="text-white" size={12} />
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          ♾️ No limit - enter as many usernames as you want (one per line)
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit"
                  className="w-full"
                  disabled={bulkCheckMutation.isPending}
                >
                  {bulkCheckMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check Usernames"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Upload .txt File</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {uploadedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                        <FileText className="text-white" size={20} />
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{uploadedFile.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                      >
                        Choose Different File
                      </Button>
                      <Button
                        onClick={handleFileUpload}
                        disabled={fileUploadMutation.isPending}
                        size="sm"
                      >
                        {fileUploadMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Process File"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div className="space-y-3">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        Select .txt File
                      </Button>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Upload a .txt file with usernames (one per line). Max: 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Summary */}
        {summary && (
          <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border border-emerald-200/50 dark:border-emerald-700/50 rounded-xl p-6 mt-6 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                  <CheckCircle className="text-white" size={18} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">Processing Summary</h4>
              </div>
              <div className="flex items-center space-x-3 bg-emerald-100 dark:bg-emerald-900/50 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Complete</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{summary.total.toLocaleString()}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-blue-100 dark:border-blue-800">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{summary.processed.toLocaleString()}</div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Processed</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-emerald-100 dark:border-emerald-800">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{summary.available.toLocaleString()}</div>
                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Available</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-red-100 dark:border-red-800">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{summary.taken.toLocaleString()}</div>
                <div className="text-sm font-medium text-red-700 dark:text-red-300">Taken</div>
              </div>
            </div>
            {summary.errors > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800">
                    {summary.errors} error{summary.errors !== 1 ? 's' : ''} occurred during processing
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Progress indicator */}
        {(bulkCheckMutation.isPending || fileUploadMutation.isPending) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Processing usernames...</span>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {results.length} completed
              </span>
            </div>
            <Progress value={progress} className="h-3 bg-white/50" />
            <div className="mt-2 text-xs text-gray-600 text-center">
              Fast processing with 0.2s delays between checks
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto mt-4">
            <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
              Results ({results.length} total)
            </h4>
            
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-900 truncate flex-1 mr-2">{result.username}</span>
                  <span className={`px-2 py-0.5 text-xs rounded whitespace-nowrap ${
                    result.isAvailable === null 
                      ? 'bg-yellow-100 text-warning'
                      : result.isAvailable 
                        ? 'bg-green-100 text-success'
                        : result.status === 'censored'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-error'
                  }`}>
                    {result.isAvailable === null 
                      ? 'Error'
                      : result.isAvailable 
                        ? 'Available'
                        : result.status === 'censored'
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
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-indigo-200/50 dark:border-indigo-700/50 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Download className="text-white" size={18} />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Download Results</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={exportResults}
                variant="outline"
                className="h-12 border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-300 font-medium"
              >
                <FileText className="mr-2 h-5 w-5" />
                Export All (CSV)
              </Button>
              {results.some(r => r.isAvailable === true) && (
                <Button 
                  onClick={downloadAvailableUsernames}
                  className="h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Available Only (.txt)
                </Button>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium">
                📊 CSV includes all data with status details • 📝 TXT contains only available usernames
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
