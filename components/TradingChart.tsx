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

    // Convert our market format to TradingView symbols
    const getTradingViewSymbol = (symbol: string) => {
      const cleanSymbol = symbol.replace("/", "");

      // Crypto
      if (symbol.includes("/USDT")) {
        return `BINANCE:${cleanSymbol}`;
      }

      // Forex
      const forexMap: Record<string, string> = {
        "EUR/USD": "FXCM:EURUSD",
        "GBP/USD": "FXCM:GBPUSD",
        "USD/JPY": "FXCM:USDJPY",
        "USD/CHF": "FXCM:USDCHF",
        "AUD/USD": "FXCM:AUDUSD",
        "USD/CAD": "FXCM:USDCAD",
        "NZD/USD": "FXCM:NZDUSD",
        "EUR/GBP": "FXCM:EURGBP",
        "EUR/JPY": "FXCM:EURJPY",
        "GBP/JPY": "FXCM:GBPJPY",
        "EUR/CHF": "FXCM:EURCHF",
        "AUD/JPY": "FXCM:AUDJPY",
        "GBP/CHF": "FXCM:GBPCHF",
        "CAD/JPY": "FXCM:CADJPY",
        "CHF/JPY": "FXCM:CHFJPY",
        "NZD/JPY": "FXCM:NZDJPY",
        "EUR/AUD": "FXCM:EURAUD",
        "EUR/CAD": "FXCM:EURCAD",
        "GBP/CAD": "FXCM:GBPCAD",
        "AUD/CAD": "FXCM:AUDCAD",
        "AUD/NZD": "FXCM:AUDNZD",
        "GBP/AUD": "FXCM:GBPAUD",
        "GBP/NZD": "FXCM:GBPNZD",
        "NZD/CAD": "FXCM:NZDCAD",
        "CAD/CHF": "FXCM:CADCHF",
        "AUD/CHF": "FXCM:AUDCHF",
        "NZD/CHF": "FXCM:NZDCHF",
        "EUR/NZD": "FXCM:EURNZD",
        "GBP/SGD": "FXCM:GBPSGD",
        "USD/SGD": "FXCM:USDSGD",
      };

      return forexMap[symbol] || "FXCM:EURUSD";
    };

    const tradingViewSymbol = getTradingViewSymbol(market);

    const iframe = document.createElement("iframe");

    iframe.src =
      `https://www.tradingview.com/widgetembed/?` +
      `frameElementId=tradingview_chart` +
      `&symbol=${encodeURIComponent(tradingViewSymbol)}` +
      `&interval=1` +
      `&hidesidetoolbar=0` +
      `&symboledit=1` +
      `&saveimage=1` +
      `&toolbarbg=%23020617` +
      `&studies=Volume@tv-basicstudies` +
      `&theme=dark` +
      `&style=1` +
      `&timezone=Etc%2FUTC` +
      `&withdateranges=1` +
      `&hideideas=1` +
      `&hidelegend=0` +
      `&hidevolume=0` +
      `&allow_symbol_change=1` +
      `&locale=en`;

    iframe.id = "tradingview_chart";

    iframe.style.width = "100%";
    iframe.style.height = "520px";
    iframe.style.border = "0";
    iframe.style.display = "block";

    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("frameborder", "0");

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