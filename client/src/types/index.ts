export interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  source: string;
  category: string;
  industry: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  views: number;
  isBookmarked: boolean;
  tags?: string[];
  aiAnalysis?: any;
  publishedAt: string;
  createdAt: string;
}

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  content?: string;
  aiAnalysis?: {
    summary: string;
    keyInsights: string[];
    recommendations: string[];
    industryImpact: string;
  };
  uploadedAt: string;
}

export interface Analytics {
  todayArticles: number;
  positiveSentiment: number;
  hvacMentions: number;
  bessArticles: number;
  categoryBreakdown: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
  trendingTags: Array<{ tag: string; count: number; change: number }>;
}

export interface AIInsights {
  marketOpportunities: string[];
  riskAlerts: string[];
  trendAnalysis: string;
}
