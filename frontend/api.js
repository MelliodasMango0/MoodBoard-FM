/**
 * Sends a song title and artist to the backend to generate a mood-based color palette.
 * Returns an array of hex colors.
 */
export async function getMoodPalette(title, artist) {
  try {
    const res = await fetch("http://localhost:3001/mood-palette", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GPT server error: ${res.status} — ${text}`);
    }

    const data = await res.json();
    return {
      palette: data.palette || [],
      moodDescription: data.moodDescription || ''
    };
  } catch (err) {
    console.error("❌ Failed to get mood palette:", err);
    return {
      palette: [],
      moodDescription: ''
    };
  }
}

  /**
   * Disambiguates the uploaded song using OpenAI 
   */
  export async function disambiguateUploadedSong(filename, rawTitleGuess) {
    const res = await fetch("http://localhost:3001/disambiguate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, title: rawTitleGuess })
    });
  
    const data = await res.json();
    return data; // { title, artist, genre }
  }
  
  /**
   * Enrich a song with iTunes preview URL and Spotify artwork
   */
  export async function enrichSong(song) {
    try {
      const res = await fetch("http://localhost:3001/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(song)
      });
  
      if (!res.ok) {
        const text = await res.text(); // log actual response
        throw new Error(`Server error: ${res.status} — ${text}`);
      }
  
      return await res.json();
    } catch (err) {
      console.error("❌ Failed to enrich song:", err);
      return {}; 
    }
  }
  