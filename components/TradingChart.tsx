"use client";

import { useEffect, useRef } from "react";

type TradingChartProps = {
  market: string;
};

export default function TradingChart({ market }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // Clear old chart
    container.innerHTML = "";

    // Convert application symbol to a valid TradingView symbol
    const getTradingViewSymbol = (symbol: string): string => {
      const cleanSymbol = symbol
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

      // ==========================================
      // CRYPTO
      // Example:
      // BTC/USDT -> BINANCE:BTCUSDT
      // ETH/USDT -> BINANCE:ETHUSDT
      // SOL/USDT -> BINANCE:SOLUSDT
      // ==========================================
      if (cleanSymbol.endsWith("/USDT")) {
        const cryptoSymbol = cleanSymbol.replace("/", "");

        return `BINANCE:${cryptoSymbol}`;
      }

      // ==========================================
      // FOREX
      // Example:
      // EUR/USD -> FX:EURUSD
      // GBP/USD -> FX:GBPUSD
      // USD/JPY -> FX:USDJPY
      // ==========================================
      const forexMap: Record<string, string> = {
        "EUR/USD": "FX:EURUSD",
        "GBP/USD": "FX:GBPUSD",
        "USD/JPY": "FX:USDJPY",
        "USD/CHF": "FX:USDCHF",
        "AUD/USD": "FX:AUDUSD",
        "USD/CAD": "FX:USDCAD",
        "NZD/USD": "FX:NZDUSD",

        "EUR/GBP": "FX:EURGBP",
        "EUR/JPY": "FX:EURJPY",
        "GBP/JPY": "FX:GBPJPY",
        "EUR/CHF": "FX:EURCHF",

        "AUD/JPY": "FX:AUDJPY",
        "GBP/CHF": "FX:GBPCHF",
        "CAD/JPY": "FX:CADJPY",
        "CHF/JPY": "FX:CHFJPY",
        "NZD/JPY": "FX:NZDJPY",

        "EUR/AUD": "FX:EURAUD",
        "EUR/CAD": "FX:EURCAD",
        "EUR/NZD": "FX:EURNZD",

        "GBP/CAD": "FX:GBPCAD",
        "GBP/AUD": "FX:GBPAUD",
        "GBP/NZD": "FX:GBPNZD",
        "GBP/SGD": "FX:GBPSGD",

        "AUD/CAD": "FX:AUDCAD",
        "AUD/NZD": "FX:AUDNZD",
        "AUD/CHF": "FX:AUDCHF",

        "NZD/CAD": "FX:NZDCAD",
        "NZD/CHF": "FX:NZDCHF",

        "CAD/CHF": "FX:CADCHF",

        "USD/SGD": "FX:USDSGD",
      };

      if (forexMap[symbol]) {
        return forexMap[symbol];
      }

      // ==========================================
      // FALLBACK
      // ==========================================
      return "FX:EURUSD";
    };

    const tradingViewSymbol = getTradingViewSymbol(market);

    console.log("TradingView symbol:", tradingViewSymbol);

    // Create TradingView iframe
    const iframe = document.createElement("iframe");

    const params = new URLSearchParams({
      frameElementId: "tradingview_chart",
      symbol: tradingViewSymbol,
      interval: "5",
      hidesidetoolbar: "0",
      symboledit: "1",
      saveimage: "1",
      toolbarbg: "#020617",
      theme: "dark",
      style: "1",
      timezone: "Etc/UTC",
      withdateranges: "1",
      hideideas: "1",
      hidelegend: "0",
      allow_symbol_change: "1",
      locale: "en",
    });

    iframe.src = `https://www.tradingview.com/widgetembed/?${params.toString()}`;

    iframe.id = "tradingview_chart";

    iframe.style.width = "100%";
    iframe.style.height = "520px";
    iframe.style.border = "0";
    iframe.style.display = "block";

    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    );

    container.appendChild(iframe);

    return () => {
      container.innerHTML = "";
    };
  }, [market]);

  return (
    <div className="w-full overflow-hidden rounded-xl">
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-xl"
        style={{
          height: "520px",
        }}
      />
    </div>
  );
}