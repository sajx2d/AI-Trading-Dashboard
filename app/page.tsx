"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/* =========================================================
   TYPES
========================================================= */

type MarketType = "crypto" | "forex";
type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";
type Signal = "BUY" | "SELL" | null;

type SignalData = {
  signal: Exclude<Signal, null>;
  confidence: number;
  trend: string;
  momentum: string;
  volatility: string;
  rsi: number;
};

type BacktestData = {
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  trades: number;
};

type NewsItem = {
  title: string;
  description?: string;
  url: string;
  publishedAt: string;
};

type MarketValue = {
  close?: string | number;
};

const cryptoMarkets = [
  "BTC/USDT",
  "ETH/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "SOL/USDT",
  "ADA/USDT",
  "DOGE/USDT",
  "TRX/USDT",
  "AVAX/USDT",
  "LINK/USDT",
  "DOT/USDT",
  "POL/USDT",
  "LTC/USDT",
  "BCH/USDT",
  "UNI/USDT",
  "ATOM/USDT",
  "ETC/USDT",
  "XLM/USDT",
  "FIL/USDT",
  "NEAR/USDT",
];

const forexMarkets = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "USD/CHF",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
  "EUR/GBP",
  "EUR/JPY",
  "GBP/JPY",
  "EUR/CHF",
  "AUD/JPY",
  "GBP/CHF",
  "CAD/JPY",
  "CHF/JPY",
  "NZD/JPY",
  "EUR/AUD",
  "EUR/CAD",
  "GBP/CAD",
  "AUD/CAD",
  "AUD/NZD",
  "GBP/AUD",
  "GBP/NZD",
  "NZD/CAD",
  "CAD/CHF",
  "AUD/CHF",
  "NZD/CHF",
  "EUR/NZD",
  "GBP/SGD",
  "USD/SGD",
];

const timeframes: {
  label: string;
  value: Timeframe;
  seconds: number;
}[] = [
  { label: "1 Minute", value: "1m", seconds: 60 },
  { label: "5 Minutes", value: "5m", seconds: 300 },
  { label: "15 Minutes", value: "15m", seconds: 900 },
  { label: "30 Minutes", value: "30m", seconds: 1800 },
  { label: "1 Hour", value: "1h", seconds: 3600 },
  { label: "4 Hours", value: "4h", seconds: 14400 },
  { label: "1 Day", value: "1d", seconds: 86400 },
];

const tvIntervals: Record<Timeframe, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1d": "D",
};

const binanceIntervals: Record<Timeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

const emptyBacktest: BacktestData = {
  winRate: 0,
  profitFactor: 0,
  maxDrawdown: 0,
  trades: 0,
};

/* =========================================================
   INDICATORS
========================================================= */

function calculateRSI(closes: number[], period = 14) {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period; i++) {
    const change = closes[i] - closes[i + 1];

    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) {
    return avgGain > 0 ? 100 : 50;
  }

  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calculateEMA(values: number[], period: number) {
  if (!values.length) return 0;

  const p = Math.min(period, values.length);
  const multiplier = 2 / (p + 1);

  let ema = values[values.length - 1];

  for (let i = values.length - 2; i >= 0; i--) {
    ema = values[i] * multiplier + ema * (1 - multiplier);
  }

  return ema;
}

function calculateSignal(closes: number[]): SignalData {
  const c = closes.filter(Number.isFinite);

  if (c.length < 15) {
    return {
      signal: "BUY",
      confidence: 50,
      trend: "Analyzing",
      momentum: "Analyzing",
      volatility: "Analyzing",
      rsi: 50,
    };
  }

  const latest = c[0];

  const shortPeriod = Math.min(5, c.length);
  const longPeriod = Math.min(20, c.length);

  const shortAvg =
    c.slice(0, shortPeriod).reduce((a, b) => a + b, 0) /
    shortPeriod;

  const longAvg =
    c.slice(0, longPeriod).reduce((a, b) => a + b, 0) /
    longPeriod;

  const emaValues = c.slice(0, Math.min(30, c.length));

  const ema9 = calculateEMA(emaValues, 9);
  const ema21 = calculateEMA(emaValues, 21);

  const trendDiff = longAvg
    ? ((shortAvg - longAvg) / longAvg) * 100
    : 0;

  const trend =
    trendDiff > 0.05 && ema9 > ema21
      ? "Bullish"
      : trendDiff < -0.05 && ema9 < ema21
        ? "Bearish"
        : "Sideways";

  const oldPrice = c[Math.min(5, c.length - 1)];

  const momentumPercent = oldPrice
    ? ((latest - oldPrice) / oldPrice) * 100
    : 0;

  const momentum =
    momentumPercent > 0.15
      ? "Strong"
      : momentumPercent > 0.03
        ? "Positive"
        : momentumPercent < -0.15
          ? "Strong"
          : momentumPercent < -0.03
            ? "Negative"
            : "Neutral";

  const rsi = calculateRSI(c);

  const returns: number[] = [];

  for (let i = 0; i < Math.min(20, c.length - 1); i++) {
    if (c[i + 1] !== 0) {
      returns.push(
        ((c[i] - c[i + 1]) / c[i + 1]) * 100
      );
    }
  }

  const avg = returns.length
    ? returns.reduce((a, b) => a + b, 0) / returns.length
    : 0;

  const variance = returns.length
    ? returns.reduce(
        (a, b) => a + Math.pow(b - avg, 2),
        0
      ) / returns.length
    : 0;

  const volatilityValue = Math.sqrt(variance);

  const volatility =
    volatilityValue > 0.8
      ? "High"
      : volatilityValue > 0.3
        ? "Medium"
        : "Low";

  let score = 0;

  if (trend === "Bullish") score += 2;
  if (trend === "Bearish") score -= 2;

  if (
    (momentum === "Strong" || momentum === "Positive") &&
    momentumPercent > 0
  ) {
    score += 2;
  }

  if (momentum === "Strong" && momentumPercent < 0) {
    score -= 2;
  }

  if (momentum === "Negative") {
    score -= 2;
  }

  if (ema9 > ema21) score += 1;
  if (ema9 < ema21) score -= 1;

  if (rsi >= 55 && rsi < 70) score += 1;
  if (rsi <= 45 && rsi > 30) score -= 1;
  if (rsi >= 70) score -= 1;
  if (rsi <= 30) score += 1;

  const signal: Exclude<Signal, null> =
    score >= 0 ? "BUY" : "SELL";

  let confidence =
    Math.abs(score) >= 5
      ? 88
      : Math.abs(score) >= 4
        ? 82
        : Math.abs(score) === 3
          ? 74
          : Math.abs(score) === 2
            ? 64
            : 55;

  if (volatility === "High") {
    confidence -= 8;
  }

  confidence = Math.max(
    50,
    Math.min(95, confidence)
  );

  return {
    signal,
    confidence,
    trend,
    momentum,
    volatility,
    rsi: Math.round(rsi),
  };
}

function runBacktest(closes: number[]): BacktestData {
  const c = closes.filter(Number.isFinite);

  if (c.length < 15) {
    return emptyBacktest;
  }

  let wins = 0;
  let grossProfit = 0;
  let grossLoss = 0;

  let equity = 100;
  let peak = 100;
  let maxDrawdown = 0;
  let trades = 0;

  for (let i = c.length - 5; i >= 10; i--) {
    const window = c.slice(
      Math.max(0, i - 20),
      i + 1
    );

    if (window.length < 10) continue;

    const analysis = calculateSignal(window);

    const entry = c[i];
    const exitIndex = i - 3;

    if (exitIndex < 0 || entry === 0) continue;

    let change =
      ((c[exitIndex] - entry) / entry) * 100;

    if (analysis.signal === "SELL") {
      change *= -1;
    }

    if (!Number.isFinite(change)) continue;

    trades++;

    if (change > 0) {
      wins++;
      grossProfit += change;
    } else {
      grossLoss += Math.abs(change);
    }

    equity += change;

    peak = Math.max(peak, equity);

    maxDrawdown = Math.max(
      maxDrawdown,
      peak
        ? ((peak - equity) / peak) * 100
        : 0
    );
  }

  return {
    winRate: trades
      ? Number(((wins / trades) * 100).toFixed(1))
      : 0,

    profitFactor: grossLoss
      ? Number((grossProfit / grossLoss).toFixed(2))
      : grossProfit
        ? 99
        : 0,

    maxDrawdown: Number(
      maxDrawdown.toFixed(1)
    ),

    trades,
  };
}

/* =========================================================
   COUNTDOWN HELPERS
========================================================= */

function getCandleRemainingSeconds(
  timeframe: Timeframe,
  nowMs: number
) {
  const periodSeconds =
    timeframes.find(
      (item) => item.value === timeframe
    )?.seconds ?? 300;

  const periodMs = periodSeconds * 1000;

  const elapsedMs = nowMs % periodMs;

  const remainingMs =
    periodMs - elapsedMs;

  return Math.max(
    1,
    Math.ceil(remainingMs / 1000)
  );
}

function formatCountdown(
  totalSeconds: number
) {
  const safeSeconds = Math.max(
    0,
    Math.floor(totalSeconds)
  );

  const hours = Math.floor(
    safeSeconds / 3600
  );

  const minutes = Math.floor(
    (safeSeconds % 3600) / 60
  );

  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

/* =========================================================
   SMALL UI
========================================================= */

function AnimatedCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-950/30 ${className}`}
    >
      {children}
    </div>
  );
}

function StatBox({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <AnimatedCard className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      {value}

      {subtitle && (
        <p className="mt-2 text-sm text-slate-400">
          {subtitle}
        </p>
      )}
    </AnimatedCard>
  );
}

/* =========================================================
   HOME
========================================================= */

export default function Home() {
  const chartContainerRef =
    useRef<HTMLDivElement | null>(null);

  const cryptoSocketRef =
    useRef<WebSocket | null>(null);

  const [marketType, setMarketType] =
    useState<MarketType>("crypto");

  const [selectedMarket, setSelectedMarket] =
    useState("BTC/USDT");

  const [timeframe, setTimeframe] =
    useState<Timeframe>("5m");

  const [marketPrice, setMarketPrice] =
    useState("--");

  const [priceLoading, setPriceLoading] =
    useState(false);

  const [signal, setSignal] =
    useState<Signal>(null);

  const [confidence, setConfidence] =
    useState(0);

  const [trend, setTrend] =
    useState("—");

  const [momentum, setMomentum] =
    useState("—");

  const [volatility, setVolatility] =
    useState("—");

  const [rsi, setRsi] =
    useState(50);

  const [signalGenerated, setSignalGenerated] =
    useState(false);

  const [signalLoading, setSignalLoading] =
    useState(false);

  const [signalError, setSignalError] =
    useState("");

  /* =====================================================
     AI SIGNAL COUNTDOWN
  ===================================================== */

  const [signalCountdown, setSignalCountdown] =
    useState<number | null>(null);

  const [isCounting, setIsCounting] =
    useState(false);

  /* =====================================================
     SIGNAL VALIDITY TIMER
  ===================================================== */

  const [
    signalValidityCountdown,
    setSignalValidityCountdown,
  ] = useState<number | null>(null);

  const [backtest, setBacktest] =
    useState<BacktestData>(
      emptyBacktest
    );

  const [news, setNews] =
    useState<NewsItem[]>([]);

  const [newsLoading, setNewsLoading] =
    useState(false);

  /* =====================================================
     SHARED CLOCK
  ===================================================== */

  const [clockMs, setClockMs] =
    useState(() => Date.now());

  useEffect(() => {
    const updateClock = () => {
      setClockMs(Date.now());
    };

    updateClock();

    const intervalId =
      window.setInterval(
        updateClock,
        1000
      );

    return () =>
      window.clearInterval(
        intervalId
      );
  }, []);

  /* =====================================================
     CANDLE COUNTDOWN
  ===================================================== */

  const candleCountdown = useMemo(
    () =>
      formatCountdown(
        getCandleRemainingSeconds(
          timeframe,
          clockMs
        )
      ),
    [timeframe, clockMs]
  );

  const markets =
    marketType === "crypto"
      ? cryptoMarkets
      : forexMarkets;

  const selectedTimeframe =
    useMemo(
      () =>
        timeframes.find(
          (t) =>
            t.value === timeframe
        )!,
      [timeframe]
    );

  const tradingViewSymbol =
    marketType === "crypto"
      ? `BINANCE:${selectedMarket.replace(
          "/",
          ""
        )}`
      : `FX:${selectedMarket.replace(
          "/",
          ""
        )}`;

  /* =====================================================
     RESET SIGNAL
  ===================================================== */

  function resetSignal() {
    setSignal(null);
    setConfidence(0);
    setTrend("—");
    setMomentum("—");
    setVolatility("—");
    setRsi(50);
    setSignalGenerated(false);
    setSignalError("");
    setBacktest(emptyBacktest);
    setSignalCountdown(null);
    setIsCounting(false);
    setSignalValidityCountdown(null);
  }

  /* =====================================================
     PRICE FORMAT
  ===================================================== */

  function formatPrice(price: number) {
    return marketType === "crypto"
      ? price.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          }
        )
      : price.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 4,
            maximumFractionDigits: 5,
          }
        );
  }

  /* =====================================================
     CRYPTO DATA
  ===================================================== */

  async function getCryptoData() {
    const symbol =
      selectedMarket
        .replace("/", "")
        .toUpperCase();

    const interval =
      binanceIntervals[timeframe];

    const [
      tickerResponse,
      candlesResponse,
    ] = await Promise.all([
      fetch(
        `https://data-api.binance.vision/api/v3/ticker/price?symbol=${encodeURIComponent(
          symbol
        )}`,
        {
          cache: "no-store",
        }
      ),

      fetch(
        `https://data-api.binance.vision/api/v3/klines?symbol=${encodeURIComponent(
          symbol
        )}&interval=${interval}&limit=100`,
        {
          cache: "no-store",
        }
      ),
    ]);

    if (
      !tickerResponse.ok ||
      !candlesResponse.ok
    ) {
      throw new Error(
        "Crypto market data is currently unavailable."
      );
    }

    const ticker =
      await tickerResponse.json();

    const candles =
      await candlesResponse.json();

    const price =
      Number(ticker?.price);

    const closes =
      Array.isArray(candles)
        ? candles
            .map((c: unknown) =>
              Array.isArray(c)
                ? Number(c[4])
                : NaN
            )
            .filter(
              Number.isFinite
            )
            .reverse()
        : [];

    if (
      !Number.isFinite(price) ||
      closes.length < 15
    ) {
      throw new Error(
        "Not enough valid crypto market data."
      );
    }

    return {
      price,
      closes,
    };
  }

  /* =====================================================
     FOREX DATA
  ===================================================== */

  async function getForexData() {
    const response =
      await fetch(
        `/api/market?symbol=${encodeURIComponent(
          selectedMarket
        )}&interval=${encodeURIComponent(
          timeframe
        )}`,
        {
          cache: "no-store",
        }
      );

    const text =
      await response.text();

    let data: {
      values?: MarketValue[];
      error?: string;
    } = {};

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        "Forex API returned invalid data."
      );
    }

    if (
      !response.ok ||
      !Array.isArray(data.values) ||
      data.values.length < 15
    ) {
      throw new Error(
        data.error ||
          "Forex market data is unavailable."
      );
    }

    const closes =
      data.values
        .map((x) =>
          Number(x.close)
        )
        .filter(
          Number.isFinite
        );

    if (closes.length < 15) {
      throw new Error(
        "Not enough valid Forex data."
      );
    }

    return {
      price: closes[0],
      closes,
    };
  }

  /* =====================================================
     GENERATE ACTUAL SIGNAL
  ===================================================== */

  async function createSignalNow() {
    setSignalLoading(true);
    setSignalError("");

    try {
      const result =
        marketType === "crypto"
          ? await getCryptoData()
          : await getForexData();

      setMarketPrice(
        formatPrice(result.price)
      );

      const analysis =
        calculateSignal(
          result.closes
        );

      setSignal(
        analysis.signal
      );

      setConfidence(
        analysis.confidence
      );

      setTrend(
        analysis.trend
      );

      setMomentum(
        analysis.momentum
      );

      setVolatility(
        analysis.volatility
      );

      setRsi(
        analysis.rsi
      );

      setBacktest(
        runBacktest(
          result.closes
        )
      );

      setSignalGenerated(
        true
      );

      /*
       * IMPORTANT:
       * Signal timer starts ONLY after
       * signal has successfully generated.
       *
       * 5m = 04:59
       * 1m = 00:59
       */
      const timeframeSeconds =
        timeframes.find(
          (item) =>
            item.value ===
            timeframe
        )?.seconds ?? 300;

      setSignalValidityCountdown(
        Math.max(
          0,
          timeframeSeconds - 1
        )
      );
    } catch (error) {
      setSignalError(
        error instanceof Error
          ? error.message
          : "Unable to generate signal."
      );

      setSignalGenerated(false);
      setSignal(null);
      setBacktest(
        emptyBacktest
      );
      setSignalValidityCountdown(
        null
      );
    } finally {
      setSignalLoading(false);
    }
  }

  /* =====================================================
     GENERATE BUTTON
  ===================================================== */

  function generateSignal() {
    if (
      isCounting ||
      signalLoading
    ) {
      return;
    }

    /*
     * Clear previous result first.
     */
    resetSignal();

    /*
     * Start exactly from 5.
     */
    setIsCounting(true);
    setSignalCountdown(5);
  }

  /* =====================================================
     5 SECOND AI COUNTDOWN
  ===================================================== */

  useEffect(() => {
    if (
      !isCounting ||
      signalCountdown === null
    ) {
      return;
    }

    if (
      signalCountdown <= 0
    ) {
      setIsCounting(false);
      setSignalCountdown(null);

      void createSignalNow();

      return;
    }

    const timer =
      window.setTimeout(() => {
        setSignalCountdown(
          (current) =>
            current === null
              ? null
              : Math.max(
                  0,
                  current - 1
                )
        );
      }, 1000);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    isCounting,
    signalCountdown,
  ]);

  /* =====================================================
     SIGNAL VALIDITY COUNTDOWN
  ===================================================== */

  useEffect(() => {
    if (
      isCounting ||
      signalLoading ||
      !signalGenerated ||
      signalValidityCountdown ===
        null
    ) {
      return;
    }

    /*
     * When timer reaches 0:
     * clear old signal and show Generate Signal.
     */
    if (
      signalValidityCountdown <=
      0
    ) {
      setSignalValidityCountdown(
        null
      );

      setSignalGenerated(
        false
      );

      setSignal(null);
      setConfidence(0);
      setTrend("—");
      setMomentum("—");
      setVolatility("—");
      setRsi(50);

      setBacktest(
        emptyBacktest
      );

      return;
    }

    const timer =
      window.setTimeout(() => {
        setSignalValidityCountdown(
          (current) =>
            current === null
              ? null
              : Math.max(
                  0,
                  current - 1
                )
        );
      }, 1000);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    isCounting,
    signalLoading,
    signalGenerated,
    signalValidityCountdown,
  ]);

  /* =====================================================
     RESET WHEN MARKET / PAIR / TIMEFRAME CHANGES
  ===================================================== */

  useEffect(() => {
    resetSignal();
    setMarketPrice("--");
  }, [
    selectedMarket,
    marketType,
    timeframe,
  ]);

  /* =====================================================
     CRYPTO LIVE PRICE
  ===================================================== */

  useEffect(() => {
    if (
      marketType !== "crypto"
    ) {
      return;
    }

    const symbol =
      selectedMarket
        .replace("/", "")
        .toLowerCase();

    const ws =
      new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbol}@ticker`
      );

    cryptoSocketRef.current =
      ws;

    ws.onmessage = (
      event
    ) => {
      try {
        const data =
          JSON.parse(
            event.data
          );

        const price =
          Number(data?.c);

        if (
          Number.isFinite(price)
        ) {
          setMarketPrice(
            formatPrice(price)
          );

          setPriceLoading(
            false
          );
        }
      } catch {}
    };

    ws.onerror = () =>
      setPriceLoading(false);

    return () => {
      ws.close();
      cryptoSocketRef.current =
        null;
    };
  }, [
    marketType,
    selectedMarket,
  ]);

  /* =====================================================
     FOREX LIVE PRICE
  ===================================================== */

  useEffect(() => {
    if (
      marketType !== "forex"
    ) {
      return;
    }

    let cancelled = false;

    async function updateForexPrice() {
      try {
        setPriceLoading(true);

        const response =
          await fetch(
            `/api/market?symbol=${encodeURIComponent(
              selectedMarket
            )}&interval=${encodeURIComponent(
              timeframe
            )}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        const price =
          Number(
            data?.values?.[0]
              ?.close
          );

        if (
          !cancelled &&
          Number.isFinite(price)
        ) {
          setMarketPrice(
            formatPrice(price)
          );
        }
      } catch {
        if (!cancelled) {
          setMarketPrice("--");
        }
      } finally {
        if (!cancelled) {
          setPriceLoading(false);
        }
      }
    }

    void updateForexPrice();

    const timer =
      window.setInterval(
        updateForexPrice,
        5000
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        timer
      );
    };
  }, [
    marketType,
    selectedMarket,
    timeframe,
  ]);

  /* =====================================================
     NEWS
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      try {
        setNewsLoading(true);

        const response =
          await fetch(
            `/api/news?symbol=${encodeURIComponent(
              selectedMarket
            )}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!cancelled) {
          setNews(
            Array.isArray(
              data?.news
            )
              ? data.news
              : []
          );
        }
      } catch {
        if (!cancelled) {
          setNews([]);
        }
      } finally {
        if (!cancelled) {
          setNewsLoading(false);
        }
      }
    }

    void loadNews();

    return () => {
      cancelled = true;
    };
  }, [
    selectedMarket,
  ]);

  /* =====================================================
     TRADINGVIEW CHART
  ===================================================== */

  useEffect(() => {
    const container =
      chartContainerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const script =
      document.createElement(
        "script"
      );

    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

    script.type =
      "text/javascript";

    script.async = true;

    /*
     * Time/date controls stay enabled.
     * Nothing here removes TradingView time.
     */
    script.innerHTML =
      JSON.stringify({
        autosize: true,
        symbol:
          tradingViewSymbol,
        interval:
          tvIntervals[
            timeframe
          ],
        timezone:
          "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        allow_symbol_change:
          false,
        calendar: false,
        hide_top_toolbar:
          false,
        hide_legend:
          false,
        save_image: false,
        support_host:
          "https://www.tradingview.com",
      });

    container.appendChild(
      script
    );

    return () => {
      container.innerHTML = "";
    };
  }, [
    tradingViewSymbol,
    timeframe,
  ]);

  /* =====================================================
     COLORS
  ===================================================== */

  const signalColor =
    signal === "BUY"
      ? "text-emerald-400"
      : signal === "SELL"
        ? "text-rose-400"
        : "text-slate-300";

  const signalBorder =
    signal === "BUY"
      ? "border-emerald-400/70"
      : signal === "SELL"
        ? "border-rose-400/70"
        : "border-blue-400/40";

  const signalGlow =
    signal === "BUY"
      ? "shadow-emerald-500/30"
      : signal === "SELL"
        ? "shadow-rose-500/30"
        : "shadow-blue-500/20";

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-8">
          <h1
            className="
              text-3xl
              font-black
              tracking-tight
              md:text-4xl
              bg-gradient-to-r
              from-cyan-400
              via-blue-500
              to-fuchsia-500
              bg-clip-text
              text-transparent
              animate-pulse
              drop-shadow-[0_0_18px_rgba(59,130,246,0.35)]
            "
          >
            # AI Trading Dashboard By Mr ZeeJxD
          </h1>

          <p className="mt-2 text-slate-400">
            Live Market Analysis • AI Signals •
            Backtesting • Economic News
          </p>
        </header>

        {/* =================================================
            TOP SELECTORS
        ================================================= */}

        <section className="grid gap-4 md:grid-cols-4">

          <StatBox
            title="Market"
            value={
              <select
                value={marketType}
                onChange={(e) =>
                  setMarketType(
                    e.target.value as MarketType
                  )
                }
                className="
                  mt-2
                  w-full
                  cursor-pointer
                  appearance-auto
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-3
                  py-2
                  text-lg
                  font-bold
                  outline-none
                  transition
                  hover:border-blue-500
                  focus:border-blue-500
                "
              >
                <option value="crypto">
                  Crypto
                </option>

                <option value="forex">
                  Forex
                </option>
              </select>
            }
            subtitle={`${markets.length} markets available`}
          />

          <StatBox
            title="Pair"
            value={
              <select
                value={selectedMarket}
                onChange={(e) =>
                  setSelectedMarket(
                    e.target.value
                  )
                }
                className="
                  mt-2
                  w-full
                  cursor-pointer
                  appearance-auto
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-3
                  py-2
                  text-lg
                  font-bold
                  outline-none
                  transition
                  hover:border-blue-500
                  focus:border-blue-500
                "
              >
                {markets.map(
                  (market) => (
                    <option
                      key={market}
                      value={market}
                    >
                      {market}
                    </option>
                  )
                )}
              </select>
            }
            subtitle={
              priceLoading
                ? "Updating live price..."
                : "Live market"
            }
          />

          <StatBox
            title="Timeframe"
            value={
              <select
                value={timeframe}
                onChange={(e) =>
                  setTimeframe(
                    e.target.value as Timeframe
                  )
                }
                className="
                  mt-2
                  w-full
                  cursor-pointer
                  appearance-auto
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-3
                  py-2
                  text-lg
                  font-bold
                  outline-none
                  transition
                  hover:border-blue-500
                  focus:border-blue-500
                "
              >
                {timeframes.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            }
            subtitle="Signal analysis timeframe"
          />

          <StatBox
            title={selectedMarket}
            value={
              <h2 className="mt-2 text-2xl font-bold">
                {marketType ===
                  "crypto" &&
                marketPrice !== "--"
                  ? `$${marketPrice}`
                  : marketPrice}
              </h2>
            }
            subtitle={
              priceLoading
                ? "Updating..."
                : "Live Price"
            }
          />
        </section>

        {/* =================================================
            CHART + AI SIGNAL
        ================================================= */}

        <section className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* =================================================
              MARKET CHART
          ================================================= */}

          <AnimatedCard
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-5
              lg:col-span-2
            "
          >

            {/* ---------------------------------------------
                ANIMATED MARKET HEADER BOX
            --------------------------------------------- */}

            <div
              className="
                relative
                overflow-hidden
                rounded-2xl
                border
                border-blue-500/40
                bg-gradient-to-r
                from-slate-950
                via-blue-950/30
                to-slate-950
                p-4
                shadow-lg
                shadow-blue-950/30
              "
            >

              {/* animated light */}
              <div
                className="
                  pointer-events-none
                  absolute
                  -left-20
                  top-0
                  h-full
                  w-24
                  rotate-12
                  bg-white/10
                  blur-xl
                  animate-[pulse_2.5s_ease-in-out_infinite]
                "
              />

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex min-w-0 items-center gap-3">

                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-wide text-white">
                      Market Chart
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      {selectedMarket} •{" "}
                      {selectedTimeframe.label}
                    </p>
                  </div>

                </div>

                <div className="flex shrink-0 items-center gap-2">

                  {/* CANDLE TIMER */}

                  <div
                    title={`New ${selectedTimeframe.label} candle in ${candleCountdown}`}
                    className="
                      rounded-xl
                      border
                      border-blue-400/40
                      bg-slate-950/90
                      px-3
                      py-2
                      shadow-inner
                      shadow-blue-950/30
                    "
                  >
                    <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
                      Candle
                    </div>

                    <div
                      className="
                        font-mono
                        text-sm
                        font-black
                        tabular-nums
                        text-blue-300
                      "
                    >
                      {candleCountdown}
                    </div>
                  </div>

                  {/* LIVE */}

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-emerald-400/30
                      bg-emerald-950/60
                      px-3
                      py-2
                      text-sm
                      font-bold
                      text-emerald-300
                      shadow-lg
                      shadow-emerald-950/30
                    "
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </span>

                    LIVE
                  </div>

                </div>
              </div>
            </div>

            {/* ---------------------------------------------
                ACTUAL TRADINGVIEW CHART
            --------------------------------------------- */}

            <div className="mt-4 overflow-hidden rounded-xl bg-slate-950">

              <div
                ref={chartContainerRef}
                className="h-[500px] w-full"
              />

              {/* -------------------------------------------
                  BELOW CHART:
                  BTC/USDT • 5 Minutes
              ------------------------------------------- */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-t
                  border-slate-800
                  bg-slate-950
                  px-4
                  py-3
                "
              >

                <div>
                  <div className="text-base font-black text-white">
                    {selectedMarket}
                  </div>

                  <div className="text-xs font-medium text-slate-500">
                    {selectedTimeframe.label}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600">
                    Candle
                  </div>

                  <div className="font-mono text-sm font-bold text-blue-300">
                    {candleCountdown}
                  </div>
                </div>

              </div>

              <div className="flex justify-between px-4 pb-3 pt-1 text-xs text-slate-600">
                <span>
                  TradingView market data
                </span>

                <span>
                  {marketType === "crypto"
                    ? "Crypto • Binance"
                    : "Forex • TradingView FX"}
                </span>
              </div>

            </div>
          </AnimatedCard>

          {/* =================================================
              AI SIGNAL
          ================================================= */}

          <AnimatedCard
            className={`
              rounded-2xl
              border
              ${signalBorder}
              bg-slate-900
              p-5
              shadow-xl
              ${signalGlow}
            `}
          >

            <div className="flex items-center justify-between gap-2">

              <h2 className="text-xl font-semibold">
                AI Signal
              </h2>

              <div className="flex shrink-0 items-center gap-2">

                {/* 5 SECOND GENERATION COUNTDOWN */}

                {isCounting ? (
                  <div
                    className="
                      rounded-xl
                      border
                      border-blue-500/50
                      bg-slate-950
                      px-3
                      py-1.5
                      shadow-lg
                      shadow-blue-950/30
                    "
                  >
                    <span className="mr-2 text-[9px] uppercase tracking-wider text-blue-300">
                      Generate
                    </span>

                    <span className="font-mono text-sm font-black tabular-nums text-blue-300">
                      00:
                      {String(
                        signalCountdown ?? 0
                      ).padStart(2, "0")}
                    </span>
                  </div>
                ) : signalLoading ? (
                  <div
                    className="
                      rounded-xl
                      border
                      border-blue-500/30
                      bg-slate-950
                      px-3
                      py-1.5
                    "
                  >
                    <span className="mr-2 text-[9px] uppercase tracking-wider text-slate-500">
                      Signal
                    </span>

                    <span className="font-mono text-sm font-bold text-blue-300">
                      ...
                    </span>
                  </div>
                ) : signalGenerated &&
                  signalValidityCountdown !==
                    null ? (
                  /* -----------------------------------------
                     SIGNAL VALIDITY TIMER
                  ----------------------------------------- */

                  <div
                    className="
                      rounded-xl
                      border
                      border-emerald-500/40
                      bg-slate-950
                      px-3
                      py-1.5
                      shadow-lg
                      shadow-emerald-950/20
                    "
                  >
                    <span className="mr-2 text-[9px] uppercase tracking-wider text-emerald-300">
                      Valid
                    </span>

                    <span className="font-mono text-sm font-black tabular-nums text-emerald-300">
                      {formatCountdown(
                        signalValidityCountdown
                      )}
                    </span>
                  </div>
                ) : null}

                <span className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs text-slate-300">
                  {selectedMarket}
                </span>

              </div>
            </div>

            {/* ---------------------------------------------
                SIGNAL MAIN BOX
            --------------------------------------------- */}

            <div className="mt-5 rounded-2xl bg-slate-950 p-5">

              <p className="text-center text-sm text-slate-400">
                Current Signal
              </p>

              <div className="flex justify-center py-6">

                <button
                  type="button"
                  onClick={
                    generateSignal
                  }
                  disabled={
                    isCounting ||
                    signalLoading ||
                    (signalGenerated &&
                      signalValidityCountdown !==
                        null)
                  }
                  className={`
                    relative
                    flex
                    h-48
                    w-48
                    flex-col
                    items-center
                    justify-center
                    rounded-full
                    border-4
                    ${signalBorder}
                    bg-slate-900
                    shadow-2xl
                    ${signalGlow}
                    transition-all
                    duration-300
                    hover:scale-105
                    disabled:cursor-not-allowed
                  `}
                >

                  {(isCounting ||
                    signalLoading) && (
                    <span
                      className="
                        absolute
                        inset-1
                        animate-spin
                        rounded-full
                        border-2
                        border-transparent
                        border-t-blue-400
                        border-r-blue-400
                      "
                    />
                  )}

                  {/* 5 4 3 2 1 */}

                  {isCounting ? (
                    <>
                      <span className="text-xs uppercase tracking-[0.3em] text-blue-300">
                        Analyzing
                      </span>

                      <span className="mt-1 text-5xl font-black text-white">
                        {signalCountdown ??
                          0}
                      </span>

                      <span className="text-xs text-slate-500">
                        seconds
                      </span>
                    </>
                  ) : signalLoading ? (
                    <>
                      <span className="text-xs uppercase tracking-[0.25em] text-blue-300">
                        AI
                      </span>

                      <span className="mt-2 animate-pulse text-2xl font-bold">
                        ANALYZING
                      </span>
                    </>
                  ) : signalGenerated &&
                    signal ? (
                    <>
                      <span
                        className={`text-4xl font-black ${signalColor}`}
                      >
                        {signal}
                      </span>

                      <span className="mt-1 text-xl font-bold text-white">
                        {confidence}%
                      </span>

                      <span className="text-xs text-slate-400">
                        confidence
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                        AI
                      </span>

                      <span className="mt-2 text-xl font-bold">
                        GENERATE
                      </span>

                      <span className="text-xs text-slate-500">
                        Signal
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* -------------------------------------------
                  ANALYSIS DATA
              ------------------------------------------- */}

              {signalGenerated &&
                signal &&
                !signalLoading &&
                !isCounting && (
                  <div className="grid grid-cols-2 gap-3">

                    <div className="rounded-xl bg-slate-900 p-3 text-center">
                      <p className="text-xs text-slate-500">
                        Confidence
                      </p>

                      <p
                        className={`mt-1 text-xl font-bold ${signalColor}`}
                      >
                        {confidence}%
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-900 p-3 text-center">
                      <p className="text-xs text-slate-500">
                        RSI
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {rsi}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-900 p-3 text-center">
                      <p className="text-xs text-slate-500">
                        Trend
                      </p>

                      <p className="mt-1 font-semibold">
                        {trend}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-900 p-3 text-center">
                      <p className="text-xs text-slate-500">
                        Momentum
                      </p>

                      <p className="mt-1 font-semibold">
                        {momentum}
                      </p>
                    </div>

                  </div>
                )}

              {/* ERROR */}

              {signalError && (
                <p className="mt-4 rounded-xl bg-rose-950/50 p-3 text-sm text-rose-300">
                  {signalError}
                </p>
              )}

              {/* -------------------------------------------
                  GENERATE BUTTON
              ------------------------------------------- */}

              <button
                type="button"
                onClick={
                  generateSignal
                }
                disabled={
                  isCounting ||
                  signalLoading ||
                  (signalGenerated &&
                    signalValidityCountdown !==
                      null)
                }
                className="
                  mt-5
                  w-full
                  rounded-xl
                  bg-blue-600
                  px-5
                  py-3
                  font-bold
                  transition-all
                  duration-300
                  hover:scale-[1.02]
                  hover:bg-blue-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isCounting
                  ? `Analyzing in ${
                      signalCountdown ??
                      0
                    }...`
                  : signalLoading
                    ? "Analyzing Market..."
                    : signalGenerated &&
                        signalValidityCountdown !==
                          null
                      ? `Signal Active • ${formatCountdown(
                          signalValidityCountdown
                        )}`
                      : "Generate Signal"}
              </button>

            </div>

            {/* =================================================
                BACKTESTING
            ================================================= */}

            <div className="mt-5">

              <div className="mb-3">
                <h3 className="font-semibold">
                  Backtesting
                </h3>

                <p className="text-xs text-slate-500">
                  Updated with the latest analysis data
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">

                {/* WIN RATE - RED */}

                <AnimatedCard className="rounded-xl bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">
                    Win Rate
                  </p>

                  <p className="mt-1 text-xl font-black text-red-500">
                    {signalGenerated
                      ? `${backtest.winRate}%`
                      : "0%"}
                  </p>
                </AnimatedCard>

                <AnimatedCard className="rounded-xl bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">
                    Profit Factor
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {signalGenerated
                      ? backtest.profitFactor
                      : 0}
                  </p>
                </AnimatedCard>

                <AnimatedCard className="rounded-xl bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">
                    Max Drawdown
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {signalGenerated
                      ? `${backtest.maxDrawdown}%`
                      : "0%"}
                  </p>
                </AnimatedCard>

                <AnimatedCard className="rounded-xl bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">
                    Trades
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {signalGenerated
                      ? backtest.trades
                      : 0}
                  </p>
                </AnimatedCard>

              </div>
            </div>

          </AnimatedCard>
        </section>

        {/* =================================================
            NEWS
        ================================================= */}

        <section className="mt-6">

          <AnimatedCard
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-5
            "
          >

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-semibold">
                  Market News
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Economic-calendar style news for{" "}
                  {selectedMarket}
                </p>
              </div>

              {newsLoading && (
                <span className="animate-pulse text-xs text-slate-500">
                  Updating...
                </span>
              )}

            </div>

            <div className="mt-4 overflow-x-auto">

              {news.length === 0 ? (
                <div className="rounded-xl bg-slate-950 p-5 text-sm text-slate-400">
                  No news available right now.
                </div>
              ) : (
                <div className="min-w-[760px] overflow-hidden rounded-xl border border-slate-800">

                  <div className="grid grid-cols-[90px_110px_1fr_160px] bg-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300">

                    <span>
                      Time
                    </span>

                    <span>
                      Impact
                    </span>

                    <span>
                      Event / News
                    </span>

                    <span>
                      Source
                    </span>

                  </div>

                  {news.map(
                    (
                      item,
                      index
                    ) => (
                      <a
                        key={`${item.url}-${index}`}
                        href={
                          item.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="
                          grid
                          grid-cols-[90px_110px_1fr_160px]
                          items-center
                          border-t
                          border-slate-800
                          bg-slate-950
                          px-4
                          py-4
                          transition-colors
                          duration-200
                          hover:bg-slate-900
                        "
                      >

                        <span className="text-xs text-slate-400">
                          {item.publishedAt
                            ? new Date(
                                item.publishedAt
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute:
                                    "2-digit",
                                }
                              )
                            : "—"}
                        </span>

                        <span className="flex gap-1">
                          <i className="h-2 w-2 rounded-full bg-rose-500" />
                          <i className="h-2 w-2 rounded-full bg-amber-400" />
                          <i className="h-2 w-2 rounded-full bg-emerald-500" />
                        </span>

                        <span>
                          <span className="block font-medium">
                            {item.title}
                          </span>

                          {item.description && (
                            <span className="mt-1 block line-clamp-2 text-xs text-slate-500">
                              {
                                item.description
                              }
                            </span>
                          )}
                        </span>

                        <span className="text-xs text-slate-500">
                          {(() => {
                            try {
                              return new URL(
                                item.url
                              ).hostname.replace(
                                "www.",
                                ""
                              );
                            } catch {
                              return "News";
                            }
                          })()}
                        </span>

                      </a>
                    )
                  )}

                </div>
              )}

            </div>
          </AnimatedCard>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="mt-8 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          # AI Trading Dashboard By Mr ZeeJxD •
          Analysis only • No automatic trade execution
        </footer>

      </div>
    </main>
  );
}