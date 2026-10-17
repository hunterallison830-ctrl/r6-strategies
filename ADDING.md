# Adding things to R6 Strategies (under a minute)

Everything lives in `data.json`. No build step: edit, save, refresh the page.

## Structure
```
meta   -> season name, "checked" date, the pool note shown on the home screen
maps[] -> { id, name, pool: "pro" | "additional", sites[], strategies[] }
sites[]-> { id: "s0".."s3", name: "Room A / Room B", floor: "2F", note }
strategies[] -> { id, side: "attack"|"defense", site: "s0", title, summary, tags[], video{} }
video  -> { id (YouTube id), start (sec), end (sec or null), creator, videoTitle, uploaded "YYYY-MM", seconds, note }
```
Site ids are shared by Attack and Defend, so one site entry serves both sides.

## Add a strategy / video (fastest: the helper)
```
python3 tools/add_strategy.py bank defense s0 "Default hold" "One or two sentences." \
  "https://www.youtube.com/watch?v=VIDEOID&t=95s" --end 160 --tags Default,Hold --creator "Creator"
```
It checks the video exists (YouTube oEmbed) AND is embeddable (yt-dlp `playable_in_embed`) before writing. Videos that cannot play inside the app are refused: the app never links out to YouTube. `t=` becomes the start; `--end` the stop second
(omit `--end` and `--creator` for a full video). Sites are `s0`..`s3` in the order shown in `data.json`.

By hand: copy any object in a map's `strategies` array, change `side`, `site`, text and the `video` fields.
Tags used so far: Default, Hold, Entry, Execute, Pro tip, Late round, Crazy Peak, Flashy, Advanced (any text works).
**Crazy Peak / Flashy / Advanced** get neon styling and show under the "Crazy Peak" filter chip on each site list. "Default" shows under the Default chip.

## Add a site
Append to the map's `sites` array: `{"id":"s4","name":"Room A / Room B","floor":"1F","note":""}`.
Then add strategies with `"site":"s4"`. (If a map has only one site name for 2 rooms, still use "A / B".)

## Add a map
Append to `maps`: `{"id":"newmap","name":"New Map","pool":"additional","sites":[...],"strategies":[]}`.
`id` is used in the link (`#newmap/attack/s0`). `pool` "pro" shows it in the first group. Update `meta.poolNote`/`meta.checked`.

## Check
Reload `http://<host>:8795/`. Deep links work: `#map/side/site`, e.g. `#bank/defense/s0`.
Rules of thumb: verify the video plays, keep clips short (under ~2 min if possible), never guess a video id.

## Everything stays in the app
Videos play in an inline `youtube-nocookie.com` iframe (start/end times, playsinline, rel=0, modestbranding, sandboxed with no popups, so nothing in the player can open a new tab). There are no "Open on YouTube" links. Creator names are plain text.
Re-check every video any time: `python3 tools/verify_embeds.py` (lists any video that is no longer embeddable).
Crazy Peak example:
```
python3 tools/add_strategy.py chalet defense s3 "C4 spot in Snowmobile" "Hole in the ceiling, C4 below." "https://youtu.be/xFM6x0RGJIM?t=190" --end 233 --tags "Crazy Peak,Advanced"
```
