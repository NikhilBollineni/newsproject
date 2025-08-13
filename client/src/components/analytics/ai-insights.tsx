import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, TrendingUp, AlertTriangle } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export default function AIInsights() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['/api/insights'],
    queryFn: analyticsApi.getInsights,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  if (isLoading) {
    return (
      <Card className="bg-blue-50 border-blue-200" data-testid="card-ai-insights-loading">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Bot className="text-primary mr-2 w-4 h-4" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" data-testid="card-ai-insights">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center text-foreground">
          <Bot className="text-primary mr-2 w-4 h-4" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {insights.marketOpportunities.length > 0 && (
            <div className="p-3 bg-card rounded-lg border" data-testid="section-market-opportunities">
              <p className="text-foreground mb-2 font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                Market Opportunity:
              </p>
              <p className="text-muted-foreground">
                {typeof insights.marketOpportunities[0] === 'string' 
                  ? insights.marketOpportunities[0]
                  : JSON.stringify(insights.marketOpportunities[0])
                }
              </p>
            </div>
          )}
          
          {insights.riskAlerts.length > 0 && (
            <div className="p-3 bg-card rounded-lg border" data-testid="section-risk-alerts">
              <p className="text-foreground mb-2 font-medium flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1 text-orange-600" />
                Risk Alert:
              </p>
              <p className="text-muted-foreground">
                {typeof insights.riskAlerts[0] === 'string' 
                  ? insights.riskAlerts[0]
                  : JSON.stringify(insights.riskAlerts[0])
                }
              </p>
            </div>
          )}
          
          {insights.trendAnalysis && (
            <div className="p-3 bg-card rounded-lg border" data-testid="section-trend-analysis">
              <p className="text-foreground mb-2 font-medium">
                Trend Analysis:
              </p>
              <p className="text-muted-foreground">
                {typeof insights.trendAnalysis === 'string' 
                  ? insights.trendAnalysis
                  : JSON.stringify(insights.trendAnalysis)
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
