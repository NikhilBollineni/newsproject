import { apiRequest } from "./queryClient";
import { Article, Document, Analytics, AIInsights } from "@/types";

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
    
    return fetch(`/api/articles?${params}`).then(res => res.json());
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
