FROM emscripten/emsdk:3.1.64-arm64

WORKDIR /app

RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir fastapi uvicorn pydantic Werkzeug

RUN mkdir -p /app/include

COPY micromouse.h /app/include
COPY micromouse.cpp /app/include

COPY main.py .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]