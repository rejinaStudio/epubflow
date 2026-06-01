"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import EpubPreview from "@/components/EpubPreviewWrapper";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface Meta {
  title: string;
  creator: string;
  language: string;
  description: string;
}

type PanelMode = "editor" | "preview" | "split";

export default function EditorPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [html, setHtml] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta>({ title: "", creator: "", language: "ko", description: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<PanelMode>("split");
  const [previewVersion, setPreviewVersion] = useState(0);

  const epubUrl = `${API}/api/download/${jobId}`;

  useEffect(() => {
    fetch(`${API}/api/edit/${jobId}`)
      .then((r) => {
        if (!r.ok) throw new Error("편집 데이터를 불러올 수 없습니다.");
        return r.json();
      })
      .then((data) => {
        setHtml(data.html);
        setMeta({ title: "", creator: "", language: "ko", description: "", ...data.meta });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSave = async (currentHtml: string) => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`${API}/api/edit/${jobId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: currentHtml, meta }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      setSaveMsg("저장 완료");
      setPreviewVersion((v) => v + 1); // 미리보기 새로고침
    } catch (e) {
      setSaveMsg((e as Error).message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = epubUrl;
    a.download = `${meta.title || "converted"}.epub`;
    a.click();
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">편집기 불러오는 중...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.push("/")} className="text-sm text-gray-500 underline">돌아가기</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 shrink-0">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-700 text-sm">← 돌아가기</button>
        <span className="font-bold text-gray-900 tracking-tight">EPUBFlow</span>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500 truncate max-w-xs">{meta.title || "제목 없음"}</span>

        {/* 뷰 모드 토글 */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 ml-2">
          {([["editor", "편집"], ["split", "분할"], ["preview", "미리보기"]] as [PanelMode, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                mode === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        {saveMsg && (
          <span className={`text-sm ${saveMsg.includes("실패") ? "text-red-500" : "text-green-600"}`}>
            {saveMsg}
          </span>
        )}
        <button
          onClick={handleDownload}
          className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          EPUB 다운로드
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 메타데이터 */}
        <aside className="w-52 bg-white border-r border-gray-200 p-4 flex flex-col gap-3 overflow-y-auto shrink-0">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">메타데이터</div>
          {([
            { key: "title", label: "제목" },
            { key: "creator", label: "저자" },
            { key: "language", label: "언어" },
          ] as { key: keyof Meta; label: string }[]).map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input
                value={meta[key]}
                onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-gray-400"
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">설명</label>
            <textarea
              rows={3}
              value={meta.description}
              onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>
        </aside>

        {/* 메인 패널 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 편집기 */}
          {(mode === "editor" || mode === "split") && (
            <div className={`overflow-y-auto p-6 ${mode === "split" ? "w-1/2 border-r border-gray-200" : "flex-1"}`}>
              <div className="max-w-2xl mx-auto">
                {html !== null && (
                  <RichEditor initialHtml={html} onSave={handleSave} saving={saving} />
                )}
              </div>
            </div>
          )}

          {/* 미리보기 */}
          {(mode === "preview" || mode === "split") && (
            <div className={`overflow-hidden ${mode === "split" ? "w-1/2" : "flex-1"}`}>
              <EpubPreview epubUrl={epubUrl} version={previewVersion} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
