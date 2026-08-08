import Script from "next/script";
import { CLARITY_PROJECT_ID } from "@/lib/analytics";

// Microsoft Clarity (session recordings + heatmaps). Kept last of the
// analytics tags on purpose: Clarity wraps history.pushState and restores
// the original on its internal reset, which can unhook any script that
// wrapped pushState after it. Loading it after the pixel and GA keeps their
// wrappers underneath Clarity's, not above it.
export function ClarityScript() {
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
    </Script>
  );
}
