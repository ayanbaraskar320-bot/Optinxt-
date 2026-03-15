import React, { useMemo, useState, useEffect } from "react";
import {
  Brain,
  Zap,
  Grid,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/servicess/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const labels = ["Low", "Emerging", "Stable", "Strong", "Top", "Elite"];

export default function SixBySixAnalysis() {
  const { toast } = useToast();
  const [selectedCell, setSelectedCell] = useState(null); // { x, y, employees }
  const [summary, setSummary] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, resultsRes] = await Promise.all([
          api.get("/analysis/summary"),
          api.get("/analysis/results?limit=500")
        ]);
        
        if (summaryRes.data.success) {
          setSummary(summaryRes.data.summary);
        }
        
        if (resultsRes.data.success) {
          // Use .data if returned by backend (after my Turn 1022 fix)
          setAnalysisResults(resultsRes.data.data || resultsRes.data.results || []);
        }
      } catch (error) {
        console.error("Failed to fetch matrix data:", error);
        toast({
          title: "Error",
          description: "Could not load talent matrix.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Zap className="animate-spin text-blue-600 h-10 w-10" />
      </div>
    );
  }

  const handleCellClick = (x, y) => {
    const cellEmps = analysisResults.filter(r => r.matrix_x === x && r.matrix_y === y);
    if (cellEmps.length > 0) {
      setSelectedCell({ x, y, employees: cellEmps });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">6├ù6 Talent Matrix</h1>
          <p className="text-slate-500 text-sm">Strategic placement of workforce based on Potential and Performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Talent Distribution Grid</CardTitle>
            <Grid className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex">
              {/* Y-Axis labels */}
              <div className="flex flex-col justify-between py-4 pr-4 h-[400px] text-[10px] font-bold text-slate-400 uppercase">
                {labels.slice().reverse().map(l => <span key={l}>{l}</span>)}
              </div>

              {/* Matrix Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-6 grid-rows-6 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 h-[400px]">
                  {Array.from({ length: 36 }).map((_, i) => {
                    const rowIdx = Math.floor(i / 6);
                    const colIdx = i % 6;
                    const x = colIdx + 1; // Potential
                    const y = 6 - rowIdx; // Performance
                    
                    const count = analysisResults.filter(r => r.matrix_x === x && r.matrix_y === y).length;
                    const isActive = count > 0;

                    return (
                      <div
                        key={i}
                        onClick={() => handleCellClick(x, y)}
                        className={cn(
                          "flex items-center justify-center rounded-md text-sm font-bold transition-all",
                          isActive 
                            ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700 hover:scale-105 shadow-sm" 
                            : "bg-white border border-slate-100 text-slate-200"
                        )}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    );
                  })}
                </div>
                
                {/* X-Axis labels */}
                <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 uppercase">
                  {labels.map(l => <span key={l}>{l}</span>)}
                </div>
                
                <div className="flex justify-center mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  Potential Capability
                </div>
              </div>
              
              <div className="relative">
                 <div className="absolute top-1/2 left-0 -translate-y-1/2 -rotate-90 origin-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 ml-[-450px]">
                   Performance Execution
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-slate-400">Total Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{analysisResults.length}</div>
              <p className="text-xs text-slate-500 mt-1">Total analyzed records</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-none text-white overflow-hidden relative">
            <CardContent className="pt-6">
              <Brain className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">AI Summary</h3>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                 "Our analysis indicates {analysisResults.filter(r => r.matrix_x >= 5 && r.matrix_y >= 5).length} High-Potential Elite employees. Performance gaps identified in {analysisResults.filter(r => r.matrix_y <= 2).length} nodes."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-slate-400">Cell:</span>
               {labels[selectedCell?.x-1]} Potential / {labels[selectedCell?.y-1]} Performance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {selectedCell?.employees.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                     {r.employee_id?.name ? r.employee_id.name[0] : "E"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{r.employee_id?.name || "Employee Node"}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">{r.talent_category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                      <p className="text-sm font-bold text-blue-600">{Math.round(r.productivity_score)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Fit</p>
                      <p className="text-sm font-bold text-emerald-600">{Math.round(r.fitment_score)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
