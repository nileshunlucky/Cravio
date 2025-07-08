import server.instaloader as instaloader
import os
import uuid
from pathlib import Path

TEMP_DIR = "Faceswap"
os.makedirs(TEMP_DIR, exist_ok=True)

def download_instagram_post_image(insta_url: str) -> str:
    try:
        loader = instaloader.Instaloader(
            download_pictures=True,
            download_videos=False,
            download_video_thumbnails=False,
            download_comments=False,
            save_metadata=False,
            post_metadata_txt_pattern="",
        )

        # Extract shortcode from URL
        if "instagram.com/" in insta_url:
            shortcode = insta_url.rstrip("/").split("/")[-1]
        else:
            raise ValueError("Unsupported Instagram URL")

        # Load post
        post = instaloader.Post.from_shortcode(loader.context, shortcode)

        # Determine image URL
        image_url = None

        if post.typename == "GraphSidecar":
            # Carousel: pick first real image (skip videos)
            for node in post.get_sidecar_nodes():
                if not node.is_video:
                    image_url = node.display_url
                    break
        else:
            # Single post
            if not post.is_video:
                image_url = post.url

        if not image_url:
            raise Exception("No image found in this post")

        # Save to file
        filename = f"{uuid.uuid4().hex}_insta.jpg"
        filepath = os.path.join(TEMP_DIR, filename)
        loader.download_pic(Path(filepath), image_url, post.date_utc)

        return filepath

    except Exception as e:
        print(f"[Instaloader Error] {e}")
        raise Exception(f"Failed to download Instagram image: {str(e)}")
