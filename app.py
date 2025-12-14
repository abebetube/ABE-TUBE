from flask import Flask, render_template, jsonify, request
import yt_dlp
import re
import logging

app = Flask(__name__)

# קבע רמת לוגים
logging.basicConfig(level=logging.INFO)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'No query provided'}), 400

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
        'default_search': 'ytsearch10',
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logging.info(f"Searching for: {query}")
            results = ydl.extract_info(f"ytsearch10:{query}", download=False)
            videos = []

            if results and 'entries' in results:
                for entry in results['entries']:
                    if entry:
                        videos.append({
                            'id':
                            entry.get('id', ''),
                            'title':
                            entry.get('title', 'Unknown Title'),
                            'duration':
                            entry.get('duration', 0),
                            'thumbnail':
                            f"https://img.youtube.com/vi/{entry.get('id', '')}/mqdefault.jpg",
                            'channel':
                            entry.get('channel',
                                      entry.get('uploader', 'Unknown'))
                        })

            return jsonify({'results': videos})
    except yt_dlp.utils.DownloadError as e:
        logging.error(f"DownloadError during search: {str(e)}")
        return jsonify({
            'error': 'Error during search',
            'details': str(e)
        }), 500
    except Exception as e:
        logging.exception("Unexpected error during search")
        return jsonify({'error': 'Unexpected error', 'details': str(e)}), 500


@app.route('/stream/<video_id>')
def stream(video_id):
    if not re.match(r'^[a-zA-Z0-9_-]{11}$', video_id):
        return jsonify({'error': 'Invalid video ID'}), 400

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'format': 'bestaudio/best',
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logging.info(f"Extracting info for video ID: {video_id}")
            info = ydl.extract_info(
                f"https://www.youtube.com/watch?v={video_id}", download=False)

            formats = info.get('formats', [])
            audio_formats = [
                f for f in formats
                if f.get('acodec') != 'none' and f.get('vcodec') == 'none'
            ]

            audio_url = None
            if audio_formats:
                audio_url = audio_formats[0].get('url')
            elif formats:
                audio_url = formats[-1].get('url')

            if audio_url:
                return jsonify({
                    'url':
                    audio_url,
                    'title':
                    info.get('title', 'Unknown'),
                    'duration':
                    info.get('duration', 0),
                    'thumbnail':
                    info.get(
                        'thumbnail',
                        f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg")
                })
            else:
                logging.error("Could not extract audio URL")
                return jsonify({'error': 'Could not extract audio URL'}), 500

    except yt_dlp.utils.DownloadError as e:
        logging.error(f"DownloadError during stream: {str(e)}")
        return jsonify({
            'error': 'Error fetching video info',
            'details': str(e)
        }), 500
    except Exception as e:
        logging.exception("Unexpected error during stream")
        return jsonify({'error': 'Unexpected error', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
