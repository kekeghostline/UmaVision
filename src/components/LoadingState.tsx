export function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      <p className="text-sm text-gray-600">
        出馬表を取得し、AIが予想を作成しています…
        <br />
        1分ほどかかる場合があります
      </p>
    </div>
  );
}
