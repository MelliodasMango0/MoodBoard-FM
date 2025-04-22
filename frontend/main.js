import { getMoodPalette, enrichSong } from './api.js';
import { searchSpotifyTrack } from './spotifySearch.js';

let particleInterval = null; // global tracker

function startParticleLoop(baseColor) {
  stopParticleLoop(); 
  const isDark = isDarkColor(baseColor);

  particleInterval = setInterval(() => {
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('div');
      p.className = 'particle';

      const variation = Math.floor(Math.random() * 30);
      const adjusted = lightenOrDarkenColor(baseColor, isDark ? variation : -variation);
      p.style.background = adjusted;

      p.style.left = `${Math.random() * 100}%`;
      p.style.bottom = `-10px`;
      p.style.opacity = `${Math.random() * 0.5 + 0.2}`;
      p.style.width = p.style.height = `${Math.random() * 6 + 2}px`;
      p.style.animationDelay = `0s`;
      p.style.animationDuration = `${8 + Math.random() * 6}s`;

      document.body.appendChild(p);
      setTimeout(() => p.remove(), 14000);
    }
  }, 300); 
}

function stopParticleLoop() {
  if (particleInterval) {
    clearInterval(particleInterval);
    particleInterval = null;
  }
}

function getContrastYIQ(hexcolor) {
  const c = hexcolor.replace('#', '');
  const r = parseInt(c.substr(0,2),16);
  const g = parseInt(c.substr(2,2),16);
  const b = parseInt(c.substr(4,2),16);
  const yiq = (r*299 + g*587 + b*114)/1000;
  return yiq >= 128 ? '#111' : '#fff';
}


function updateTextColorBasedOnBackground(bgHex1, bgHex2) {
  const luminance = hex => {
    const c = parseInt(hex.slice(1), 16);
    const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
    const [R, G, B] = [r, g, b].map(x => {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };

  const lumA = luminance(bgHex1);
  const lumB = luminance(bgHex2);
  const avgLum = (lumA + lumB) / 2;

  return avgLum < 0.5 ? '#ffffff' : '#111111';
}



function isDarkColor(hex) {
  if (!hex.startsWith('#')) return false;
  const c = hex.slice(1);
  const bigint = parseInt(c, 16);
  const r = (bigint >> 16) & 255;
  const g = ((bigint >> 8) & 255);
  const b = (bigint & 255);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function lightenOrDarkenColor(hex, amt) {
  let col = hex.slice(1);
  let num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0x00FF) + amt;
  let b = (num & 0x0000FF) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

function createAmbientShapes(colors = ['#ffffff11', '#ffffff22']) {
  // Clear any existing ambient shapes
  document.querySelectorAll('.ambient-shape').forEach(el => el.remove());

  colors.forEach((color, i) => {
    const shape = document.createElement('div');
    shape.className = 'ambient-shape';
    shape.style.background = `radial-gradient(circle, ${color}, transparent 70%)`;
    shape.style.top = `${Math.random() * 80}%`;
    shape.style.left = `${Math.random() * 80}%`;
    shape.style.animationDuration = `${40 + i * 20}s`;
    shape.style.width = shape.style.height = `${300 + i * 100}px`;
    document.querySelector('.ambient-layer').appendChild(shape);
  });
}

// document.addEventListener('mousemove', (e) => {
//   const x = (e.clientX / window.innerWidth - 0.5) * 10;
//   const y = (e.clientY / window.innerHeight - 0.5) * 10;
//   document.querySelector('.ui-container').style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
// });


document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('songForm');
  const regenBtn = document.getElementById('regenBtn');
  const paletteDisplay = document.getElementById('paletteDisplay');
  document.getElementById('title').value = '';
  document.getElementById('artist').value = '';
  let currentTitle = '';
  let currentArtist = '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    stopParticleLoop();
    const title = document.getElementById('title').value.trim();
    const artist = document.getElementById('artist').value.trim();
    if (!title || !artist) return alert("Please enter both title and artist.");

    currentTitle = title;
    currentArtist = artist;

    const loading = document.getElementById('loadingIndicator');
    loading.style.display = 'block';
    paletteDisplay.innerHTML = '';

    const shimmer = document.createElement('div');
    shimmer.className = 'shimmer-placeholder';
    paletteDisplay.appendChild(shimmer);

    try {
      const { palette, moodDescription } = await getMoodPalette(title, artist);
      document.body.style.setProperty('--colorA', palette[0]);
      document.body.style.setProperty('--colorB', palette[1] || palette[0]);
      const textColor = updateTextColorBasedOnBackground(palette[0], palette[1] || palette[0]);
      document.body.style.setProperty('--textColor', textColor);
      createAmbientShapes([palette[0] + '22', palette[1] + '11']); 
      startParticleLoop(palette[0]);
      const [itunesData, spotifyData] = await Promise.all([
        enrichSong({ title, artist }),
        searchSpotifyTrack(`${title} ${artist}`)
      ]);

      if (!palette.length) {
        paletteDisplay.innerHTML = '<p>❌ Could not generate a palette.</p>';
        return;
      }

      document.body.style.setProperty('--colorA', palette[0]);
      document.body.style.setProperty('--colorB', palette[1] || palette[0]);

      if (moodDescription) {
        const moodText = document.createElement('p');
        const cleanMood = moodDescription.replace(/^Mood:\s*/i, '');
        moodText.textContent = cleanMood;
        moodText.className = 'mood-text';
        paletteDisplay.appendChild(moodText);
      }

      if (itunesData || spotifyData) {
        const displayTitle = spotifyData?.title || itunesData?.title || title;
        const displayArtist = spotifyData?.artist || itunesData?.artist || artist;
        const previewUrl = itunesData?.previewUrl || null;
        const artwork = spotifyData?.artwork || itunesData?.artwork || '';

        const infoContainer = document.createElement('div');
        infoContainer.className = 'song-info';

        const artworkImg = document.createElement('img');
        artworkImg.src = artwork;
        artworkImg.alt = `${displayTitle} artwork`;
        artworkImg.className = 'album-art';

        const titleInfo = document.createElement('p');
        titleInfo.textContent = `${displayTitle} – ${displayArtist}`;
        titleInfo.className = 'song-title';

        infoContainer.appendChild(artworkImg);
        infoContainer.appendChild(titleInfo);

        if (previewUrl) {
          const audio = document.createElement('audio');
          audio.src = previewUrl;
          audio.controls = true;
          audio.className = 'preview-player';
          infoContainer.appendChild(audio);


          audio.addEventListener('play', () => artworkImg.classList.add('pulsing'));
          audio.addEventListener('pause', () => artworkImg.classList.remove('pulsing'));
          audio.addEventListener('ended', () => artworkImg.classList.remove('pulsing'));
        } else {
          const noPreview = document.createElement('p');
          noPreview.textContent = "No preview available.";
          noPreview.style.fontSize = '0.8rem';
          infoContainer.appendChild(noPreview);
        }

        paletteDisplay.appendChild(infoContainer);
      }
    } catch (err) {
      console.error("❌ Error during moodboard generation:", err);
      paletteDisplay.innerHTML = '<p>Something went wrong. Try again.</p>';
    } finally {
      document.querySelector('.shimmer-placeholder')?.remove();
      loading.style.display = 'none';
    }
  });

  regenBtn.addEventListener('click', () => {
    if (currentTitle && currentArtist) {
      form.dispatchEvent(new Event('submit'));
    }
  });
});
