FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    git python3 python3-pip libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY requirements.txt .
RUN pip3 install --upgrade pip && pip3 install --no-cache-dir -r requirements.txt

RUN git clone https://github.com/kohya-ss/sd-scripts.git ./sd-scripts

COPY train.py handler.py ./

ENTRYPOINT ["python3", "handler.py"]