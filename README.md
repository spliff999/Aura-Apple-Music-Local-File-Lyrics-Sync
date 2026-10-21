# Aura Lyrics — custom TTML lyrics for Apple Music Web

A cinematic lyric overlay for **music.apple.com**, taking visual inspiration from the [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics) experience for Spotify/Spicetify. This project is an independent implementation written from scratch: it **does not use Spicy Lyrics source code or assets**, and it is **not affiliated with Apple or Spicy Lyrics**.

## Install in Chrome or Edge (Windows/macOS/Linux)

1. **Extract** `Aura_Lyrics_Apple_Music_Extension.zip` to a permanent folder (e.g., Desktop/AuraLyrics).
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the extracted **Aura_Lyrics_Apple_Music_Extension** folder (the folder containing `manifest.json`).
5. Open **https://music.apple.com/** and sign in normally.
6. Click the **Aura Lyrics** extension button in the browser toolbar. Import a `.ttml` file or folder of `.ttml` files. Make sure filenames match song titles.
7. Play a track, then click the floating **LYRICS** pill near the right side of the player. Switch to cinema view and use the fullscreen button if desired.

If you already installed the previous `My TTML Lyrics` extension, **disable the old extension** to avoid two simultaneous lyric overlays. Your previous import library is not automatically copied: Chrome treats this as a new extension, so import the `.ttml` folder again.

## Aesthetic and controls

- Cinematic layout: album artwork left, scrolling karaoke lyrics right, atmospheric blurred artwork background.
- Dynamic **word-by-word fill**, active-line emphasis, smooth scrolling, and dimmed past/future lines.
- **4 themes**: Violet, Ember, Ocean, Obsidian.
- Adjustable font size, backdrop blur, text alignment, word glow and auto-follow.
- Switch between **Cinema / Compact** and fullscreen.
- Import an entire TTML folder, search the local lyrics library, remove tracks.
- Manually choose a track's lyric file if automatic title matching fails.
- Tap **- / +** to move lyrics earlier/later by 0.25 seconds. The offset is saved separately for each track. Positive values delay the lyrics.
- **Start sync** begins a fallback timer at 0:00. Only click when the recording *actually starts* if the Apple Music playback clock is unavailable.

## What works and what doesn't

**Supported:** Word-synced TTML with timed `<p>` and `<span>` elements, line-synced TTML with timed `<p>` elements; MP3/M4A TTML output from your local generator. Nested timed spans, `HH:MM:SS.mmm` and unit timestamps are supported.

**Limitations:** This is a separate overlay *on the Apple Music website*. Apple does not expose an official API to inject personal TTML into its own synced lyric panel. It does not change the native Windows Apple Music app, iOS/iPadOS Apple Music, or Apple's catalog. Album art and synchronized playback information are read from supported browser media metadata/MusicKit/HTML audio elements when exposed; page updates may break detection. The manual timer is a workaround, not real-time detection. Matching is by cleaned track title, not fingerprinting; multiple tracks with identical titles need manual choice.

**Privacy:** No lyric files are uploaded; their parsed timing and text remain in `chrome.storage.local` in the browser. The extension has no analytics, no remote backend, and no request for Apple login credentials. It runs only on `https://music.apple.com/*`.

## Troubleshooting

- **Extension icon appears but lyric window doesn't:** Refresh music.apple.com after installing, then click the floating `LYRICS` pill.
- **No matched lyrics:** Open the extension popup and import the `.ttml`. Use the footer's lyrics dropdown if the track title and filename differ.
- **Timing is off:** Check that your `.ttml` is aligned to that exact song edition, then use footer `-`/`+` offset controls.
- **No clock detected:** Play a track in Apple Music Web. If the site doesn't expose playback time, click `Start sync` *exactly at 0:00*; the extension cannot infer the true playback position in that case.
- **How to return to Apple Music:** Click the **X** in the lyric overlay; use the floating `LYRICS` pill to reopen it.
- **TTML import not working:** Confirm the XML is well formed and has valid begin/end timestamps. Files containing only static text are not synchronizable.

## Files

- `manifest.json` — Chrome/Edge Manifest V3 configuration.
- `overlay.js`, `overlay.css` — animated lyric UI and settings.
- `page-bridge.js` — read-only playback information from Apple Music Web.
- `popup.html`, `popup.js` — local TTML library manager.
- `ttml-parser.js` — TTML timing parser.

## Testing

The popup import was checked with a real user-supplied timed TTML (42 lines). The overlay's rendering, active-line highlighting, and UI behavior were smoke-tested in Chromium using simulated playback data. **Actual Apple Music Web integration was not tested with a signed-in account**, so automatic track/clock detection needs to be checked in your browser.
