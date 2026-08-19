import {
  NextRequest,
  NextResponse,
} from "next/server";

type ForexValue = {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
};

type TwelveDataResponse = {
  values?: ForexValue[];
  status?: string;
  code?: number;
  message?: string;
};

type Timeframe =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d";

function normalizeSymbol(
  symbol: string
): string {
  return symbol
    .trim()
    .toUpperCase()
    .replace("/", "");
}

function normalizeForexInterval(
  interval: string
): string {
  const intervalMap: Record<
    Timeframe,
    string
  > = {
    "1m": "1min",
    "5m": "5min",
    "15m": "15min",
    "30m": "30min",
    "1h": "1h",
    "4h": "4h",
    "1d": "1day",
  };

  if (
    interval in intervalMap
  ) {
    return intervalMap[
      interval as Timeframe
    ];
  }

  return "5min";
}

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const symbol =
      searchParams.get("symbol") ||
      "EUR/USD";

    const interval =
      searchParams.get("interval") ||
      "5m";

    const apiKey =
      process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          values: [],
          error:
            "TWELVE_DATA_API_KEY is missing in .env.local",
        },
        { status: 500 }
      );
    }

    const normalizedSymbol =
      normalizeSymbol(symbol);

    if (
      normalizedSymbol.length !== 6
    ) {
      return NextResponse.json(
        {
          values: [],
          error:
            "Invalid Forex symbol: " +
            symbol,
        },
        { status: 400 }
      );
    }

    const normalizedInterval =
      normalizeForexInterval(
        interval
      );

    const url =
      "https://api.twelvedata.com/time_series?" +
      "symbol=" +
      encodeURIComponent(symbol) +
      "&interval=" +
      encodeURIComponent(
        normalizedInterval
      ) +
      "&outputsize=100" +
      "&apikey=" +
      encodeURIComponent(apiKey);

    const response =
      await fetch(url, {
        cache: "no-store",
      });

    const data =
      (await response.json()) as TwelveDataResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          values: [],
          error:
            data?.message ||
            "Forex provider request failed",
        },
        { status: 502 }
      );
    }

    if (
      data?.status === "error"
    ) {
      return NextResponse.json(
        {
          values: [],
          error:
            data?.message ||
            "Forex provider returned an error",
        },
        { status: 502 }
      );
    }

    if (
      !Array.isArray(data?.values)
    ) {
      return NextResponse.json(
        {
          values: [],
          error:
            data?.message ||
            "Forex provider returned no market data",
        },
        { status: 502 }
      );
    }

    const values =
      data.values
        .filter(
          (item) =>
            item &&
            item.close !== undefined
        )
        .map((item) => ({
          datetime:
            item.datetime || "",
          open:
            item.open || "",
          high:
            item.high || "",
          low:
            item.low || "",
          close:
            item.close || "",
        }));

    if (values.length < 15) {
      return NextResponse.json(
        {
          values: [],
          error:
            "Not enough Forex candle data",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        symbol,
        interval,
        providerInterval:
          normalizedInterval,
        values,
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
      "Forex market API error:",
      error
    );

    return NextResponse.json(
      {
        values: [],
        error:
          error instanceof Error
            ? error.message
            : "Unknown Forex API error",
      },
      {
        status: 500,
      }
    );
  }
}