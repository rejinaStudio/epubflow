"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadFile, pollJob, getDownloadUrl, type Job } from "@/lib/api";

type FileState = {
  file: File;
  job: Job | null;
  error: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  queued: "대기 중",
  processing: "변환 중...",
  done: "완료",
  error: "실패",
};

const STATUS_COLOR: Record<string, string> = {
  queued: "text-gray-400",
  processing: "text-blue-500",
  done: "text-green-600",
  error: "text-red-500",
};

export default function Converter() {
  const router = useRouter();
  const [items, setItems] = useState<FileState[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateItem = (index: number, patch: Partial<FileState>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const processFile = useCallback(async (file: File, index: number) => {
    try {
      const job = await uploadFile(file);
      updateItem(index, { job });

      // poll until done or error
      const poll = async () => {
        const updated = await pollJob(job.job_id);
        updateItem(index, { job: updated });

        if (updated.status === "queued" || updated.status === "processing") {
          setTimeout(poll, 1500);
        }
      };
      setTimeout(poll, 1500);
    } catch (e) {
      updateItem(index, { error: (e as Error).message });
    }
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const startIndex = items.length;
      const newItems: FileState[] = arr.map((f) => ({ file: f, job: null, error: null }));
      setItems((prev) => [...prev, ...newItems]);
      arr.forEach((f, i) => processFile(f, startIndex + i));
    },
    [items.length, processFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${dragging ? "border-gray-500 bg-gray-100" : "border-gray-300 hover:border-gray-400 bg-white"}`}
      >
        <div className="text-4xl mb-3">📂</div>
        <p className="font-semibold text-gray-700 mb-1">파일을 드래그하거나 클릭하여 업로드</p>
        <p className="text-sm text-gray-400">DOCX, DOC, TXT, HTML 지원</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".docx,.doc,.txt,.html"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* File list */}
      {items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {items.map((item, i) => (
            <FileRow
              key={i}
              item={item}
              onDownload={() => {
                if (item.job?.job_id) {
                  const a = document.createElement("a");
                  a.href = getDownloadUrl(item.job.job_id);
                  a.download = item.file.name.replace(/\.[^.]+$/, "") + ".epub";
                  a.click();
                }
              }}
              onEdit={() => {
                if (item.job?.job_id) router.push(`/editor/${item.job.job_id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileRow({ item, onDownload, onEdit }: { item: FileState; onDownload: () => void; onEdit: () => void }) {
  const status = item.error ? "error" : item.job?.status ?? "queued";
  const sizeKB = Math.round(item.file.size / 1024);

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="text-2xl">{item.file.name.endsWith(".docx") || item.file.name.endsWith(".doc") ? "📝" : "📄"}</span>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">{item.file.name}</div>
        <div className="text-xs text-gray-400">{sizeKB}KB</div>
      </div>

      <div className={`text-sm font-medium ${STATUS_COLOR[status]}`}>
        {item.error || STATUS_LABEL[status]}
        {status === "processing" && (
          <span className="ml-1 inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin align-middle" />
        )}
      </div>

      {status === "done" && (
        <div className="flex gap-2 ml-2">
          <button
            onClick={onEdit}
            className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            편집하기
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            다운로드
          </button>
        </div>
      )}
    </div>
  );
}
