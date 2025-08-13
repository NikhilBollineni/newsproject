import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Download } from "lucide-react";
import NewsArticle from "./news-article";
import { articlesApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsFilters {
  category?: string;
  industry?: string;
  sentiment?: string;
  search?: string;
}

interface NewsFeedProps {
  searchQuery?: string;
  showBookmarked?: boolean;
}

export default function NewsFeed({ searchQuery, showBookmarked }: NewsFeedProps) {
  const [filters, setFilters] = useState<NewsFilters>({});

  const { data: articles = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['/api/articles', filters, searchQuery, showBookmarked],
    queryFn: () => articlesApi.getArticles({
      ...filters,
      search: searchQuery,
      bookmarked: showBookmarked
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleFilterChange = (key: keyof NewsFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'All' || value === '' ? undefined : value
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="w-48" data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  <SelectItem value="Product Launch">Product Launches</SelectItem>
                  <SelectItem value="Market Trends">Market Trends</SelectItem>
                  <SelectItem value="Competitor Financials">Competitor Financials</SelectItem>
                  <SelectItem value="Regulatory Compliance">Regulatory Compliance</SelectItem>
                </SelectContent>
              </Select>
              
              <Select onValueChange={(value) => handleFilterChange('industry', value)}>
                <SelectTrigger className="w-40" data-testid="select-industry">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Industries">All Industries</SelectItem>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="BESS">BESS</SelectItem>
                </SelectContent>
              </Select>
              
              <Select onValueChange={(value) => handleFilterChange('sentiment', value)}>
                <SelectTrigger className="w-40" data-testid="select-sentiment">
                  <SelectValue placeholder="All Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Sentiment">All Sentiment</SelectItem>
                  <SelectItem value="Positive">Positive</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                  <SelectItem value="Negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => refetch()}
                disabled={isRefetching}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                Refresh Feed
              </Button>
              <Button variant="outline" data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      <div data-testid="news-feed-articles">
        {articles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground" data-testid="text-no-articles">
                {showBookmarked ? "No bookmarked articles found." : "No articles found matching your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {articles.map((article) => (
              <NewsArticle key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {articles.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" className="px-6 py-3" data-testid="button-load-more">
            Load More Articles
          </Button>
        </div>
      )}
    </div>
  );
}
