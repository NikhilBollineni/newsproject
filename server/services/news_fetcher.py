#!/usr/bin/env python3
"""
HVAC Industry News Fetcher using GNews
Fetches real-time news articles related to HVAC and BESS industries
"""

import json
import sys
from datetime import datetime, timedelta
from gnews import GNews
import requests
from dateutil import parser as date_parser

class HVACNewsFetcher:
    def __init__(self):
        self.google_news = GNews(
            language='en',
            country='US',
            period='7d',  # Last 7 days
            max_results=20
        )
        
        # HVAC and BESS related search terms
        self.search_terms = [
            'HVAC industry news',
            'heating ventilation air conditioning',
            'battery energy storage systems BESS',
            'smart HVAC technology',
            'heat pump technology',
            'commercial HVAC equipment',
            'Tesla Megapack energy storage',
            'grid scale battery storage',
            'HVAC regulations EPA',
            'energy efficiency HVAC'
        ]

    def fetch_articles(self, max_articles=50):
        """Fetch news articles related to HVAC and BESS industries"""
        all_articles = []
        seen_titles = set()
        
        for term in self.search_terms:
            try:
                # Search for articles
                articles = self.google_news.get_news(term)
                
                for article in articles:
                    # Skip duplicates based on title
                    title = article.get('title', '').strip()
                    if title in seen_titles or not title:
                        continue
                    
                    seen_titles.add(title)
                    
                    # Parse and format article data
                    formatted_article = self._format_article(article)
                    if formatted_article:
                        all_articles.append(formatted_article)
                    
                    # Stop if we have enough articles
                    if len(all_articles) >= max_articles:
                        break
                        
            except Exception as e:
                print(f"Error fetching articles for term '{term}': {e}", file=sys.stderr)
                continue
            
            if len(all_articles) >= max_articles:
                break
        
        return all_articles[:max_articles]

    def _format_article(self, article):
        """Format a single article for the HVAC Intel platform"""
        try:
            title = article.get('title', '').strip()
            description = article.get('description', '').strip()
            url = article.get('url', '')
            publisher = article.get('publisher', {}).get('title', 'Unknown Source')
            published_date = article.get('published date', '')
            
            # Skip if essential data is missing
            if not title or not description:
                return None
            
            # Parse published date
            try:
                if published_date:
                    parsed_date = date_parser.parse(published_date)
                else:
                    parsed_date = datetime.now()
            except:
                parsed_date = datetime.now()
            
            # Determine industry based on content
            industry = self._determine_industry(title, description)
            
            # Determine category based on content
            category = self._determine_category(title, description)
            
            # Create article object matching the application schema
            formatted_article = {
                'title': title,
                'content': description,
                'summary': self._generate_summary(description),
                'source': publisher,
                'category': category,
                'industry': industry,
                'url': url,
                'publishedAt': parsed_date.isoformat(),
                'tags': self._extract_tags(title, description)
            }
            
            return formatted_article
            
        except Exception as e:
            print(f"Error formatting article: {e}", file=sys.stderr)
            return None

    def _determine_industry(self, title, content):
        """Determine if article is HVAC or BESS related"""
        text = (title + ' ' + content).lower()
        
        bess_keywords = ['battery', 'energy storage', 'megapack', 'grid scale', 'bess', 'lithium']
        hvac_keywords = ['hvac', 'heating', 'ventilation', 'air conditioning', 'heat pump', 'refriger']
        
        bess_score = sum(1 for keyword in bess_keywords if keyword in text)
        hvac_score = sum(1 for keyword in hvac_keywords if keyword in text)
        
        return 'BESS' if bess_score > hvac_score else 'HVAC'

    def _determine_category(self, title, content):
        """Determine article category based on content"""
        text = (title + ' ' + content).lower()
        
        if any(word in text for word in ['launch', 'new product', 'introduce', 'unveil']):
            return 'Product Launch'
        elif any(word in text for word in ['regulation', 'compliance', 'epa', 'law', 'standard']):
            return 'Regulatory Compliance'
        elif any(word in text for word in ['market', 'growth', 'forecast', 'trend', 'analysis']):
            return 'Market Trends'
        elif any(word in text for word in ['acquisition', 'merger', 'financial', 'revenue', 'profit']):
            return 'Competitor Financials'
        elif any(word in text for word in ['technology', 'innovation', 'breakthrough', 'research']):
            return 'Technology Innovation'
        else:
            return 'Industry Analysis'

    def _generate_summary(self, content):
        """Generate a brief summary from the article content"""
        if len(content) <= 120:
            return content
        
        # Find the first sentence or truncate at word boundary
        sentences = content.split('. ')
        if sentences and len(sentences[0]) <= 120:
            return sentences[0] + '.'
        
        # Truncate at word boundary
        words = content.split()
        summary = ''
        for word in words:
            if len(summary + word) > 120:
                break
            summary += word + ' '
        
        return summary.strip() + '...'

    def _extract_tags(self, title, content):
        """Extract relevant tags from article content"""
        text = (title + ' ' + content).lower()
        
        # Common industry tags
        potential_tags = [
            'SmartHVAC', 'AI', 'EnergyEfficiency', 'HeatPump', 'BatteryStorage',
            'Tesla', 'GridModernization', 'RenewableEnergy', 'EPA', 'Regulations',
            'MarketGrowth', 'Innovation', 'Sustainability', 'IoT', 'Automation',
            'CommercialHVAC', 'ResidentialHVAC', 'Carrier', 'Honeywell', 'JohnsonControls',
            'Trane', 'Rheem', 'LGEnergy', 'BYD', 'EnergyStorage'
        ]
        
        # Extract tags that appear in the content
        found_tags = []
        for tag in potential_tags:
            tag_words = tag.lower().replace('hvac', 'hvac').split()
            if all(word in text for word in tag_words):
                found_tags.append(tag)
        
        return found_tags[:5]  # Limit to 5 tags

def main():
    """Main function to fetch and return articles as JSON"""
    try:
        fetcher = HVACNewsFetcher()
        articles = fetcher.fetch_articles(max_articles=30)
        
        # Output articles as JSON
        print(json.dumps(articles, indent=2))
        
    except Exception as e:
        print(f"Error in main: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()