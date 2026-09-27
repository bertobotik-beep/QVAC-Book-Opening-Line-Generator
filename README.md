# QVAC Book Opening Line Generator

Enter a genre and a theme and an on-device AI writes 2-3 possible opening lines for a story in that genre/theme. No cloud call, no API key.

## How it works

1. You type a genre (e.g. `Mystery`) and a theme (e.g. `a missing lighthouse keeper`) into the two input fields and submit.
2. The server asks the on-device model for exactly 3 distinct opening-line hooks, formatted as a numbered list for reliable parsing.
3. The reply is streamed token-by-token, then `parseLines()` splits it into individual lines, strips numbering and quotes, and discards anything that looks unusable.
4. Because the prompt includes a hardcoded lighthouse-keeper example to teach the model the format, `logic.js` also drops any generated line that leaks nouns from that example (`lighthouse`, `keeper`, `ferry`, `logbook`, etc.) unless the user's own theme actually mentions them — so the demo example never bleeds into unrelated results. If fewer than 2 usable lines remain, a guaranteed on-topic fallback pair is returned instead.

### Example

- Input: genre `Mystery`, theme `a missing lighthouse keeper`
- Typical output: two or three distinct opening lines such as `"The lighthouse still turned its light every night, but no one had seen Old Tam in six days."`

### QVAC functions used

- `loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 })` — loads the model on-device at startup (`src/gui.js`).
- `completion({ modelId, history, stream: true, completionOpts })` — generates the opening lines, streamed via `run.tokenStream` (`src/logic.js`).
- `unloadModel({ modelId })` — releases the model when the server shuts down (`src/gui.js`).

## Run

```bash
npm install
npm start
```

Then open http://localhost:31027

The port can be overridden with the `PORT` environment variable.

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## License

MIT
