/**
 * Search Spotify for a track and return preview URL + artwork
 * 
 */
export async function searchSpotifyTrack(query) {
    try {
      const res = await fetch(`http://localhost:3001/search?q=${encodeURIComponent(query)}`);
  
      if (!res.ok) {
        console.error("❌ Spotify search failed:", await res.text());
        return null;
      }
  
      const data = await res.json();
      return {
        title: data.title,
        artist: data.artist,
        previewUrl: data.previewUrl,
        artwork: data.artwork,
        id: data.id
      };
    } catch (err) {
      console.error("❌ Spotify search error:", err);
      return null;
    }
  }
  
  /**
   * get artwork URL
   */
  export async function getSpotifyArtwork(title, artist) {
    const fullQuery = `${title} ${artist}`;
    const result = await searchSpotifyTrack(fullQuery);
    return result?.artwork || null;
  }
  