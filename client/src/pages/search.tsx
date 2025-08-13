import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import NewsArticle from "@/components/news/news-article";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, TrendingUp, Clock } from "lucide-react";
import { articlesApi } from "@/lib/api";
import { Article } from "@/types";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('hvac-intel-recent-searches');
    return saved ? JSON.parse(saved) : [];
  });

  // Popular search terms (mock data)
  const popularSearches = [
    "Smart HVAC",
    "Battery Storage",
    "Energy Efficiency",
    "Refrigerant Regulations",
    "Grid Modernization",
    "Heat Pumps",
    "Solar Integration",
    "Tesla Energy"
  ];

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ['/api/articles', { search: debouncedQuery }],
    queryFn: () => articlesApi.getArticles({ search: debouncedQuery }),
    enabled: debouncedQuery.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && query.length > 2) {
      // Add to recent searches
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('hvac-intel-recent-searches', JSON.stringify(updated));
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('hvac-intel-recent-searches');
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Search Articles"
        subtitle="Find specific articles, topics, and insights"
      />
      
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Search Input */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for articles, companies, topics, or keywords..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 text-lg h-12"
                data-testid="input-search-main"
              />
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {debouncedQuery.length > 2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Search Results for "{debouncedQuery}"
              </h3>
              {searchResults.length > 0 && (
                <span className="text-sm text-muted-foreground" data-testid="text-results-count">
                  {searchResults.length} articles found
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <SearchIcon className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground" data-testid="text-searching">Searching articles...</p>
              </div>
            ) : error ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-destructive" data-testid="text-search-error">
                    Error occurred while searching. Please try again.
                  </p>
                </CardContent>
              </Card>
            ) : searchResults.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No Results Found</h4>
                  <p className="text-muted-foreground" data-testid="text-no-results">
                    We couldn't find any articles matching "{debouncedQuery}". 
                    Try different keywords or browse popular searches below.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4" data-testid="search-results">
                {searchResults.map((article: Article) => (
                  <NewsArticle key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Search Suggestions */
          <div className="space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Card data-testid="card-recent-searches">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Recent Searches
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearRecentSearches}
                      data-testid="button-clear-recent"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => handleSearch(search)}
                        data-testid={`badge-recent-search-${index}`}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Popular Searches */}
            <Card data-testid="card-popular-searches">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Popular Searches
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {popularSearches.map((search, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors justify-center py-2"
                      onClick={() => handleSearch(search)}
                      data-testid={`badge-popular-search-${index}`}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search Tips */}
            <Card data-testid="card-search-tips">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Search Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Company Names</h4>
                    <p>Search for specific companies like "Tesla", "Carrier", or "Honeywell"</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Technology Terms</h4>
                    <p>Try terms like "heat pump", "battery storage", or "smart thermostat"</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Regulatory Topics</h4>
                    <p>Search for "EPA regulations", "energy efficiency", or "carbon emissions"</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Market Trends</h4>
                    <p>Look for "market growth", "industry forecast", or "investment trends"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
