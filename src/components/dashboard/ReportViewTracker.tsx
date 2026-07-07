"use client";

import { useEffect, useRef } from "react";
import { markReportViewed } from "@/lib/actions/reportEngagement";

/**
 * Invisible receipt: on the parent's report page, stamps the report as viewed
 * once per mount. The underlying RPC no-ops for anyone who isn't the linked
 * parent, so there's no harm if this ever renders elsewhere.
 */
export function ReportViewTracker({ reportId }: { reportId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void markReportViewed(reportId);
  }, [reportId]);

  return null;
}
