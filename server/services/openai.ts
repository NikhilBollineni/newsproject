import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function analyzeArticleSentiment(content: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert for HVAC and BESS industry news. Analyze the sentiment and provide a score from -1 to 1 (negative to positive) and confidence level. Return JSON with sentiment (positive/negative/neutral), score, and confidence fields."
        },
        {
          role: "user",
          content: content
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      sentiment: result.sentiment || 'neutral',
      score: Math.max(-1, Math.min(1, result.score || 0)),
      confidence: Math.max(0, Math.min(1, result.confidence || 0))
    };
  } catch (error) {
    console.error('Failed to analyze sentiment:', error);
    return { sentiment: 'neutral', score: 0, confidence: 0 };
  }
}

export async function categorizeArticle(title: string, content: string): Promise<{
  category: string;
  industry: string;
  tags: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an industry expert for HVAC and BESS sectors. Categorize the article with:
          - category: one of "Product Launch", "Market Trends", "Competitor Financials", "Regulatory Compliance", "Technology Innovation", "Industry Analysis"
          - industry: "HVAC" or "BESS" (Battery Energy Storage Systems)
          - tags: array of relevant keywords/hashtags
          Return JSON format with these fields.`
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent: ${content}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      category: result.category || 'Industry Analysis',
      industry: result.industry || 'HVAC',
      tags: result.tags || []
    };
  } catch (error) {
    console.error('Failed to categorize article:', error);
    return { category: 'Industry Analysis', industry: 'HVAC', tags: [] };
  }
}

export async function analyzeDocument(content: string): Promise<{
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  industryImpact: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert analyst for the HVAC and BESS industries. Analyze the document and provide:
          - summary: concise overview of the document
          - keyInsights: array of key findings or insights
          - recommendations: array of actionable recommendations
          - industryImpact: assessment of how this affects the HVAC/BESS industry
          Return JSON format with these fields.`
        },
        {
          role: "user",
          content: content
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: result.summary || 'Analysis not available',
      keyInsights: result.keyInsights || [],
      recommendations: result.recommendations || [],
      industryImpact: result.industryImpact || 'Impact assessment not available'
    };
  } catch (error) {
    console.error('Failed to analyze document:', error);
    return {
      summary: 'Analysis failed',
      keyInsights: [],
      recommendations: [],
      industryImpact: 'Unable to assess impact'
    };
  }
}

export async function generateAIInsights(articles: any[]): Promise<{
  marketOpportunities: string[];
  riskAlerts: string[];
  trendAnalysis: string;
}> {
  try {
    const articlesData = articles.map(a => ({
      title: a.title,
      category: a.category,
      sentiment: a.sentiment,
      industry: a.industry
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a strategic analyst for HVAC and BESS industries. Based on recent articles, provide:
          - marketOpportunities: array of potential business opportunities
          - riskAlerts: array of potential risks or challenges
          - trendAnalysis: overall trend assessment
          Return JSON format with these fields.`
        },
        {
          role: "user",
          content: `Analyze these recent articles: ${JSON.stringify(articlesData)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Ensure arrays contain only strings, not objects
    const sanitizeArray = (arr: any[]): string[] => {
      return arr.map(item => 
        typeof item === 'string' ? item : 
        typeof item === 'object' ? JSON.stringify(item) : 
        String(item)
      );
    };
    
    return {
      marketOpportunities: sanitizeArray(result.marketOpportunities || []),
      riskAlerts: sanitizeArray(result.riskAlerts || []),
      trendAnalysis: typeof result.trendAnalysis === 'string' ? 
        result.trendAnalysis : 
        String(result.trendAnalysis) || 'No trend analysis available'
    };
  } catch (error) {
    console.error('Failed to generate AI insights:', error);
    return {
      marketOpportunities: [],
      riskAlerts: [],
      trendAnalysis: 'Insights generation failed'
    };
  }
}
