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

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ListChecks className="text-roblox-blue" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Bulk Username Check</h2>
        </div>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText size={16} />
              Manual Input
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

        {/* Summary */}
        {summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Processing Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Total: <span className="font-medium">{summary.total}</span></div>
              <div>Processed: <span className="font-medium">{summary.processed}</span></div>
              <div className="text-success">Available: <span className="font-medium">{summary.available}</span></div>
              <div className="text-error">Taken: <span className="font-medium">{summary.taken}</span></div>
              {summary.errors > 0 && (
                <div className="text-warning col-span-2">Errors: <span className="font-medium">{summary.errors}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {(bulkCheckMutation.isPending || fileUploadMutation.isPending) && (
          <div className="bg-gray-50 rounded-lg p-3 mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">
                {results.length} processed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
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
                        : 'bg-red-100 text-error'
                  }`}>
                    {result.isAvailable === null 
                      ? 'Error'
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
            Export Results as CSV
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
