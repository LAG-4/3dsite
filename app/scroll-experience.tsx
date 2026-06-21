"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 7;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function visibleBetween(progress: number, start: number, end: number, fade = 0.075) {
  if (progress < start) return clamp((progress - (start - fade)) / fade);
  if (progress > end) return clamp((end + fade - progress) / fade);
  return 1;
}

export function ScrollExperience() {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const durationRef = useRef(10);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const root = rootRef.current;
      if (!root) return;

      const start = root.offsetTop;
      const distance = Math.max(root.offsetHeight - window.innerHeight, 1);
      setProgress(clamp((window.scrollY - start) / distance));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    targetTimeRef.current = progress * Math.max(durationRef.current - 0.04, 0);
  }, [progress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMetadata = () => {
      durationRef.current = Number.isFinite(video.duration) ? video.duration : 10;
      video.pause();
      video.currentTime = Math.min(targetTimeRef.current, durationRef.current - 0.04);
    };

    let animationFrame = 0;
    const renderFrame = () => {
      if (video.readyState >= 2 && Number.isFinite(video.duration)) {
        const difference = targetTimeRef.current - video.currentTime;
        if (Math.abs(difference) > 0.008) {
          video.currentTime += difference * 0.16;
        }
      }
      animationFrame = requestAnimationFrame(renderFrame);
    };

    video.addEventListener("loadedmetadata", onMetadata);
    if (video.readyState >= 1) onMetadata();
    animationFrame = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrame);
      video.removeEventListener("loadedmetadata", onMetadata);
    };
  }, []);

  const framePosition = progress * (FRAME_COUNT - 1);
  const heroOpacity = visibleBetween(progress, 0, 0.24);
  const audienceOpacity = visibleBetween(progress, 0.32, 0.69);
  const finalOpacity = visibleBetween(progress, 0.79, 1);
  const firstRailOpacity = visibleBetween(progress, 0, 0.3);
  const socialRailOpacity = visibleBetween(progress, 0.31, 0.67);
  const contactRailOpacity = visibleBetween(progress, 0.72, 1);
  const activeFrame = Math.min(FRAME_COUNT, Math.floor(framePosition + 1));

  const jumpTo = (target: number) => {
    const root = rootRef.current;
    if (!root) return;
    const distance = Math.max(root.offsetHeight - window.innerHeight, 1);
    window.scrollTo({ top: root.offsetTop + distance * target, behavior: "smooth" });
  };

  return (
    <main ref={rootRef} className="scrollExperience">
      <div className="stickyViewport">
        <div className="videoStage" aria-hidden="true">
          <video
            ref={videoRef}
            className="scrollVideo"
            src="/head-transformation.mp4"
            poster="/head-poster.webp"
            muted
            playsInline
            preload="auto"
          />
          <div className="videoTreatment" />
        </div>

        <div className="grain" aria-hidden="true" />
        <div className="viewportFrame" aria-hidden="true" />

        <header
          className="siteHeader"
          style={{ transform: `translate3d(0, ${progress * -7}px, 0)` }}
        >
          <button
            className="brand"
            onClick={() => jumpTo(0)}
            aria-label="Back to the beginning"
            style={{ opacity: 1 - progress * 0.16 }}
          >
            <span className="brandMark" aria-hidden="true" />
            <span className="brandCopy">
              <strong>Your Name</strong>
              <small>Studio</small>
            </span>
          </button>

          <nav
            className="navPill"
            aria-label="Primary navigation"
            style={{ transform: `scale(${1 - progress * 0.035})` }}
          >
            <button onClick={() => jumpTo(0)}>Work</button>
            <button onClick={() => jumpTo(0.37)}>Topics</button>
            <button onClick={() => jumpTo(0.62)}>About</button>
            <button onClick={() => jumpTo(0.88)}>Contact</button>
          </nav>

          <a
            className="subscribeButton"
            href="mailto:hello@example.com?subject=Subscribe"
            style={{ transform: `translateX(${progress * 5}px)` }}
          >
            <span>Subscribe</span>
            <span className="arrowDisc" aria-hidden="true">→</span>
          </a>
        </header>

        <section className="narrative" aria-live="polite">
          <div
            className="narrativePanel"
            style={{
              opacity: heroOpacity,
              pointerEvents: heroOpacity > 0.5 ? "auto" : "none",
              filter: `blur(${(1 - heroOpacity) * 7}px)`,
              transform: `translate3d(0, ${(1 - heroOpacity) * -24}px, 0) scale(${0.98 + heroOpacity * 0.02})`,
            }}
          >
            <p className="eyebrow">Your Name · Studio</p>
            <h1>
              Creating content<br />that <em>connects.</em>
            </h1>
            <p className="intro">Practical AI tutorials for creators who want to grow, ship, and monetise.</p>
          </div>

          <div
            className="narrativePanel"
            style={{
              opacity: audienceOpacity,
              pointerEvents: audienceOpacity > 0.5 ? "auto" : "none",
              filter: `blur(${(1 - audienceOpacity) * 7}px)`,
              transform: `translate3d(0, ${(1 - audienceOpacity) * 24}px, 0) scale(${0.98 + audienceOpacity * 0.02})`,
            }}
          >
            <p className="eyebrow">Audience</p>
            <h2>
              Over <em>one million</em><br />curious people.
            </h2>
            <p className="intro">Across YouTube, TikTok, Reels and Shorts. Creators, engineers, founders swapping notes.</p>
          </div>

          <div
            className="narrativePanel"
            style={{
              opacity: finalOpacity,
              pointerEvents: finalOpacity > 0.5 ? "auto" : "none",
              filter: `blur(${(1 - finalOpacity) * 7}px)`,
              transform: `translate3d(0, ${(1 - finalOpacity) * 24}px, 0) scale(${0.98 + finalOpacity * 0.02})`,
            }}
          >
            <p className="eyebrow">The ad moment</p>
            <h2>
              Made by<br />Your Name<br />with <em>care.</em>
            </h2>
            <p className="intro finalIntro">A scroll-led portrait study built from image, motion and a little controlled chaos.</p>
            <a className="projectButton" href="mailto:hello@example.com?subject=Project%20enquiry">
              <span>Start a project</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <aside className="informationRail">
          <div className="railTop">
            <p>Tutorials · Tool breakdowns · Monetisation</p>
            <p>Available · Worldwide</p>
          </div>

          <div className="railScenes">
            <div
              className="railScene"
              style={{
                opacity: firstRailOpacity,
                pointerEvents: firstRailOpacity > 0.5 ? "auto" : "none",
                filter: `blur(${(1 - firstRailOpacity) * 5}px)`,
                transform: `translate3d(${(1 - firstRailOpacity) * 18}px, 0, 0)`,
              }}
            >
              <p className="railLabel">Currently</p>
              <p className="railMuted">Filming a breakdown of</p>
              <p className="railFeature">Nano Banana Pro</p>
              <p className="railLabel railGap">This week</p>
              <p>Kling 2.6 audio rig</p>
              <p>Higgsfield Earn deep-dive</p>
            </div>

            <div
              className="railScene"
              style={{
                opacity: socialRailOpacity,
                pointerEvents: socialRailOpacity > 0.5 ? "auto" : "none",
                filter: `blur(${(1 - socialRailOpacity) * 5}px)`,
                transform: `translate3d(${(1 - socialRailOpacity) * 18}px, 0, 0)`,
              }}
            >
              <p className="railLabel">Follow</p>
              <a href="#" rel="noreferrer">YouTube</a>
              <a href="#" rel="noreferrer">TikTok</a>
              <a href="#" rel="noreferrer">Instagram</a>
              <a href="#" rel="noreferrer">Threads</a>
              <a href="#" rel="noreferrer">X</a>
            </div>

            <div
              className="railScene"
              style={{
                opacity: contactRailOpacity,
                pointerEvents: contactRailOpacity > 0.5 ? "auto" : "none",
                filter: `blur(${(1 - contactRailOpacity) * 5}px)`,
                transform: `translate3d(${(1 - contactRailOpacity) * 18}px, 0, 0)`,
              }}
            >
              <p className="railLabel">Contact</p>
              <a href="mailto:hello@example.com">hello@example.com</a>
              <p className="railLabel railGap">Est. 2023 — 2026</p>
            </div>
          </div>

          <button className="scrollCue" onClick={() => jumpTo(Math.min(progress + 0.17, 1))}>
            <span aria-hidden="true">↓</span>
            <span>Scroll to explore</span>
          </button>
        </aside>

        <div
          className="frameCounter"
          aria-hidden="true"
          style={{ opacity: 0.62 + progress * 0.38 }}
        >
          <span>{String(activeFrame).padStart(2, "0")}</span>
          <i><b style={{ transform: `scaleX(${Math.max(progress, 0.02)})` }} /></i>
          <span>{String(FRAME_COUNT).padStart(2, "0")}</span>
        </div>

        <p className="mobileHint">Scroll to transform <span aria-hidden="true">↓</span></p>
      </div>
    </main>
  );
}
