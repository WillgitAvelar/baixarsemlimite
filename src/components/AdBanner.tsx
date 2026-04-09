import { useEffect } from "react";

export function AdBanner() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", marginBottom: "20px" }}
      data-ad-client="ca-pub-9761562870144270"
      data-ad-slot="5574341635"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}