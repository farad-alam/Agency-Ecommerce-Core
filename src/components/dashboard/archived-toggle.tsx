"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ArchivedToggle() {
  const router = useRouter();
  const params = useSearchParams();
  const showArchived = params.get("archived") === "1";

  function toggle() {
    if (showArchived) {
      router.push("/dashboard/products");
    } else {
      router.push("/dashboard/products?archived=1");
    }
  }

  return (
    <button
      onClick={toggle}
      className={`h-9 px-4 rounded-xl border text-xs font-medium transition ${
        showArchived
          ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
          : "border-white/[0.09] bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05]"
      }`}
    >
      {showArchived ? "Hide Archived" : "Show Archived"}
    </button>
  );
}
