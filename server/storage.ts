import { type User, type InsertUser, type Article, type InsertArticle, type Document, type InsertDocument, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Articles
  getArticles(filters?: {
    category?: string;
    industry?: string;
    sentiment?: string;
    search?: string;
    bookmarked?: boolean;
  }): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, updates: Partial<Article>): Promise<Article | undefined>;
  toggleBookmark(id: string): Promise<Article | undefined>;
  
  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  
  // Analytics
  getAnalytics(): Promise<{
    todayArticles: number;
    positiveSentiment: number;
    hvacMentions: number;
    bessArticles: number;
    categoryBreakdown: Record<string, number>;
    sentimentBreakdown: Record<string, number>;
    trendingTags: Array<{ tag: string; count: number; change: number }>;
  }>;
  
  // Notifications
  getNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  getUnreadNotificationCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private articles: Map<string, Article>;
  private documents: Map<string, Document>;
  private notifications: Map<string, Notification>;
  private dataFilePath: string;

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.documents = new Map();
    this.notifications = new Map();

     this.dataFilePath = path.join(process.cwd(), "data", "news.json");

    // Load persisted articles if available
    this.loadArticlesFromFile();

    // Initialize with sample data if no file data present
    if (this.articles.size === 0) {
      this.initializeSampleData();
      this.saveArticlesToFile();
    }
  }

  private loadArticlesFromFile() {
    try {
      const data = fs.readFileSync(this.dataFilePath, "utf8");
      const articles: Article[] = JSON.parse(data);
      for (const article of articles) {
        this.articles.set(article.id, {
          ...article,
          publishedAt: new Date(article.publishedAt),
          createdAt: new Date(article.createdAt),
        });
      }
    } catch {
      // File may not exist yet
    }
  }

  private saveArticlesToFile() {
    try {
      fs.mkdirSync(path.dirname(this.dataFilePath), { recursive: true });
      const articlesArray = Array.from(this.articles.values());
      fs.writeFileSync(this.dataFilePath, JSON.stringify(articlesArray, null, 2));
    } catch (error) {
      console.error("Failed to save articles to file:", error);
    }
  }

  private appendArticleToFile(article: Article) {
    try {
      fs.mkdirSync(path.dirname(this.dataFilePath), { recursive: true });
      let articles: Article[] = [];
      try {
        const data = fs.readFileSync(this.dataFilePath, "utf8");
        articles = JSON.parse(data);
      } catch {
        // File may not exist or be empty
      }
      articles.push(article);
      fs.writeFileSync(this.dataFilePath, JSON.stringify(articles, null, 2));
    } catch (error) {
      console.error("Failed to append article to file:", error);
    }
  }

  private initializeSampleData() {
    // Create sample articles
    const sampleArticles = [
      {
        id: randomUUID(),
        title: "Carrier Introduces Revolutionary Smart HVAC System with AI-Powered Energy Optimization",
        content: "Carrier Global Corporation announces the launch of their next-generation smart HVAC system featuring advanced AI algorithms for predictive maintenance and energy efficiency optimization. The system promises up to 30% energy savings compared to traditional systems through intelligent load balancing and predictive analytics.",
        summary: "Carrier launches AI-powered HVAC system promising 30% energy savings.",
        source: "HVAC Industry Today",
        category: "Product Launch",
        industry: "HVAC",
        sentiment: "positive",
        sentimentScore: 0.8,
        views: 1247,
        isBookmarked: true,
        tags: ["SmartHVAC", "AI", "EnergyEfficiency", "Carrier"],
        aiAnalysis: {
          keyPoints: ["AI-powered optimization", "30% energy savings", "Predictive maintenance"],
          impact: "High - Could reshape HVAC efficiency standards"
        },
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        title: "Global Battery Energy Storage Market Expected to Reach $15.1B by 2027",
        content: "New market research indicates significant growth in the BESS sector, driven by renewable energy adoption and grid modernization initiatives. Key players include Tesla, LG Energy Solution, and BYD with major capacity expansions planned.",
        summary: "BESS market projected to grow to $15.1B by 2027 driven by renewable energy.",
        source: "Energy Storage News",
        category: "Market Trends",
        industry: "BESS",
        sentiment: "neutral",
        sentimentScore: 0.1,
        views: 856,
        isBookmarked: false,
        tags: ["BatteryStorage", "MarketGrowth", "RenewableEnergy", "Tesla"],
        aiAnalysis: {
          keyPoints: ["$15.1B market size by 2027", "Tesla, LG, BYD leading", "Grid modernization driver"],
          impact: "High - Indicates strong sector growth potential"
        },
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        title: "New EPA Regulations Could Impact HVAC Refrigerant Phase-Out Timeline",
        content: "The Environmental Protection Agency announces stricter regulations on hydrofluorocarbon (HFC) refrigerants, potentially accelerating the industry transition to more environmentally friendly alternatives like R-32 and R-454B refrigerants.",
        summary: "EPA tightens HFC regulations, accelerating transition to eco-friendly refrigerants.",
        source: "EPA Environmental News",
        category: "Regulatory Compliance",
        industry: "HVAC",
        sentiment: "negative",
        sentimentScore: -0.4,
        views: 2134,
        isBookmarked: true,
        tags: ["EPA", "Regulations", "HFC", "Refrigerants"],
        aiAnalysis: {
          keyPoints: ["Stricter HFC regulations", "Accelerated phase-out", "Alternative refrigerants needed"],
          impact: "Medium - May increase compliance costs but drive innovation"
        },
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        title: "Honeywell Launches Smart Building Controls Platform with AI Integration",
        content: "Honeywell International announces the release of their advanced smart building controls platform featuring AI-driven optimization for HVAC systems, energy management, and occupancy sensing. The platform promises to reduce energy consumption by up to 25% while improving indoor air quality.",
        summary: "Honeywell debuts AI-powered smart building platform with 25% energy savings.",
        source: "Smart Building News",
        category: "Product Launch",
        industry: "HVAC",
        sentiment: "positive",
        sentimentScore: 0.7,
        views: 892,
        isBookmarked: false,
        tags: ["SmartBuilding", "AI", "Honeywell", "EnergyManagement"],
        aiAnalysis: {
          keyPoints: ["AI-driven optimization", "25% energy savings", "Improved air quality"],
          impact: "Medium - Competitive response to market trends"
        },
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        title: "BESS Market Growth Driven by Grid Modernization and Renewable Energy Adoption",
        content: "Industry analysts report accelerating growth in battery energy storage systems (BESS) market, with deployment expected to triple by 2026. Key drivers include grid modernization initiatives, renewable energy integration requirements, and declining lithium-ion battery costs.",
        summary: "BESS market set to triple by 2026 driven by grid modernization needs.",
        source: "Energy Storage Report",
        category: "Market Trends",
        industry: "BESS",
        sentiment: "positive",
        sentimentScore: 0.6,
        views: 1456,
        isBookmarked: true,
        tags: ["GridModernization", "BatteryStorage", "RenewableEnergy", "MarketGrowth"],
        aiAnalysis: {
          keyPoints: ["Market tripling by 2026", "Grid modernization driver", "Cost reductions"],
          impact: "High - Major market expansion opportunity"
        },
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        title: "Johnson Controls Acquires Clean Energy Technology Startup for $200M",
        content: "Johnson Controls International announces acquisition of CleanTech Solutions, a startup specializing in advanced heat pump technologies and smart energy management systems. The deal values the company at $200 million and strengthens JCI's position in sustainable building solutions.",
        summary: "Johnson Controls acquires CleanTech Solutions for $200M to boost sustainable tech.",
        source: "Building Industry Times",
        category: "Competitor Financials",
        industry: "HVAC",
        sentiment: "positive",
        sentimentScore: 0.5,
        views: 2341,
        isBookmarked: false,
        tags: ["JohnsonControls", "Acquisition", "HeatPump", "SustainableTech"],
        aiAnalysis: {
          keyPoints: ["$200M acquisition", "Heat pump technology", "Market consolidation"],
          impact: "Medium - Strategic positioning move"
        },
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        title: "New DOE Efficiency Standards Impact Commercial HVAC Equipment Manufacturing",
        content: "The Department of Energy finalizes new energy efficiency standards for commercial HVAC equipment, requiring manufacturers to meet stricter performance criteria by 2025. Industry experts estimate compliance costs could reach $1.2 billion across all manufacturers.",
        summary: "DOE sets stricter HVAC efficiency standards with $1.2B compliance costs.",
        source: "Regulatory Watch",
        category: "Regulatory Compliance",
        industry: "HVAC",
        sentiment: "negative",
        sentimentScore: -0.3,
        views: 1789,
        isBookmarked: true,
        tags: ["DOE", "Regulations", "Efficiency", "Compliance"],
        aiAnalysis: {
          keyPoints: ["New efficiency standards", "$1.2B compliance costs", "2025 deadline"],
          impact: "High - Significant regulatory burden"
        },
        publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        title: "Tesla Megapack Factory Reaches Record Production Milestone",
        content: "Tesla's Megapack factory in California achieves record production levels, manufacturing over 1,000 utility-scale battery units in Q3. The facility now operates at 85% capacity and is expected to reach full production by end of year, supporting grid-scale energy storage projects worldwide.",
        summary: "Tesla Megapack factory hits record production with 1,000+ units in Q3.",
        source: "Tesla Energy News",
        category: "Technology Innovation",
        industry: "BESS",
        sentiment: "positive",
        sentimentScore: 0.8,
        views: 3247,
        isBookmarked: false,
        tags: ["Tesla", "Megapack", "Production", "GridScale"],
        aiAnalysis: {
          keyPoints: ["Record production levels", "85% capacity utilization", "Global expansion"],
          impact: "High - Market leadership consolidation"
        },
        publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        title: "Heat Pump Sales Surge 40% as Homeowners Seek Energy Efficient Solutions",
        content: "Residential heat pump sales experience unprecedented growth with 40% year-over-year increase, driven by energy cost concerns and federal tax incentives. Major manufacturers including Trane, Carrier, and Rheem report supply chain challenges meeting demand.",
        summary: "Heat pump sales jump 40% amid energy efficiency push and tax incentives.",
        source: "HVAC Contractor Magazine",
        category: "Market Trends",
        industry: "HVAC",
        sentiment: "positive",
        sentimentScore: 0.6,
        views: 1923,
        isBookmarked: false,
        tags: ["HeatPumps", "SalesGrowth", "EnergyEfficiency", "TaxIncentives"],
        aiAnalysis: {
          keyPoints: ["40% sales increase", "Supply chain challenges", "Federal incentives"],
          impact: "Medium - Growing market segment"
        },
        publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
        createdAt: new Date()
      }
    ];

    sampleArticles.forEach(article => {
      this.articles.set(article.id, {
        ...article,
        url: null,
        aiAnalysis: (article as any).aiAnalysis || {}
      } as Article);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'analyst'
    };
    this.users.set(id, user);
    return user;
  }

  async getArticles(filters?: {
    category?: string;
    industry?: string;
    sentiment?: string;
    search?: string;
    bookmarked?: boolean;
  }): Promise<Article[]> {
    let articles = Array.from(this.articles.values());

    if (filters) {
      if (filters.category && filters.category !== 'All Categories') {
        articles = articles.filter(a => a.category === filters.category);
      }
      if (filters.industry && filters.industry !== 'All Industries') {
        articles = articles.filter(a => a.industry === filters.industry);
      }
      if (filters.sentiment && filters.sentiment !== 'All Sentiment') {
        const sentiment = filters.sentiment.toLowerCase();
        articles = articles.filter(a => a.sentiment === sentiment);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        articles = articles.filter(a => 
          a.title.toLowerCase().includes(searchTerm) || 
          a.content.toLowerCase().includes(searchTerm) ||
          a.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      if (filters.bookmarked) {
        articles = articles.filter(a => a.isBookmarked);
      }
    }

    return articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (article) {
      // Increment view count
      article.views += 1;
      this.articles.set(id, article);
    }
    return article;
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const article: Article = {
      ...insertArticle,
      aiAnalysis: insertArticle.aiAnalysis ?? {},
      url: insertArticle.url ?? null,
      sentimentScore: insertArticle.sentimentScore ?? 0,
      tags: insertArticle.tags ?? null,
      id,
      views: 0,
      isBookmarked: false,
      createdAt: new Date(),
      summary: insertArticle.summary || null,
      publishedAt: insertArticle.publishedAt ?? new Date()
    };
    this.articles.set(id, article);
    this.appendArticleToFile(article);
    return article;
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;

    const updatedArticle = { ...article, ...updates };
    this.articles.set(id, updatedArticle);
    this.saveArticlesToFile();
    return updatedArticle;
  }

  async toggleBookmark(id: string): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;

    const updatedArticle = { ...article, isBookmarked: !article.isBookmarked };
    this.articles.set(id, updatedArticle);
    this.saveArticlesToFile();
    return updatedArticle;
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values())
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      aiAnalysis: insertDocument.aiAnalysis ?? null,
      id,
      uploadedAt: new Date(),
      content: insertDocument.content || null
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async getAnalytics(): Promise<{
    todayArticles: number;
    positiveSentiment: number;
    hvacMentions: number;
    bessArticles: number;
    categoryBreakdown: Record<string, number>;
    sentimentBreakdown: Record<string, number>;
    trendingTags: Array<{ tag: string; count: number; change: number }>;
  }> {
    const articles = Array.from(this.articles.values());
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const todayArticles = articles.filter(a => 
      new Date(a.publishedAt) >= yesterday
    ).length;

    const positiveCount = articles.filter(a => a.sentiment === 'positive').length;
    const positiveSentiment = articles.length > 0 ? (positiveCount / articles.length) * 100 : 0;

    const hvacMentions = articles.filter(a => a.industry === 'HVAC').length;
    const bessArticles = articles.filter(a => a.industry === 'BESS').length;

    const categoryBreakdown: Record<string, number> = {};
    const sentimentBreakdown: Record<string, number> = {};

    articles.forEach(article => {
      categoryBreakdown[article.category] = (categoryBreakdown[article.category] || 0) + 1;
      sentimentBreakdown[article.sentiment] = (sentimentBreakdown[article.sentiment] || 0) + 1;
    });

    // Calculate trending tags
    const tagCounts: Record<string, number> = {};
    articles.forEach(article => {
      article.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const trendingTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        change: Math.floor(Math.random() * 40) - 10 // Mock trend change
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      todayArticles,
      positiveSentiment: Math.round(positiveSentiment),
      hvacMentions,
      bessArticles,
      categoryBreakdown,
      sentimentBreakdown,
      trendingTags
    };
  }

  // Notification methods
  async getNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: randomUUID(),
      ...notification,
      data: notification.data ?? null,
      priority: notification.priority ?? 'medium',
      read: notification.read ?? false,
      createdAt: new Date()
    };
    
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async getUnreadNotificationCount(): Promise<number> {
    return Array.from(this.notifications.values()).filter(n => !n.read).length;
  }
}

export const storage = new MemStorage();
