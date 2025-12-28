// Splash Screen Handler
window.addEventListener('load', () => {
    const splash = document.getElementById('splashScreen');
    setTimeout(() => {
        splash.classList.add('fade-out');
    }, 2000); // 2 seconds splash
});

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('results');
const loadingEl = document.getElementById('loading');
const welcomeMessage = document.getElementById('welcomeMessage');
const playerSection = document.getElementById('playerSection');
const audioPlayer = document.getElementById('audioPlayer');
const videoPlayer = document.getElementById('videoPlayer');
const mainAudioPlayer = document.getElementById('mainAudioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');

const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const playerTitle = document.getElementById('playerTitle');
const playerThumb = document.getElementById('playerThumb');

let playlist = [];
let currentIndex = -1;
let isPlaying = false;

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    loadingEl.classList.remove('hidden');
    welcomeMessage.classList.add('hidden');
    resultsContainer.innerHTML = '';

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.error) {
            resultsContainer.innerHTML = '';
            const errorP = document.createElement('p');
            errorP.className = 'error';
            errorP.textContent = 'שגיאה: ' + data.error;
            resultsContainer.appendChild(errorP);
            return;
        }

        playlist = data.results;
        renderResults(playlist);
    } catch (error) {
        resultsContainer.innerHTML = `<p class="error">שגיאה בחיפוש</p>`;
    } finally {
        loadingEl.classList.add('hidden');
    }
}

function renderResults(results) {
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6);">לא נמצאו תוצאות</p>';
        return;
    }

    resultsContainer.innerHTML = '';
    
    results.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.dataset.index = index;
        card.dataset.id = song.id.toString();

        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'thumbnail-container';

        const img = document.createElement('img');
        img.src = song.thumbnail;
        img.alt = song.title;
        img.className = 'song-thumbnail';
        img.loading = 'lazy';

        const playOverlay = document.createElement('div');
        playOverlay.className = 'play-overlay';
        const playIcon = document.createElement('span');
        playIcon.textContent = '▶️';
        playOverlay.appendChild(playIcon);

        thumbContainer.appendChild(img);
        thumbContainer.appendChild(playOverlay);

        const songInfo = document.createElement('div');
        songInfo.className = 'song-info';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'song-title';
        titleDiv.textContent = song.title;

        const channelDiv = document.createElement('div');
        channelDiv.className = 'song-channel';
        channelDiv.textContent = song.channel;

        const durationDiv = document.createElement('div');
        durationDiv.className = 'song-duration';
        durationDiv.textContent = formatDuration(song.duration);

        songInfo.appendChild(titleDiv);
        songInfo.appendChild(channelDiv);
        songInfo.appendChild(durationDiv);

        card.appendChild(thumbContainer);
        card.appendChild(songInfo);
        resultsContainer.appendChild(card);
    });

    document.querySelectorAll('.song-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.index);
            playSong(index);
        });
    });
}

async function playSong(index) {
    if (index < 0 || index >= playlist.length) return;

    currentIndex = index;
    const song = playlist[index];

    playerSection.classList.remove('hidden');
    playerTitle.textContent = song.title;
    playPauseBtn.textContent = '⏸️';
    
    // Scroll to player instead of top for YouTube feel
    playerSection.scrollIntoView({ behavior: 'smooth' });

    document.querySelectorAll('.song-card').forEach(card => {
        card.classList.remove('playing');
    });
    document.querySelector(`.song-card[data-index="${index}"]`)?.classList.add('playing');

    try {
        const response = await fetch(`/stream/${song.id}`);
        const data = await response.json();

        if (data.error) {
            alert('שגיאה בהשמעה: ' + data.error);
            return;
        }

        // Use both players for best compatibility
        videoPlayer.src = data.url;
        if (mainAudioPlayer) {
            mainAudioPlayer.src = data.audio_url || data.url;
        }
        videoPlayer.classList.remove('hidden');
        
        const playPromise = videoPlayer.play();
        if (mainAudioPlayer) mainAudioPlayer.play().catch(() => {});
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Playback failed:", error);
                if (data.audio_url && data.audio_url !== data.url) {
                    videoPlayer.src = data.audio_url;
                    videoPlayer.play().catch(e => alert('שגיאה בהשמעת הסרטון'));
                }
            });
        }
        isPlaying = true;
        playPauseBtn.textContent = '⏸️';

    // Background Playback Support (Media Session API)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.channel,
            artwork: [
                { src: song.thumbnail, sizes: '96x96', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '128x128', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '192x192', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '256x256', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '384x384', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' },
            ]
        });

        navigator.mediaSession.setActionHandler('play', () => {
            videoPlayer.play();
            if (mainAudioPlayer) mainAudioPlayer.play();
            isPlaying = true;
            playPauseBtn.textContent = '⏸️';
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            videoPlayer.pause();
            if (mainAudioPlayer) mainAudioPlayer.pause();
            isPlaying = false;
            playPauseBtn.textContent = '▶️';
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            if (currentIndex > 0) playSong(currentIndex - 1);
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            if (currentIndex < playlist.length - 1) playSong(currentIndex + 1);
        });
        
        // Ensure playback state is updated
        const updateMediaSession = () => {
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
            }
        };
        
        videoPlayer.onplay = updateMediaSession;
        videoPlayer.onpause = updateMediaSession;
        if (mainAudioPlayer) {
            mainAudioPlayer.onplay = updateMediaSession;
            mainAudioPlayer.onpause = updateMediaSession;
        }
    }
    } catch (error) {
        alert('שגיאה בהשמעה');
    }
}

playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        videoPlayer.pause();
        if (mainAudioPlayer) mainAudioPlayer.pause();
        playPauseBtn.textContent = '▶️';
    } else {
        videoPlayer.play();
        if (mainAudioPlayer) mainAudioPlayer.play();
        playPauseBtn.textContent = '⏸️';
    }
    isPlaying = !isPlaying;
});

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        playSong(currentIndex - 1);
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < playlist.length - 1) {
        playSong(currentIndex + 1);
    }
});

videoPlayer.addEventListener('timeupdate', () => {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    if (progressBar) {
        progressBar.value = progress || 0;
    }
    if (currentTimeEl) {
        currentTimeEl.textContent = formatDuration(videoPlayer.currentTime);
    }
    if (totalTimeEl) {
        totalTimeEl.textContent = formatDuration(videoPlayer.duration);
    }
});

if (progressBar) {
    progressBar.addEventListener('input', () => {
        const time = (progressBar.value / 100) * videoPlayer.duration;
        videoPlayer.currentTime = time;
    });
}



videoPlayer.addEventListener('ended', () => {
    if (currentIndex < playlist.length - 1) {
        playSong(currentIndex + 1);
    } else {
        isPlaying = false;
        playPauseBtn.textContent = '▶️';
    }
});

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed', err));
    });
}
