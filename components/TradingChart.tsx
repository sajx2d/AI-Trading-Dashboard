"use client";

import { useEffect, useRef } from "react";

type TradingChartProps = {
  market: string;
};

export default function TradingChart({
  market,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Remove previous TradingView widget
    container.innerHTML = "";

    // Convert dashboard market symbols to TradingView symbols
    const getTradingViewSymbol = (value: string): string => {
      const symbol = (value || "").trim().toUpperCase();

      // ----------------------------------------
      // FOREX
      // ----------------------------------------
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

        "GBP/CAD": "FX:GBPCAD",
        GBPCAD: "FX:GBPCAD",

        "AUD/CAD": "FX:AUDCAD",
        AUDCAD: "FX:AUDCAD",

        "AUD/NZD": "FX:AUDNZD",
        AUDNZD: "FX:AUDNZD",

        "GBP/AUD": "FX:GBPAUD",
        GBPAUD: "FX:GBPAUD",

        "GBP/NZD": "FX:GBPNZD",
        GBPNZD: "FX:GBPNZD",

        "NZD/CAD": "FX:NZDCAD",
        NZDCAD: "FX:NZDCAD",

        "CAD/CHF": "FX:CADCHF",
        CADCHF: "FX:CADCHF",

        "AUD/CHF": "FX:AUDCHF",
        AUDCHF: "FX:AUDCHF",

        "NZD/CHF": "FX:NZDCHF",
        NZDCHF: "FX:NZDCHF",

        "EUR/NZD": "FX:EURNZD",
        EURNZD: "FX:EURNZD",

        "GBP/SGD": "FX:GBPSGD",
        GBPSGD: "FX:GBPSGD",

        "USD/SGD": "FX:USDSGD",
        USDSGD: "FX:USDSGD",

        "USD/HKD": "FX:USDHKD",
        USDHKD: "FX:USDHKD",

        "USD/MXN": "FX:USDMXN",
        USDMXN: "FX:USDMXN",

        "USD/ZAR": "FX:USDZAR",
        USDZAR: "FX:USDZAR",

        "USD/TRY": "FX:USDTRY",
        USDTRY: "FX:USDTRY",

        "USD/NOK": "FX:USDNOK",
        USDNOK: "FX:USDNOK",

        "USD/SEK": "FX:USDSEK",
        USDSEK: "FX:USDSEK",

        "USD/DKK": "FX:USDDKK",
        USDDKK: "FX:USDDKK",

        "EUR/NOK": "FX:EURNOK",
        EURNOK: "FX:EURNOK",

        "EUR/SEK": "FX:EURSEK",
        EURSEK: "FX:EURSEK",

        "EUR/PLN": "FX:EURPLN",
        EURPLN: "FX:EURPLN",

        "EUR/TRY": "FX:EURTRY",
        EURTRY: "FX:EURTRY",
      };

      // Exact Forex match
      if (forexMap[symbol]) {
        return forexMap[symbol];
      }

      // ----------------------------------------
      // CRYPTO
      // ----------------------------------------
      if (
        symbol.includes("/USDT") ||
        symbol.endsWith("USDT") ||
        symbol.includes("/USDC") ||
        symbol.endsWith("USDC")
      ) {
        const cleanCryptoSymbol = symbol
          .replace("/", "")
          .replace("-", "");

        return `BINANCE:${cleanCryptoSymbol}`;
      }

      if (symbol.includes("/BTC") || symbol.endsWith("BTC")) {
        const cleanCryptoSymbol = symbol
          .replace("/", "")
          .replace("-", "");

        return `BINANCE:${cleanCryptoSymbol}`;
      }

      // ----------------------------------------
      // FALLBACK
      // ----------------------------------------
      // Never use UNIUSDT as the default.
      // If the selected market is not found,
      // show EUR/USD instead.
      return "FX:EURUSD";
    };

    const tradingViewSymbol = getTradingViewSymbol(market);

    console.log(
      "TradingView symbol:",
      market,
      "=>",
      tradingViewSymbol
    );

    // ----------------------------------------
    // CREATE TRADINGVIEW IFRAME
    // ----------------------------------------
    const iframe = document.createElement("iframe");

    const params = new URLSearchParams({
      frameElementId: "tradingview_chart",
      symbol: tradingViewSymbol,
      interval: "5",
      hidesidetoolbar: "0",
      symboledit: "1",
      saveimage: "1",
      toolbarbg: "#020617",
      studies: "Volume@tv-basicstudies",
      theme: "dark",
      style: "1",
      timezone: "Etc/UTC",
      withdateranges: "1",
      hideideas: "1",
      hidelegend: "0",
      hidevolume: "0",
      allow_symbol_change: "1",
      locale: "en",
    });

    iframe.src =
      `https://www.tradingview.com/widgetembed/?${params.toString()}`;

    iframe.id = "tradingview_chart";

    iframe.style.width = "100%";
    iframe.style.height = "520px";
    iframe.style.border = "0";
    iframe.style.display = "block";

    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "true");

    container.appendChild(iframe);

    // ----------------------------------------
    // CLEANUP
    // ----------------------------------------
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