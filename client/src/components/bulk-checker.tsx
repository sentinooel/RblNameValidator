import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ListChecks, Play, Download, Loader2, Upload, FileText } from "lucide-react";
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
    <Card className="enhanced-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <ListChecks className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bulk Username Check</h2>
              <p className="text-sm text-gray-600">Check multiple usernames at once</p>
            </div>
          </div>
          {summary && (
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">
                {summary.processed || 0} processed
              </span>
            </div>
          )}
        </div>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="manual" 
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FileText size={16} />
              Manual Input
            </TabsTrigger>
            <TabsTrigger 
              value="file" 
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
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
                      <Label htmlFor="bulk-usernames" className="text-sm font-medium text-gray-700">
                        Multiple Usernames
                      </Label>
                      <FormControl>
                        <Textarea
                          {...field}
                          id="bulk-usernames"
                          rows={8}
                          placeholder="Enter usernames (one per line)&#10;Example:&#10;Username1&#10;CoolPlayer&#10;GamerTag123&#10;&#10;No limit on number of usernames!"
                          className="resize-none"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        No limit - enter as many usernames as you want (one per line)
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
                      Check All Usernames
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Upload .txt File</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {uploadedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="text-roblox-blue" size={24} />
                      <span className="text-sm font-medium text-gray-900">{uploadedFile.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <div className="flex space-x-2">
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
                        className="bg-roblox-blue text-white hover:bg-roblox-blue/90"
                      >
                        {fileUploadMutation.isPending ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-1 h-3 w-3" />
                            Process File
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                      >
                        Select .txt File
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Upload a .txt file with usernames (one per line)
                      <br />
                      Maximum file size: 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Summary */}
        {summary && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-xl p-5 mt-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Processing Summary</h4>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-700 font-medium">Complete</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{summary.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.processed}</div>
                <div className="text-xs text-gray-600">Processed</div>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.available}</div>
                <div className="text-xs text-gray-600">Available</div>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.taken}</div>
                <div className="text-xs text-gray-600">Taken</div>
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
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200/50 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-green-600" />
              Download Results
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={exportResults}
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                <FileText className="mr-2 h-4 w-4" />
                Export All (CSV)
              </Button>
              {results.some(r => r.isAvailable === true) && (
                <Button 
                  onClick={downloadAvailableUsernames}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Available Only (.txt)
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              CSV includes all data • TXT contains only available usernames
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
