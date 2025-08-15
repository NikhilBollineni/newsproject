import { apiRequest } from "./queryClient";
import { Article, Document, Analytics, AIInsights } from "@/types";

const sampleArticles: Article[] = [
  {
    id: 'sample-1',
    title: 'Sample News Headline',
    content: 'Sample content for when no news data is available.',
    summary: 'Sample content for when no news data is available.',
    source: 'Sample Source',
    category: 'Industry Analysis',
    industry: 'HVAC',
    sentiment: 'neutral',
    sentimentScore: 0,
    views: 0,
    isBookmarked: false,
    tags: [],
    aiAnalysis: {},
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

export const articlesApi = {
  getArticles: (filters?: {
    category?: string;
    industry?: string;
    sentiment?: string;
    search?: string;
    bookmarked?: boolean;
  }): Promise<Article[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.sentiment) params.append('sentiment', filters.sentiment);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.bookmarked) params.append('bookmarked', 'true');

    const applyFilters = (articles: Article[]): Article[] => {
      return articles.filter(a => {
        if (filters?.category && a.category !== filters.category) return false;
        if (filters?.industry && a.industry !== filters.industry) return false;
        if (filters?.sentiment && a.sentiment !== filters.sentiment.toLowerCase()) return false;
        if (filters?.search && !a.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters?.bookmarked && !a.isBookmarked) return false;
        return true;
      });
    };

    return fetch('/data/news.json')
      .then(res => {
        if (!res.ok) throw new Error('news file missing');
        return res.json();
      })
      .then((data: Article[]) => {
        if (Array.isArray(data) && data.length > 0) {
          return applyFilters(data);
        }
        return fetch(`/api/articles?${params}`).then(r => r.json());
      })
      .then((data: Article[]) => {
        if (Array.isArray(data) && data.length > 0) {
          return applyFilters(data);
        }
        return sampleArticles;
      })
      .catch(async () => {
        try {
          const res = await fetch(`/api/articles?${params}`);
          if (!res.ok) throw new Error('api failed');
          const apiData: Article[] = await res.json();
          return apiData.length > 0 ? applyFilters(apiData) : sampleArticles;
        } catch {
          return sampleArticles;
        }
      });
  },

  exportArticles: (filters?: {
    category?: string;
    industry?: string;
    sentiment?: string;
    search?: string;
    bookmarked?: boolean;
  }): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.sentiment) params.append('sentiment', filters.sentiment);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.bookmarked) params.append('bookmarked', 'true');

    return fetch(`/api/articles/export?${params}`).then(res => res.blob());
  },

  getArticle: (id: string): Promise<Article> =>
    fetch(`/api/articles/${id}`).then(res => res.json()),

  createArticle: (article: Partial<Article>) =>
    apiRequest("POST", "/api/articles", article),

  toggleBookmark: (id: string): Promise<Article> =>
    apiRequest("PATCH", `/api/articles/${id}/bookmark`).then(res => res.json())
};

export const documentsApi = {
  getDocuments: (): Promise<Document[]> =>
    fetch("/api/documents").then(res => res.json()),

  uploadDocument: (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch("/api/documents/upload", {
      method: "POST",
      body: formData
    }).then(res => res.json());
  },

  analyzeDocument: (id: string): Promise<any> =>
    fetch(`/api/documents/${id}/analyze`).then(res => res.json())
};

export const analyticsApi = {
  getAnalytics: (): Promise<Analytics> =>
    fetch("/api/analytics").then(res => res.json()),

  getInsights: (): Promise<AIInsights> =>
    fetch("/api/insights").then(res => res.json())
};
