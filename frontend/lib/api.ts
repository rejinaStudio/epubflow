const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type JobStatus = "queued" | "processing" | "done" | "error";

export interface Job {
  job_id: string;
  status: JobStatus;
  filename?: string;
  download_url?: string;
  error?: string;
}

export async function uploadFile(file: File): Promise<Job> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/api/convert`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "업로드에 실패했습니다.");
  }

  return res.json();
}

export async function pollJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
  if (!res.ok) throw new Error("상태 조회에 실패했습니다.");
  return res.json();
}

export function getDownloadUrl(jobId: string): string {
  return `${API_URL}/api/download/${jobId}`;
}
