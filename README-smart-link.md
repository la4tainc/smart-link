# Music Smart Link Landing Page

This is a minimal music smart link web app, inspired by Feature.fm but simplified for your needs:

- Landing page with artwork, title, artist, and a primary **Listen on Spotify** button.
- Facebook Pixel support (for Meta ads tracking).
- Spotify deep-link attempt to open the real app on mobile, with web fallback.

## How to run it

1. Open this folder in VS Code.
2. In a terminal, install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

## Configuring your smart link

Edit `config.json` in the project root:

- `pageTitle`: Release title shown on the landing page and browser tab.
- `artistName`: Artist name displayed under the title.
- `headline`: Short tagline (e.g. "New single out now").
- `spotifyUrl`: Public Spotify URL for your track/album/playlist, e.g. `https://open.spotify.com/track/...`.
- `primaryColor`, `accentColor`, `backgroundColor`: Optional brand colors.
- `facebookPixelId`: Your Facebook Pixel ID for Meta ads tracking. Leave empty if you don't want the pixel.

## Artwork

Put your cover art file into the `public` folder and name it `artwork.jpg` (or update the `src` in `public/index.html` if you want a different filename). Whatever file you drop there will be displayed as the main artwork.

## Analytics

This page is designed primarily for **Facebook/Meta Pixel** based conversion tracking:

- A `PageView` event is fired when the landing page loads (if a Pixel ID is configured).
- A `Lead` (or whichever event you configure) is fired when the Spotify play button is clicked.

There is no longer any custom backend analytics or `events.json` file required. For streaming performance, rely on Spotify's own analytics (Spotify for Artists, etc.) and your Meta Ads reporting.

## Facebook Pixel

When `facebookPixelId` is set in `config.json`:

- The standard Meta pixel script is injected dynamically.
- `PageView` is tracked on load.
- `Lead` is tracked when the Spotify button is clicked.

You can adjust the event names in `public/app.js` if you prefer different pixel events.
