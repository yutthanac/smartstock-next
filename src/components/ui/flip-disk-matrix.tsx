"use client";

import React, { useCallback, useEffect, useState, memo } from "react";

// Minimal 5x7 Font Definition
function glyphBitmap(ch: string, cols: number, rows: number): boolean[][] {
  const glyphs: Record<string, number[]> = {
    "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
    "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
    "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
    "3": [0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110],
    "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
    "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
    "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
    "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
    "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
    "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
    ":": [0b00000, 0b00100, 0b00000, 0b00000, 0b00000, 0b00100, 0b00000],
    " ": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
    "A": [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
    "B": [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
    "C": [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
    "D": [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
    "E": [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
    "F": [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
    "G": [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
    "H": [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
    "I": [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
    "J": [0b00011, 0b00001, 0b00001, 0b00001, 0b10001, 0b10001, 0b01110],
    "K": [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
    "L": [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
    "M": [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001],
    "N": [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
    "O": [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
    "P": [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
    "Q": [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b01110, 0b00001],
    "R": [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
    "S": [0b01110, 0b10001, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110],
    "T": [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
    "U": [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
    "V": [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
    "W": [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
    "X": [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
    "Y": [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
    "Z": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  };

  const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
  const chars = ch.toUpperCase().split("");
  const gw = 5;
  const gh = 7;
  const totalW = chars.length * (gw + 1) - 1;

  let ox = Math.max(0, Math.floor((cols - totalW) / 2));
  const oy = Math.max(0, Math.floor((rows - gh) / 2));

  for (const c of chars) {
    const rowsBits = glyphs[c] || glyphs[" "];
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        if (oy + y < rows && ox + x < cols) {
          grid[oy + y][ox + x] = !!(rowsBits[y] & (1 << (gw - 1 - x)));
        }
      }
    }
    ox += gw + 1;
  }
  return grid;
}

// Memoized Disk component - Strict Black & White / Monochrome Palette
const Disk = memo(({ on, theme = "dark" }: { on: boolean; theme?: "dark" | "light" }) => {
  return (
    <div
      className="relative w-full aspect-square select-none cursor-default"
      style={{ perspective: "400px" }}
    >
      <div
        className="absolute inset-0 w-full h-full transition-transform duration-[550ms] hover:duration-100 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-x-[90deg]"
        style={{
          transformStyle: "preserve-3d",
          transform: on ? "rotateX(180deg)" : "rotateX(0deg)",
        }}
      >
        {/* Inactive Face */}
        <div
          className={`absolute inset-0 rounded-full ${
            theme === "dark"
              ? "bg-[#1f1f1e] border border-stone-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
              : "bg-stone-200 border border-stone-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]"
          }`}
          style={{ backfaceVisibility: "hidden" }}
        />
        {/* Active Face (Flipped) */}
        <div
          className={`absolute inset-0 rounded-full ${
            theme === "dark"
              ? "bg-white border border-stone-200 shadow-[0_0_6px_rgba(255,255,255,0.45),_inset_0_-1px_2px_rgba(0,0,0,0.25)]"
              : "bg-stone-900 border border-stone-950 shadow-[0_1px_3px_rgba(0,0,0,0.35),_inset_0_-1px_2px_rgba(255,255,255,0.15)]"
          }`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateX(180deg)",
          }}
        />
      </div>
    </div>
  );
});
Disk.displayName = "Disk";

export interface FlipDiskMatrixProps {
  className?: string;
  theme?: "dark" | "light";
  compact?: boolean;
  showControls?: boolean;
  showSeconds?: boolean;
  initialMode?: "time" | "wave" | "text" | "noise";
}

export function FlipDiskMatrix({
  className = "",
  theme = "dark",
  compact = false,
  showControls = true,
  showSeconds = true,
  initialMode = "time",
}: FlipDiskMatrixProps) {
  // 49 columns accommodate "HH:MM:SS" (8 characters * 6 - 1 = 47 dots wide + 2 dots margin)
  const cols = showSeconds ? 49 : 31;
  const rows = 11;

  const [mode, setMode] = useState<"time" | "wave" | "text" | "noise">(initialMode);
  const [text, setText] = useState<string>("SMART");
  const [mounted, setMounted] = useState(false);

  const [bits, setBits] = useState<boolean[][]>(() =>
    Array.from({ length: rows }, () => Array(cols).fill(false))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const computeTarget = useCallback(
    (t: number): boolean[][] => {
      if (mode === "text" || mode === "time") {
        let display = text;
        if (mode === "time") {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, "0");
          const mm = String(now.getMinutes()).padStart(2, "0");
          const ss = String(now.getSeconds()).padStart(2, "0");
          display = showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
        }
        return glyphBitmap(display, cols, rows);
      }
      if (mode === "wave") {
        return Array.from({ length: rows }, (_, y) =>
          Array.from({ length: cols }, (_, x) => {
            const v = Math.sin(x * 0.2 + t * 3) * Math.cos(y * 0.3 + t * 2);
            return v > 0.2;
          })
        );
      }
      // Noise mode
      return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => Math.random() > 0.6)
      );
    },
    [mode, text, cols, rows, showSeconds]
  );

  useEffect(() => {
    if (!mounted) return;

    let raf = 0;
    let last = 0;

    const getInterval = () => {
      if (mode === "wave") return 150;
      if (mode === "noise") return 250;
      // In time mode, update every 250ms to ensure seconds switch immediately without delay
      return 250;
    };

    const loop = (now: number) => {
      if (now - last > getInterval()) {
        last = now;
        const t = now / 1000;
        const next = computeTarget(t);

        setBits((prev) => {
          let changed = false;
          const newBits = prev.map((row, y) =>
            row.map((cell, x) => {
              if (cell !== next[y]?.[x]) changed = true;
              return next[y]?.[x] ?? false;
            })
          );
          return changed ? newBits : prev;
        });
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [computeTarget, mode, mounted]);

  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">(theme);
  const isDark = currentTheme === "dark";

  return (
    <div className={`flex flex-col items-center gap-3 w-full ${className}`}>
      {/* Mode Controls and Header Info */}
      {showControls && (
        <div className="flex items-center justify-between w-full px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-900"></span>
            </span>
            <span className="text-[11px] font-mono tracking-wider text-stone-500 uppercase">
              LIVE MATRIX • BKK (UTC+7)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 p-0.5 rounded-lg border text-[10px] font-mono ${
                isDark
                  ? "bg-stone-900 border-stone-800"
                  : "bg-stone-100 border-stone-200"
              }`}
            >
              {(["time", "text", "wave", "noise"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-2 py-0.5 uppercase rounded-md transition-all cursor-pointer ${
                    mode === m
                      ? isDark
                        ? "bg-stone-100 text-stone-900 font-semibold shadow-xs"
                        : "bg-stone-900 text-white font-semibold shadow-xs"
                      : isDark
                      ? "text-stone-400 hover:text-white"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentTheme((t) => (t === "dark" ? "light" : "dark"))}
              title={isDark ? "สลับเป็นธีมสว่าง (White)" : "สลับเป็นธีมมืด (Dark)"}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono transition-all cursor-pointer ${
                isDark
                  ? "bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800"
                  : "bg-stone-100 border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-200/70"
              }`}
            >
              {isDark ? "WHITE" : "DARK"}
            </button>
          </div>
        </div>
      )}


      {/* Dynamic Text Input Box (Only when 'text' mode is selected) */}
      {mode === "text" && (
        <div className="flex flex-col items-center gap-1 w-full animate-fadeIn">
          <input
            type="text"
            value={text}
            maxLength={showSeconds ? 8 : 4}
            onChange={(e) => {
              const filtered = e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9: ]/g, "");
              setText(filtered);
            }}
            placeholder={showSeconds ? "TYPE (MAX 8)" : "TYPE (MAX 4)"}
            className={`px-3 py-1.5 text-xs font-mono uppercase border rounded-xl text-center tracking-[0.25em] shadow-2xs focus:outline-none focus:ring-2 focus:ring-stone-900 ${
              isDark
                ? "bg-stone-900 border-stone-700 text-stone-100"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          />
          <span className="text-[9px] font-mono text-stone-400 tracking-wider">
            A-Z, 0-9, COLON & SPACE (MAX {showSeconds ? "8" : "4"})
          </span>
        </div>
      )}

      {/* Main Matrix Housing */}
      <div
        className={`relative w-full rounded-2xl border transition-all ${
          compact ? "p-2 sm:p-3" : "p-3 sm:p-4"
        } ${
          isDark
            ? "bg-[#121212] border-stone-800 shadow-[inset_0_2px_8px_rgba(0,0,0,0.7),_0_8px_20px_rgba(0,0,0,0.35)]"
            : "bg-white border-stone-200/90 shadow-xs"
        }`}
      >
        {/* Inner Bezel */}
        <div
          className={`relative rounded-xl overflow-hidden ${
            compact ? "p-2" : "p-2.5 sm:p-3.5"
          } ${
            isDark
              ? "bg-[#0a0a0a] shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)]"
              : "bg-stone-50 border border-stone-200/60 shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)]"
          }`}
        >
          <div
            className="grid w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gap: compact ? "min(0.25vw, 1.8px)" : "min(0.35vw, 2.5px)",
            }}
          >
            {bits.map((row, y) =>
              row.map((on, x) => (
                <Disk
                  key={`${x}-${y}`}
                  on={mounted ? on : false}
                  theme={currentTheme}
                />

              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlipDiskMatrix;
