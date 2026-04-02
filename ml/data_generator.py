from pathlib import Path
import argparse
import contextlib
import io
import time

import matplotlib.pyplot as plt
import mplfinance as mpf
import pandas as pd
import yfinance as yf


STOCK_SYMBOLS = [
    "TCS",
    "RELIANCE",
    "INFY",
    "HDFCBANK",
    "ICICIBANK",
    "SBIN",
    "TATAMOTORS",
    "LT",
    "ITC",
    "BHARTIARTL",
]
TICKER = "^NSEI"
PERIOD = "2y"
INTERVAL = "1d"
WINDOW_SIZE = 10
IMAGE_SIZE = 224
OUTPUT_DIR = Path(__file__).resolve().parent / "dataset" / "images"
OHLC_DIR = Path(__file__).resolve().parent / "dataset" / "ohlc"
MANIFEST_PATH = Path(__file__).resolve().parent / "dataset" / "windows_manifest.csv"
MIN_IMAGE_COUNT = 300
MAX_WINDOWS_PER_STOCK = 250
YF_CACHE_DIR = Path(__file__).resolve().parent / ".yf_cache"
RETRY_ATTEMPTS = 3
PERIOD_CANDIDATES = [PERIOD, "1y", "6mo"]


def configure_yfinance_cache() -> None:
    YF_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if hasattr(yf, "set_tz_cache_location"):
        yf.set_tz_cache_location(str(YF_CACHE_DIR))


def normalize_symbol(symbol: str) -> str:
    cleaned = symbol.strip().upper()
    if not cleaned:
        raise ValueError("Stock symbol cannot be empty.")
    if cleaned.startswith("^") or "." in cleaned:
        return cleaned
    return f"{cleaned}.NS"


def download_stock_data(symbol: str) -> pd.DataFrame:
    yahoo_symbol = normalize_symbol(symbol)
    configure_yfinance_cache()
    periods_to_try: list[str] = []
    for period in PERIOD_CANDIDATES:
        if period not in periods_to_try:
            periods_to_try.append(period)

    best_ohlc: pd.DataFrame | None = None
    for period in periods_to_try:
        for attempt in range(1, RETRY_ATTEMPTS + 1):
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                data = yf.download(
                    yahoo_symbol,
                    period=period,
                    interval=INTERVAL,
                    auto_adjust=False,
                    progress=False,
                    threads=False,
                )

            if data.empty:
                if attempt < RETRY_ATTEMPTS:
                    time.sleep(1.0)
                continue

            if isinstance(data.columns, pd.MultiIndex):
                data.columns = data.columns.get_level_values(0)

            ohlc = data[["Open", "High", "Low", "Close"]].dropna().copy()
            if len(ohlc) >= WINDOW_SIZE:
                return ohlc

            best_ohlc = ohlc
            if attempt < RETRY_ATTEMPTS:
                time.sleep(1.0)

    if best_ohlc is None or best_ohlc.empty:
        raise RuntimeError(f"No data returned for {symbol}.")
    raise RuntimeError(f"Need at least {WINDOW_SIZE} candles for {symbol}, but found {len(best_ohlc)}.")


def make_style():
    return mpf.make_mpf_style(
        base_mpf_style="classic",
        marketcolors=mpf.make_marketcolors(
            up="#16a34a",
            down="#dc2626",
            wick="inherit",
            edge="inherit",
            volume="inherit",
        ),
        facecolor="white",
        figcolor="white",
        gridstyle="",
        rc={"axes.grid": False},
    )


def save_window_image(window: pd.DataFrame, output_path: Path, style) -> None:
    dpi = 100
    fig, axes = mpf.plot(
        window,
        type="candle",
        style=style,
        volume=False,
        axisoff=True,
        returnfig=True,
        figsize=(IMAGE_SIZE / dpi, IMAGE_SIZE / dpi),
    )

    for ax in axes:
        ax.set_axis_off()
        ax.grid(False)

    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
    fig.set_size_inches(IMAGE_SIZE / dpi, IMAGE_SIZE / dpi)
    fig.savefig(output_path, dpi=dpi, pad_inches=0, facecolor="white")
    plt.close(fig)


def parse_symbols(symbols_arg: str | None) -> list[str]:
    if symbols_arg:
        parsed = [token.strip().upper() for token in symbols_arg.split(",") if token.strip()]
    else:
        parsed = STOCK_SYMBOLS

    unique_symbols: list[str] = []
    seen: set[str] = set()
    for symbol in parsed:
        if symbol not in seen:
            unique_symbols.append(symbol)
            seen.add(symbol)
    return unique_symbols


def clear_existing_dataset() -> None:
    if not OUTPUT_DIR.exists():
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if not OHLC_DIR.exists():
        OHLC_DIR.mkdir(parents=True, exist_ok=True)

    for image_path in OUTPUT_DIR.rglob("*.png"):
        if image_path.name == ".gitkeep":
            continue
        image_path.unlink()

    for csv_path in OHLC_DIR.glob("*.csv"):
        csv_path.unlink()

    if MANIFEST_PATH.exists():
        MANIFEST_PATH.unlink()


def build_dataset(symbols: list[str], clean: bool = False) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OHLC_DIR.mkdir(parents=True, exist_ok=True)
    if clean:
        clear_existing_dataset()

    style = make_style()
    total_images = 0
    generated_per_symbol: dict[str, int] = {}
    manifest_rows: list[dict[str, str | int]] = []

    for symbol in symbols:
        try:
            ohlc = download_stock_data(symbol)
        except Exception as exc:
            print(f"Skipping {symbol}: {exc}")
            continue

        symbol_key = symbol.upper()
        ohlc.to_csv(OHLC_DIR / f"{symbol_key}.csv")

        available_windows = len(ohlc) - WINDOW_SIZE + 1
        if available_windows <= 0:
            print(f"Skipping {symbol}: not enough rolling windows.")
            continue

        start_window = 0
        if MAX_WINDOWS_PER_STOCK > 0 and available_windows > MAX_WINDOWS_PER_STOCK:
            start_window = available_windows - MAX_WINDOWS_PER_STOCK

        symbol_count = 0
        for seq_idx, start_idx in enumerate(range(start_window, available_windows), start=1):
            window = ohlc.iloc[start_idx:start_idx + WINDOW_SIZE]
            output_path = OUTPUT_DIR / f"{symbol_key}_img_{seq_idx}.png"
            save_window_image(window, output_path, style)
            manifest_rows.append(
                {
                    "filename": output_path.name,
                    "symbol": symbol_key,
                    "window_index": start_idx + 1,
                }
            )
            symbol_count += 1
            total_images += 1

        generated_per_symbol[symbol_key] = symbol_count

    if total_images < MIN_IMAGE_COUNT:
        raise RuntimeError(
            f"Expected at least {MIN_IMAGE_COUNT} images, but generated {total_images}."
        )

    pd.DataFrame(manifest_rows, columns=["filename", "symbol", "window_index"]).to_csv(
        MANIFEST_PATH, index=False
    )
    print(f"Saved {total_images} images to {OUTPUT_DIR}")
    print(f"Saved manifest to {MANIFEST_PATH}")
    for symbol, count in generated_per_symbol.items():
        print(f"{symbol}: {count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate candlestick images for one or more stocks.")
    parser.add_argument(
        "--symbols",
        type=str,
        default="",
        help="Comma-separated symbols (without .NS), e.g. TCS,RELIANCE,INFY",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Remove existing PNG images in dataset/images before generating new images.",
    )
    args = parser.parse_args()

    symbols = parse_symbols(args.symbols or None)
    build_dataset(symbols=symbols, clean=args.clean)
