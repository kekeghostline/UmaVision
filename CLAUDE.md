@AGENTS.md

# UmaVision プロジェクト情報

## 概要

JRA出馬表を取得し、資金額とスタイルに応じてAI（Claude）が馬券を予想するスマホ向けブラウザアプリ。プロジェクト概要・機能一覧は `README.md` を参照。

## 現在のスコープ（最小プロトタイプ）

日付・競馬場・レース番号・資金額・スタイル（堅め/バランス/攻め）を入力し、実際にJRAサイトをスクレイピングしてClaude APIに予想させる単一画面のみ実装済み。ユーザー認証・DB永続化・予想結果履歴は未実装（次フェーズで検討）。

## 重要な制約（著作権対応）

JRAサイトから取得した出馬表の生データ（馬名・騎手名・オッズ等）はAPIレスポンス・UIに一切出力しない。返すのはAI予想結果のみ。この制約は `src/lib/claude/promptBuilder.ts` のシステムプロンプトと `src/app/api/predict/route.ts` のレスポンス整形で担保している。新機能を追加する際もこの原則を維持すること。

## アーキテクチャ概要

- `src/lib/scraper/*` — JRAサイトの取得・パース（Cheerioベース）。`index.ts` の `fetchShutubaTable()` がエントリポイント。
- `src/lib/claude/*` — Claude APIによる予想生成。`predict.ts` は `messages.parse()`（`.create()` ではない）を使い構造化出力を得る。
- `src/app/api/predict/route.ts` — スクレイピング＋Claude予想のオーケストレーション（`runtime = "nodejs"` 必須）。
- `src/app/api/scrape-debug/route.ts` — 開発時（`NODE_ENV=development`）のみ有効な、スクレイパー単体検証用エンドポイント。

## 既知の技術的注意点

- JRAサイトはShift_JISで配信されるため `src/lib/scraper/http.ts` で `TextDecoder("shift_jis")` を明示使用している（`response.text()` のUTF-8デコードだと文字化けする）。
- `resolveThisweekUrl`（週間出走馬情報ページからのレースリンク抽出、`src/lib/scraper/calendar.ts`）は実際の開催日でのライブ検証が未完了。ページの実データがJSレンダリングされている場合、現在のCheerioのみの実装では0件になる可能性があり、その場合は `src/lib/scraper/fetchWithFallback.ts` にPlaywrightフォールバックの実装が必要になる。

## 環境構築

`ANTHROPIC_API_KEY` を `.env.local`（gitignore対象、`.env.example` 参照）に設定する。`npm run dev` / `npm run build` / `npm run lint`。
