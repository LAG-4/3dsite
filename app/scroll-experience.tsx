"use client";

import { useEffect, useRef } from "react";
import {
  getBreakpoint,
  isCompactLayout,
  VIDEO_STAGE_CONFIG,
  type BreakpointKey,
} from "./lib/experience-config";

const LINKS = {
  youtube: "https://www.youtube.com/@Nomadatoast",
  tiktok: "https://www.tiktok.com/@nomadatoast",
  instagram: "https://www.instagram.com/nomadatoast/",
  threads: "https://www.threads.net/@nomadatoast",
  x: "https://x.com/nomadatoast",
  allLinks: "https://www.instagram.com/nomadatoast/",
  emailPress: "mailto:hi@nomadatoast.com?subject=Press%20%26%20collabs",
} as const;

const FRAME_COUNT = 13;
const VIDEO_PROGRESS_LIMIT = 0.16;
const SEEK_THRESHOLD = 0.04;

const PANEL_RANGES: ReadonlyArray<readonly [number, number, number]> = [
  [0.0, 0.07, 0.015],
  [0.09, 0.15, 0.015],
  [0.17, 0.22, 0.015],
  [0.24, 0.32, 0.015],
  [0.34, 0.41, 0.015],
  [0.43, 0.5, 0.015],
  [0.52, 0.59, 0.015],
  [0.61, 0.68, 0.015],
  [0.7, 0.77, 0.015],
  [0.79, 0.86, 0.015],
  [0.88, 0.93, 0.015],
  [0.95, 0.97, 0.01],
  [0.98, 1.0, 0.015],
];

const RAIL_RANGES: ReadonlyArray<readonly [number, number, number]> = [
  [0.0, 0.08, 0.015],
  [0.09, 0.16, 0.015],
  [0.17, 0.235, 0.015],
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function visibleBetween(progress: number, start: number, end: number, fade = 0.03) {
  if (progress < start - fade) return 0;
  if (progress < start) return (progress - (start - fade)) / fade;
  if (progress > end + fade) return 0;
  if (progress > end) return (end + fade - progress) / fade;
  return 1;
}

export function ScrollExperience() {
  const rootRef = useRef<HTMLElement>(null);
  const heroZoneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStageRef = useRef<HTMLDivElement>(null);

  const headerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLButtonElement>(null);
  const navPillRef = useRef<HTMLElement>(null);
  const subBtnRef = useRef<HTMLAnchorElement>(null);

  const infoRailRef = useRef<HTMLElement>(null);
  const activeFrameRef = useRef<HTMLSpanElement>(null);
  const frameCounterLineRef = useRef<HTMLElement>(null);

  const panelsRef = useRef<HTMLElement[]>([]);
  const railScenesRef = useRef<HTMLElement[]>([]);

  const cachedOffsetTop = useRef(0);
  const cachedScrollDistance = useRef(1);
  const progressRef = useRef(0);
  const targetTimeRef = useRef(0);
  const durationRef = useRef(10);

  const breakpointRef = useRef<BreakpointKey>("lg");
  const seekThresholdRef = useRef(SEEK_THRESHOLD);
  const videoFailedRef = useRef(false);
  const lastDarkRef = useRef(false);
  const lastShowRailRef = useRef(false);
  const lastTargetTimeRef = useRef(-1);
  const lastPanelOpRef = useRef<number[]>([]);
  const lastRailOpRef = useRef<number[]>([]);

  const updateStyles = (p: number) => {
    const root = rootRef.current;
    if (!root) return;

    const framePosition = p * (FRAME_COUNT - 1);
    const activeFrame = Math.min(FRAME_COUNT, Math.floor(framePosition + 1));
    if (activeFrameRef.current) {
      activeFrameRef.current.textContent = String(activeFrame).padStart(2, "0");
    }
    if (frameCounterLineRef.current) {
      frameCounterLineRef.current.style.transform = `scaleX(${Math.max(p, 0.02)})`;
    }

    const isDark = p >= 0.235 && p <= 0.325;
    if (isDark !== lastDarkRef.current) {
      lastDarkRef.current = isDark;
      root.classList.toggle("darkTheme", isDark);
      if (videoStageRef.current) {
        videoStageRef.current.style.opacity = isDark ? "0" : "1";
      }
    }

    if (headerRef.current) {
      headerRef.current.style.transform = `translate3d(0, ${p * -7}px, 0)`;
    }
    if (navPillRef.current) {
      navPillRef.current.style.transform = `scale(${1 - p * 0.035})`;
    }
    if (brandRef.current) {
      brandRef.current.style.opacity = String(1 - p * 0.16);
    }
    if (subBtnRef.current) {
      subBtnRef.current.style.transform = `translateX(${p * 5}px)`;
    }

    const panels = panelsRef.current;
    const panelOps = lastPanelOpRef.current;
    for (let i = 0; i < panels.length; i++) {
      const el = panels[i];
      const range = PANEL_RANGES[i];
      const op = range ? visibleBetween(p, range[0], range[1], range[2]) : 0;
      if (panelOps[i] === op) continue;
      panelOps[i] = op;
      el.style.opacity = String(op);
      el.style.display = op > 0 ? "" : "none";
      el.style.pointerEvents = op > 0.5 ? "auto" : "none";
      const ty = i === 0 ? (1 - op) * -24 : (1 - op) * 24;
      el.style.transform = `translate3d(0, ${ty}px, 0) scale(${0.98 + op * 0.02})`;
    }

    const showRail = p <= 0.235;
    if (showRail !== lastShowRailRef.current) {
      lastShowRailRef.current = showRail;
      if (infoRailRef.current) {
        infoRailRef.current.style.opacity = showRail ? "1" : "0";
        infoRailRef.current.style.pointerEvents = showRail ? "auto" : "none";
      }
    }
    if (showRail) {
      const scenes = railScenesRef.current;
      const railOps = lastRailOpRef.current;
      for (let i = 0; i < scenes.length; i++) {
        const el = scenes[i];
        const range = RAIL_RANGES[i];
        const op = range ? visibleBetween(p, range[0], range[1], range[2]) : 0;
        if (railOps[i] === op) continue;
        railOps[i] = op;
        el.style.opacity = String(op);
        el.style.display = op > 0 ? "" : "none";
        el.style.pointerEvents = op > 0.5 ? "auto" : "none";
        el.style.transform = `translate3d(${(1 - op) * 18}px, 0, 0)`;
      }
    }
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const applyBreakpoint = () => {
      const bp = getBreakpoint();
      breakpointRef.current = bp;
      const config = VIDEO_STAGE_CONFIG[bp];
      const compact = isCompactLayout(bp);
      const video = videoRef.current;
      const stage = videoStageRef.current;

      root.dataset.bp = bp;
      root.classList.toggle("compactLayout", compact);

      if (stage) {
        stage.style.opacity = "1";
        if (compact) {
          stage.style.setProperty("--stage-height", config.stageHeight);
          stage.style.setProperty("--stage-min-height", `${config.stageMinHeight}px`);
        } else {
          stage.style.removeProperty("--stage-height");
          stage.style.removeProperty("--stage-min-height");
        }
      }

      if (video) {
        if (compact) {
          video.style.objectPosition = config.objectPosition;
          video.style.transform = `scale(${config.scale})`;
        } else {
          video.style.objectPosition = "center";
          video.style.transform = "scale(1.008)";
        }
      }

      seekThresholdRef.current = config.seekThreshold;
    };

    panelsRef.current = Array.from(
      root.querySelectorAll<HTMLElement>(".narrativePanel, .narrativePanelFull"),
    );
    railScenesRef.current = Array.from(root.querySelectorAll<HTMLElement>(".railScene"));
    lastPanelOpRef.current = new Array(panelsRef.current.length).fill(-1);
    lastRailOpRef.current = new Array(railScenesRef.current.length).fill(-1);

    let raf = 0;

    const computeDesktopProgress = () =>
      clamp((window.scrollY - cachedOffsetTop.current) / cachedScrollDistance.current);

    const computeHeroProgress = () => {
      const config = VIDEO_STAGE_CONFIG[breakpointRef.current];
      const scrollRange = Math.max(window.innerHeight * 0.75, 320);
      return clamp((window.scrollY / scrollRange) * config.heroScrollRange);
    };

    const syncVideo = (p: number) => {
      const video = videoRef.current;
      if (!video || videoFailedRef.current || video.readyState < 2 || !Number.isFinite(video.duration)) return;
      const scaled = clamp(p / VIDEO_PROGRESS_LIMIT);
      const tt = scaled * Math.max(durationRef.current - 0.04, 0);
      targetTimeRef.current = tt;
      if (Math.abs(tt - lastTargetTimeRef.current) > seekThresholdRef.current) {
        lastTargetTimeRef.current = tt;
        video.currentTime = Math.min(tt, durationRef.current - 0.04);
      }
    };

    const updateMetrics = () => {
      raf = 0;
      applyBreakpoint();

      if (isCompactLayout(breakpointRef.current)) {
        const p = computeHeroProgress();
        progressRef.current = p;
        syncVideo(p);
        return;
      }

      cachedOffsetTop.current = root.offsetTop;
      cachedScrollDistance.current = Math.max(root.offsetHeight - window.innerHeight, 1);
      const p = computeDesktopProgress();
      progressRef.current = p;
      syncVideo(p);
      updateStyles(p);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (isCompactLayout(breakpointRef.current)) {
          const p = computeHeroProgress();
          progressRef.current = p;
          syncVideo(p);
          return;
        }
        const p = computeDesktopProgress();
        progressRef.current = p;
        syncVideo(p);
        updateStyles(p);
      });
    };

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.scrollTo(0, 0);
        requestAnimationFrame(updateMetrics);
      }
    };

    updateMetrics();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMetrics);
    window.addEventListener("orientationchange", updateMetrics);
    window.addEventListener("pageshow", onPageShow);
    const timeout = setTimeout(updateMetrics, 120);
    const secondSync = setTimeout(updateMetrics, 600);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(timeout);
      clearTimeout(secondSync);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMetrics);
      window.removeEventListener("orientationchange", updateMetrics);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const primeVideoFrame = () => {
      if (videoFailedRef.current) return;
      durationRef.current = Number.isFinite(video.duration) ? video.duration : 10;
      video.pause();
      const scaled = clamp(progressRef.current / VIDEO_PROGRESS_LIMIT);
      const tt = scaled * Math.max(durationRef.current - 0.04, 0);
      targetTimeRef.current = tt;
      lastTargetTimeRef.current = tt;
      if (video.readyState >= 2) {
        video.currentTime = Math.min(tt, durationRef.current - 0.04);
      }
    };

    const onMetadata = () => primeVideoFrame();
    const onCanPlay = () => primeVideoFrame();

    const onError = () => {
      videoFailedRef.current = true;
      videoStageRef.current?.classList.add("videoStageFallback");
    };

    video.addEventListener("loadedmetadata", onMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    if (video.readyState >= 1) onMetadata();

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
    };
  }, []);

  const jumpTo = (target: number) => {
    const root = rootRef.current;
    if (!root) return;
    const distance = Math.max(root.offsetHeight - window.innerHeight, 1);
    window.scrollTo({ top: root.offsetTop + distance * target, behavior: "smooth" });
  };

  const partners = [
    "Adobe", "ASUS", "Artlist", "Filmora", "iStock", "Freepik",
    "HeyGen", "Printify", "Sihoo", "Gamma", "Even Realities", "Wix",
    "Kittl", "Kling AI", "Pika", "Hailuo AI", "invideo",
  ];

  return (
    <main ref={rootRef} className="scrollExperience" data-bp="lg">
      <div ref={heroZoneRef} className="heroScrollZone">
        <div className="stickyViewport">
        <div ref={videoStageRef} className="videoStage">
          <video
            ref={videoRef}
            className="scrollVideo"
            src="/head-transformation.mp4"
            poster="/head-poster.webp"
            muted
            playsInline
            preload="metadata"
            aria-label="Scroll-driven portrait transformation video"
          />
          <div className="videoTreatment" />
        </div>

        <div className="grain" aria-hidden="true" />
        <div className="viewportFrame" aria-hidden="true" />

        <header ref={headerRef} className="siteHeader">
          <button
            ref={brandRef}
            className="brand"
            onClick={() => jumpTo(0)}
            aria-label="Back to the beginning"
          >
            <span className="brandMark" aria-hidden="true" />
            <span className="brandCopy">
              <strong>Jo Mendes</strong>
              <small>NOMADATOAST</small>
            </span>
          </button>

          <nav ref={navPillRef} className="navPill" aria-label="Primary navigation">
            <button onClick={() => jumpTo(0)}>Work</button>
            <button onClick={() => jumpTo(0.245)}>Topics</button>
            <button onClick={() => jumpTo(0.88)}>About</button>
            <button onClick={() => jumpTo(0.955)}>Contact</button>
          </nav>

          <a
            ref={subBtnRef}
            className="subscribeButton"
            href="https://youtube.com/@Nomadatoast"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Subscribe</span>
            <span className="arrowDisc" aria-hidden="true">→</span>
          </a>
        </header>

        <section className="narrative" aria-live="polite">
          <div className="narrativePanel" style={{ opacity: 0 }}>
            <p className="eyebrow">Jo Mendes · NomadaToast</p>
            <h1>
              Creating content<br />that <em>connects.</em>
            </h1>
            <p className="intro">Practical AI tutorials for creators who want to grow, ship, and monetise.</p>
          </div>

          <div className="narrativePanel" style={{ opacity: 0 }}>
            <p className="eyebrow">Audience</p>
            <h2>
              Over <em>one million</em><br />curious people.
            </h2>
            <p className="intro">Across YouTube, TikTok, Reels and Shorts. Creators, engineers, founders swapping notes.</p>
          </div>

          <div className="narrativePanel" style={{ opacity: 0 }}>
            <p className="eyebrow">The ad moment</p>
            <h2>
              Made by<br />NomadaToast<br />using <em>Emergent.</em>
            </h2>
            <p className="intro finalIntro">This entire site, the scroll-scrubbed video, the glass cards, the live chat, was built in a single session with Emergent.</p>
            <a
              className="projectButton"
              href="https://emergent.sh"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Made by NomadaToast using Emergent</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="narrativePanelFull" style={{ opacity: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>
              <div>
                <p className="eyebrow" style={{ margin: "0 0 15px" }}>What I make</p>
                <h2 style={{ fontSize: "clamp(38px, 3.2vw, 56px)", maxWidth: "550px" }}>Helping creators grow and monetise with AI.</h2>
              </div>
              <div className="metricCard" style={{ maxWidth: "450px", padding: "20px 25px" }}>
                <p style={{ textTransform: "none", fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.45" }}>
                  Four pillars, one mission: making the AI tools that are rewriting content actually useful for the people making it.
                </p>
              </div>
            </div>

            <div className="pillarsSection">
              <div className="pillarCard">
                <span className="pillarArrow">↗</span>
                <div className="pillarCardNumber">01</div>
                <div>
                  <h3 className="pillarCardTitle">Tutorials & How-Tos</h3>
                  <p className="pillarCardDesc">End-to-end walkthroughs of the exact AI workflows behind today’s best content.</p>
                  <div className="pillarCardTags">
                    <span className="pillarTag">YouTube</span>
                    <span className="pillarTag">Weekly</span>
                    <span className="pillarTag">No fluff</span>
                  </div>
                </div>
              </div>

              <div className="pillarCard">
                <span className="pillarArrow">↗</span>
                <div className="pillarCardNumber">02</div>
                <div>
                  <h3 className="pillarCardTitle">Tool Breakdowns</h3>
                  <p className="pillarCardDesc">Honest, side-by-side reviews of the AI tools that actually ship. Receipts included.</p>
                  <div className="pillarCardTags">
                    <span className="pillarTag">Deep dives</span>
                    <span className="pillarTag">Comparisons</span>
                    <span className="pillarTag">Receipts</span>
                  </div>
                </div>
              </div>

              <div className="pillarCard">
                <span className="pillarArrow">↗</span>
                <div className="pillarCardNumber">03</div>
                <div>
                  <h3 className="pillarCardTitle">Grow Your Socials</h3>
                  <p className="pillarCardDesc">Formats, hooks and posting systems I use to turn AI-native content into real reach.</p>
                  <div className="pillarCardTags">
                    <span className="pillarTag">Formats</span>
                    <span className="pillarTag">Hooks</span>
                    <span className="pillarTag">Systems</span>
                  </div>
                </div>
              </div>

              <div className="pillarCard">
                <span className="pillarArrow">↗</span>
                <div className="pillarCardNumber">04</div>
                <div>
                  <h3 className="pillarCardTitle">Monetise the Work</h3>
                  <p className="pillarCardDesc">Turn AI content into revenue, affiliate links, productised services, client work.</p>
                  <div className="pillarCardTags">
                    <span className="pillarTag">Earnings</span>
                    <span className="pillarTag">Playbooks</span>
                    <span className="pillarTag">Templates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="narrativePanelFull" style={{ opacity: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <p className="eyebrow">Latest video</p>
              <a
                href="https://youtube.com/@Nomadatoast"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--white)", fontSize: "14px", textDecoration: "none", fontWeight: "600" }}
              >
                Watch on YouTube →
              </a>
            </div>

            <div className="videoSectionContainer">
              <div className="latestVideoCard">
                <div>
                  <div className="videoBadge">New · YouTube 07:49</div>
                  <h3 className="videoTitle">I turned my wife into an AI influencer that pays.</h3>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "10px 0 15px" }}>Science & Technology</div>
                  <p className="videoDesc">
                    The exact end-to-end system I used to turn my wife into a monetised AI influencer, tools, prompts and payouts included.
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
                  <a
                    className="videoWatchBtn"
                    href="https://youtube.com/@Nomadatoast"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Watch now
                  </a>
                  <div className="videoMeta">
                    <div className="metaItem">
                      <span className="metaVal">07:49</span>
                      <span className="metaLbl">runtime</span>
                    </div>
                    <div className="metaItem">
                      <span className="metaVal">3 tools</span>
                      <span className="metaLbl">covered</span>
                    </div>
                    <div className="metaItem">
                      <span className="metaVal">2 paths</span>
                      <span className="metaLbl">to monetise</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="liveChatWidget">
                <div className="chatHeader">
                  <span className="chatTitle">Live chat</span>
                  <span className="chatWatchers">1.2k watching</span>
                </div>
                <div className="chatHeaderSub">Re: “I turned my wife into an AI influencer that pays”</div>

                <div className="chatMessage">
                  <div className="chatAvatar" style={{ background: "#4a3c31" }}>MT</div>
                  <div className="chatBubble">
                    <span className="chatAuthor">Mika T. · 6m</span>
                    <span className="chatText">the AI influencer breakdown is wild</span>
                  </div>
                </div>

                <div className="chatMessage">
                  <div className="chatAvatar" style={{ background: "#2e3b4e" }}>RP</div>
                  <div className="chatBubble">
                    <span className="chatAuthor">Ravi P. · 4m</span>
                    <span className="chatText">wait jo built this entire site on Emergent in one afternoon??</span>
                  </div>
                </div>

                <div className="chatMessage">
                  <div className="chatAvatar" style={{ background: "#394d3c" }}>EV</div>
                  <div className="chatBubble">
                    <span className="chatAuthor">Elena V. · 2m</span>
                    <span className="chatText">emergent rendered 17 brand logos faster than my coffee brewed</span>
                  </div>
                </div>

                <div className="chatTyping">
                  <span className="chatTypingDot" aria-hidden="true" />
                  <span>Diego is typing</span>
                </div>
              </div>
            </div>
          </div>

          <div className="narrativePanelFull" style={{ opacity: 0 }}>
            <p className="eyebrow">Philosophy</p>
            <h2 style={{ fontSize: "clamp(38px, 3.2vw, 56px)", marginBottom: "30px" }}>How I make videos</h2>

            <div className="processGrid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="processCard">
                <span className="processStep">Note · 01</span>
                <div>
                  <h3 className="processTitle">Build in public. Ship it this week.</h3>
                  <p className="processDesc">
                    Every tutorial is a real project I’m shipping, filmed as I build it. You see the dead ends, the fixes, the prompts that actually worked.
                  </p>
                </div>
              </div>

              <div className="processCard">
                <span className="processStep">Note · 02</span>
                <div>
                  <h3 className="processTitle">Engineer first, creator second.</h3>
                  <p className="processDesc">
                    Years in developer tools before a single video. Every workflow is tested against real constraints before it gets explained.
                  </p>
                </div>
              </div>

              <div className="processCard">
                <span className="processStep">Note · 03</span>
                <div>
                  <h3 className="processTitle">Creators swapping notes.</h3>
                  <p className="processDesc">
                    The comments section is half the value. Viewers share their prompts, their mistakes, and the edits they are shipping.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="narrativePanelFull" style={{ opacity: 0 }}>
            <p className="eyebrow">Process</p>
            <h2 style={{ fontSize: "clamp(38px, 3.2vw, 56px)", margin: "0" }}>From paper to published, every week.</h2>
            <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px", margin: "10px 0 30px", fontWeight: "500" }}>Four steps · ship weekly</p>

            <div className="processGrid">
              <div className="processCard">
                <span className="processStep">01 / step 1 / 4</span>
                <div>
                  <h3 className="processTitle">Research</h3>
                  <p className="processDesc">Test the new tool, read the docs, and build a working prototype before I commit to a topic.</p>
                </div>
              </div>

              <div className="processCard">
                <span className="processStep">02 / step 2 / 4</span>
                <div>
                  <h3 className="processTitle">Build</h3>
                  <p className="processDesc">Run the full end-to-end project on a real brief, so the tutorial is about the actual thing.</p>
                </div>
              </div>

              <div className="processCard">
                <span className="processStep">03 / step 3 / 4</span>
                <div>
                  <h3 className="processTitle">Film</h3>
                  <p className="processDesc">One-person set. Clean audio, cinema colour, screen-record workflows in real time.</p>
                </div>
              </div>

              <div className="processCard">
                <span className="processStep">04 / step 4 / 4</span>
                <div>
                  <h3 className="processTitle">Publish</h3>
                  <p className="processDesc">Long-form on YouTube, cuts on TikTok / Reels / Shorts. Same build, shaped for where you watch.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="narrativePanelFull" style={{ opacity: 0 }}>
            <p className="eyebrow">The audience</p>
            <h2 style={{ fontSize: "clamp(38px, 3.2vw, 56px)", margin: "0" }}>Over one million curious people, across four platforms.</h2>
            <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px", margin: "10px 0 30px", fontWeight: "500" }}>YouTube · TikTok · Instagram · X</p>

            <div className="metricsGrid">
              <div className="metricCard">
                <h3>1M+</h3>
                <p>audience across socials</p>
              </div>

              <div className="metricCard">
                <h3>17</h3>
                <p>brand partnerships</p>
              </div>

              <div className="metricCard">
                <h3>4</h3>
                <p>platforms, posted daily</p>
              </div>

              <div className="metricCard">
                <h3>100%</h3>
                <p>prompts shared</p>
              </div>
            </div>
          </div>

          <div className="narrativePanelFull" style={{ opacity: 0 }}>
            <p className="eyebrow">Selective partnerships</p>
            <h2 style={{ fontSize: "clamp(36px, 3vw, 50px)", marginBottom: "30px" }}>Working with community & brands</h2>

            <div className="brandsSectionContainer">
              <div className="testimonialCard">
                <div>
                  <div className="videoBadge" style={{ color: "rgba(255,255,255,0.4)" }}>From the community</div>
                  <p className="quoteText">
                    “Finally a channel that actually shows the prompts, the settings, and the payouts. The alter-ego workflow alone was worth weeks of my own trial and error.”
                  </p>
                </div>
                <div className="quoteAuthor">
                  <span className="authorName">Mika Tanaka</span>
                  <span className="authorRole">AI filmmaker, Tokyo · 01/03</span>
                </div>
              </div>

              <div className="forBrandsCard">
                <div>
                  <div className="videoBadge" style={{ color: "rgba(255,255,255,0.4)" }}>For brands</div>
                  <p className="brandsDesc">
                    A small number of selective partnerships each year, native, platform-first ad content for AI and tech companies that want to reach creator audiences. Recent partners include Adobe, ASUS, Wix, Kling AI, Pika and Hailuo AI.
                  </p>
                  <div className="brandsPills">
                    <span className="brandPill">Short-form ads</span>
                    <span className="brandPill">Tool walkthroughs</span>
                    <span className="brandPill">Launch campaigns</span>
                    <span className="brandPill">Bundled socials</span>
                  </div>
                </div>
                <a
                  className="brandPitchBtn"
                  href="mailto:hi@nomadatoast.com?subject=Brand%20partnership"
                >
                  Pitch a partnership
                </a>
              </div>
            </div>
          </div>

          <div className="narrativePanelFull" style={{ opacity: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <p className="eyebrow" style={{ margin: "0 0 10px" }}>Partners & collaborations</p>
                <h2 style={{ fontSize: "clamp(34px, 3vw, 48px)" }}>Brands I’ve created content for.</h2>
              </div>
              <span className="brandPill" style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px" }}>17 recent partnerships</span>
            </div>

            <div className="partnersGrid">
              {partners.map((partner, i) => (
                <div key={i} className="partnerCard">
                  <span className="partnerName">{partner}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="narrativePanelFull" style={{ opacity: 0 }}>
            <p className="eyebrow">About</p>
            <h2 style={{ fontSize: "clamp(34px, 3vw, 48px)", margin: "0 0 30px" }}>A one-person studio for honest AI coverage.</h2>

            <div className="aboutContainer">
              <div className="aboutLeftCard">
                <div className="aboutAvatarCircle">JM</div>
                <h3>Jo Mendes</h3>
                <p>Portrait · 2025</p>
              </div>

              <div className="aboutRightCard">
                <div>
                  <p className="aboutBio">
                    Hi, I’m Jo. Portuguese-born, Amsterdam-based creator building NomadaToast, a channel about the practical end of AI. Former software engineer; now making full-time tutorials about the tools, prompts and workflows that turn AI experiments into real, monetisable content.
                  </p>
                  <div className="aboutSpecsGrid">
                    <div className="specItem">
                      <span className="specLbl">Channel</span>
                      <span className="specVal">NomadaToast</span>
                    </div>
                    <div className="specItem">
                      <span className="specLbl">Based</span>
                      <span className="specVal">Amsterdam, NL</span>
                    </div>
                    <div className="specItem">
                      <span className="specLbl">Previously</span>
                      <span className="specVal">Software engineer · dev-tools</span>
                    </div>
                    <div className="specItem">
                      <span className="specLbl">Speaks</span>
                      <span className="specVal">PT · EN · ES</span>
                    </div>
                  </div>
                </div>

                <div className="aboutButtons">
                  <a href="https://youtube.com/@Nomadatoast" target="_blank" rel="noopener noreferrer" className="aboutBtn">Watch latest</a>
                  <a href={LINKS.allLinks} target="_blank" rel="noopener noreferrer" className="aboutBtn">All links</a>
                  <a href="mailto:hi@nomadatoast.com" className="aboutBtn">Get in touch</a>
                </div>
              </div>
            </div>
          </div>

          <div className="narrativePanel" style={{ opacity: 0, width: "100%" }}>
            <p className="eyebrow">Start here</p>
            <h2 style={{ fontSize: "clamp(52px, 3.8vw, 74px)", maxWidth: "800px" }}>Let’s build with AI.</h2>
            <p className="intro" style={{ maxWidth: "600px", marginTop: "24px" }}>
              Subscribe to the channel, drop a note, or pitch a collab. I reply to every real message, hi@nomadatoast.com.
            </p>

            <div className="contactButtons">
              <a
                className="contactBtn"
                href="https://youtube.com/@Nomadatoast"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Subscribe on YouTube</span>
                <span className="arrowDisc" style={{ width: "24px", height: "24px", fontSize: "14px", borderRadius: "6px" }} aria-hidden="true">→</span>
              </a>
              <a className="contactBtn" href="mailto:hi@nomadatoast.com">
                <span>hi@nomadatoast.com</span>
                <span style={{ fontSize: "14px", opacity: 0.8 }} aria-hidden="true">✉</span>
              </a>
            </div>

            <div className="contactLinks">
              <a className="contactLink" href="https://youtube.com/@Nomadatoast" target="_blank" rel="noreferrer">YouTube @Nomadatoast ↗</a>
              <a className="contactLink" href={LINKS.tiktok} target="_blank" rel="noreferrer">TikTok @nomadatoast ↗</a>
              <a className="contactLink" href={LINKS.instagram} target="_blank" rel="noreferrer">Instagram @nomadatoast ↗</a>
              <a className="contactLink" href={LINKS.threads} target="_blank" rel="noreferrer">Threads @nomadatoast ↗</a>
              <a className="contactLink" href={LINKS.x} target="_blank" rel="noreferrer">X @nomadatoast ↗</a>
            </div>
          </div>

          <div className="narrativePanelFull" style={{ opacity: 0 }}>
            <div className="footerCard">
              <div className="footerLogoCol">
                <div>
                  <h3 className="footerLogoTitle">Jo Mendes</h3>
                  <p className="footerLogoDesc">NOMADATOAST</p>
                </div>
                <p style={{ fontSize: "18px", color: "var(--white)", fontWeight: "500", marginTop: "20px" }}>
                  Practical AI for creators.
                </p>
              </div>

              <div className="footerLinkCol">
                <h4>Watch</h4>
                <ul>
                  <li><a href="https://youtube.com/@Nomadatoast" target="_blank" rel="noreferrer">YouTube · @Nomadatoast</a></li>
                  <li><a href={LINKS.tiktok} target="_blank" rel="noreferrer">TikTok · @nomadatoast</a></li>
                  <li><a href={LINKS.instagram} target="_blank" rel="noreferrer">Instagram Reels</a></li>
                  <li><a href={LINKS.youtube} target="_blank" rel="noreferrer">Latest video</a></li>
                </ul>
              </div>

              <div className="footerLinkCol">
                <h4>Read</h4>
                <ul>
                  <li><a href={LINKS.threads} target="_blank" rel="noreferrer">Threads · @nomadatoast</a></li>
                  <li><a href={LINKS.x} target="_blank" rel="noreferrer">X · @nomadatoast</a></li>
                  <li><a href={LINKS.allLinks} target="_blank" rel="noreferrer">All links</a></li>
                </ul>
              </div>

              <div className="footerLinkCol">
                <h4>Contact</h4>
                <ul>
                  <li><a href="mailto:hi@nomadatoast.com">hi@nomadatoast.com</a></li>
                  <li><a href={LINKS.emailPress}>Press & collabs</a></li>
                  <li><span className="footerLocation">Amsterdam · Lisbon</span></li>
                </ul>
              </div>
            </div>

            <div className="hugeFooterText">NomadaToast+</div>

            <div className="bottomBar">
              <span>© 2025 Jo Mendes · NomadaToast. Made using Emergent.</span>
              <div className="bottomBarLinks">
                <a href="https://youtube.com/@Nomadatoast" target="_blank" rel="noreferrer">YOUTUBE</a>
                <a href={LINKS.tiktok} target="_blank" rel="noreferrer">TIKTOK</a>
                <a href={LINKS.instagram} target="_blank" rel="noreferrer">INSTAGRAM</a>
                <a href={LINKS.threads} target="_blank" rel="noreferrer">THREADS</a>
                <a href={LINKS.x} target="_blank" rel="noreferrer">X</a>
              </div>
            </div>
          </div>
        </section>

        <aside ref={infoRailRef} className="informationRail" style={{ opacity: 1 }}>
          <div className="railTop">
            <p>Tutorials · Tool breakdowns · Monetisation</p>
            <p>Amsterdam · Lisbon</p>
          </div>

          <div className="railScenes">
            <div className="railScene" style={{ opacity: 0 }}>
              <p className="railLabel">Currently</p>
              <p className="railMuted">Filming a breakdown of</p>
              <p className="railFeature">Nano Banana Pro</p>
              <p className="railLabel railGap">This week</p>
              <p>Kling 2.6 audio rig</p>
              <p>Higgsfield Earn deep-dive</p>
              <p>AI influencer playbook</p>
            </div>

            <div className="railScene" style={{ opacity: 0 }}>
              <p className="railLabel">Follow</p>
              <a href="https://youtube.com/@Nomadatoast" target="_blank" rel="noreferrer">YouTube</a>
              <a href={LINKS.tiktok} target="_blank" rel="noreferrer">TikTok</a>
              <a href={LINKS.instagram} target="_blank" rel="noreferrer">Instagram</a>
              <a href={LINKS.threads} target="_blank" rel="noreferrer">Threads</a>
              <a href={LINKS.x} target="_blank" rel="noreferrer">X</a>
            </div>

            <div className="railScene" style={{ opacity: 0 }}>
              <p className="railLabel">Contact</p>
              <a href="mailto:hi@nomadatoast.com">hi@nomadatoast.com</a>
              <p className="railLabel railGap">Est. 2023 — 2026</p>
            </div>
          </div>

          <button className="scrollCue" onClick={() => jumpTo(Math.min(progressRef.current + 0.08, 1))}>
            <span aria-hidden="true">↓</span>
            <span>Scroll to explore</span>
          </button>
        </aside>

        <div className="frameCounter" aria-hidden="true" style={{ opacity: 0.62 }}>
          <span ref={activeFrameRef}>01</span>
          <i><b ref={frameCounterLineRef} style={{ transform: "scaleX(0.02)" }} /></i>
          <span>{String(FRAME_COUNT).padStart(2, "0")}</span>
        </div>

        <p className="mobileHint">Scroll to transform <span aria-hidden="true">↓</span></p>
        </div>
      </div>
    </main>
  );
}
