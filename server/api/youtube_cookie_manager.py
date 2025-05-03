import os
import sys
import json
import time
import sqlite3
import browser_cookie3
import http.cookiejar
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("youtube_auth")

def get_youtube_cookies_from_browser():
    """Extract YouTube cookies from installed browsers and save them to a file"""
    
    cookies_path = "youtube_cookies.txt"
    logger.info(f"Attempting to extract YouTube cookies to {cookies_path}")
    
    # Track if we successfully found cookies
    found_cookies = False
    
    # Browsers to try, in order of preference
    browsers = [
        ('chrome', browser_cookie3.chrome),
        ('firefox', browser_cookie3.firefox),
        ('edge', browser_cookie3.edge),
        ('brave', browser_cookie3.brave),
        ('opera', browser_cookie3.opera),
        ('safari', browser_cookie3.safari),
    ]
    
    cookie_jar = http.cookiejar.MozillaCookieJar(cookies_path)
    
    # Try each browser
    for browser_name, browser_func in browsers:
        try:
            logger.info(f"Attempting to extract cookies from {browser_name}...")
            browser_cookies = browser_func(domain_name='.youtube.com')
            
            # Count YouTube cookies
            youtube_cookies = [c for c in browser_cookies if '.youtube.com' in c.domain]
            if youtube_cookies:
                logger.info(f"Found {len(youtube_cookies)} YouTube cookies in {browser_name}")
                
                # Add cookies to our jar
                for cookie in youtube_cookies:
                    cookie_jar.set_cookie(cookie)
                
                found_cookies = True
            else:
                logger.info(f"No YouTube cookies found in {browser_name}")
                
        except Exception as e:
            logger.info(f"Could not extract cookies from {browser_name}: {str(e)}")
    
    # Also try Google cookies which might help with YouTube auth
    for browser_name, browser_func in browsers:
        try:
            google_cookies = browser_func(domain_name='.google.com')
            google_cookies_count = len([c for c in google_cookies if '.google.com' in c.domain])
            
            if google_cookies_count > 0:
                logger.info(f"Found {google_cookies_count} Google cookies in {browser_name}")
                
                # Add cookies to our jar
                for cookie in google_cookies:
                    if '.google.com' in cookie.domain:
                        cookie_jar.set_cookie(cookie)
                        
                found_cookies = True
        except Exception as e:
            pass  # Already logged the browser error above
    
    # Save cookies if we found any
    if found_cookies:
        try:
            cookie_jar.save(ignore_discard=True, ignore_expires=True)
            logger.info(f"Successfully saved cookies to {cookies_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to save cookies: {str(e)}")
            return False
    else:
        logger.warning("No YouTube cookies found in any browser")
        return False

def check_cookie_file():
    """Check if the cookie file exists and has content"""
    cookies_path = "youtube_cookies.txt"
    
    if os.path.exists(cookies_path):
        size = os.path.getsize(cookies_path)
        logger.info(f"Cookie file exists with size: {size} bytes")
        
        if size > 100:  # If file has meaningful content
            # Check file age
            mtime = os.path.getmtime(cookies_path)
            age_days = (time.time() - mtime) / (60 * 60 * 24)
            
            if age_days > 7:
                logger.warning(f"Cookie file is {age_days:.1f} days old and may be expired")
                return False
            return True
        else:
            logger.warning("Cookie file exists but is too small to contain valid cookies")
            return False
    else:
        logger.info("Cookie file doesn't exist")
        return False

def manual_cookie_instructions():
    """Print instructions for manually getting YouTube cookies"""
    print("\n==================== MANUAL COOKIE EXTRACTION ====================")
    print("To manually extract YouTube cookies:")
    print("1. Install the 'Get cookies.txt' browser extension")
    print("   - Chrome: https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid")
    print("   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/")
    print("2. Log in to YouTube in your browser")
    print("3. Navigate to youtube.com")
    print("4. Click on the extension icon and export cookies")
    print("5. Save the file as 'youtube_cookies.txt' in this application's directory")
    print("=================================================================\n")

def main():
    """Main function to check and update YouTube cookies"""
    logger.info("Starting YouTube cookie manager")
    
    # Check if cookie file exists and is valid
    if check_cookie_file():
        logger.info("Valid cookie file found. No action needed.")
        return True
        
    # Try to get cookies from browser
    if get_youtube_cookies_from_browser():
        logger.info("Successfully updated cookies from browser")
        return True
    
    # If we're here, we couldn't get cookies automatically
    logger.warning("Couldn't automatically extract YouTube cookies")
    manual_cookie_instructions()
    return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)