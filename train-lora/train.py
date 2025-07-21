import subprocess
import os
import logging
from pathlib import Path

def train_lora_model(image_dir: str, output_dir: str, model_name: str, trigger_word: str):
    """
    Run LoRA training using kohya-ss scripts for a given image_dir
    and save the model to output_dir with the specified model_name.
    """
    
    logging.info(f"🎯 Starting LoRA training preparation...")
    logging.info(f"  - Image directory: {image_dir}")
    logging.info(f"  - Output directory: {output_dir}")
    logging.info(f"  - Model name: {model_name}")
    logging.info(f"  - Trigger word: {trigger_word}")

    # Verify image directory exists and has files
    image_path = Path(image_dir)
    if not image_path.exists():
        raise RuntimeError(f"Image directory does not exist: {image_dir}")
    
    # Count images in directory
    extensions = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    image_files = []
    for pattern in extensions:
        image_files.extend(list(image_path.glob(pattern)))
    
    logging.info(f"📸 Found {len(image_files)} image files:")
    for img_file in image_files:
        file_size = img_file.stat().st_size
        logging.info(f"  - {img_file.name} ({file_size} bytes)")

    if not image_files:
        raise RuntimeError(f"No image files found in {image_dir}")

    # --- Auto-caption block (one caption per image, if .txt doesn't exist) ---
    caption = f"a person of {trigger_word}"
    caption_count = 0
    
    logging.info(f"📝 Creating captions with text: '{caption}'")
    
    for img_file in image_files:
        caption_file = img_file.with_suffix(".txt")
        if not caption_file.exists():
            with open(caption_file, "w") as f:
                f.write(caption)
            caption_count += 1
            logging.info(f"  ✍️  Created caption: {caption_file.name}")
        else:
            # Read existing caption
            with open(caption_file, "r") as f:
                existing_caption = f.read().strip()
            logging.info(f"  📄 Existing caption: {caption_file.name} -> '{existing_caption}'")
    
    logging.info(f"📝 Created {caption_count} new caption files")

    # Verify output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    logging.info(f"📁 Output directory ready: {output_path}")

    # Check for pretrained model
    pretrained_model_path = "/runpod-volume/realvisxlV50_v50LightningBakedvae.safetensors"
    if not Path(pretrained_model_path).exists():
        raise RuntimeError(f"Pretrained model not found: {pretrained_model_path}")
    
    pretrained_size = Path(pretrained_model_path).stat().st_size
    logging.info(f"🤖 Pretrained model found: {pretrained_size} bytes")

    run_script_path = "/workspace/sd-scripts/train_network.py"
    if not Path(run_script_path).exists():
        raise RuntimeError(f"Training script not found: {run_script_path}")

    # Build command
    command = [
        "python3", run_script_path,
        "--pretrained_model_name_or_path", pretrained_model_path,
        "--train_data_dir", image_dir,
        "--output_dir", output_dir,
        "--output_name", model_name,
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
        "--logging_dir", f"{output_dir}/logs",
        "--log_with", "tensorboard",
        "--save_every_n_epochs", "1"
    ]

    logging.info("🚀 Launching LoRA training subprocess...")
    logging.info(f"📋 Command: {' '.join(command)}")

    # Run the training process
    try:
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            timeout=3600  # 1 hour timeout
        )
        
        # Log the outputs
        if result.stdout:
            logging.info("📤 Training STDOUT:")
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    logging.info(f"  {line}")
        
        if result.stderr:
            logging.info("📤 Training STDERR:")
            for line in result.stderr.strip().split('\n'):
                if line.strip():
                    logging.info(f"  {line}")

        if result.returncode != 0:
            error_msg = f"Training failed with return code {result.returncode}"
            logging.error(f"❌ {error_msg}")
            logging.error("Last 10 lines of STDOUT:")
            stdout_lines = result.stdout.strip().split('\n')[-10:]
            for line in stdout_lines:
                logging.error(f"  {line}")
            logging.error("Last 10 lines of STDERR:")
            stderr_lines = result.stderr.strip().split('\n')[-10:]
            for line in stderr_lines:
                logging.error(f"  {line}")
            raise RuntimeError(f"LoRA training failed. {error_msg}")
        else:
            logging.info("✅ Training subprocess completed successfully")
            
    except subprocess.TimeoutExpired:
        error_msg = "Training process timed out after 1 hour"
        logging.error(f"⏰ {error_msg}")
        raise RuntimeError(error_msg)

    # Check if output file was created
    expected_output = Path(output_dir) / f"{model_name}.safetensors"
    
    # List all files in output directory
    output_files = list(Path(output_dir).glob("*"))
    logging.info(f"📂 Files in output directory after training:")
    for file in output_files:
        if file.is_file():
            file_size = file.stat().st_size
            logging.info(f"  - {file.name} ({file_size} bytes)")

    # Check various possible output locations
    possible_outputs = [
        Path(output_dir) / f"{model_name}.safetensors",
        Path(output_dir) / f"{model_name}_000001.safetensors", 
        Path(output_dir) / f"{model_name}_001000.safetensors",  # max_train_steps
    ]
    
    actual_output = None
    for possible_output in possible_outputs:
        if possible_output.exists():
            actual_output = possible_output
            break
    
    if actual_output:
        file_size = actual_output.stat().st_size
        logging.info(f"✅ Model file created: {actual_output.name} ({file_size} bytes)")
        
        # If it's not the expected name, rename it
        if actual_output.name != f"{model_name}.safetensors":
            final_output = Path(output_dir) / f"{model_name}.safetensors"
            actual_output.rename(final_output)
            logging.info(f"🔄 Renamed {actual_output.name} to {final_output.name}")
    else:
        # List all .safetensors files to help debug
        safetensors_files = list(Path(output_dir).glob("*.safetensors"))
        if safetensors_files:
            logging.error(f"❌ Expected {model_name}.safetensors not found, but found these .safetensors files:")
            for st_file in safetensors_files:
                logging.error(f"  - {st_file.name}")
            # Use the first one we find and rename it
            actual_output = safetensors_files[0]
            final_output = Path(output_dir) / f"{model_name}.safetensors"
            actual_output.rename(final_output)
            logging.info(f"🔄 Using {actual_output.name}, renamed to {final_output.name}")
        else:
            raise RuntimeError(f"No model file created. Expected: {expected_output}")
    
    logging.info("🎉 LoRA training completed successfully!")