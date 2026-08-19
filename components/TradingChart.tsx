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

    // Remove previous chart
    container.innerHTML = "";

    /**
     * Convert application market symbol
     * into a valid TradingView symbol.
     *
     * Examples:
     *
     * BTC/USDT  -> BINANCE:BTCUSDT
     * BTCUSDT   -> BINANCE:BTCUSDT
     * ETH/USDT  -> BINANCE:ETHUSDT
     * EUR/USD   -> FX:EURUSD
     * EURUSD    -> FX:EURUSD
     */
    const getTradingViewSymbol = (value: string): string => {
      const original = String(value || "").trim().toUpperCase();

      // Remove spaces
      const symbol = original.replace(/\s+/g, "");

      console.log("Application market:", original);

      // =====================================================
      // CRYPTO
      // =====================================================

      // BTC/USDT
      // ETH/USDT
      // SOL/USDT
      if (symbol.includes("/USDT")) {
        const cryptoSymbol = symbol.replace("/", "");

        console.log(
          "TradingView crypto symbol:",
          `BINANCE:${cryptoSymbol}`
        );

        return `BINANCE:${cryptoSymbol}`;
      }

      // BTCUSDT
      // ETHUSDT
      // SOLUSDT
      //
      // This handles symbols WITHOUT "/"
      if (symbol.endsWith("USDT") && symbol.length > 4) {
        console.log(
          "TradingView crypto symbol:",
          `BINANCE:${symbol}`
        );

        return `BINANCE:${symbol}`;
      }

      // =====================================================
      // FOREX
      // =====================================================

      const forexMap: Record<string, string> = {
        "EUR/USD": "FX:EURUSD",
        EURUSD: "FX:EURUSD",

        "GBP/USD": "FX:GBPUSD",
        GBPUSD: "FX:GBPUSD",

        "USD/JPY": "FX:USDJPY",
        USDJPY: "FX:USDJPY",

        "USD/CHF": "FX:USDCHF",
        USDCHF: "FX:USDCHF",

        "AUD/USD": "FX:AUDUSD",
        AUDUSD: "FX:AUDUSD",

        "USD/CAD": "FX:USDCAD",
        USDCAD: "FX:USDCAD",

        "NZD/USD": "FX:NZDUSD",
        NZDUSD: "FX:NZDUSD",

        "EUR/GBP": "FX:EURGBP",
        EURGBP: "FX:EURGBP",

        "EUR/JPY": "FX:EURJPY",
        EURJPY: "FX:EURJPY",

        "GBP/JPY": "FX:GBPJPY",
        GBPJPY: "FX:GBPJPY",

        "EUR/CHF": "FX:EURCHF",
        EURCHF: "FX:EURCHF",

        "AUD/JPY": "FX:AUDJPY",
        AUDJPY: "FX:AUDJPY",

        "GBP/CHF": "FX:GBPCHF",
        GBPCHF: "FX:GBPCHF",

        "CAD/JPY": "FX:CADJPY",
        CADJPY: "FX:CADJPY",

        "CHF/JPY": "FX:CHFJPY",
        CHFJPY: "FX:CHFJPY",

        "NZD/JPY": "FX:NZDJPY",
        NZDJPY: "FX:NZDJPY",

        "EUR/AUD": "FX:EURAUD",
        EURAUD: "FX:EURAUD",

        "EUR/CAD": "FX:EURCAD",
        EURCAD: "FX:EURCAD",

        "EUR/NZD": "FX:EURNZD",
        EURNZD: "FX:EURNZD",

        "GBP/CAD": "FX:GBPCAD",
        GBPCAD: "FX:GBPCAD",

        "GBP/AUD": "FX:GBPAUD",
        GBPAUD: "FX:GBPAUD",

        "GBP/NZD": "FX:GBPNZD",
        GBPNZD: "FX:GBPNZD",

        "GBP/SGD": "FX:GBPSGD",
        GBPSGD: "FX:GBPSGD",

        "AUD/CAD": "FX:AUDCAD",
        AUDCAD: "FX:AUDCAD",

        "AUD/NZD": "FX:AUDNZD",
        AUDNZD: "FX:AUDNZD",

        "AUD/CHF": "FX:AUDCHF",
        AUDCHF: "FX:AUDCHF",

        "NZD/CAD": "FX:NZDCAD",
        NZDCAD: "FX:NZDCAD",

        "NZD/CHF": "FX:NZDCHF",
        NZDCHF: "FX:NZDCHF",

        "CAD/CHF": "FX:CADCHF",
        CADCHF: "FX:CADCHF",

        "USD/SGD": "FX:USDSGD",
        USDSGD: "FX:USDSGD",
      };

      // Check exact Forex symbol
      if (forexMap[original]) {
        console.log(
          "TradingView Forex symbol:",
          forexMap[original]
        );

        return forexMap[original];
      }

      // Check normalized Forex symbol
      if (forexMap[symbol]) {
        console.log(
          "TradingView Forex symbol:",
          forexMap[symbol]
        );

        return forexMap[symbol];
      }

      // =====================================================
      // SAFETY CHECK
      // =====================================================

      console.warn(
        "Unknown market symbol:",
        original,
        "Using EURUSD fallback."
      );

      return "FX:EURUSD";
    };

    const tradingViewSymbol = getTradingViewSymbol(market);

    console.log(
      "FINAL TradingView symbol:",
      tradingViewSymbol
    );

    // =====================================================
    // TRADINGVIEW IFRAME
    // =====================================================

    const iframe = document.createElement("iframe");

    const params = new URLSearchParams();

    params.set("frameElementId", "tradingview_chart");
    params.set("symbol", tradingViewSymbol);
    params.set("interval", "5");
    params.set("hidesidetoolbar", "0");
    params.set("symboledit", "1");
    params.set("saveimage", "1");
    params.set("toolbarbg", "#020617");
    params.set("theme", "dark");
    params.set("style", "1");
    params.set("timezone", "Etc/UTC");
    params.set("withdateranges", "1");
    params.set("hideideas", "1");
    params.set("hidelegend", "0");
    params.set("allow_symbol_change", "1");
    params.set("locale", "en");

    iframe.src =
      `https://www.tradingview.com/widgetembed/?${params.toString()}`;

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

    // Cleanup
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
          width: "100%",
          height: "520px",
        }}
      />
    </div>
  );
}