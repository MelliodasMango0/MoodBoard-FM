import { getMoodPalette, enrichSong } from './api.js';
import { searchSpotifyTrack } from './spotifySearch.js';

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

    const title = document.getElementById('title').value.trim();
    const artist = document.getElementById('artist').value.trim();
    if (!title || !artist) return alert("Please enter both title and artist.");

    currentTitle = title;
    currentArtist = artist;

    const loading = document.getElementById('loadingIndicator');
    loading.style.display = 'block';
    paletteDisplay.innerHTML = '';
    document.body.style.setProperty('--colorA', '#111');
    document.body.style.setProperty('--colorB', '#222');

    try {
      const { palette, moodDescription } = await getMoodPalette(title, artist);
      const [itunesData, spotifyData] = await Promise.all([
        enrichSong({ title, artist }),
        searchSpotifyTrack(`${title} ${artist}`)
      ]);

      if (!palette.length) {
        paletteDisplay.innerHTML = '<p>❌ Could not generate a palette.</p>';
        return;
      }

      // Background gradient
      document.body.style.setProperty('--colorA', palette[0]);
      document.body.style.setProperty('--colorB', palette[1] || palette[0]);

      // Mood description
      if (moodDescription) {
        const moodText = document.createElement('p');
        moodText.textContent = moodDescription;
        moodText.className = 'mood-text';
        paletteDisplay.appendChild(moodText);
      }

      // Merge data sources
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
      loading.style.display = 'none';
    }
  });

  regenBtn.addEventListener('click', () => {
    if (currentTitle && currentArtist) {
      form.dispatchEvent(new Event('submit'));
    }
  });
});
