#!/usr/bin/env python3
"""Simple HVAC Industry News Fetcher

This script fetches news articles from Google News RSS feeds using only
Python's standard library. It avoids third-party dependencies that were
previously causing module import errors (for example, the missing
`gnews` package).

The script searches for several HVAC, BESS and finance related terms and
returns a list of formatted article objects in JSON format. Each run
prints the JSON array to STDOUT so that the Node.js server can consume
it.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime
from html import unescape


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

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def fetch_articles(self, max_articles: int = 50) -> list[dict]:
        """Fetch news articles related to the defined industries."""

        all_articles: list[dict] = []
        seen_titles: set[str] = set()

        for term in self.search_terms:
            try:
                query = urllib.parse.quote(term)
                url = (
                    f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
                )

                # Some environments block requests with the default Python
                # user agent which results in empty feeds. Spoof a common
                # browser user agent so Google News always responds with
                # results.
                request = urllib.request.Request(
                    url,
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                with urllib.request.urlopen(request, timeout=10) as response:
                    root = ET.fromstring(response.read())

                for item in root.findall("./channel/item"):
                    title = (item.findtext("title") or "").strip()
                    if not title or title in seen_titles:
                        continue
                    seen_titles.add(title)

                    description = unescape(
                        re.sub("<[^<]+?>", "", item.findtext("description") or "").strip()
                    )
                    link = (item.findtext("link") or "").strip()
                    source = (item.findtext("source") or "Unknown Source").strip()
                    published = item.findtext("pubDate") or ""

                    article = {
                        "title": title,
                        "description": description,
                        "url": link,
                        "publisher": {"title": source},
                        "published date": published,
                    }

                    formatted = self._format_article(article)
                    if formatted:
                        all_articles.append(formatted)

                    if len(all_articles) >= max_articles:
                        break
            except Exception as exc:  # pragma: no cover - robustness
                print(
                    f"Error fetching articles for term '{term}': {exc}", file=sys.stderr
                )
                continue

            if len(all_articles) >= max_articles:
                break

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
        print(f"Error in main: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

