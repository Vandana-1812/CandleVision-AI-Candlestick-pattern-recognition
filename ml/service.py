import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from predict import InvalidStockSymbolError, predict_stock


class MlSignalHandler(BaseHTTPRequestHandler):
    server_version = "CandleVisionML/1.0"

    def _send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send_json({"status": "ok"})
            return
        self._send_json({"error": "Not found"}, status=404)

    def do_POST(self) -> None:
        if self.path != "/predict":
            self._send_json({"error": "Not found"}, status=404)
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON payload"}, status=400)
            return

        symbol = str(payload.get("symbol", "")).strip()
        if not symbol:
            self._send_json({"error": "Stock symbol is required"}, status=400)
            return

        try:
            result = predict_stock(symbol)
            self._send_json(result)
        except InvalidStockSymbolError:
            self._send_json({"error": "Invalid stock symbol"}, status=400)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=500)

    def log_message(self, format: str, *args) -> None:
        return


def main() -> None:
    host = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("ML_SERVICE_PORT", "8001"))
    server = ThreadingHTTPServer((host, port), MlSignalHandler)
    print(f"ML service listening on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
