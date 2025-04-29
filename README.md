# MoodBoard FM

## Project Overview
MoodBoard FM is a web application that dynamically generates a vibrant color palette and animated visual effects based on a song selected by the user. The project combines frontend animations with backend AI and music data enrichment to create an immersive, music-driven visual experience.

Users input a song title and artist, and the app generates:
- A 7-color linear gradient palette based on the song's emotional tone.
- Animated background effects (particles, ambient shapes, audio-synced waves) reflecting the song’s mood.
- A short caption describing the mood of the song.

The application retrieves additional song metadata, artwork, and audio previews using external APIs.

---

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express.js
- **APIs Integrated**:
  - OpenAI API (for mood and palette generation)
  - Spotify API (for song metadata and BPM/tempo analysis)
  - iTunes Search API (for song preview URLs and backup artwork)

---

## Project Structure
- `frontend/`
  - Main web app files (HTML, CSS, JavaScript)
- `server.js`
  - Node.js server handling API requests, OpenAI calls, and Spotify/iTunes integrations
- `.env`
  - Environment variables for API keys (not committed to version control)

---

## Installation and Setup
1. Clone the repository.
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following:
   ```
   OPENAI_API_KEY=your_openai_key
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```
4. Start the server:
   ```bash
   node server.js
   ```
5. Open `index.html` in your browser (using Live Server extension or similar).

---

## How It Works
- When the user submits a song:
  - The backend uses OpenAI to generate a **mood description** and a **7-color palette**.
  - Spotify and iTunes APIs are used to retrieve the song's preview audio, artwork, and tempo.
  - The frontend animates a flowing linear gradient background based on the palette and triggers particle effects and synchronized wave animations according to the song's BPM.
  
---

## Equipment Used
- Developed and tested on a MacBook Pro running macOS
- Node.js v20.x
- Google Chrome, Safari, and Firefox browsers for testing

---

## Notes
- This project uses the **OpenAI GPT-4 Turbo model** for fast and creative palette generation.
- Spotify Client Credentials flow is used for public API access (no user login required).
- iTunes is used as a fallback source to ensure most songs have a working 30-second preview.
