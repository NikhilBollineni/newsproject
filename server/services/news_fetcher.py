#!/usr/bin/env python3
"""Simple HVAC Industry News Fetcher.

This script now uses the :mod:`gnews` package to query Google News for
HVAC, BESS and finance related articles. The resulting articles are
normalized into a structure consumed by the Node.js server and printed
to STDOUT as JSON.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from email.utils import parsedate_to_datetime
from html import unescape

from gnews import GNews


class HVACNewsFetcher:
    """Fetch and format news articles for the application."""

    def __init__(self) -> None:
        # HVAC, BESS, and Finance related search terms
        self.search_terms = [
            "HVAC industry news",
            "heating ventilation air conditioning",
            "battery energy storage systems BESS",
            "smart HVAC technology",
            "heat pump technology",
            "commercial HVAC equipment",
            "Tesla Megapack energy storage",
            "grid scale battery storage",
            "HVAC regulations EPA",
            "energy efficiency HVAC",
            "financial technology fintech",
            "banking industry news",
            "cryptocurrency blockchain",
            "investment banking",
            "financial services regulation",
            "digital payments fintech",
            "insurance technology insurtech",
            "venture capital funding",
            "financial markets analysis",
            "central bank policy",
        ]

        # Configure GNews client
        self.client = GNews(language="en", country="US")
        self.client.max_results = 100

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def fetch_articles(self, max_articles: int = 50) -> list[dict]:
        """Fetch news articles related to the defined industries."""

        all_articles: list[dict] = []
        seen_titles: set[str] = set()

        try:
            top_news = self.client.get_top_news()
        except Exception as exc:  # pragma: no cover - network robustness
            raise RuntimeError(f"GNews error fetching top news: {exc}") from exc

        def process_item(item: dict) -> None:
            title = (item.get("title") or "").strip()
            if not title or title in seen_titles:
                return
            seen_titles.add(title)

            description = unescape(
                re.sub("<[^<]+?>", "", item.get("description") or "").strip()
            )
            article = {
                "title": title,
                "description": description,
                "url": (item.get("url") or "").strip(),
                "publisher": item.get("publisher", {}),
                "published date": item.get("published date", ""),
            }
            formatted = self._format_article(article)
            if formatted:
                all_articles.append(formatted)

        for item in top_news:
            process_item(item)
            if len(all_articles) >= max_articles:
                return all_articles[:max_articles]

        for term in self.search_terms:
            try:
                search_results = self.client.get_news(term)
            except Exception as exc:  # pragma: no cover - network robustness
                raise RuntimeError(
                    f"GNews error fetching articles for term '{term}': {exc}"
                ) from exc

            for item in search_results:
                process_item(item)
                if len(all_articles) >= max_articles:
                    return all_articles[:max_articles]

        return all_articles[:max_articles]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _format_article(self, article: dict) -> dict | None:
        """Format a single article for the HVAC Intel platform."""

        try:
            title = article.get("title", "").strip()
            description = article.get("description", "").strip()
            url = article.get("url", "")
            publisher = article.get("publisher", {}).get("title", "Unknown Source")
            published_date = article.get("published date", "")

            if not title or not description:
                return None

            try:
                parsed_date = (
                    parsedate_to_datetime(published_date)
                    if published_date
                    else datetime.utcnow()
                )
            except Exception:
                parsed_date = datetime.utcnow()

            industry = self._determine_industry(title, description)
            category = self._determine_category(title, description)

            formatted_article = {
                "title": title,
                "content": description,
                "summary": self._generate_summary(description),
                "source": publisher,
                "category": category,
                "industry": industry,
                "url": url,
                "publishedAt": parsed_date.isoformat(),
                "tags": self._extract_tags(title, description),
            }

            return formatted_article
        except Exception as exc:  # pragma: no cover - robustness
            print(f"Error formatting article: {exc}", file=sys.stderr)
            return None

    def _determine_industry(self, title: str, content: str) -> str:
        text = (title + " " + content).lower()

        bess_keywords = [
            "battery",
            "energy storage",
            "megapack",
            "grid scale",
            "bess",
            "lithium",
        ]
        hvac_keywords = [
            "hvac",
            "heating",
            "ventilation",
            "air conditioning",
            "heat pump",
            "refriger",
        ]
        finance_keywords = [
            "fintech",
            "banking",
            "cryptocurrency",
            "blockchain",
            "investment",
            "financial",
            "finance",
            "payment",
            "insurance",
            "venture capital",
            "funding",
        ]

        bess_score = sum(1 for keyword in bess_keywords if keyword in text)
        hvac_score = sum(1 for keyword in hvac_keywords if keyword in text)
        finance_score = sum(1 for keyword in finance_keywords if keyword in text)

        if finance_score > max(bess_score, hvac_score):
            return "Finance"
        elif bess_score > hvac_score:
            return "BESS"
        else:
            return "HVAC"

    def _determine_category(self, title: str, content: str) -> str:
        text = (title + " " + content).lower()

        if any(word in text for word in ["launch", "new product", "introduce", "unveil"]):
            return "Product Launch"
        elif any(word in text for word in ["regulation", "compliance", "epa", "law", "standard"]):
            return "Regulatory Compliance"
        elif any(word in text for word in ["market", "growth", "forecast", "trend", "analysis"]):
            return "Market Trends"
        elif any(
            word in text for word in ["acquisition", "merger", "financial", "revenue", "profit"]
        ):
            return "Competitor Financials"
        elif any(
            word in text
            for word in ["technology", "innovation", "breakthrough", "research"]
        ):
            return "Technology Innovation"
        else:
            return "Industry Analysis"

    def _generate_summary(self, content: str) -> str:
        if len(content) <= 120:
            return content

        sentences = content.split(". ")
        if sentences and len(sentences[0]) <= 120:
            return sentences[0] + "."

        words = content.split()
        summary = ""
        for word in words:
            if len(summary + word) > 120:
                break
            summary += word + " "

        return summary.strip() + "..."

    def _extract_tags(self, title: str, content: str) -> list[str]:
        text = (title + " " + content).lower()

        potential_tags = [
            "SmartHVAC",
            "AI",
            "EnergyEfficiency",
            "HeatPump",
            "BatteryStorage",
            "Tesla",
            "GridModernization",
            "RenewableEnergy",
            "EPA",
            "Regulations",
            "MarketGrowth",
            "Innovation",
            "Sustainability",
            "IoT",
            "Automation",
            "CommercialHVAC",
            "ResidentialHVAC",
            "Carrier",
            "Honeywell",
            "JohnsonControls",
            "Trane",
            "Rheem",
            "LGEnergy",
            "BYD",
            "EnergyStorage",
            "Fintech",
            "Blockchain",
            "Cryptocurrency",
            "DigitalPayments",
            "Banking",
            "Investment",
            "VentureCapital",
            "InsurTech",
            "RegTech",
            "WealthTech",
            "LendingTech",
            "CentralBank",
            "FinancialRegulation",
            "Trading",
            "RoboAdvisor",
        ]

        found_tags: list[str] = []
        for tag in potential_tags:
            # Split camel-cased tags (e.g., "SmartHVAC" -> "smart hvac") so each
            # component can be matched individually within the article text.
            tag_words = tag.lower().replace("hvac", " hvac").split()
            if all(word in text for word in tag_words):
                found_tags.append(tag)

        return found_tags[:5]


def main() -> None:
    try:
        fetcher = HVACNewsFetcher()
        articles = fetcher.fetch_articles(max_articles=30)
        print(json.dumps(articles, indent=2))
    except Exception as exc:  # pragma: no cover - robustness
        # Surface errors to the Node handler in a structured format
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()

