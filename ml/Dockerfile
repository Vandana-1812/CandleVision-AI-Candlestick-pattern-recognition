FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MPLCONFIGDIR=/tmp/matplotlib
ENV ML_SERVICE_HOST=0.0.0.0
ENV ML_SERVICE_PORT=8001

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY ml/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY ml/predict.py /app/predict.py
COPY ml/pattern_rules.py /app/pattern_rules.py
COPY ml/service.py /app/service.py
COPY ml/model /app/model

EXPOSE 8001

CMD ["python", "service.py"]
