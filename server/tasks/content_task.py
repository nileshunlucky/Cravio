import uuid
import os
import boto3
import requests
from datetime import datetime
from db import users_collection
from celery_config import celery_app
import fal_client
import logging
import subprocess
import tempfile
from openai import OpenAI
from typing import Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configure AWS S3
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)

# Configure fal.ai client
fal_client.api_key = os.getenv("FAL_KEY")

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def extract_audio_from_video(video_url: str) -> str:
    """
    Downloads the persona video and extracts audio using ffmpeg.
    Returns the local path to the generated .wav file.
    """
    temp_video_path = None
    temp_audio_path = None

    try:
        # Download the video file
        response = requests.get(video_url, stream=True)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
            temp_video.write(response.content)
            temp_video_path = temp_video.name

        # Create a temp file for the extracted audio
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        temp_audio_path = temp_audio.name
        temp_audio.close()

        # Run ffmpeg to extract audio in WAV format (best for cloning)
        ffmpeg_command = [
            "ffmpeg",
            "-y",  # overwrite
            "-i",
            temp_video_path,
            "-vn",  # no video
            "-acodec",
            "pcm_s16le",
            "-ar",
            "44100",
            "-ac",
            "2",
            temp_audio_path,
        ]
        subprocess.run(
            ffmpeg_command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        # Clean up temp video file
        if temp_video_path and os.path.exists(temp_video_path):
            os.remove(temp_video_path)

        return temp_audio_path

    except Exception as e:
        # Clean up temp files on error
        try:
            if temp_video_path and os.path.exists(temp_video_path):
                os.remove(temp_video_path)
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
        except:
            pass
        logger.error(f"Audio extraction failed: {e}")
        raise Exception("Failed to extract audio from persona video with ffmpeg")


def generate_viral_script(prompt: str) -> str:
    """
    Convert raw idea into a viral short-form content script using GPT-5.
    The output will be structured, punchy, and optimized for hooks + retention.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-5",
            messages=[
                {
                    "role": "system",
                    "content": "You are a viral content strategist who writes high-converting short-form video scripts (15–60s) for platforms like TikTok, Reels, and Shorts.",
                },
                {
                    "role": "user",
                    "content": f"""Turn this idea into a punchy, viral short-form video script under 120 words.

                The script should sound like a natural monologue — as if someone is speaking directly to the camera. 
                Do NOT include any section labels like 'Hook', 'Body', or 'CTA'. 
                It should hook fast, for example: "I went from [this] to [this] in [X] days," 
                deliver value like a storyteller with emotion, 
                and end with a natural call-to-action, for example: "Comment [one word related to topic] and I'll send you [solution/link/guide]."

                Idea: {prompt}""",
                },
            ],
            temperature=0.8,
            max_tokens=400,
        )

        viral_script = response.choices[0].message.content.strip()
        return viral_script

    except Exception as e:
        logger.error(f"GPT-5 script generation failed: {e}")
        raise Exception("Failed to generate viral script with GPT-5")


def convert_video_to_vertical(input_url: str) -> str:
    """
    Downloads the generated video, converts it to 9:16 aspect ratio (1080x1920),
    and returns the local path to the converted file.
    """
    temp_in_path = None
    temp_out_path = None

    try:
        # Download original Kling video
        response = requests.get(input_url, stream=True)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_in:
            temp_in.write(response.content)
            temp_in_path = temp_in.name

        temp_out = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        temp_out_path = temp_out.name
        temp_out.close()

        # ffmpeg: scale and pad to 1080x1920 while keeping proportions
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-i",
            temp_in_path,
            "-vf",
            "scale=w=1080:h=1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
            "-c:a",
            "copy",
            temp_out_path,
        ]

        subprocess.run(
            ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        # Clean up input file
        if temp_in_path and os.path.exists(temp_in_path):
            os.remove(temp_in_path)

        return temp_out_path

    except Exception as e:
        # Clean up temp files on error
        try:
            if temp_in_path and os.path.exists(temp_in_path):
                os.remove(temp_in_path)
            if temp_out_path and os.path.exists(temp_out_path):
                os.remove(temp_out_path)
        except:
            pass
        logger.error(f"Video conversion to 9:16 failed: {e}")
        raise Exception("Failed to convert video to vertical format")


def upload_file_to_s3(file_path: str, email: str, prefix: str = "shorts") -> str:
    """Upload local file to S3 and return the URL"""
    try:
        unique_id = uuid.uuid4().hex[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"{prefix}/{email}/{timestamp}_{unique_id}.mp4"

        with open(file_path, "rb") as f:
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=file_name,
                Body=f,
                ContentType="video/mp4",
            )

        return f"https://{S3_BUCKET}.s3.amazonaws.com/{file_name}"
    except Exception as e:
        logger.error(f"S3 upload failed: {e}")
        raise Exception("Failed to upload converted video to S3")

def generate_caption_and_score(script: str):
    """
    Generate a short social media caption and a virality score (0-100)
    for the given script using GPT-5.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-5",
            messages=[
                {
                    "role": "system",
                    "content": "You are a social media growth strategist. Generate catchy captions and predict virality of video scripts."
                },
                {
                    "role": "user",
                    "content": f"""Given this short-form video script:
{script}

1. Generate a punchy, 1-line caption suitable for TikTok, Shorts, or Reels without # and emojis.
2. Provide a virality score (0-100) predicting its potential to go viral.

Return as JSON: {{ "caption": "...", "virality_score": 85 }}"""
                }
            ],
            temperature=0.7,
            max_tokens=100,
        )

        result_text = response.choices[0].message.content.strip()
        # Try to parse JSON from GPT response
        import json
        try:
            result_json = json.loads(result_text)
            return result_json.get("caption"), result_json.get("virality_score")
        except:
            logger.warning(f"Failed to parse caption/score JSON: {result_text}")
            return result_text, None

    except Exception as e:
        logger.error(f"Caption/virality generation failed: {e}")
        return None, None

def save_content_to_db(email: str, prompt: str, content_url: str, script: str = None, caption: str = None, virality_score: int = None):
    doc = {
        "id": uuid.uuid4().hex,
        "prompt": prompt,
        "script": script,
        "caption": caption,
        "virality_score": virality_score,
        "content_url": content_url,
        "created_at": datetime.utcnow(),
    }
    users_collection.update_one({"email": email}, {"$push": {"content": doc}})


@celery_app.task(bind=True)
def content(self, prompt: str, email: str, persona: str, option: Optional[str] = None):
    """Generate Content using fal.ai"""
    try:

        # if option == "Script" the skip idea to script part
        if option == "Script":
            viral_script = prompt
        else:
        # STEP 1: Convert idea to Viral Script using GPT-5
            self.update_state(
            state="PROGRESS",
            meta={"status": "Scripting", "progress": 10},
            )

            viral_script = generate_viral_script(prompt)
            logger.info(f"Generated script: {viral_script}")


        caption, virality_score = generate_caption_and_score(viral_script)
        logger.info(f"Caption: {caption}, Virality Score: {virality_score}")


        # STEP 2: Convert Script to Audio using persona voice
        self.update_state(
            state="PROGRESS", meta={"status": "Transcribing", "progress": 50}
        )

        # 1. Extract reference audio from persona video
        reference_audio_path = extract_audio_from_video(persona)
        logger.info(f"Extracted audio from persona: {reference_audio_path}")

        # 2. Upload reference audio to S3 to get a public URL (zonos needs a URL)
        unique_id = uuid.uuid4().hex[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        s3_key = f"reference_audio/{email}/{timestamp}_{unique_id}.wav"

        with open(reference_audio_path, "rb") as f:
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=f,
                ContentType="audio/wav",
            )

        reference_audio_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"

        # Clean up reference audio file
        if reference_audio_path and os.path.exists(reference_audio_path):
            os.remove(reference_audio_path)

        # 3. Send script + reference audio to fal.ai zonos for voice cloning
        request_data = {
            "reference_audio_url": reference_audio_url,
            "prompt": viral_script,
        }

        api_endpoint = "fal-ai/zonos"

        zonos_result = fal_client.subscribe(
            api_endpoint,
            arguments=request_data,
            with_logs=True,
        )

        if not zonos_result or "audio" not in zonos_result:
            raise Exception("No audio generated by Zonos")

        generated_audio_url = zonos_result["audio"]["url"]

        # Create Content using persona (video) and Audio (created by zonas ai) using fal.ai Kling lip-sync
        self.update_state(state="PROGRESS", meta={"status": "Creating", "progress": 80})

        kling_result = fal_client.subscribe(
            "fal-ai/kling-video/lipsync/audio-to-video",
            arguments={"video_url": persona, "audio_url": generated_audio_url},
            with_logs=True,
        )

        content_url = kling_result["content"]["url"]

        if not kling_result or "content" not in kling_result:
            raise Exception("No Content generated by kling")

        # STEP 4: Convert Kling video to 9:16 format
        self.update_state(
            state="PROGRESS", meta={"status": "Formatting", "progress": 90}
        )
        converted_video_path = convert_video_to_vertical(content_url)

        # STEP 5: Upload converted content to S3
        final_content_url = upload_file_to_s3(
            converted_video_path, email, prefix="shorts"
        )

        # Clean up converted video file
        if converted_video_path and os.path.exists(converted_video_path):
            os.remove(converted_video_path)

        # STEP 6: Save everything in DB
        save_content_to_db(email, prompt, final_content_url, viral_script, caption, virality_score)


        return {"status": "SUCCESS", "fal_url": final_content_url}

    except Exception as e:

        # Update user aura on failure (refund)
        users_collection.update_one({"email": email}, {"$inc": {"aura": 40}})

        self.update_state(
            state="FAILURE",
            meta={
                "error": str(e),
                "status": "Content generation failed",
                "progress": 100,
            },
        )
        raise Exception(f"Content generation failed: {str(e)}")
