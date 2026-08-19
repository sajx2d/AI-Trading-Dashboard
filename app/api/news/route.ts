import { NextRequest, NextResponse } from "next/server";

type NewsItem = {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
};

function cleanText(value: string): string {
  return value
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function getSearchQuery(symbol: string): string {
  const clean = symbol.trim().toUpperCase();

  const cryptoNames: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    BNB: "BNB",
    XRP: "XRP",
    SOL: "Solana",
    ADA: "Cardano",
    DOGE: "Dogecoin",
    TRX: "TRON",
    AVAX: "Avalanche",
    LINK: "Chainlink",
    DOT: "Polkadot",
    MATIC: "Polygon",
    LTC: "Litecoin",
    BCH: "Bitcoin Cash",
    UNI: "Uniswap",
    ATOM: "Cosmos",
    ETC: "Ethereum Classic",
    XLM: "Stellar",
    FIL: "Filecoin",
    NEAR: "NEAR Protocol",
  };

  const baseSymbol = clean.split("/")[0];

  if (cryptoNames[baseSymbol]) {
    return `${cryptoNames[baseSymbol]} crypto`;
  }

  const forexPair = clean.replace("/", " ");

  return `${forexPair} forex`;
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const symbol =
      searchParams.get("symbol") || "BTC/USDT";

    const query = getSearchQuery(symbol);

    const newsUrl =
      "https://news.google.com/rss/search?" +
      "q=" +
      encodeURIComponent(`${query} when:7d`) +
      "&hl=en-US" +
      "&gl=US" +
      "&ceid=US:en";

    const response = await fetch(newsUrl, {
      cache: "no-store",
      headers: {
        Accept:
          "application/rss+xml, application/xml, text/xml",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const xml = await response.text();

    if (!response.ok) {
      console.error(
        "Google News request failed:",
        response.status
      );

      return NextResponse.json(
        {
          news: [],
          symbol,
          query,
          error: "News provider unavailable",
        },
        { status: 200 }
      );
    }

    if (
      !xml.includes("<rss") &&
      !xml.includes("<feed")
    ) {
      console.error(
        "Google News returned invalid RSS data:",
        xml.slice(0, 200)
      );

      return NextResponse.json(
        {
          news: [],
          symbol,
          query,
          error: "News provider returned invalid data",
        },
        { status: 200 }
      );
    }

    const items: NewsItem[] = [];
        const itemMatches =
      xml.match(/<item[\s\S]*?<\/item>/gi) || [];

    for (
      const itemXml of itemMatches.slice(0, 8)
    ) {
      const titleMatch = itemXml.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
      );

      const linkMatch = itemXml.match(
        /<link[^>]*>([\s\S]*?)<\/link>/i
      );

      const descriptionMatch = itemXml.match(
        /<description[^>]*>([\s\S]*?)<\/description>/i
      );

      const dateMatch = itemXml.match(
        /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i
      );

      const title = titleMatch
        ? cleanText(titleMatch[1])
        : "";

      const url = linkMatch
        ? cleanText(linkMatch[1])
        : "";

      const description = descriptionMatch
        ? cleanText(descriptionMatch[1])
        : "";

      const publishedAt = dateMatch
        ? cleanText(dateMatch[1])
        : "";

      if (!title || !url) {
        continue;
      }

      items.push({
        title,
        description,
        url,
        publishedAt,
      });
    }

    return NextResponse.json(
      {
        news: items,
        symbol,
        query,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
      } catch (error) {
    console.error(
      "News API error:",
      error
    );

    return NextResponse.json(
      {
        news: [],
        error:
          error instanceof Error
            ? error.message
            : "Unknown news error",
      },
      {
        status: 200,
      }
    );
  }
}
