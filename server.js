import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

import OpenAI from 'openai';

// ===== OpenAI GPT Setup =====
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

// ===== Spotify API Setup =====
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

// ===== GPT Mood Palette Endpoint =====
function buildMoodPrompt(title, artist) {
  return `You are a creative assistant that translates music into visual color themes.

A user is analyzing the song "${title}" by "${artist}". Based on the song's emotional tone, mood, and sonic atmosphere (consider tempo, instrumentation, and genre), generate a short descriptive sentence of the song’s mood. Then return a list of 4–5 hex color codes that best capture the emotion and energy of the music. These colors should be suitable for use in a relaxing, visually rich moodboard app.

Return only the color hex codes in a JSON array, like: ["#112233", "#445566", "#778899"]`;
}

app.post('/mood-palette', async (req, res) => {
    const { title, artist } = req.body;
    if (!title || !artist) return res.status(400).json({ error: 'Missing title or artist' });
  
    const prompt = buildMoodPrompt(title, artist);
  
    try {
      const gptRes = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      });
  
      if (!gptRes || !gptRes.choices || !gptRes.choices[0]?.message?.content) {
        throw new Error("Invalid GPT response");
      }
  
      const responseText = gptRes.choices[0].message.content;
  
      const match = responseText.match(/\[[^\]]+\]/);
      const palette = match ? JSON.parse(match[0]) : [];
  
      const lines = responseText.split("\n").filter(line => line.trim().length > 0);
      const description = lines.find(line => !line.includes("#") && !line.includes("["));
  
      res.json({ palette, moodDescription: description || "" });
  
    } catch (err) {
      console.error('❌ GPT API error:', err);
      res.status(500).json({ error: 'Failed to generate mood palette' });
    }
  });
  

// ===== Spotify Preview / Artwork Endpoint =====
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send('Missing search query');

  try {
    const token = await getSpotifyToken();

    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await searchRes.json();
    const track = data.tracks?.items?.[0];

    if (!track) return res.status(404).send('Track not found');

    res.json({
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      previewUrl: track.preview_url,
      artwork: track.album.images?.[0]?.url || '',
    });
  } catch (err) {
    console.error('❌ Spotify search error:', err);
    res.status(500).send('Spotify search failed');
  }
});

app.post('/enrich', async (req, res) => {
    const { title, artist } = req.body;
    if (!title || !artist) return res.status(400).json({ error: 'Missing title or artist' });
  
    try {
      const query = `${title} ${artist}`.replace(/[-_]/g, " ").trim();
  
      // iTunes search
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`);
      const itunesData = await itunesRes.json();
  
      if (!itunesData.results.length) {
        return res.status(404).json({ error: 'No iTunes matches found' });
      }
  
      const filtered = itunesData.results.filter(track =>
        track.artistName.toLowerCase() === artist.toLowerCase() &&
        !/karaoke|cover|remix|tribute|live/i.test(track.collectionName)
      );
  
      const bestMatch = filtered[0] || itunesData.results[0];
  
      if (!bestMatch?.previewUrl) {
        console.log("❌ No iTunes preview available for:", query);
      }
  
      // Spotify fallback for artwork if needed
      let artwork = bestMatch.artworkUrl100 || '';
      if (!artwork) {
        const token = await getSpotifyToken();
        const spotifyRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const spotifyJson = await spotifyRes.json();
        artwork = spotifyJson.tracks?.items?.[0]?.album?.images?.[0]?.url || '';
      }
  
      res.json({
        title: bestMatch.trackName || title,
        artist: bestMatch.artistName || artist,
        previewUrl: bestMatch.previewUrl || null,
        artwork,
        genre: bestMatch.primaryGenreName || 'unknown'
      });
  
    } catch (err) {
      console.error('❌ Failed to enrich song:', err);
      res.status(500).json({ error: 'Failed to enrich song data' });
    }
  });
  
  

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🎨 MoodBoard FM server running at http://localhost:${PORT}`);
});
