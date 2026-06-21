"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 13;

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStageRef = useRef<HTMLDivElement>(null);
  
  // Header Elements Refs
  const headerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLButtonElement>(null);
  const navPillRef = useRef<HTMLElement>(null);
  const subBtnRef = useRef<HTMLAnchorElement>(null);
  
  // Rail Refs
  const infoRailRef = useRef<HTMLElement>(null);
  
  // Frame Counter Refs
  const activeFrameRef = useRef<HTMLSpanElement>(null);
  const frameCounterLineRef = useRef<HTMLElement>(null);

  // Performance Caching Refs
  const cachedOffsetTop = useRef(0);
  const cachedScrollDistance = useRef(1);
  const progressRef = useRef(0);
  const targetTimeRef = useRef(0);
  const durationRef = useRef(10);

  // Update styles directly in DOM to bypass React re-renders on scroll
  const updateStyles = (progressVal: number) => {
    // 1. Calculate active frame
    const framePosition = progressVal * (FRAME_COUNT - 1);
    const activeFrame = Math.min(FRAME_COUNT, Math.floor(framePosition + 1));

    // 2. Update frame counter DOM
    if (frameCounterLineRef.current) {
      frameCounterLineRef.current.style.transform = `scaleX(${Math.max(progressVal, 0.02)})`;
    }
    if (activeFrameRef.current) {
      activeFrameRef.current.textContent = String(activeFrame).padStart(2, "0");
    }

    // 3. Update main container darkTheme class
    const isDark = progressVal >= 0.235 && progressVal <= 0.325;
    const root = rootRef.current;
    if (root) {
      if (isDark) {
        root.classList.add("darkTheme");
      } else {
        root.classList.remove("darkTheme");
      }
    }

    // 4. Update videoStage opacity and video blur dynamically
    if (videoStageRef.current) {
      videoStageRef.current.style.opacity = isDark ? "0" : "1";
    }
    if (videoRef.current) {
      const blurVal = clamp(1.8 + progressVal * 2.5, 1.8, 4.5);
      videoRef.current.style.filter = `blur(${blurVal}px) saturate(0.95) contrast(1.015) brightness(0.92)`;
    }

    // 5. Update header styles
    if (headerRef.current) {
      headerRef.current.style.transform = `translate3d(0, ${progressVal * -7}px, 0)`;
    }
    if (navPillRef.current) {
      navPillRef.current.style.transform = `scale(${1 - progressVal * 0.035})`;
    }
    if (brandRef.current) {
      brandRef.current.style.opacity = String(1 - progressVal * 0.16);
    }
    if (subBtnRef.current) {
      subBtnRef.current.style.transform = `translateX(${progressVal * 5}px)`;
    }

    // 6. Update narrative panels
    const panels = root?.querySelectorAll(".narrativePanel, .narrativePanelFull");
    if (panels) {
      const opacities = [
        visibleBetween(progressVal, 0.00, 0.07, 0.015), // Hero
        visibleBetween(progressVal, 0.09, 0.15, 0.015), // Audience
        visibleBetween(progressVal, 0.17, 0.22, 0.015), // Ad Moment
        visibleBetween(progressVal, 0.24, 0.32, 0.015), // What I Make
        visibleBetween(progressVal, 0.34, 0.41, 0.015), // Latest Video
        visibleBetween(progressVal, 0.43, 0.50, 0.015), // Philosophy
        visibleBetween(progressVal, 0.52, 0.59, 0.015), // Process
        visibleBetween(progressVal, 0.61, 0.68, 0.015), // Stats
        visibleBetween(progressVal, 0.70, 0.77, 0.015), // Testimonial/Brands
        visibleBetween(progressVal, 0.79, 0.86, 0.015), // Partners
        visibleBetween(progressVal, 0.88, 0.93, 0.015), // About
        visibleBetween(progressVal, 0.95, 0.97, 0.01),  // Start Here
        visibleBetween(progressVal, 0.98, 1.00, 0.015), // Footer
      ];

      panels.forEach((panel, i) => {
        const htmlPanel = panel as HTMLElement;
        const opacity = opacities[i] ?? 0;
        htmlPanel.style.opacity = String(opacity);
        htmlPanel.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
        
        const blurStr = `blur(${(1 - opacity) * 7}px)`;
        const scaleStr = `scale(${0.98 + opacity * 0.02})`;
        
        let translateStr = "";
        if (i === 0) {
          translateStr = `translate3d(0, ${(1 - opacity) * -24}px, 0)`;
        } else {
          translateStr = `translate3d(0, ${(1 - opacity) * 24}px, 0)`;
        }
        
        htmlPanel.style.filter = blurStr;
        htmlPanel.style.transform = `${translateStr} ${scaleStr}`;
      });
    }

    // 7. Update information rails
    const showRail = progressVal <= 0.235;
    if (infoRailRef.current) {
      infoRailRef.current.style.opacity = showRail ? "1" : "0";
      infoRailRef.current.style.pointerEvents = showRail ? "auto" : "none";
    }

    if (showRail && root) {
      const railScenes = root.querySelectorAll(".railScene");
      const railOpacities = [
        visibleBetween(progressVal, 0.00, 0.08, 0.015),
        visibleBetween(progressVal, 0.09, 0.16, 0.015),
        visibleBetween(progressVal, 0.17, 0.235, 0.015)
      ];

      railScenes.forEach((scene, i) => {
        const htmlScene = scene as HTMLElement;
        const opacity = railOpacities[i] ?? 0;
        htmlScene.style.opacity = String(opacity);
        htmlScene.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
        htmlScene.style.filter = `blur(${(1 - opacity) * 5}px)`;
        htmlScene.style.transform = `translate3d(${(1 - opacity) * 18}px, 0, 0)`;
      });
    }
  };

  useEffect(() => {
    let raf = 0;

    const updateMetrics = () => {
      const root = rootRef.current;
      if (!root) return;
      cachedOffsetTop.current = root.offsetTop;
      cachedScrollDistance.current = Math.max(root.offsetHeight - window.innerHeight, 1);
      
      // Re-trigger layout calculations
      const progressVal = clamp((window.scrollY - cachedOffsetTop.current) / cachedScrollDistance.current);
      progressRef.current = progressVal;
      updateStyles(progressVal);
    };

    const update = () => {
      const progressVal = clamp((window.scrollY - cachedOffsetTop.current) / cachedScrollDistance.current);
      progressRef.current = progressVal;

      // Video Timing Limits (completes transition before 0.16)
      const videoProgressLimit = 0.16;
      const scaledProgress = clamp(progressVal / videoProgressLimit);
      targetTimeRef.current = scaledProgress * Math.max(durationRef.current - 0.04, 0);

      updateStyles(progressVal);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    // Initialize layout positions
    updateMetrics();
    
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMetrics);

    // Initial timeout to ensure layout calculations are accurate after initial styles mount
    const timeout = setTimeout(updateMetrics, 100);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMetrics);
      clearTimeout(timeout);
    };
  }, []);

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
        // Only trigger currentTime updates if the timing is not fully caught up
        if (Math.abs(difference) > 0.002) {
          video.currentTime = Math.min(video.currentTime + difference * 0.22, video.duration - 0.04);
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

  const jumpTo = (target: number) => {
    const root = rootRef.current;
    if (!root) return;
    const distance = Math.max(root.offsetHeight - window.innerHeight, 1);
    window.scrollTo({ top: root.offsetTop + distance * target, behavior: "smooth" });
  };

  const partners = [
    "Adobe", "ASUS", "Artlist", "Filmora", "iStock", "Freepik",
    "HeyGen", "Printify", "Sihoo", "Gamma", "Even Realities", "Wix",
    "Kittl", "Kling AI", "Pika", "Hailuo AI", "invideo"
  ];

  return (
    <main ref={rootRef} className="scrollExperience">
      <div className="stickyViewport">
        {/* Background Video Stage */}
        <div ref={videoStageRef} className="videoStage" aria-hidden="true">
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

        {/* Brand Header */}
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

        {/* Narrative Panel Elements */}
        <section className="narrative" aria-live="polite">
          {/* Scene 0: Hero Panel */}
          <div className="narrativePanel" style={{ opacity: 0 }}>
            <p className="eyebrow">Jo Mendes · NomadaToast</p>
            <h1>
              Creating content<br />that <em>connects.</em>
            </h1>
            <p className="intro">Practical AI tutorials for creators who want to grow, ship, and monetise.</p>
          </div>

          {/* Scene 1: Audience Text Panel */}
          <div className="narrativePanel" style={{ opacity: 0 }}>
            <p className="eyebrow">Audience</p>
            <h2>
              Over <em>one million</em><br />curious people.
            </h2>
            <p className="intro">Across YouTube, TikTok, Reels and Shorts. Creators, engineers, founders swapping notes.</p>
          </div>

          {/* Scene 2: The Ad Moment Panel */}
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

          {/* Scene 3: What I Make Panel (Black Background) */}
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

          {/* Scene 4: Latest Video Panel */}
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

              {/* Chat Widget */}
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
                  <span style={{ display: "inline-block", width: "6px", height: "6px", background: "currentColor", borderRadius: "50%", animation: "pulse 1s infinite" }} />
                  <span>Diego is typing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scene 5: Philosophy (How I Make Videos) */}
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

          {/* Scene 6: Process Panel */}
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

          {/* Scene 7: The Audience Stats Grid Panel */}
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

          {/* Scene 8: Testimonial & For Brands Panel */}
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

          {/* Scene 9: Partners & Collaborations Panel */}
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

          {/* Scene 10: About Panel (Jo Mendes Bio) */}
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
                  <a href="#" className="aboutBtn">All links</a>
                  <a href="mailto:hi@nomadatoast.com" className="aboutBtn">Get in touch</a>
                </div>
              </div>
            </div>
          </div>

          {/* Scene 11: Start Here Panel */}
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
              <a className="contactLink" href="#" rel="noreferrer">TikTok @nomadatoast ↗</a>
              <a className="contactLink" href="#" rel="noreferrer">Instagram @nomadatoast ↗</a>
              <a className="contactLink" href="#" rel="noreferrer">Threads @nomadatoast ↗</a>
              <a className="contactLink" href="#" rel="noreferrer">X @nomadatoast ↗</a>
            </div>
          </div>

          {/* Scene 12: Footer Panel */}
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
                  <li><a href="#" rel="noreferrer">TikTok · @nomadatoast</a></li>
                  <li><a href="#" rel="noreferrer">Instagram Reels</a></li>
                  <li><a href="#" rel="noreferrer">Latest video</a></li>
                </ul>
              </div>

              <div className="footerLinkCol">
                <h4>Read</h4>
                <ul>
                  <li><a href="#" rel="noreferrer">Threads · @nomadatoast</a></li>
                  <li><a href="#" rel="noreferrer">X · @nomadatoast</a></li>
                  <li><a href="#" rel="noreferrer">All links</a></li>
                </ul>
              </div>

              <div className="footerLinkCol">
                <h4>Contact</h4>
                <ul>
                  <li><a href="mailto:hi@nomadatoast.com">hi@nomadatoast.com</a></li>
                  <li><a href="#">Press & collabs</a></li>
                  <li><a href="#">Amsterdam · Lisbon</a></li>
                </ul>
              </div>
            </div>

            <div className="hugeFooterText">NomadaToast+</div>

            <div className="bottomBar">
              <span>© 2025 Jo Mendes · NomadaToast. Made using Emergent.</span>
              <div className="bottomBarLinks">
                <a href="https://youtube.com/@Nomadatoast" target="_blank" rel="noreferrer">YOUTUBE</a>
                <a href="#" rel="noreferrer">TIKTOK</a>
                <a href="#" rel="noreferrer">INSTAGRAM</a>
                <a href="#" rel="noreferrer">THREADS</a>
                <a href="#" rel="noreferrer">X</a>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Information Rail */}
        <aside ref={infoRailRef} className="informationRail" style={{ opacity: 1 }}>
          <div className="railTop">
            <p>Tutorials · Tool breakdowns · Monetisation</p>
            <p>Amsterdam · Lisbon</p>
          </div>

          <div className="railScenes">
            {/* Hero Rail Info */}
            <div className="railScene" style={{ opacity: 0 }}>
              <p className="railLabel">Currently</p>
              <p className="railMuted">Filming a breakdown of</p>
              <p className="railFeature">Nano Banana Pro</p>
              <p className="railLabel railGap">This week</p>
              <p>Kling 2.6 audio rig</p>
              <p>Higgsfield Earn deep-dive</p>
              <p>AI influencer playbook</p>
            </div>

            {/* Audience Rail Info */}
            <div className="railScene" style={{ opacity: 0 }}>
              <p className="railLabel">Follow</p>
              <a href="https://youtube.com/@Nomadatoast" target="_blank" rel="noreferrer">YouTube</a>
              <a href="#" rel="noreferrer">TikTok</a>
              <a href="#" rel="noreferrer">Instagram</a>
              <a href="#" rel="noreferrer">Threads</a>
              <a href="#" rel="noreferrer">X</a>
            </div>

            {/* Ad Moment Rail Info */}
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

        {/* Bottom Frame Counter */}
        <div className="frameCounter" aria-hidden="true" style={{ opacity: 0.62 }}>
          <span ref={activeFrameRef}>01</span>
          <i><b ref={frameCounterLineRef} style={{ transform: "scaleX(0.02)" }} /></i>
          <span>{String(FRAME_COUNT).padStart(2, "0")}</span>
        </div>

        <p className="mobileHint">Scroll to transform <span aria-hidden="true">↓</span></p>
      </div>
    </main>
  );
}
