import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ThumbsUp, Bookmark, Share, Bot, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Article } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface NewsArticleProps {
  article: Article;
}

export default function NewsArticle({ article }: NewsArticleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bookmarkMutation = useMutation({
    mutationFn: () => articlesApi.toggleBookmark(article.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({
        title: article.isBookmarked ? "Bookmark removed" : "Article bookmarked",
        description: article.isBookmarked ? 
          "Article removed from bookmarks" : 
          "Article added to bookmarks"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    }
  });

  const getCategoryClass = (category: string) => {
    const categoryMap: Record<string, string> = {
      "Product Launch": "category-product",
      "Market Trends": "category-market",
      "Competitor Financials": "category-financial",
      "Regulatory Compliance": "category-regulatory"
    };
    return categoryMap[category] || "category-product";
  };

  const getSentimentClass = (sentiment: string) => {
    return `sentiment-${sentiment}`;
  };

  const getIndustryClass = (industry: string) => {
    switch (industry) {
      case 'HVAC': return 'industry-hvac';
      case 'BESS': return 'industry-bess';
      case 'Finance': return 'industry-finance';
      default: return 'industry-hvac';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col" data-testid={`card-article-${article.id}`}>
      <CardContent className="p-4 flex flex-col h-full">
        {/* Tags */}
        <div className="flex items-center flex-wrap gap-1 mb-3">
          <Badge className={cn("text-xs font-medium", getCategoryClass(article.category))}>
            {article.category.replace(/\s+/g, ' ').substring(0, 12)}
          </Badge>
          <Badge className={cn("text-xs font-medium", getSentimentClass(article.sentiment))}>
            {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
          </Badge>
          <Badge className={cn("text-xs font-medium", getIndustryClass(article.industry))}>
            {article.industry}
          </Badge>
        </div>
        
        {/* Title */}
        {article.url ? (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-foreground mb-2 hover:text-primary cursor-pointer line-clamp-3 flex-grow-0 block"
            data-testid={`link-title-${article.id}`}
            title={article.title}
            onClick={(e) => e.stopPropagation()}
          >
            {article.title}
          </a>
        ) : (
          <h3 
            className="text-sm font-semibold text-foreground mb-2 hover:text-primary cursor-pointer line-clamp-3 flex-grow-0"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`text-title-${article.id}`}
            title={article.title}
          >
            {article.title}
          </h3>
        )}
        
        {/* Content */}
        <p className="text-xs text-secondary leading-relaxed mb-3 flex-grow line-clamp-4" data-testid={`text-content-${article.id}`}>
          {article.summary || article.content.substring(0, 150) + "..."}
        </p>
        
        {/* Time */}
        <div className="text-xs text-secondary mb-3" data-testid={`text-time-${article.id}`}>
          {formatTimeAgo(article.publishedAt)}
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-secondary mb-3">
          <span className="flex items-center" data-testid={`text-views-${article.id}`}>
            <Eye className="w-3 h-3 mr-1" />
            {article.views >= 1000 ? `${(article.views/1000).toFixed(1)}k` : article.views}
          </span>
          <span className="flex items-center" data-testid={`text-sentiment-score-${article.id}`}>
            <ThumbsUp className="w-3 h-3 mr-1" />
            {Math.round((article.sentimentScore + 1) * 50)}%
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border pt-3 mt-auto">
          <span className="text-xs text-secondary truncate pr-2" data-testid={`text-source-${article.id}`}>
            {article.source}
          </span>
          <div className="flex items-center space-x-1 flex-shrink-0">
            {(article.url || article.aiAnalysis?.sourceUrl) && (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.open(article.url || article.aiAnalysis?.sourceUrl, '_blank', 'noopener,noreferrer')}
                title="Read full article"
                data-testid={`button-read-full-${article.id}`}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
              className={cn(
                "p-1 h-6 w-6 transition-colors",
                article.isBookmarked ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-primary"
              )}
              data-testid={`button-bookmark-${article.id}`}
            >
              <Bookmark className={cn("w-3 h-3", article.isBookmarked && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
              data-testid={`button-share-${article.id}`}
            >
              <Share className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
              data-testid={`button-analyze-${article.id}`}
            >
              <Bot className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
