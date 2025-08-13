import { WebSocket } from "ws";
import { storage } from "../storage";
import { type InsertNotification, type Notification } from "@shared/schema";

class NotificationService {
  private clients: Set<WebSocket> = new Set();

  addClient(ws: WebSocket) {
    this.clients.add(ws);
    
    ws.on('close', () => {
      this.clients.delete(ws);
    });

    // Send unread notification count when client connects
    this.sendUnreadCount(ws);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification = await storage.createNotification(notification);
    
    // Broadcast to all connected clients
    this.broadcast({
      type: 'notification',
      data: newNotification
    });

    // Update unread count for all clients
    this.broadcastUnreadCount();

    return newNotification;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const notification = await storage.markNotificationRead(id);
    
    if (notification) {
      // Update unread count for all clients
      this.broadcastUnreadCount();
    }

    return notification;
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  private async sendUnreadCount(ws: WebSocket) {
    if (ws.readyState === WebSocket.OPEN) {
      const count = await storage.getUnreadNotificationCount();
      ws.send(JSON.stringify({
        type: 'unread_count',
        data: { count }
      }));
    }
  }

  private async broadcastUnreadCount() {
    const count = await storage.getUnreadNotificationCount();
    this.broadcast({
      type: 'unread_count',
      data: { count }
    });
  }

  // Check if an article qualifies as breaking news
  isBreakingNews(article: any): boolean {
    const breakingKeywords = [
      'breaking', 'urgent', 'emergency', 'alert', 'critical',
      'new regulation', 'major announcement', 'acquisition',
      'merger', 'partnership', 'recall', 'lawsuit'
    ];

    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();

    return breakingKeywords.some(keyword => 
      titleLower.includes(keyword) || contentLower.includes(keyword)
    );
  }

  // Check for significant sentiment changes
  async checkSentimentAlerts(): Promise<void> {
    // This could analyze recent articles for sentiment shifts
    // For now, we'll implement a basic version
    const articles = await storage.getArticles();
    const recentArticles = articles.filter(a => {
      const articleDate = new Date(a.publishedAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return articleDate > oneDayAgo;
    });

    if (recentArticles.length > 0) {
      const negativeArticles = recentArticles.filter(a => a.sentiment === 'negative');
      const negativePercentage = (negativeArticles.length / recentArticles.length) * 100;

      if (negativePercentage > 60) {
        await this.createNotification({
          type: 'sentiment_change',
          title: 'Market Sentiment Alert',
          message: `High negative sentiment detected: ${Math.round(negativePercentage)}% of recent articles are negative`,
          priority: 'high',
          data: {
            percentage: negativePercentage,
            articlesCount: recentArticles.length
          }
        });
      }
    }
  }

  // Create notifications for new breaking news articles
  async handleNewArticle(article: any): Promise<void> {
    if (this.isBreakingNews(article)) {
      await this.createNotification({
        type: 'breaking_news',
        title: 'Breaking Industry News',
        message: `${article.industry}: ${article.title}`,
        priority: 'high',
        data: {
          articleId: article.id,
          industry: article.industry,
          category: article.category
        }
      });
    }

    // Check for market opportunities based on article content
    if (article.sentiment === 'positive' && 
        (article.category === 'Product Launch' || article.category === 'Market Trends')) {
      await this.createNotification({
        type: 'market_alert',
        title: 'Market Opportunity Alert',
        message: `New ${article.category.toLowerCase()} in ${article.industry}: ${article.title.substring(0, 80)}...`,
        priority: 'medium',
        data: {
          articleId: article.id,
          industry: article.industry,
          category: article.category
        }
      });
    }
  }
}

export const notificationService = new NotificationService();