import "server-only";

const USER_AGENT =
  "UmaVision/0.1 (personal, non-commercial prototype; contact: see GitHub repo kekeghostline/UmaVision)";

const REQUEST_DELAY_MS = 700;

let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

// JRAサイトは Shift_JIS でHTMLを配信している。fetchの text() はUTF-8として
// デコードしてしまい文字化けするため、バイト列を取得してから明示的にデコードする。
const SHIFT_JIS_DECODER = new TextDecoder("shift_jis");

export async function fetchJraHtml(url: string): Promise<string> {
  await throttle();
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "ja,en;q=0.8",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`JRAサイトへのリクエストに失敗しました (HTTP ${response.status}): ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return SHIFT_JIS_DECODER.decode(buffer);
}
