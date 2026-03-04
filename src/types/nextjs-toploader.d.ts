declare module "nextjs-toploader" {
  import * as React from "react";

  type NextTopLoaderProps = {
    color?: string;
    initialPosition?: number;
    crawl?: boolean;
    crawlSpeed?: number;
    height?: number;
    crawlSpinner?: boolean;
    easing?: string;
    speed?: number;
    shadow?: string;
    template?: string;
    zIndex?: number;
    showAtBottom?: boolean;
    showForHashAnchor?: boolean;
  };

  const NextTopLoader: React.ComponentType<NextTopLoaderProps>;
  export default NextTopLoader;
}
