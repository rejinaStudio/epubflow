"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  epubUrl: string;
  /** epub.js 렌더링 트리거: 값이 바뀔 때마다 재로드 */
  version: number;
}

export default function EpubPreview({ epubUrl, version }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const [page, setPage] = useState({ current: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("tablet");

  const VIEWPORT_WIDTH = { mobile: 375, tablet: 600, desktop: 800 };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // 이전 rendition 제거
      if (renditionRef.current) {
        renditionRef.current.destroy();
        renditionRef.current = null;
      }
      if (bookRef.current) {
        bookRef.current.destroy();
        bookRef.current = null;
      }

      const ePub = (await import("epubjs")).default;
      if (cancelled || !containerRef.current) return;

      const book = ePub(epubUrl + `?v=${version}`);
      bookRef.current = book;

      const w = VIEWPORT_WIDTH[viewport];
      const rendition = book.renderTo(containerRef.current, {
        width: w,
        height: 520,
        spread: "none",
      });
      renditionRef.current = rendition;

      await rendition.display();
      if (cancelled) return;

      setLoading(false);

      book.locations.generate(1024).then(() => {
        if (cancelled) return;
        const locs = book.locations as any;
        setPage((p) => ({ ...p, total: locs.total ?? locs.length() ?? 0 }));
      });

      rendition.on("locationChanged", (loc: any) => {
        const locs = book.locations as any;
        const idx = locs.locationFromCfi?.(loc.start.cfi) ?? 0;
        setPage((p) => ({ ...p, current: (idx ?? 0) + 1 }));
      });
    };

    load();
    return () => { cancelled = true; };
  }, [epubUrl, version, viewport]);

  const prev = () => renditionRef.current?.prev();
  const next = () => renditionRef.current?.next();

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 뷰포트 선택 */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 text-xs">
        <span className="text-gray-400 mr-1">화면</span>
        {(["mobile", "tablet", "desktop"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setViewport(v)}
            className={`px-2 py-1 rounded transition-colors ${
              viewport === v ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {{ mobile: "모바일", tablet: "태블릿", desktop: "데스크톱" }[v]}
          </button>
        ))}
        <div className="flex-1" />
        {page.total > 0 && (
          <span className="text-gray-400">{page.current} / {page.total}</span>
        )}
      </div>

      {/* 렌더 영역 */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div
          className="bg-white shadow-xl rounded-lg overflow-hidden relative"
          style={{ width: VIEWPORT_WIDTH[viewport] }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
          <div ref={containerRef} />
        </div>
      </div>

      {/* 페이지 네비게이션 */}
      <div className="flex items-center justify-center gap-4 py-3 bg-white border-t border-gray-200">
        <button
          onClick={prev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}
