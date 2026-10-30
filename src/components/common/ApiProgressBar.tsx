import { useEffect, useState } from "react";
import { useSelector } from "@/store/hooks";

/** Top indeterminate bar shown while any RTK Query API request is in flight. */
export function ApiProgressBar() {
  const pendingCount = useSelector((state) => state.globalLoader.pendingRequests);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pendingCount > 0) {
      setVisible(true);
      return;
    }
    const timeoutId = window.setTimeout(() => setVisible(false), 180);
    return () => window.clearTimeout(timeoutId);
  }, [pendingCount]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] overflow-hidden bg-blue-100"
      role="progressbar"
      aria-busy="true"
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="api-progress-bar h-full rounded-r-full bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-600" />
    </div>
  );
}
