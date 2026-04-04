import pandas as pd


def candle_parts(candle: pd.Series) -> tuple[float, float, float, float]:
    open_price = float(candle["Open"])
    high_price = float(candle["High"])
    low_price = float(candle["Low"])
    close_price = float(candle["Close"])

    body = abs(close_price - open_price)
    full_range = max(high_price - low_price, 1e-9)
    upper_wick = high_price - max(open_price, close_price)
    lower_wick = min(open_price, close_price) - low_price

    return body, full_range, upper_wick, lower_wick


def is_doji(candle: pd.Series) -> bool:
    body, full_range, _, _ = candle_parts(candle)
    return body <= full_range * 0.1


def is_hammer(candle: pd.Series) -> bool:
    body, full_range, upper_wick, lower_wick = candle_parts(candle)
    return (
        body <= full_range * 0.3
        and lower_wick >= body * 2
        and upper_wick <= body
    )


def is_engulfing(previous_candle: pd.Series, current_candle: pd.Series) -> bool:
    prev_open = float(previous_candle["Open"])
    prev_close = float(previous_candle["Close"])
    curr_open = float(current_candle["Open"])
    curr_close = float(current_candle["Close"])

    prev_body_low = min(prev_open, prev_close)
    prev_body_high = max(prev_open, prev_close)
    curr_body_low = min(curr_open, curr_close)
    curr_body_high = max(curr_open, curr_close)

    previous_direction = prev_close - prev_open
    current_direction = curr_close - curr_open

    opposite_direction = (
        previous_direction > 0 > current_direction
        or previous_direction < 0 < current_direction
    )

    return (
        opposite_direction
        and curr_body_low <= prev_body_low
        and curr_body_high >= prev_body_high
    )


def label_window(window: pd.DataFrame) -> str:
    current_candle = window.iloc[-1]
    previous_candle = window.iloc[-2]

    if is_engulfing(previous_candle, current_candle):
        return "Engulfing"
    if is_hammer(current_candle):
        return "Hammer"
    if is_doji(current_candle):
        return "Doji"
    return "None"
