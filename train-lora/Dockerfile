FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install all required system libraries
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --upgrade pip && pip3 install --no-cache-dir -r requirements.txt

# Clone Kohya LoRA training scripts
RUN git clone https://github.com/kohya-ss/sd-scripts.git ./sd-scripts

# Add your handler and training logic
COPY train.py handler.py ./

# Entrypoint
ENTRYPOINT ["python3", "handler.py"]
