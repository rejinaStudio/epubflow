"use client";

import dynamic from "next/dynamic";

const EpubPreview = dynamic(() => import("./EpubPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100 h-full">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  ),
});

export default EpubPreview;
