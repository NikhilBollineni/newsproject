import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import NewsFeed from "@/components/news/news-feed";
import SentimentChart from "@/components/analytics/sentiment-chart";
import CategoryBreakdown from "@/components/analytics/category-breakdown";
import TrendingTopics from "@/components/analytics/trending-topics";
import AIInsights from "@/components/analytics/ai-insights";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper, Smile, Wind, Battery } from "lucide-react";
import { analyticsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics'],
    queryFn: analyticsApi.getAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          title="Industry News Feed"
          subtitle="Real-time HVAC & BESS industry intelligence"
          onSearch={setSearchQuery}
        />
        
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-12 w-full mb-4" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card data-testid="card-stat-today-articles">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-secondary">Today's Articles</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-today-articles">
                          {analytics?.todayArticles || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Newspaper className="text-primary text-lg" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <span className="text-accent">↗ 12%</span>
                      <span className="text-secondary ml-2">from yesterday</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card data-testid="card-stat-positive-sentiment">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-secondary">Positive Sentiment</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-positive-sentiment">
                          {analytics?.positiveSentiment || 0}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Smile className="text-accent text-lg" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <span className="text-accent">↗ 5%</span>
                      <span className="text-secondary ml-2">this week</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card data-testid="card-stat-hvac-mentions">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-secondary">HVAC Mentions</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-hvac-mentions">
                          {analytics?.hvacMentions || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Wind className="text-orange-600 text-lg" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <span className="text-red-500">↘ 3%</span>
                      <span className="text-secondary ml-2">from last week</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card data-testid="card-stat-bess-articles">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-secondary">BESS Articles</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-bess-articles">
                          {analytics?.bessArticles || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Battery className="text-purple-600 text-lg" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <span className="text-accent">↗ 18%</span>
                      <span className="text-secondary ml-2">trending up</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <NewsFeed searchQuery={searchQuery} />
        </div>
      </div>

      {/* Analytics Sidebar */}
      <aside className="w-80 bg-card border-l border-border p-6 overflow-y-auto scrollbar-hide">
        <h3 className="text-lg font-semibold text-foreground mb-6">Analytics Overview</h3>
        
        <div className="space-y-6">
          {analytics ? (
            <>
              <SentimentChart sentimentBreakdown={analytics.sentimentBreakdown} />
              <CategoryBreakdown categoryBreakdown={analytics.categoryBreakdown} />
              <TrendingTopics trendingTags={analytics.trendingTags} />
              <AIInsights />
            </>
          ) : (
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
