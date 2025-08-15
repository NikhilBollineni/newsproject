import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { analyzeArticleSentiment, categorizeArticle } from './openai';
import type { InsertArticle } from '@shared/schema';

export interface FetchedArticle {
  title: string;
  content: string;
  summary: string;
  source: string;
  category: string;
  industry: string;
  url: string;
  publishedAt: string;
  tags: string[];
}

export class NewsService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), 'server', 'services', 'news_fetcher.py');
  }

  async fetchLatestNews(): Promise<InsertArticle[]> {
    try {
      console.log('Fetching latest HVAC and BESS industry news...');
      
      // Execute Python news fetcher
      const articles = await this.executePythonScript();
      
      if (!articles || articles.length === 0) {
        console.log('No articles fetched from news service');
        return [];
      }

      console.log(`Fetched ${articles.length} articles, processing with AI...`);

      // Process articles with AI analysis (or basic processing if AI unavailable)
      const processedArticles = await this.processArticlesWithAI(articles);
      // Persist fetched articles to JSON file
      try {
        const dataPath = path.join(process.cwd(), 'data', 'news.json');
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(processedArticles, null, 2));
      } catch (err) {
        console.error('Failed to write news data file:', err);
      }

      console.log(`Successfully processed ${processedArticles.length} articles`);
      return processedArticles;

    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Failed to fetch news articles');
    }
  }

  private async executePythonScript(): Promise<FetchedArticle[]> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [this.pythonScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout for the process using configurable env var with 5 min default
      const timeoutMsEnv = parseInt(process.env.NEWS_FETCH_TIMEOUT_MS || '', 10);
      const timeoutMs = Number.isFinite(timeoutMsEnv) ? timeoutMsEnv : 300000;
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('News fetching timeout'));
      }, timeoutMs);

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          console.error('Python script error:', stderr);
          reject(new Error(`Python script exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const articles = JSON.parse(stdout);
          resolve(articles);
        } catch (error) {
          console.error('Failed to parse JSON from Python script:', error);
          console.error('Raw output:', stdout);
          reject(new Error('Failed to parse news data'));
        }
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        console.error('Failed to start Python script:', error);
        reject(new Error('Failed to start news fetcher'));
      });
    });
  }

  private async processArticlesWithAI(articles: FetchedArticle[]): Promise<InsertArticle[]> {
    const hasKey = Boolean(
      process.env.OPENAI_API_KEY ||
      (process.env.OPENAI_API_KEY_ENV_VAR && process.env[process.env.OPENAI_API_KEY_ENV_VAR])
    );

    // If no API key is configured, return basic article data without AI enhancement
    if (!hasKey) {
      return articles.map(article => ({
        title: article.title,
        content: article.content,
        summary: article.summary,
        source: article.source,
        category: article.category,
        industry: article.industry,
        sentiment: 'neutral' as const,
        sentimentScore: 0,
        tags: article.tags || [],
        aiAnalysis: {
          aiEnhanced: false,
          fetchedAt: new Date().toISOString(),
          sourceUrl: article.url
        },
        publishedAt: new Date(article.publishedAt)
      }));
    }

    const processedArticles: InsertArticle[] = [];

    // Process articles in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);

      const batchPromises = batch.map(async (article) => {
        try {
          // Get AI analysis for sentiment and category verification
          const [sentimentResult, categoryResult] = await Promise.all([
            analyzeArticleSentiment(article.content),
            categorizeArticle(article.title, article.content)
          ]);

          // Create processed article
          const processedArticle: InsertArticle = {
            title: article.title,
            content: article.content,
            summary: article.summary,
            source: article.source,
            category: categoryResult.category || article.category,
            industry: categoryResult.industry || article.industry,
            sentiment: sentimentResult.sentiment,
            sentimentScore: sentimentResult.score,
            tags: [...(article.tags || []), ...(categoryResult.tags || [])].slice(0, 8), // Limit to 8 tags
            aiAnalysis: {
              sentimentConfidence: sentimentResult.confidence,
              originalCategory: article.category,
              aiEnhanced: true,
              fetchedAt: new Date().toISOString(),
              sourceUrl: article.url
            },
            publishedAt: new Date(article.publishedAt)
          };

          return processedArticle;
        } catch (error) {
          console.error(`Error processing article "${article.title}":`, error);

          // Return article with minimal processing if AI fails
          return {
            title: article.title,
            content: article.content,
            summary: article.summary,
            source: article.source,
            category: article.category,
            industry: article.industry,
            sentiment: 'neutral' as const,
            sentimentScore: 0,
            tags: article.tags || [],
            aiAnalysis: {
              error: 'AI processing failed',
              fallback: true,
              fetchedAt: new Date().toISOString(),
              sourceUrl: article.url
            },
            publishedAt: new Date(article.publishedAt)
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      processedArticles.push(...batchResults);

      // Small delay between batches to be respectful to the API
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return processedArticles;
  }

  async testConnection(): Promise<boolean> {
    try {
      const testArticles = await this.executePythonScript();
      return testArticles.length > 0;
    } catch (error) {
      console.error('News service test failed:', error);
      return false;
    }
  }
}