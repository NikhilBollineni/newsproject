import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendingTopicsData {
  trendingTags: Array<{ tag: string; count: number; change: number }>;
}

export default function TrendingTopics({ trendingTags }: TrendingTopicsData) {
  return (
    <Card data-testid="card-trending-topics">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Trending Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trendingTags.slice(0, 6).map((topic) => (
            <div key={topic.tag} className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <span className="text-sm text-foreground" data-testid={`text-topic-${topic.tag.toLowerCase()}`}>
                #{topic.tag}
              </span>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={topic.change >= 0 ? "default" : "destructive"}
                  className={`text-xs font-medium ${
                    topic.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                  data-testid={`badge-change-${topic.tag.toLowerCase()}`}
                >
                  {topic.change >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {topic.change > 0 ? '+' : ''}{topic.change}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
