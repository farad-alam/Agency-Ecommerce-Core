import { Metadata } from "next";
import { Image, Construction } from "lucide-react";

export const metadata: Metadata = {
  title: "Media Library",
};

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Media Library</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage all your product images and assets.</p>
      </div>

      <div className="flex flex-col items-center justify-center border border-dashed border-white/[0.1] rounded-2xl bg-[#18181b] py-32 px-4 text-center">
        <div className="h-16 w-16 bg-white/[0.04] rounded-full flex items-center justify-center mb-4 border border-white/[0.05]">
          <Image className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">Global Media Library</h2>
        <p className="text-zinc-500 text-sm max-w-sm mb-6">
          The global media library feature is currently under development. For now, please manage images directly within individual product edit pages.
        </p>
        <div className="inline-flex items-center text-xs text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-full font-medium border border-indigo-400/20">
          <Construction className="w-3.5 h-3.5 mr-1.5" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}
