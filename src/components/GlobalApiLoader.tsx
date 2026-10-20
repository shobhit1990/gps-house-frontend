import { Loader2 } from "lucide-react";
import { useSelector } from "@/store/hooks";

export default function GlobalApiLoader() {
  const pendingRequests = useSelector(
    (state) => state.globalLoader.pendingRequests
  );
  if (pendingRequests <= 0) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-slate-700">Loading...</span>
      </div>
    </div>
  );
}
