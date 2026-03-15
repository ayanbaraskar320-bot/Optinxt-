import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import { 
  CheckCircle2, Clock, Zap, Target, Layers, 
  TrendingUp, TrendingDown, Loader2, AlertCircle 
} from "lucide-react";

export default function MyWorkPerformance() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/employee/me/work-metrics");
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Metrics load error:", err);
        toast({ title: "Error", description: "Could not load work metrics.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 px-1">My Work & Performance</h1>
          <p className="text-muted-foreground mt-1 px-1">Detailed analytics from WDT system</p>
        </div>
        <Badge className={`px-4 py-1.5 text-sm font-bold ${
          data.status === 'Optimal' ? 'bg-emerald-100 text-emerald-700' : 
          data.status === 'Overworked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>
          Status: {data.status}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem 
          title="Tasks Completed" 
          value={data.tasksCompleted} 
          icon={CheckCircle2} 
          color="text-blue-600" 
          bg="bg-blue-50"
          desc="Current period"
        />
        <KPIItem 
          title="Productivity" 
          value={`${data.productivityScore}%`} 
          icon={TrendingUp} 
          color="text-emerald-600" 
          bg="bg-emerald-50"
          desc="Efficiency index"
        />
        <KPIItem 
          title="Utilization" 
          value={`${data.utilizationPct}%`} 
          icon={Zap} 
          color="text-amber-600" 
          bg="bg-amber-50"
          desc="Workload capacity"
        />
        <KPIItem 
          title="Work Hours" 
          value={data.workHours} 
          icon={Clock} 
          color="text-indigo-600" 
          bg="bg-indigo-50"
          desc={`${data.overtimeHours} hours OT`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Productivity Chart */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Productivity Trend (Weekly)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Process Involvement */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              Process Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.processInvolvement}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="hours"
                    nameKey="name"
                  >
                    {data.processInvolvement.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {data.processInvolvement.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-600">{p.name}</span>
                  </div>
                  <span className="font-semibold">{p.hours}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Activity Table */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Recent Performance Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="pb-4 font-semibold px-4">Date</th>
                  <th className="pb-4 font-semibold">Tasks Done</th>
                  <th className="pb-4 font-semibold">Working Hours</th>
                  <th className="pb-4 font-semibold">Efficiency</th>
                  <th className="pb-4 font-semibold">Overtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-medium">{new Date(record.record_date).toLocaleDateString()}</td>
                    <td className="py-4 font-semibold text-slate-700">{record.tasks_completed}</td>
                    <td className="py-4 text-slate-600">{record.working_hours}h</td>
                    <td className="py-4 text-slate-600">
                      {Math.round((record.tasks_completed / (record.expected_tasks || 1)) * 100)}%
                    </td>
                    <td className="py-4">
                      {record.overtime_hours > 0 ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-100 bg-amber-50">
                          +{record.overtime_hours}h OT
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPIItem({ title, value, icon: Icon, color, bg, desc }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden group">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
              <h3 className="text-3xl font-bold text-slate-900 group-hover:scale-105 transition-transform origin-left">{value}</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">{desc}</p>
            </div>
            <div className={`p-3 rounded-2xl ${bg} ${color}`}>
              <Icon size={22} strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <div className={`h-1.5 w-full ${bg} opacity-50`}>
          <div className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-1000`} style={{ width: '100%' }} />
        </div>
      </CardContent>
    </Card>
  );
}
