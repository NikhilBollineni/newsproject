import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CategoryData {
  categoryBreakdown: Record<string, number>;
}

const CATEGORY_COLORS = {
  "Product Launch": "bg-blue-500",
  "Market Trends": "bg-green-500",
  "Competitor Financials": "bg-purple-500",
  "Regulatory Compliance": "bg-red-500",
  "Technology Innovation": "bg-orange-500",
  "Industry Analysis": "bg-gray-500"
};

export default function CategoryBreakdown({ categoryBreakdown }: CategoryData) {
  const total = Object.values(categoryBreakdown).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(categoryBreakdown));

  return (
    <Card data-testid="card-category-breakdown">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(categoryBreakdown).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground" data-testid={`text-category-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                {category}
              </span>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={(count / maxCount) * 100} 
                  className="w-16 h-2"
                  data-testid={`progress-${category.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <span className="text-sm font-medium w-8 text-right" data-testid={`text-count-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
