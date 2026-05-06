FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg fonts-noto-cjk wget && \
    wget -q https://github.com/google/fonts/raw/main/ofl/notosansarabic/NotoSansArabic%5Bwdth%2Cwght%5D.ttf \
    -O /usr/share/fonts/NotoSansArabic.ttf && \
    fc-cache -f && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 7860
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}
