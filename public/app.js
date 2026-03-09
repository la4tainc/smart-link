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

function initFacebookPixel(pixelId) {
  if (!pixelId) return;
  if (window.fbq) return;

  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script');

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

async function trackEvent(type, metadata) {
  // Backend analytics removed for static hosting / GitHub Pages.
  // Keep this function so existing calls don't break; optional: log in dev.
  // console.debug('event', type, metadata);
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

  // Init Facebook Pixel
  if (cfg.facebookPixelId) {
    initFacebookPixel(cfg.facebookPixelId);
  }

  // Track initial page view in our own analytics
  trackEvent('page_view', {
    utm_source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
    utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined
  });

  const spotifyButton = document.getElementById('spotifyButton');
  if (spotifyButton && cfg.spotifyUrl) {
    const spotifyUri = deriveSpotifyUri(cfg.spotifyUrl);

    const handleSpotifyClick = () => {
      // Pixel event for click
      if (window.fbq && cfg.facebookPixelId) {
        window.fbq('track', 'Lead');
      }

      // Our own analytics
      trackEvent('spotify_click', {
        target: cfg.spotifyUrl
      });

      // Try opening in Spotify app on mobile, fallback to web URL
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      if (isMobile && spotifyUri) {
        const start = Date.now();
        // Try deep link first
        window.location.href = spotifyUri;

        // Fallback to https link shortly after
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

    // Attach handler only to the main play button
    spotifyButton.addEventListener('click', handleSpotifyClick);
  } else if (spotifyButton) {
    spotifyButton.disabled = true;
    spotifyButton.textContent = 'Spotify link not configured';
  }
}

window.addEventListener('DOMContentLoaded', initPage);
