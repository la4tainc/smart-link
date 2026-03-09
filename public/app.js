async function loadConfig() {
  // 1) Try backend API (for local Node dev)
  try {
    const apiRes = await fetch('/api/config', { cache: 'no-store' });
    if (apiRes.ok) {
      return await apiRes.json();
    }
  } catch (_) {
    // ignore and fall back to static file
  }

  // 2) Fallback to static config.json next to index.html (for GitHub Pages/static hosting)
  try {
    const res = await fetch('config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch static config');
    return await res.json();
  } catch (err) {
    console.error('Error loading config', err);
    return {};
  }
}

function deriveSpotifyUri(spotifyUrl) {
  try {
    if (!spotifyUrl) return null;
    const url = new URL(spotifyUrl);
    if (url.hostname !== 'open.spotify.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const type = parts[0];
    const id = parts[1];
    return `spotify:${type}:${id}`;
  } catch {
    return null;
  }
}

async function initPage() {
  const cfg = await loadConfig();

  // Apply theme colors
  // Keep body background consistent with app styling; ignore configurable backgroundColor.
  if (cfg.primaryColor) {
    document.documentElement.style.setProperty('--primary', cfg.primaryColor);
  }
  if (cfg.accentColor) {
    document.documentElement.style.setProperty('--accent', cfg.accentColor);
  }

  // Basic text content
  if (cfg.pageTitle) {
    document.title = cfg.pageTitle;
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = cfg.pageTitle;
  }
  if (cfg.artistName) {
    const artistEl = document.getElementById('artistName');
    if (artistEl) artistEl.textContent = cfg.artistName;
  }
  if (cfg.headline) {
    const headlineEl = document.getElementById('headline');
    if (headlineEl) headlineEl.textContent = cfg.headline;
  }
  if (cfg.logoText) {
    const logoEl = document.getElementById('logoText');
    if (logoEl) logoEl.textContent = cfg.logoText;
  }

  const spotifyButton = document.getElementById('spotifyButton');
  if (spotifyButton && cfg.spotifyUrl) {
    const spotifyUri = deriveSpotifyUri(cfg.spotifyUrl);

    const redirectToSpotify = () => {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      if (isMobile && spotifyUri) {
        const start = Date.now();
        window.location.href = spotifyUri;

        setTimeout(() => {
          const elapsed = Date.now() - start;
          if (elapsed < 1500) {
            window.location.href = cfg.spotifyUrl;
          }
        }, 800);
      } else {
        window.location.href = cfg.spotifyUrl;
      }
    };

    const handleSpotifyClick = () => {
      if (window.fbq) {
        setTimeout(redirectToSpotify, 250);
        return;
      }

      redirectToSpotify();
    };

    // Attach handler only to the main play button
    spotifyButton.addEventListener('click', handleSpotifyClick);
  } else if (spotifyButton) {
    spotifyButton.disabled = true;
    spotifyButton.textContent = 'Spotify link not configured';
  }
}

window.addEventListener('DOMContentLoaded', initPage);
