import argparse
import contextlib
import io
import json
from pathlib import Path
import tempfile

import matplotlib.pyplot as plt
import mplfinance as mpf
import pandas as pd
import torch
import yfinance as yf
from PIL import Image
from torch import nn
from torchvision import models, transforms

from pattern_rules import label_window


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "candle_model.pth"
YF_CACHE_DIR = BASE_DIR / ".yf_cache"
WINDOW_SIZE = 10
IMAGE_SIZE = 224


class InvalidStockSymbolError(Exception):
    pass


def configure_yfinance_cache() -> None:
    # Keep yfinance cache writable in restricted environments.
    YF_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if hasattr(yf, "set_tz_cache_location"):
        yf.set_tz_cache_location(str(YF_CACHE_DIR))


def cleanup_temp_chart(chart_path: Path | None) -> None:
    if chart_path and chart_path.exists():
        chart_path.unlink()


def normalize_symbol(symbol: str) -> tuple[str, str]:
    cleaned = symbol.strip().upper()
    if not cleaned:
        raise InvalidStockSymbolError

    display_symbol = cleaned[:-3] if cleaned.endswith(".NS") else cleaned
    yahoo_symbol = cleaned if cleaned.endswith(".NS") else f"{cleaned}.NS"
    return display_symbol, yahoo_symbol


def fetch_latest_window(yahoo_symbol: str) -> pd.DataFrame:
    configure_yfinance_cache()
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        data = yf.download(
            yahoo_symbol,
            period="1mo",
            interval="1d",
            auto_adjust=False,
            progress=False,
            threads=False,
        )

    if data.empty:
        raise InvalidStockSymbolError

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    required_cols = ["Open", "High", "Low", "Close"]
    if not set(required_cols).issubset(data.columns):
        raise InvalidStockSymbolError

    ohlc = data[required_cols].dropna().copy()
    if len(ohlc) < WINDOW_SIZE:
        raise InvalidStockSymbolError

    return ohlc.tail(WINDOW_SIZE)


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


def save_temp_chart(window: pd.DataFrame) -> Path:
    style = make_style()
    dpi = 100
    temp_file = tempfile.NamedTemporaryFile(
        suffix=".png",
        prefix="temp_chart_",
        delete=False,
        dir=BASE_DIR,
    )
    temp_path = Path(temp_file.name)
    temp_file.close()
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
    fig.savefig(temp_path, dpi=dpi, pad_inches=0, facecolor="white")
    plt.close(fig)
    return temp_path


def load_checkpoint(model_path: Path):
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(model_path, map_location=device)

    class_to_idx = checkpoint.get("class_to_idx")
    if not class_to_idx:
        raise ValueError("Checkpoint is missing class_to_idx.")

    idx_to_class = {index: label for label, index in class_to_idx.items()}
    return checkpoint, class_to_idx, idx_to_class, device


def build_model(num_classes: int, checkpoint: dict, device: torch.device) -> nn.Module:
    model = models.resnet18(weights=None)

    for parameter in model.parameters():
        parameter.requires_grad = False

    model.fc = nn.Linear(model.fc.in_features, num_classes)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()
    return model


def build_transform():
    return transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )


def predict_image(
    image_path: Path,
    model_path: Path = MODEL_PATH,
) -> tuple[str, float, dict[str, float], dict[str, int]]:
    if not image_path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    checkpoint, class_to_idx, idx_to_class, device = load_checkpoint(model_path)
    model = build_model(len(class_to_idx), checkpoint, device)
    transform = build_transform()

    image = Image.open(image_path).convert("RGB")
    input_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(input_tensor)
        probabilities = torch.softmax(logits, dim=1)
        confidence, predicted_index = torch.max(probabilities, dim=1)

    predicted_label = idx_to_class[int(predicted_index.item())]
    confidence_score = float(confidence.item())
    probability_map = {
        idx_to_class[index]: float(probabilities[0, index].item())
        for index in range(probabilities.shape[1])
    }
    return predicted_label, confidence_score, probability_map, class_to_idx


def get_signal(pattern: str) -> str:
    pattern = pattern.lower()

    if pattern in ["hammer", "engulfing"]:
        return "BUY"
    if pattern == "doji":
        return "HOLD"
    return "HOLD"


def choose_final_pattern(
    window: pd.DataFrame,
    model_pattern: str,
    probability_map: dict[str, float],
) -> tuple[str, float]:
    # Keep live inference consistent with the exact rules used for labeling.
    rule_pattern = label_window(window)
    if rule_pattern != "None":
        return rule_pattern, round(probability_map.get(rule_pattern, 0.0), 4)
    return model_pattern, round(probability_map.get(model_pattern, 0.0), 4)


def predict_stock(symbol: str) -> dict[str, str | float]:
    display_symbol, yahoo_symbol = normalize_symbol(symbol)
    window = fetch_latest_window(yahoo_symbol)
    image_path: Path | None = None
    try:
        image_path = save_temp_chart(window)
        predicted_label, confidence_score, probability_map, _ = predict_image(image_path)
        final_pattern, final_confidence = choose_final_pattern(window, predicted_label, probability_map)

        return {
            "stock": display_symbol,
            "pattern": final_pattern,
            "confidence": final_confidence,
            "signal": get_signal(final_pattern),
        }
    finally:
        cleanup_temp_chart(image_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run candlestick pattern inference for a stock symbol.")
    parser.add_argument("symbol", type=str, help="Stock symbol, e.g. TCS, RELIANCE, INFY")
    args = parser.parse_args()

    try:
        result = predict_stock(args.symbol)
        print(json.dumps(result, indent=2))
    except InvalidStockSymbolError:
        print(json.dumps({"error": "Invalid stock symbol"}))


if __name__ == "__main__":
    main()
