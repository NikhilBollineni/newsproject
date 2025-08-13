import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import SentimentChart from "@/components/analytics/sentiment-chart";
import CategoryBreakdown from "@/components/analytics/category-breakdown";
import TrendingTopics from "@/components/analytics/trending-topics";
import AIInsights from "@/components/analytics/ai-insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { analyticsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics'],
    queryFn: analyticsApi.getAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mock time series data for demonstration
  const timeSeriesData = [
    { date: '2024-01-01', articles: 12, sentiment: 0.6 },
    { date: '2024-01-02', articles: 18, sentiment: 0.7 },
    { date: '2024-01-03', articles: 15, sentiment: 0.5 },
    { date: '2024-01-04', articles: 22, sentiment: 0.8 },
    { date: '2024-01-05', articles: 19, sentiment: 0.6 },
    { date: '2024-01-06', articles: 24, sentiment: 0.9 },
    { date: '2024-01-07', articles: 16, sentiment: 0.4 },
  ];

  const categoryData = analytics ? Object.entries(analytics.categoryBreakdown).map(([name, value]) => ({
    name: name.replace(/\s+/g, '\n'),
    value
  })) : [];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header
          title="Analytics Dashboard"
          subtitle="Detailed insights and performance metrics"
        />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Analytics Dashboard"
        subtitle="Detailed insights and performance metrics"
      />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Articles Over Time */}
          <Card data-testid="card-articles-timeline">
            <CardHeader>
              <CardTitle>Articles Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value) => [value, 'Articles']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="articles" 
                      stroke="hsl(217, 78%, 58%)" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Over Time */}
          <Card data-testid="card-sentiment-timeline">
            <CardHeader>
              <CardTitle>Sentiment Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Positive Sentiment']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="hsl(160, 76%, 36%)" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card data-testid="card-category-distribution">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      fontSize={12}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(217, 78%, 58%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {analytics && (
              <>
                <SentimentChart sentimentBreakdown={analytics.sentimentBreakdown} />
                <TrendingTopics trendingTags={analytics.trendingTags} />
              </>
            )}
          </div>
        </div>

        {/* Detailed Breakdowns */}
        <div className="grid grid-cols-3 gap-6">
          {analytics && (
            <>
              <CategoryBreakdown categoryBreakdown={analytics.categoryBreakdown} />
              <AIInsights />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
