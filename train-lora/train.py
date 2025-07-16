import subprocess
import os
from pathlib import Path

def train_lora_model(image_dir: str, output_path: str, trigger_word: str):
    """
    Run LoRA training using kohya-ss scripts for a given image_dir
    and save the model to output_path.
    """

    # --- Auto-caption block (one caption per image, if .txt doesn't exist) ---
    # This creates a txt file for every .jpg in image_dir if missing, using the trigger_word.

    caption = f"a person of {trigger_word}"
    extensions = ("*.jpg", "*.jpeg", "*.png")

    for pattern in extensions:
        for img_file in Path(image_dir).glob(pattern):
            caption_file = img_file.with_suffix(".txt")
            if not caption_file.exists():
                with open(caption_file, "w") as f:
                    f.write(caption)

    # ------------------------------------------------------------------------

    pretrained_model_path = "/runpod-volume/realvisxlV50_v50LightningBakedvae.safetensors"
    output_dir = os.path.dirname(output_path)
    output_name = os.path.basename(output_path).replace(".safetensors", "")
    run_script_path = "/workspace/sd-scripts/train_network.py"

    command = [
        "python3", run_script_path,
        "--pretrained_model_name_or_path", pretrained_model_path,
        "--train_data_dir", image_dir,
        "--output_dir", output_dir,
        "--output_name", output_name,
        "--network_module", "networks.lora",
        "--network_train_unet_only",
        "--resolution", "1024,1024",
        "--train_batch_size", "2",
        "--learning_rate", "1e-4",
        "--max_train_steps", "1000",
        "--mixed_precision", "fp16",
        "--clip_skip", "2",
        "--save_model_as", "safetensors",
        "--caption_extension", ".txt",
        "--shuffle_caption",
        "--cache_latents",
    ]

    print("▶️  Launching LoRA training subprocess...")
    print("Command:", " ".join(command))

    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        print("❌ Training failed!")
        print("STDOUT:\n", result.stdout)
        print("STDERR:\n", result.stderr)
        raise RuntimeError("LoRA training failed. See logs above.")
    else:
        print("✅ Training completed successfully.")
