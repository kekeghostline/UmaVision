import { PredictionForm } from "@/components/PredictionForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <main className="mx-auto flex max-w-md flex-col gap-6">
        <header className="text-center">
          <h1 className="text-xl font-bold text-gray-900">UmaVision</h1>
          <p className="mt-1 text-sm text-gray-500">AIによる競馬予想プロトタイプ</p>
        </header>
        <PredictionForm />
      </main>
    </div>
  );
}
