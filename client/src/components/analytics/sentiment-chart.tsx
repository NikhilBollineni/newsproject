import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SentimentData {
  sentimentBreakdown: Record<string, number>;
}

const SENTIMENT_COLORS = {
  positive: '#10B981', // green-500
  neutral: '#6B7280',  // gray-500
  negative: '#EF4444'  // red-500
};

export default function SentimentChart({ sentimentBreakdown }: SentimentData) {
  const data = Object.entries(sentimentBreakdown).map(([sentiment, count]) => ({
    name: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
    value: count,
    color: SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS] || '#6B7280'
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card data-testid="card-sentiment-chart">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [
                  `${value} articles (${Math.round((value / total) * 100)}%)`,
                  'Count'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-secondary mt-2">
          {data.map((item) => (
            <span key={item.name} data-testid={`text-sentiment-${item.name.toLowerCase()}`}>
              {item.name}: {Math.round((item.value / total) * 100)}%
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
