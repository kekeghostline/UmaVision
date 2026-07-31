@AGENTS.md

# UmaVision プロジェクト情報

## 概要

JRA出馬表を取得し、資金額とスタイルに応じてAI（Claude）が馬券を予想するスマホ向けブラウザアプリ。プロジェクト概要・機能一覧は `README.md` を参照。

## 現在のスコープ（最小プロトタイプ）

日付・競馬場・レース番号・資金額・スタイル（堅め/バランス/攻め）を入力し、実際にJRAサイトをスクレイピングしてClaude APIに予想させる単一画面のみ実装済み。ユーザー認証・DB永続化・予想結果履歴は未実装（次フェーズで検討）。

## 重要な制約（著作権対応）

JRAサイトから取得した出馬表の生データ（馬名・騎手名・オッズ等）はAPIレスポンス・UIに一切出力しない。返すのはAI予想結果のみ。この制約は `src/lib/claude/promptBuilder.ts` のシステムプロンプトと `src/app/api/predict/route.ts` のレスポンス整形で担保している。新機能を追加する際もこの原則を維持すること。

## アーキテクチャ概要

- `src/lib/scraper/*` — JRAサイトの取得・パース（Cheerioベース）。`index.ts` の `fetchShutubaTable()` がエントリポイント。JRAサイトは出馬表への直接リンクを提供しておらず、JS(`doAction()`)がCNAMEをhiddenフォームに詰めてPOSTするナビゲーションでのみ到達できるため、`calendar.ts`（開催選択→レース選択CNAMEの解決）→`thisweek.ts`（レース選択→個別レースURLの解決）→`shutubaParser.ts`（出馬表テーブルのパース）という3段階になっている。
- `src/lib/claude/*` — Claude APIによる予想生成。`predict.ts` は `messages.parse()`（`.create()` ではない）を使い構造化出力を得る。
- `src/app/api/predict/route.ts` — スクレイピング＋Claude予想のオーケストレーション（`runtime = "nodejs"` 必須）。
- `src/app/api/scrape-debug/route.ts` — 開発時（`NODE_ENV=development`）のみ有効な、スクレイパー単体検証用エンドポイント。

## 既知の技術的注意点

- JRAサイトはShift_JISで配信されるため `src/lib/scraper/http.ts` で `TextDecoder("shift_jis")` を明示使用している（`response.text()` のUTF-8デコードだと文字化けする）。
- 出馬表データは静的HTMLに直接含まれており、JSによる動的読み込みではない（実データで検証済み）。Playwright等のヘッドレスブラウザは不要。
- 出馬表テーブルは `table.basic.narrow-xy.mt20` というクラスで識別する。同じページ内の「過去5年の成績」テーブルは `.mt20` が付かないため誤って混ざらない。列はクラスベース（`td.num`＝馬番、`td.horse .name a`＝馬名、`td.jockey p.jockey a`＝騎手名 等）で抽出しており、単純な位置ベースのtd抽出ではない。
- オッズはaccessD.html（出馬表ページ）には含まれていない。別ページ（accessO.html）の取得が必要だが未実装（スコープ外）。

## 環境構築

`ANTHROPIC_API_KEY` を `.env.local`（gitignore対象、`.env.example` 参照）に設定する。`npm run dev` / `npm run build` / `npm run lint`。
