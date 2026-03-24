"use client";

import React from "react";
import { OHLC } from "@/lib/market-data";

interface ReplayCandlestickChartProps {
  data: OHLC[];
}

const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 520;
const PADDING = { top: 18, right: 18, bottom: 30, left: 52 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export const ReplayCandlestickChart: React.FC<ReplayCandlestickChartProps> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-headline text-xs tracking-[0.25em]">
        NO REPLAY DATA
      </div>
    );
  }

  const innerWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom;
  const minPrice = Math.min(...data.map((bar) => bar.low));
  const maxPrice = Math.max(...data.map((bar) => bar.high));
  const range = Math.max(1, maxPrice - minPrice);
  const paddedMin = minPrice - range * 0.05;
  const paddedMax = maxPrice + range * 0.05;
  const paddedRange = paddedMax - paddedMin;
  const stepX = innerWidth / Math.max(data.length, 1);
  const candleWidth = clamp(stepX * 0.58, 6, 18);
  const latestIndex = data.length - 1;

  const priceToY = (price: number) =>
    PADDING.top + ((paddedMax - price) / paddedRange) * innerHeight;

  const closePath = data
    .map((bar, index) => {
      const x = PADDING.left + index * stepX + stepX / 2;
      const y = priceToY(bar.close);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const latestBar = data[latestIndex];
  const latestX = PADDING.left + latestIndex * stepX + stepX / 2;
  const latestY = priceToY(latestBar.close);
  const priceTicks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    const price = paddedMax - paddedRange * ratio;
    const y = PADDING.top + innerHeight * ratio;
    return { price, y };
  });

  const dateLabels = [
    data[0],
    data[Math.floor(latestIndex / 2)],
    data[latestIndex],
  ].filter(Boolean);

  return (
    <div className="w-full h-full rounded-[1.25rem] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(42,90,159,0.18),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="w-full h-full"
        role="img"
        aria-label="Replay candlestick chart"
      >
        <defs>
          <linearGradient id="replay-grid-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(42,90,159,0.22)" />
            <stop offset="100%" stopColor="rgba(42,90,159,0.02)" />
          </linearGradient>
        </defs>

        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={innerWidth}
          height={innerHeight}
          rx="20"
          fill="rgba(255,255,255,0.01)"
          stroke="rgba(255,255,255,0.08)"
        />

        {priceTicks.map((tick, index) => (
          <g key={index}>
            <line
              x1={PADDING.left}
              y1={tick.y}
              x2={VIEWBOX_WIDTH - PADDING.right}
              y2={tick.y}
              stroke="rgba(255,255,255,0.07)"
              strokeDasharray="4 8"
            />
            <text
              x={PADDING.left - 10}
              y={tick.y + 5}
              fill="rgba(255,255,255,0.55)"
              fontSize="13"
              textAnchor="end"
            >
              ${Math.round(tick.price).toLocaleString()}
            </text>
          </g>
        ))}

        {data.map((bar, index) => {
          const x = PADDING.left + index * stepX + stepX / 2;
          const openY = priceToY(bar.open);
          const closeY = priceToY(bar.close);
          const highY = priceToY(bar.high);
          const lowY = priceToY(bar.low);
          const isBullish = bar.close >= bar.open;
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(Math.abs(closeY - openY), 3);
          const candleColor = isBullish ? "#39ff14" : "#ff7a00";

          return (
            <g key={`${bar.timestamp}-${index}`}>
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={candleColor}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.95}
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                rx="2"
                fill={isBullish ? "rgba(57,255,20,0.78)" : "rgba(255,122,0,0.74)"}
                stroke={candleColor}
                strokeWidth={1}
              />
            </g>
          );
        })}

        <path
          d={closePath}
          fill="none"
          stroke="rgba(42,90,159,0.55)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <line
          x1={latestX}
          y1={PADDING.top}
          x2={latestX}
          y2={PADDING.top + innerHeight}
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="6 8"
        />
        <circle cx={latestX} cy={latestY} r={6} fill="#ffffff" fillOpacity="0.95" />
        <circle cx={latestX} cy={latestY} r={12} fill="rgba(255,255,255,0.12)" />

        <rect
          x={Math.min(latestX + 14, VIEWBOX_WIDTH - 190)}
          y={Math.max(latestY - 18, PADDING.top + 8)}
          width="148"
          height="36"
          rx="18"
          fill="rgba(9,10,12,0.88)"
          stroke="rgba(255,255,255,0.1)"
        />
        <text
          x={Math.min(latestX + 88, VIEWBOX_WIDTH - 108)}
          y={Math.max(latestY + 5, PADDING.top + 30)}
          fill="#39ff14"
          fontSize="15"
          textAnchor="middle"
        >
          Current ${Math.round(latestBar.close).toLocaleString()}
        </text>

        {dateLabels.map((bar, index) => {
          const positionIndex =
            index === 0 ? 0 : index === 1 ? Math.floor(latestIndex / 2) : latestIndex;
          const x = PADDING.left + positionIndex * stepX + stepX / 2;
          const label = new Date(bar.timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

          return (
            <text
              key={`${bar.timestamp}-${index}-label`}
              x={x}
              y={VIEWBOX_HEIGHT - 12}
              fill="rgba(255,255,255,0.55)"
              fontSize="14"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
