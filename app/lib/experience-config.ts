export type BreakpointKey = "xs" | "sm" | "md" | "lg";

export const BREAKPOINTS = {
  xs: 480,
  sm: 768,
  md: 1024,
} as const;

export type VideoStageConfig = {
  stageHeight: string;
  stageMinHeight: number;
  objectPosition: string;
  scale: number;
  heroScrollRange: number;
  seekThreshold: number;
};

export const VIDEO_STAGE_CONFIG: Record<BreakpointKey, VideoStageConfig> = {
  xs: {
    stageHeight: "52vh",
    stageMinHeight: 280,
    objectPosition: "center 22%",
    scale: 1.06,
    heroScrollRange: 0.85,
    seekThreshold: 0.06,
  },
  sm: {
    stageHeight: "56vh",
    stageMinHeight: 320,
    objectPosition: "center 20%",
    scale: 1.04,
    heroScrollRange: 0.9,
    seekThreshold: 0.05,
  },
  md: {
    stageHeight: "60vh",
    stageMinHeight: 380,
    objectPosition: "center 18%",
    scale: 1.02,
    heroScrollRange: 0.95,
    seekThreshold: 0.045,
  },
  lg: {
    stageHeight: "100%",
    stageMinHeight: 640,
    objectPosition: "center",
    scale: 1.008,
    heroScrollRange: 1,
    seekThreshold: 0.04,
  },
};

export function getBreakpoint(width = typeof window !== "undefined" ? window.innerWidth : 1280): BreakpointKey {
  if (width <= BREAKPOINTS.xs) return "xs";
  if (width <= BREAKPOINTS.sm) return "sm";
  if (width <= BREAKPOINTS.md) return "md";
  return "lg";
}

export function isCompactLayout(bp: BreakpointKey) {
  return bp !== "lg";
}
