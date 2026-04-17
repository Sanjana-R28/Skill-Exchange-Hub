import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Sparkles, MessageSquare, Activity, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard({
    query: {
      queryKey: getGetDashboardQueryKey(),
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const statCards = [
    {
      title: "Potential Matches",
      value: dashboard.matchCount,
      icon: Sparkles,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/matches"
    },
    {
      title: "Pending Requests",
      value: dashboard.incomingRequests,
      icon: Users,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      href: "/connections"
    },
    {
      title: "Connections",
      value: dashboard.connectionCount,
      icon: Users,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      href: "/connections"
    },
    {
      title: "Unread Messages",
      value: dashboard.messageCount,
      icon: MessageSquare,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      href: "/connections" // Usually direct to messages from connections
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your campus skill exchange activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <Card className="hover-elevate cursor-pointer transition-colors border-border/50 hover:border-primary/30">
              <CardContent className="p-6 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>What's happening in your network</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recentActivity && dashboard.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    <p className="text-sm">{activity}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                <Activity className="h-8 w-8 mb-2 opacity-20" />
                <p>No recent activity yet.</p>
                <p className="text-xs mt-1">Update your skills to get matched!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Categories</CardTitle>
            <CardDescription>What students are looking for</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.categoryCounts && dashboard.categoryCounts.length > 0 ? (
              <div className="space-y-4">
                {dashboard.categoryCounts.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium text-sm">{cat.category}</span>
                    <span className="text-muted-foreground text-sm">{cat.count} users</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No category data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}