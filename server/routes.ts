import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArticleSchema, insertDocumentSchema } from "@shared/schema";
import { analyzeArticleSentiment, categorizeArticle, analyzeDocument, generateAIInsights } from "./services/openai";
import multer from "multer";
import { z } from "zod";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Articles endpoints
  app.get("/api/articles", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        industry: req.query.industry as string,
        sentiment: req.query.sentiment as string,
        search: req.query.search as string,
        bookmarked: req.query.bookmarked === 'true'
      };
      
      const articles = await storage.getArticles(filters);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      const validatedData = insertArticleSchema.parse(req.body);
      
      // AI-powered analysis
      const [sentimentResult, categoryResult] = await Promise.all([
        analyzeArticleSentiment(validatedData.content),
        categorizeArticle(validatedData.title, validatedData.content)
      ]);

      const articleData = {
        ...validatedData,
        sentiment: sentimentResult.sentiment,
        sentimentScore: sentimentResult.score,
        category: categoryResult.category,
        industry: categoryResult.industry,
        tags: categoryResult.tags,
        aiAnalysis: {
          sentimentConfidence: sentimentResult.confidence,
          aiGenerated: true
        }
      };

      const article = await storage.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.patch("/api/articles/:id/bookmark", async (req, res) => {
    try {
      const article = await storage.toggleBookmark(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  // Documents endpoints
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let content = '';
      if (req.file.mimetype === 'text/plain') {
        content = req.file.buffer.toString();
      } else if (req.file.mimetype === 'application/pdf') {
        // For PDF processing, we'll store the buffer and process later
        content = 'PDF content extraction pending...';
      }

      const documentData = {
        filename: `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        content
      };

      const document = await storage.createDocument(documentData);

      // Perform AI analysis if content is available
      if (content && content !== 'PDF content extraction pending...') {
        const analysis = await analyzeDocument(content);
        await storage.updateDocument(document.id, { aiAnalysis: analysis });
      }

      res.status(201).json(document);
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/documents/:id/analyze", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (!document.content) {
        return res.status(400).json({ message: "Document has no content to analyze" });
      }

      const analysis = await analyzeDocument(document.content);
      await storage.updateDocument(document.id, { aiAnalysis: analysis });
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/insights", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      const insights = await generateAIInsights(articles);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
