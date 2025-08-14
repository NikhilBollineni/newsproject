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
from pathlib import Path


class HVACNewsFetcher:
    """Fetch and format news articles for the application."""

    def __init__(self) -> None:
        # Separate search terms by industry so that we always retrieve a
        # balanced set of articles.  Previously a single HVAC search could
        # return enough results to reach the overall limit which meant that
        # no Finance or BESS articles were ever fetched.  Grouping terms by
        # industry ensures each area receives coverage.
        self.search_terms: dict[str, list[str]] = {
            "HVAC": [
                "HVAC industry news",
                "heating ventilation air conditioning",
                "smart HVAC technology",
                "heat pump technology",
                "commercial HVAC equipment",
                "HVAC regulations EPA",
                "energy efficiency HVAC",
            ],
            "BESS": [
                "battery energy storage systems BESS",
                "Tesla Megapack energy storage",
                "grid scale battery storage",
            ],
            "Finance": [
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
            ],
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def fetch_articles(self, max_per_industry: int = 10) -> list[dict]:
        """Fetch a balanced set of news articles across industries."""

        all_articles: list[dict] = []

        # Track titles we've already seen both in this run and from the
        # existing persisted articles so repeated fetches only return new
        # items.  This helps avoid merge conflicts when the Node.js layer
        # appends results to data/news.json.
        seen_titles: set[str] = set()

        data_file = Path(__file__).resolve().parents[2] / "data" / "news.json"
        if data_file.exists():
            try:
                with data_file.open("r", encoding="utf-8") as fh:
                    for article in json.load(fh):
                        title = (article.get("title") or "").strip()
                        if title:
                            seen_titles.add(title)
            except Exception:
                # If the file can't be read or parsed, proceed without
                # pre-populating seen titles.
                pass

        for industry, terms in self.search_terms.items():
            collected = 0
            for term in terms:
                if collected >= max_per_industry:
                    break
                try:
                    query = urllib.parse.quote(term)
                    url = (
                        f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
                    )
                    with urllib.request.urlopen(url, timeout=10) as response:
                        root = ET.fromstring(response.read())

                    for item in root.findall("./channel/item"):
                        title = (item.findtext("title") or "").strip()
                        if not title or title in seen_titles:
                            continue
                        seen_titles.add(title)

                        description = unescape(
                            re.sub(
                                "<[^<]+?>",
                                "",
                                item.findtext("description") or "",
                            ).strip()
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

                        formatted = self._format_article(article, industry_hint=industry)
                        if formatted:
                            all_articles.append(formatted)
                            collected += 1
                        if collected >= max_per_industry:
                            break
                except Exception as exc:  # pragma: no cover - robustness
                    print(
                        f"Error fetching articles for term '{term}': {exc}",
                        file=sys.stderr,
                    )
                    continue

        return all_articles

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _format_article(self, article: dict, industry_hint: str | None = None) -> dict | None:
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

            industry = industry_hint or self._determine_industry(title, description)
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
            tag_words = tag.lower().replace("hvac", "hvac").split()
            if all(word in text for word in tag_words):
                found_tags.append(tag)

        return found_tags[:5]


def main() -> None:
    try:
        fetcher = HVACNewsFetcher()
        # Fetch up to 10 articles for each industry for a balanced result set
        articles = fetcher.fetch_articles(max_per_industry=10)
        print(json.dumps(articles, indent=2))
    except Exception as exc:  # pragma: no cover - robustness
        print(f"Error in main: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

