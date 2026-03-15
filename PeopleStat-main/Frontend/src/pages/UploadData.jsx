import React, { useState, useCallback } from "react";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  FileType,
  FileSpreadsheet,
  FileJson,
  Layout
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/servicess/api";
import { cn } from "@/lib/utils";

export default function UploadData() {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success, error
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (isValidFile(droppedFile)) {
      setFile(droppedFile);
      setUploadStatus("idle");
    }
  }, []);

  const onFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (isValidFile(selectedFile)) {
      setFile(selectedFile);
      setUploadStatus("idle");
    }
  };

  const isValidFile = (file) => {
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json', '.pdf'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(extension)) {
      toast({
        title: "Invalid file type",
        description: `Please upload ${validExtensions.join(", ")} files only.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(30);
      const response = await api.post("/upload/employees", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.min(percentCompleted, 90));
        }
      });

      if (response.data.success) {
        setUploadProgress(100);
        setUploadStatus("success");
        toast({
          title: "Upload Successful",
          description: `${file.name} has been processed and analyzed.`,
        });
      }
    } catch (error) {
      setUploadStatus("error");
      toast({
        title: "Upload Failed",
        description: error.response?.data?.error || "There was a problem processing your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  const getFileIcon = () => {
    if (!file) return <UploadCloud className="h-10 w-10 text-slate-400" />;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText className="h-10 w-10 text-red-500" />;
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileSpreadsheet className="h-10 w-10 text-emerald-500" />;
    if (ext === 'json') return <FileJson className="h-10 w-10 text-amber-500" />;
    return <FileType className="h-10 w-10 text-blue-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Ingestion Pipeline</h1>
        <p className="text-slate-500">Upload your workforce datasets (Excel, CSV, JSON, or PDF) for AI processing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 overflow-hidden border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layout className="h-5 w-5 text-blue-600" />
              Dataset Upload
            </CardTitle>
            <CardDescription>Drag and drop your organizational files below</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {!file ? (
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer group",
                  isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500 mt-1">Supports XLSX, CSV, JSON, and structured PDF tables</p>
                </div>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls,.json,.pdf"
                  onChange={onFileSelect}
                />
              </div>
            ) : (
              <div className="p-6 border rounded-2xl bg-slate-50/50 border-slate-200 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                      {getFileIcon()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 line-clamp-1">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!isUploading && (
                    <Button variant="ghost" size="icon" onClick={removeFile} className="text-slate-400 hover:text-red-500">
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-widest">
                      <span>{uploadStatus === 'uploading' ? 'Analyzing Dataset...' : 'Processing Complete'}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2 bg-slate-200" indicatorClassName="bg-blue-600" />
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-bold">Analysis pipeline completed successfully.</span>
                  </div>
                )}

                {!isUploading && uploadStatus !== 'success' && (
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-base font-black uppercase tracking-widest" onClick={handleUpload}>
                    Start AI Ingestion
                  </Button>
                )}

                {uploadStatus === 'success' && (
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={removeFile}>Upload Another</Button>
                    <Button className="flex-1 bg-slate-900" onClick={() => window.location.href = "/workforce-intelligence"}>View Insights</Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">File Requirements</CardTitle>
            <CardDescription>Guidelines for best results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <RequirementItem 
                title="Employee Data" 
                desc="Include Name, Department, and Band." 
                icon={CheckCircle2}
                color="text-emerald-500"
              />
              <RequirementItem 
                title="Performance Metrics" 
                desc="Productivity, Quality, and Hours." 
                icon={CheckCircle2}
                color="text-emerald-500"
              />
              <RequirementItem 
                title="PDF Format" 
                desc="Tables should be clearly formatted." 
                icon={Loader2}
                color="text-amber-500"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 italic text-sm text-blue-800">
              "MAYAAI automatically handles column mapping and data cleaning during ingestion."
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RequirementItem({ title, desc, icon: Icon, color }) {
  return (
    <div className="flex gap-3">
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", color)} />
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
