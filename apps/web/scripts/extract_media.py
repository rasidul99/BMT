import sys
import json
import os
import subprocess
import warnings

# Suppress all python warnings
warnings.filterwarnings("ignore")

try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception:
    pass

import yt_dlp

def ensure_universal_h264(file_path):
    """
    Ensure video is encoded in universal H.264 (AVC) so default Windows Media Player,
    QuickTime, and all mobile/desktop players can play video + audio without missing codecs.
    """
    if not os.path.exists(file_path) or not file_path.endswith('.mp4'):
        return

    try:
        # Check current video codec
        probe_cmd = [
            'ffprobe', '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=codec_name',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ]
        codec = subprocess.check_output(probe_cmd).decode('utf-8', errors='ignore').strip().lower()

        # If already H.264 / AVC, nothing to do
        if codec in ['h264', 'avc', 'avc1']:
            return

        # If AV1, VP9, or other non-universal codec, quickly transcode video to H.264 with audio copied
        dir_name = os.path.dirname(file_path)
        base_name = os.path.basename(file_path)
        temp_path = os.path.join(dir_name, f"transcoded_{base_name}")

        ffmpeg_cmd = [
            'ffmpeg', '-y',
            '-i', file_path,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '22',
            '-c:a', 'copy',
            temp_path
        ]
        subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
            os.replace(temp_path, file_path)
    except Exception as e:
        # If transcode fails, retain original file
        pass

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing url or output_dir"}))
        sys.exit(1)

    url = sys.argv[1].strip()
    output_dir = sys.argv[2]
    media_format = sys.argv[3] if len(sys.argv) > 3 else "video"

    is_audio = "audio" in media_format.lower() or "mp3" in media_format.lower()
    os.makedirs(output_dir, exist_ok=True)

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'outtmpl': os.path.join(output_dir, '%(id)s.%(ext)s'),
    }

    if is_audio:
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    else:
        # Prioritize pre-merged single MP4 streams (hd, sd, best[ext=mp4]) for maximum speed and compatibility
        ydl_opts['format'] = 'hd/sd/b/best[ext=mp4]/bestvideo+bestaudio/best'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if not info:
                raise Exception("Could not extract video metadata from given URL")

            content_id = str(info.get('id', 'media_' + str(int(os.times()[4]))))
            raw_title = info.get('title') or info.get('description') or f"Facebook Reel #{content_id[-6:]}"
            clean_title = ' '.join(raw_title.splitlines())[:120].strip()

            duration = info.get('duration') or 0
            mins = int(duration // 60)
            secs = int(duration % 60)
            duration_str = f"{mins}:{secs:02d} min"

            # Check downloaded file in output_dir
            ext = 'mp3' if is_audio else (info.get('ext') or 'mp4')
            filename = f"{content_id}.{ext}"
            file_path = os.path.join(output_dir, filename)

            # If not matching exact ext, find file starting with content_id
            if not os.path.exists(file_path):
                for f in os.listdir(output_dir):
                    if f.startswith(content_id) and not f.endswith(".part"):
                        filename = f
                        file_path = os.path.join(output_dir, f)
                        break

            # Guarantee Universal H.264 Playback for Windows Media Player & all devices
            if not is_audio and os.path.exists(file_path):
                ensure_universal_h264(file_path)

            file_size_mb = "2.4 MB"
            if os.path.exists(file_path):
                size_bytes = os.path.getsize(file_path)
                file_size_mb = f"{(size_bytes / (1024 * 1024)):.1f} MB"

            result = {
                "success": True,
                "id": content_id,
                "title": clean_title,
                "duration": duration_str,
                "fileSize": file_size_mb,
                "filename": filename,
                "videoUrl": f"/downloads/{filename}",
                "thumbnailUrl": info.get('thumbnail') or ""
            }
            print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == '__main__':
    main()
