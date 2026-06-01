import EditorPage from "@/components/EditorPage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <EditorPage jobId={jobId} />;
}
