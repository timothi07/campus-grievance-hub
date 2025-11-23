import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsDashboard() {
  const { data: statusStats, isLoading: statusLoading } = useQuery({
    queryKey: ["analytics-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("status");
      
      if (error) throw error;
      
      const stats = data.reduce((acc: any, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(stats).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: departmentStats, isLoading: deptLoading } = useQuery({
    queryKey: ["analytics-department"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("department_id, departments(name)");
      
      if (error) throw error;
      
      const stats = data.reduce((acc: any, item) => {
        const deptName = item.departments?.name || "Unassigned";
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(stats).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: priorityStats, isLoading: priorityLoading } = useQuery({
    queryKey: ["analytics-priority"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("priority");
      
      if (error) throw error;
      
      const stats = data.reduce((acc: any, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(stats).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ["analytics-trend"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("created_at, status")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      const monthlyStats: any = {};
      data.forEach(complaint => {
        const month = new Date(complaint.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyStats[month]) {
          monthlyStats[month] = { month, total: 0, resolved: 0, pending: 0 };
        }
        monthlyStats[month].total++;
        if (complaint.status === 'resolved') monthlyStats[month].resolved++;
        if (complaint.status === 'pending') monthlyStats[month].pending++;
      });
      
      return Object.values(monthlyStats);
    },
  });

  const { data: overallStats, isLoading: overallLoading } = useQuery({
    queryKey: ["analytics-overall"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*");
      
      if (error) throw error;
      
      const total = data.length;
      const resolved = data.filter(c => c.status === 'resolved').length;
      const pending = data.filter(c => c.status === 'pending').length;
      const highPriority = data.filter(c => c.priority === 'high').length;
      
      return { total, resolved, pending, highPriority };
    },
  });

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (statusLoading || deptLoading || priorityLoading || trendLoading || overallLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Complaints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{overallStats?.resolved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{overallStats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Priority</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{overallStats?.highPriority || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Complaints by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complaints by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complaints by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complaint Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Total" />
                <Line type="monotone" dataKey="resolved" stroke="hsl(var(--chart-1))" name="Resolved" />
                <Line type="monotone" dataKey="pending" stroke="hsl(var(--chart-3))" name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
