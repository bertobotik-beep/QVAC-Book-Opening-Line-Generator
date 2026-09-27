// QVAC Book Opening Line Generator — core logic.
// completion() writes 2-3 possible opening lines for a story in the given
// genre/theme, formatted as a numbered list for reliable parsing.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i do not have", "please provide"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

// Words specific to the hardcoded few-shot example below. Even given as
// proper multi-turn history (not prose), the small model sometimes still
// bleeds this example's nouns into unrelated themes — so any generated line
// containing one of these is dropped, unless the user's own theme mentions it.
const EXAMPLE_LEAK_WORDS = ["lighthouse", "keeper", "ferry", "logbook", "lamp room", "old tam"];

function leaksExample(line, theme) {
  const lowerLine = line.toLowerCase();
  const lowerTheme = theme.toLowerCase();
  return EXAMPLE_LEAK_WORDS.some((w) => lowerLine.includes(w) && !lowerTheme.includes(w));
}

function parseLines(text, theme) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^\d+[.)]\s*/, "").trim())
    .map((l) => l.replace(/^["'“]|["'”]$/g, "").trim())
    .filter((l) => l.length > 0 && !looksUnusable(l) && !leaksExample(l, theme));
  return lines.slice(0, 3);
}

const FALLBACK = (genre, theme) => [
  `No one in town believed the old stories about ${theme} — until the night everything changed.`,
  `The ${genre.toLowerCase()} began, as these things often do, with a warning nobody heeded about ${theme}.`,
];

export async function generate(modelId, genre, theme) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          `Write exactly 3 possible opening lines (first sentences) for a ${genre} story about ${theme}. ` +
          "Each line should be a strong, distinct hook, one sentence each. Format your reply as a numbered " +
          "list: \"1. ...\" then \"2. ...\" then \"3. ...\", one per line. Reply with ONLY the numbered list, " +
          "no preamble, no extra commentary.",
      },
      { role: "user", content: "Genre: Mystery\nTheme: a missing lighthouse keeper" },
      {
        role: "assistant",
        content:
          "1. The lighthouse still turned its light every night, but no one had seen Old Tam in six days.\n" +
          "2. When the ferry captain found the lamp room empty and the logbook mid-sentence, he knew something was wrong.\n" +
          "3. They said the keeper vanished with the fog, and after that night, the fog never fully lifted again.",
      },
      { role: "user", content: `Genre: ${genre}\nTheme: ${theme}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.9, maxTokens: 220 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text.trim();

  // Fall back to a guaranteed on-topic pair of lines whenever the model
  // refused, or too many candidate lines were dropped (unusable, or leaking
  // nouns from the hardcoded few-shot example) to leave a usable result.
  let lines = looksUnusable(text) ? [] : parseLines(text, theme);
  if (lines.length < 2) lines = FALLBACK(genre, theme);

  return { lines };
}
