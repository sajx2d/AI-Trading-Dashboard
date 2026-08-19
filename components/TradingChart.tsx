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

    // Remove previous chart
    container.innerHTML = "";

    /*
     * Convert dashboard symbols to REAL TradingView symbols.
     *
     * TradingView format:
     * EXCHANGE:SYMBOL
     */

    const forexMap: Record<string, string> = {
      "EUR/USD": "OANDA:EURUSD",
      "GBP/USD": "OANDA:GBPUSD",
      "USD/JPY": "OANDA:USDJPY",
      "USD/CHF": "OANDA:USDCHF",
      "AUD/USD": "OANDA:AUDUSD",
      "USD/CAD": "OANDA:USDCAD",
      "NZD/USD": "OANDA:NZDUSD",

      "EUR/GBP": "OANDA:EURGBP",
      "EUR/JPY": "OANDA:EURJPY",
      "GBP/JPY": "OANDA:GBPJPY",
      "EUR/CHF": "OANDA:EURCHF",
      "AUD/JPY": "OANDA:AUDJPY",
      "GBP/CHF": "OANDA:GBPCHF",
      "CAD/JPY": "OANDA:CADJPY",
      "CHF/JPY": "OANDA:CHFJPY",
      "NZD/JPY": "OANDA:NZDJPY",

      "EUR/AUD": "OANDA:EURAUD",
      "EUR/CAD": "OANDA:EURCAD",
      "GBP/CAD": "OANDA:GBPCAD",
      "AUD/CAD": "OANDA:AUDCAD",
      "AUD/NZD": "OANDA:AUDNZD",
      "GBP/AUD": "OANDA:GBPAUD",
      "GBP/NZD": "OANDA:GBPNZD",
      "NZD/CAD": "OANDA:NZDCAD",
      "CAD/CHF": "OANDA:CADCHF",
      "AUD/CHF": "OANDA:AUDCHF",
      "NZD/CHF": "OANDA:NZDCHF",
      "EUR/NZD": "OANDA:EURNZD",

      "GBP/SGD": "OANDA:GBPSGD",
      "USD/SGD": "OANDA:USDSGD",
    };

    /*
     * Crypto mapping.
     *
     * BTC/USDT
     * ETH/USDT
     * etc.
     *
     * TradingView Binance symbols use:
     * BINANCE:BTCUSDT
     * BINANCE:ETHUSDT
     */

    const getTradingViewSymbol = (symbol: string): string => {
      const cleanSymbol = symbol
        .trim()
        .toUpperCase();

      // Forex
      if (forexMap[cleanSymbol]) {
        return forexMap[cleanSymbol];
      }

      // Crypto
      if (cleanSymbol.includes("/USDT")) {
        const cryptoSymbol = cleanSymbol.replace("/", "");

        return `BINANCE:${cryptoSymbol}`;
      }

      // Other common crypto pairs
      if (cleanSymbol.includes("/USD")) {
        const cryptoSymbol = cleanSymbol.replace("/", "");

        return `COINBASE:${cryptoSymbol}`;
      }

      // Fallback
      return "OANDA:EURUSD";
    };

    const tradingViewSymbol =
      getTradingViewSymbol(market);

    /*
     * IMPORTANT:
     *
     * We use tvwidgetsymbol instead of symbol.
     *
     * TradingView officially supports tvwidgetsymbol
     * for Advanced Chart widgets.
     */

    const iframe = document.createElement("iframe");

    const params = new URLSearchParams({
      frameElementId: "tradingview_chart",

      // IMPORTANT FIX
      tvwidgetsymbol: tradingViewSymbol,

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

    iframe.setAttribute(
      "allowtransparency",
      "true"
    );

    iframe.setAttribute(
      "frameborder",
      "0"
    );

    iframe.setAttribute(
      "scrolling",
      "no"
    );

    container.appendChild(iframe);

    /*
     * Cleanup when market changes.
     */

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