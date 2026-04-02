from pathlib import Path
import contextlib
import io
import re

import pandas as pd
import yfinance as yf

from data_generator import INTERVAL, MANIFEST_PATH, OHLC_DIR, OUTPUT_DIR, PERIOD, TICKER, WINDOW_SIZE
from pattern_rules import label_window


BALANCED_LABELS_PATH = Path(__file__).resolve().parent / "dataset" / "labels_balanced.csv"
RANDOM_SEED = 42
YF_CACHE_DIR = Path(__file__).resolve().parent / ".yf_cache"


def configure_yfinance_cache() -> None:
    # Keep yfinance cache writable in restricted environments.
    YF_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if hasattr(yf, "set_tz_cache_location"):
        yf.set_tz_cache_location(str(YF_CACHE_DIR))


def normalize_yahoo_symbol(symbol: str) -> str:
    cleaned = symbol.strip().upper()
    if not cleaned:
        raise ValueError("Empty stock symbol.")

    if cleaned.startswith("^") or "." in cleaned:
        return cleaned
    return f"{cleaned}.NS"


def extract_symbol_and_index(image_path: Path) -> tuple[str, int]:
    stem = image_path.stem
    relative_parent = image_path.parent.relative_to(OUTPUT_DIR)
    parent_name = "" if str(relative_parent) == "." else image_path.parent.name

    # Supported examples:
    # TCS_img_15.png, TCS_15.png, img_15.png (with stock folder), img_15.png (fallback ticker)
    match = re.match(r"^img_(?P<idx>\d+)$", stem, flags=re.IGNORECASE)
    if match:
        window_index = int(match.group("idx"))
        if parent_name:
            return parent_name, window_index
        return TICKER, window_index

    match = re.match(r"^(?P<symbol>[A-Za-z0-9^.-]+)_img_(?P<idx>\d+)$", stem, flags=re.IGNORECASE)
    if not match:
        match = re.match(r"^(?P<symbol>[A-Za-z0-9^.-]+)_(?P<idx>\d+)$", stem, flags=re.IGNORECASE)
    if match:
        symbol = match.group("symbol")
        window_index = int(match.group("idx"))
        return symbol, window_index

    raise ValueError(f"Unsupported image filename format: {image_path.name}")


def download_ohlc(symbol: str, min_required_rows: int) -> pd.DataFrame:
    local_ohlc_path = OHLC_DIR / f"{symbol.upper()}.csv"
    if local_ohlc_path.exists():
        local_df = pd.read_csv(local_ohlc_path, keep_default_na=False)
        required_cols = {"Open", "High", "Low", "Close"}
        if required_cols.issubset(local_df.columns):
            local_ohlc = local_df[["Open", "High", "Low", "Close"]].copy()
            local_ohlc = local_ohlc.apply(pd.to_numeric, errors="coerce").dropna()
            if len(local_ohlc) >= min_required_rows:
                return local_ohlc

    yahoo_symbol = normalize_yahoo_symbol(symbol)
    configure_yfinance_cache()
    periods = [PERIOD, "1y", "2y", "5y", "max"]
    unique_periods: list[str] = []
    for period in periods:
        if period not in unique_periods:
            unique_periods.append(period)

    best_ohlc: pd.DataFrame | None = None
    for period in unique_periods:
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
            continue

        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        ohlc = data[["Open", "High", "Low", "Close"]].dropna().copy()
        if len(ohlc) < WINDOW_SIZE:
            continue

        best_ohlc = ohlc
        if len(ohlc) >= min_required_rows:
            return ohlc

    if best_ohlc is None:
        raise RuntimeError(f"No data returned for symbol: {symbol}")

    raise RuntimeError(
        f"Not enough candles for {symbol}: needed {min_required_rows}, found {len(best_ohlc)}."
    )


def collect_image_specs() -> list[tuple[str, int, Path]]:
    if MANIFEST_PATH.exists():
        manifest_df = pd.read_csv(MANIFEST_PATH, keep_default_na=False)
        required_columns = {"filename", "symbol", "window_index"}
        if not required_columns.issubset(manifest_df.columns):
            raise ValueError(
                f"Manifest must contain columns {required_columns}, found {set(manifest_df.columns)}"
            )

        specs: list[tuple[str, int, Path]] = []
        for _, row in manifest_df.iterrows():
            filename = str(row["filename"]).strip()
            symbol = str(row["symbol"]).strip()
            window_index = int(row["window_index"])
            relative_filename = Path(filename)
            if not (OUTPUT_DIR / relative_filename).exists():
                continue
            specs.append((symbol, window_index, relative_filename))

        if specs:
            return specs

    if not OUTPUT_DIR.exists():
        raise FileNotFoundError(f"Images directory not found: {OUTPUT_DIR}")

    specs: list[tuple[str, int, Path]] = []
    for image_path in sorted(OUTPUT_DIR.rglob("*.png")):
        symbol, window_index = extract_symbol_and_index(image_path)
        relative_filename = image_path.relative_to(OUTPUT_DIR)
        specs.append((symbol, window_index, relative_filename))

    if not specs:
        raise RuntimeError(f"No PNG images found in {OUTPUT_DIR}.")

    return specs


def build_labels() -> None:
    rows: list[dict[str, str]] = []
    specs = collect_image_specs()
    specs_by_symbol: dict[str, list[tuple[int, Path]]] = {}

    for symbol, window_index, relative_filename in specs:
        specs_by_symbol.setdefault(symbol, []).append((window_index, relative_filename))

    skipped = 0
    for symbol, symbol_specs in specs_by_symbol.items():
        required_rows = max(window_index for window_index, _ in symbol_specs) + WINDOW_SIZE - 1
        try:
            ohlc = download_ohlc(symbol, min_required_rows=required_rows)
        except Exception as exc:
            skipped += len(symbol_specs)
            print(f"Skipping {symbol} ({len(symbol_specs)} images): {exc}")
            continue

        for window_index, relative_filename in symbol_specs:
            start_idx = window_index - 1
            end_idx = start_idx + WINDOW_SIZE
            if start_idx < 0 or end_idx > len(ohlc):
                skipped += 1
                continue

            window = ohlc.iloc[start_idx:end_idx]
            rows.append(
                {
                    "filename": relative_filename.as_posix(),
                    "label": label_window(window),
                }
            )

    if not rows:
        raise RuntimeError("No labels generated. Check image naming and symbol data availability.")

    labels_df = pd.DataFrame(rows, columns=["filename", "label"])
    BALANCED_LABELS_PATH.parent.mkdir(parents=True, exist_ok=True)

    pattern_df = labels_df[labels_df["label"] != "None"].copy()
    none_df = labels_df[labels_df["label"] == "None"].copy()
    target_none_count = min(len(none_df), len(pattern_df))

    if target_none_count > 0:
        balanced_none_df = none_df.sample(
            n=target_none_count,
            random_state=RANDOM_SEED,
        )
    else:
        balanced_none_df = none_df.iloc[0:0].copy()

    balanced_df = pd.concat([pattern_df, balanced_none_df], ignore_index=True)
    balanced_df = balanced_df.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)
    balanced_df.to_csv(BALANCED_LABELS_PATH, index=False)

    print(f"Scanned images: {len(specs)}")
    print(f"Generated labels: {len(labels_df)}")
    print(f"Skipped images: {skipped}")
    print(f"Saved {len(balanced_df)} balanced labels to {BALANCED_LABELS_PATH}")
    print(labels_df["label"].value_counts().to_string())
    print(balanced_df["label"].value_counts().to_string())


if __name__ == "__main__":
    build_labels()
