import sys
import json
import os
import warnings

# Suppress all python warnings
warnings.filterwarnings("ignore")

import yt_dlp

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing url or output_dir"}))
        sys.exit(1)

    url = sys.argv[1]
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
        ydl_opts['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            content_id = str(info.get('id', 'media_' + str(int(os.times()[4]))))
            title = info.get('title') or info.get('description') or f"Media {content_id}"
            clean_title = ' '.join(title.splitlines())[:120].strip()
            
            duration = info.get('duration', 0)
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
                    if f.startswith(content_id):
                        filename = f
                        file_path = os.path.join(output_dir, f)
                        break

            file_size_mb = "1.5 MB"
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
            # Pure JSON output
            print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == '__main__':
    main()
