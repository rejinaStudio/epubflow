import Converter from "@/components/Converter";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">EPUBFlow</h1>
          <p className="mt-2 text-gray-500">Word · TXT 파일을 EPUB으로 변환하고 다운로드하세요</p>
        </div>
        <Converter />
      </div>
    </main>
  );
}
