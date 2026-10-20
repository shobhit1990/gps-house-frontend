import { useState, useEffect } from "react";

interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}

export function useMobile(): MobileInfo {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: "lg",
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      let breakpoint: MobileInfo["breakpoint"] = "lg";
      if (width < 640) breakpoint = "xs";
      else if (width < 768) breakpoint = "sm";
      else if (width < 1024) breakpoint = "md";
      else if (width < 1280) breakpoint = "lg";
      else if (width < 1536) breakpoint = "xl";
      else breakpoint = "2xl";

      setMobileInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        breakpoint,
      });
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return mobileInfo;
}
