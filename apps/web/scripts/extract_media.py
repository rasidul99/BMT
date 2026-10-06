import sys
import json
import os
import re
import shutil
import subprocess
import urllib.request
import urllib.error
import time
import warnings

# Suppress all python warnings
warnings.filterwarnings("ignore")

# Force UTF-8 on Windows stdout & stderr to avoid UnicodeEncodeError (cp1252 emoji crash)
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Ensure static_ffmpeg is loaded and in PATH
ffmpeg_dir = None
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
    ffmpeg_exe = shutil.which('ffmpeg')
    if ffmpeg_exe:
        ffmpeg_dir = os.path.dirname(ffmpeg_exe)
except Exception:
    pass

if not ffmpeg_dir:
    ffmpeg_exe = shutil.which('ffmpeg')
    if ffmpeg_exe:
        ffmpeg_dir = os.path.dirname(ffmpeg_exe)

import yt_dlp

def resolve_redirects(url):
    """Resolve shortened URLs (pin.it, vm.tiktok.com, vt.tiktok.com, youtu.be, fb.watch) to canonical URLs"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as resp:
            return resp.geturl()
    except Exception:
        return url

def detect_platform(url):
    u = url.lower()
    if 'youtube.com' in u or 'youtu.be' in u:
        return 'YouTube'
    elif 'tiktok.com' in u:
        return 'TikTok'
    elif 'pinterest.' in u or 'pin.it' in u:
        return 'Pinterest'
    elif 'instagram.com' in u:
        return 'Instagram'
    elif 'facebook.com' in u or 'fb.watch' in u or 'fb.com' in u:
        return 'Facebook'
    elif 'twitter.com' in u or 'x.com' in u:
        return 'Twitter / X'
    elif 'reddit.com' in u or 'v.redd.it' in u:
        return 'Reddit'
    elif 'vimeo.com' in u:
        return 'Vimeo'
    elif any(u.endswith(ext) or ext + '?' in u for ext in ['.mp4', '.mov', '.webm', '.m4v']):
        return 'Direct Video'
    return 'Web Video'

def ensure_universal_h264_mp4(file_path):
    """
    Ensure video is in universal MP4 container with H.264 (AVC) video and AAC audio.
    Guarantees seamless playback in HTML5 <video>, Windows Media Player, QuickTime, and mobile.
    """
    if not os.path.exists(file_path):
        return file_path

    base_name = os.path.splitext(file_path)[0]
    target_mp4 = f"{base_name}.mp4"
    is_already_mp4 = file_path.lower().endswith('.mp4')

    try:
        # Check current video and audio codecs with ffprobe
        needs_transcode = not is_already_mp4
        if is_already_mp4 and ffmpeg_dir:
            probe_cmd = [
                'ffprobe', '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=codec_name',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                file_path
            ]
            codec = subprocess.check_output(probe_cmd, stderr=subprocess.DEVNULL).decode('utf-8', errors='ignore').strip().lower()
            if codec not in ['h264', 'avc', 'avc1']:
                needs_transcode = True

        if needs_transcode:
            dir_name = os.path.dirname(file_path)
            temp_mp4 = os.path.join(dir_name, f"universal_{int(time.time())}_{os.path.basename(target_mp4)}")
            ffmpeg_cmd = [
                'ffmpeg', '-y',
                '-i', file_path,
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-crf', '22',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-movflags', '+faststart',
                temp_mp4
            ]
            subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            if os.path.exists(temp_mp4) and os.path.getsize(temp_mp4) > 1000:
                if file_path != target_mp4 and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass
                os.replace(temp_mp4, target_mp4)
                return target_mp4
    except Exception:
        pass

    return file_path

def extract_pinterest_fallback(url, output_dir):
    """Direct scraper fallback for Pinterest Video Pins"""
    resolved_url = resolve_redirects(url)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    req = urllib.request.Request(resolved_url, headers=headers)
    html = ""
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')

    # Look for v.pinimg.com video MP4 links
    video_url = None
    v_matches = re.findall(r'(https://v\.pinimg\.com/videos/[^\s"\'<>\\]+?\.mp4)', html)
    if v_matches:
        v_720 = [v for v in v_matches if '720p' in v]
        video_url = v_720[0] if v_720 else v_matches[0]

    if not video_url:
        og_match = re.search(r'<meta property="og:video" content="([^"]+)"', html)
        if og_match:
            video_url = og_match.group(1)

    if not video_url:
        json_matches = re.findall(r'"url"\s*:\s*"(https://v\.pinimg\.com/[^"]+?\.mp4)"', html)
        if json_matches:
            video_url = json_matches[0]

    if not video_url:
        return None

    # Title & Thumbnail
    pin_id_match = re.search(r'/pin/(\d+)', resolved_url)
    pin_id = pin_id_match.group(1) if pin_id_match else str(int(time.time()))

    title_match = re.search(r'<meta property="og:title" content="([^"]+)"', html) or re.search(r'<title>(.*?)</title>', html)
    title = title_match.group(1).strip() if title_match else f"Pinterest Video #{pin_id}"
    title = ' '.join(title.splitlines())[:120].strip()

    thumb_match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
    thumbnail = thumb_match.group(1) if thumb_match else ""

    # Download video file
    filename = f"pinterest_{pin_id}.mp4"
    file_path = os.path.join(output_dir, filename)

    download_req = urllib.request.Request(video_url, headers=headers)
    with urllib.request.urlopen(download_req, timeout=30) as d_resp, open(file_path, 'wb') as f_out:
        shutil.copyfileobj(d_resp, f_out)

    file_size_mb = "2.0 MB"
    if os.path.exists(file_path):
        size_bytes = os.path.getsize(file_path)
        file_size_mb = f"{(size_bytes / (1024 * 1024)):.1f} MB"

    return {
        "success": True,
        "id": pin_id,
        "title": title,
        "platform": "Pinterest",
        "duration": "0:30 min",
        "fileSize": file_size_mb,
        "filename": filename,
        "videoUrl": f"/downloads/{filename}",
        "thumbnailUrl": thumbnail,
    }

def extract_direct_video(url, output_dir):
    """Direct downloader for raw MP4 / video CDN links"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    }
    content_id = f"video_{int(time.time())}"
    filename = f"{content_id}.mp4"
    file_path = os.path.join(output_dir, filename)

    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp, open(file_path, 'wb') as f_out:
        shutil.copyfileobj(resp, f_out)

    file_size_mb = "3.5 MB"
    if os.path.exists(file_path):
        size_bytes = os.path.getsize(file_path)
        file_size_mb = f"{(size_bytes / (1024 * 1024)):.1f} MB"

    return {
        "success": True,
        "id": content_id,
        "title": f"Direct Web Video #{content_id[-6:]}",
        "platform": "Direct Video",
        "duration": "0:30 min",
        "fileSize": file_size_mb,
        "filename": filename,
        "videoUrl": f"/downloads/{filename}",
        "thumbnailUrl": "",
    }

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing url or output_dir"}))
        sys.exit(1)

    raw_url = sys.argv[1].strip()
    output_dir = sys.argv[2]
    media_format = sys.argv[3] if len(sys.argv) > 3 else "video"

    is_audio = "audio" in media_format.lower() or "mp3" in media_format.lower()
    os.makedirs(output_dir, exist_ok=True)

    # 1. Resolve redirect for shortened social URLs
    target_url = resolve_redirects(raw_url)
    platform = detect_platform(target_url)

    # 2. Check if direct video link
    if platform == "Direct Video" and not is_audio:
        try:
            direct_result = extract_direct_video(target_url, output_dir)
            if direct_result:
                print(json.dumps(direct_result))
                return
        except Exception:
            pass

    # 3. Configure Node.js runtime for YouTube deciphering
    node_path = shutil.which('node')
    if not node_path and os.path.exists(r'C:\Program Files\nodejs\node.exe'):
        node_path = r'C:\Program Files\nodejs\node.exe'

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'outtmpl': os.path.join(output_dir, '%(id)s.%(ext)s'),
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    }

    if node_path:
        ydl_opts['js_runtimes'] = {'node': {'path': node_path}}

    if ffmpeg_dir:
        ydl_opts['ffmpeg_location'] = ffmpeg_dir

    if is_audio:
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    else:
        # Prioritize 1080p/720p MP4 formats or merge into MP4
        ydl_opts['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best'
        ydl_opts['merge_output_format'] = 'mp4'

    # Platform-specific extractor arguments
    if platform == 'YouTube':
        ydl_opts['extractor_args'] = {
            'youtube': {
                'player_client': ['web', 'android', 'ios'],
            }
        }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target_url, download=True)
            if not info:
                raise Exception("Could not extract video metadata from given URL")

            content_id = str(info.get('id', 'media_' + str(int(time.time()))))
            raw_title = info.get('title') or info.get('description') or f"{platform} Video #{content_id[-6:]}"
            clean_title = ' '.join(raw_title.splitlines())[:120].strip()

            duration = info.get('duration') or 0
            mins = int(duration // 60)
            secs = int(duration % 60)
            duration_str = f"{mins}:{secs:02d} min"

            # Check downloaded file in output_dir
            ext = 'mp3' if is_audio else 'mp4'
            filename = f"{content_id}.{ext}"
            file_path = os.path.join(output_dir, filename)

            # If not matching exact name, find file starting with content_id
            if not os.path.exists(file_path):
                for f in os.listdir(output_dir):
                    if f.startswith(content_id) and not f.endswith(".part"):
                        filename = f
                        file_path = os.path.join(output_dir, f)
                        break

            # Guarantee Universal H.264 / AAC MP4 Playback
            if not is_audio and os.path.exists(file_path):
                file_path = ensure_universal_h264_mp4(file_path)
                filename = os.path.basename(file_path)

            file_size_mb = "3.2 MB"
            if os.path.exists(file_path):
                size_bytes = os.path.getsize(file_path)
                file_size_mb = f"{(size_bytes / (1024 * 1024)):.1f} MB"

            result = {
                "success": True,
                "id": content_id,
                "title": clean_title,
                "platform": platform,
                "duration": duration_str,
                "fileSize": file_size_mb,
                "filename": filename,
                "videoUrl": f"/downloads/{filename}",
                "thumbnailUrl": info.get('thumbnail') or ""
            }
            print(json.dumps(result))
            return
    except Exception as ydl_error:
        # 4. Check Pinterest fallback
        if platform == 'Pinterest':
            try:
                pin_result = extract_pinterest_fallback(target_url, output_dir)
                if pin_result:
                    print(json.dumps(pin_result))
                    return
            except Exception:
                pass

        error_msg = str(ydl_error)
        # Produce human-friendly error
        if "This video is unavailable" in error_msg:
            friendly_err = "ভিডিওটি বর্তমানে অনুপলব্ধ বা ডিলিট করা হয়েছে (Video is unavailable or removed)."
        elif "Private video" in error_msg or "Sign in" in error_msg:
            friendly_err = "ভিডিওটি প্রাইভেট বা লগইন প্রয়োজন (Video is private or requires sign-in)."
        elif "HTTP Error 404" in error_msg:
            friendly_err = "ভিডিও লিংকটি পাওয়া যায়নি (404 Not Found). সঠিক লিংক প্রদান করুন।"
        else:
            friendly_err = f"ভিডিও এক্সট্র্যাক্ট করা সম্ভব হয়নি: {error_msg[:120]}"

        print(json.dumps({
            "success": False,
            "error": friendly_err,
            "platform": platform
        }))

if __name__ == '__main__':
    main()
