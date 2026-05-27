document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const MOTION_FPS = 24;
    const MOTION_FRAME_INTERVAL = 1000 / MOTION_FPS;
    const RIPPLE_COOLDOWN = 50;

    function prefersReducedMotion() {
        return prefersReducedMotionQuery.matches;
    }

    function injectMotionCSS() {
        const style = document.createElement("style");
        style.textContent = `
            .wave-layer::before{
                animation-play-state:var(--wave-play-state,running);
            }

            .motion-paused .wave-layer::before,
            .motion-reduced .wave-layer::before{
                animation-play-state:paused!important;
            }

            .motion-reduced #bubble-canvas{
                display:none!important;
            }

            .motion-reduced .ripple-card,
            .motion-reduced .ripple-bg,
            .motion-reduced .ripple{
                display:none!important;
                animation:none!important;
            }
        `;
        document.head.appendChild(style);
    }

    function applyMotionPreference() {
        document.documentElement.classList.toggle("motion-reduced", prefersReducedMotion());
    }

    injectMotionCSS();
    applyMotionPreference();

    if (typeof prefersReducedMotionQuery.addEventListener === "function") {
        prefersReducedMotionQuery.addEventListener("change", applyMotionPreference);
    } else if (typeof prefersReducedMotionQuery.addEventListener === "function") {
        prefersReducedMotionQuery.addEventListener(applyMotionPreference);
    }

    const sectionLinks = document.querySelectorAll('a[href^="#"]');
    const navDropdowns = document.querySelectorAll(".nav-dropdown");
    const navTriggers = document.querySelectorAll(".nav-trigger");

    sectionLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");
            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: prefersReducedMotion() ? "auto" : "smooth",
                block: "start"
            });
        });
    });

    navTriggers.forEach((trigger) => {
        trigger.addEventListener("click", () => {
            const dropdown = trigger.closest(".nav-dropdown");
            if (!dropdown) return;

            const isOpen = dropdown.classList.contains("open");

            navDropdowns.forEach((item) => {
                item.classList.remove("open");

                const itemTrigger = item.querySelector(".nav-trigger");
                if (itemTrigger) itemTrigger.setAttribute("aria-expanded", "false");
            });

            if (!isOpen) {
                dropdown.classList.add("open");
                trigger.setAttribute("aria-expanded", "true");
            }
        });
    });

    document.addEventListener("click", (event) => {
        if (event.target.closest(".nav-dropdown")) return;

        navDropdowns.forEach((item) => {
            item.classList.remove("open");

            const trigger = item.querySelector(".nav-trigger");
            if (trigger) trigger.setAttribute("aria-expanded", "false");

            item.querySelectorAll(".dropdown-submenu").forEach((sub) => {
                sub.classList.remove("open");

                const subTrigger = sub.querySelector(".dropdown-subtrigger");
                if (subTrigger) subTrigger.setAttribute("aria-expanded", "false");
            });
        });
    });

    const copyButtons = document.querySelectorAll(".copy-btn");
    const emailBtn = document.getElementById("email-copy-btn");
    if (emailBtn) {
        const e = "aprexbiz" + "\u0040" + "gmail.com";
        emailBtn.setAttribute("data-copy", e);
        emailBtn.textContent = e;
    }
    
    copyButtons.forEach((button) => {
        button.addEventListener("click", async () => {
            const textToCopy = button.getAttribute("data-copy");
            const originalText = button.textContent;

            button.classList.add("copied");
            button.textContent = "Copied!";

            try {
                await navigator.clipboard.writeText(textToCopy);
            } catch (err) {
                try {
                    const textarea = document.createElement("textarea");
                    textarea.value = textToCopy;
                    textarea.style.position = "fixed";
                    textarea.style.opacity = "0";
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                } catch (fallbackErr) {
                    console.error("Failed to copy:", fallbackErr);

                    button.textContent = "Error";

                    setTimeout(() => {
                        button.classList.remove("copied");
                        button.textContent = originalText;
                    }, 1500);

                    return;
                }
            }

            setTimeout(() => {
                button.classList.remove("copied");
                button.textContent = originalText;
            }, 1500);
        });
    });

    // ---------- Wave throttling / pausing ----------
    const waveStacks = document.querySelectorAll(".wave-stack");

    function configureWaves() {
        if (!waveStacks.length) return;

        document.querySelectorAll(".layer-1").forEach((layer) => {
            layer.style.setProperty("--drift-duration", "48s");
        });

        document.querySelectorAll(".layer-2").forEach((layer) => {
            layer.style.setProperty("--drift-duration", "72s");
        });

        document.querySelectorAll(".layer-3").forEach((layer) => {
            layer.style.setProperty("--drift-duration", "108s");
        });

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle("motion-paused", !entry.isIntersecting);
                });
            }, {
                root: null,
                threshold: 0
            });

            waveStacks.forEach((stack) => observer.observe(stack));
        }
    }

    configureWaves();

    function updateGlobalMotionState() {
        const shouldPause = document.hidden || prefersReducedMotion();
        document.documentElement.classList.toggle("motion-paused", shouldPause);
    }

    document.addEventListener("visibilitychange", updateGlobalMotionState);
    updateGlobalMotionState();
    
    const aboutCard = document.getElementById("about");

    if (aboutCard && !prefersReducedMotion()) {
        aboutCard.style.setProperty("--glare-x", "50%");
        aboutCard.style.setProperty("--glare-y", "50%");

        const maxTilt = 3;
        let latestMouseEvent = null;
        let tiltFrameId = null;
        let lastTiltFrameTime = 0;

        function updateTilt(timestamp) {
            tiltFrameId = requestAnimationFrame(updateTilt);

            if (!latestMouseEvent) return;
            if (timestamp - lastTiltFrameTime < MOTION_FRAME_INTERVAL) return;

            lastTiltFrameTime = timestamp;

            const rect = aboutCard.getBoundingClientRect();
            const x = latestMouseEvent.clientX - rect.left;
            const y = latestMouseEvent.clientY - rect.top;

            const xPercent = x / rect.width;
            const yPercent = y / rect.height;

            const rotateY = (xPercent - 0.5) * maxTilt;
            const rotateX = (0.5 - yPercent) * maxTilt;

            aboutCard.style.transition = "none";
            aboutCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            aboutCard.style.setProperty("--glare-x", `${xPercent * 100}%`);
            aboutCard.style.setProperty("--glare-y", `${yPercent * 100}%`);
        }

        function startTiltLoop() {
            if (!tiltFrameId) {
                lastTiltFrameTime = 0;
                tiltFrameId = requestAnimationFrame(updateTilt);
            }
        }

        function stopTiltLoop() {
            if (tiltFrameId) {
                cancelAnimationFrame(tiltFrameId);
                tiltFrameId = null;
            }
        }

        function resetCard() {
            latestMouseEvent = null;
            stopTiltLoop();

            aboutCard.style.transition = "transform 120ms linear";
            aboutCard.style.transform = "rotateX(0deg) rotateY(0deg)";
            aboutCard.style.setProperty("--glare-x", "50%");
            aboutCard.style.setProperty("--glare-y", "50%");

            window.setTimeout(() => {
                aboutCard.style.transition = "none";
            }, 140);
        }

        aboutCard.addEventListener("mousemove", (event) => {
            latestMouseEvent = event;
            startTiltLoop();
        });

        aboutCard.addEventListener("mouseleave", resetCard);

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) resetCard();
        });
    }

    // ---------- Ripple effects, rate-limited ----------
    let lastCardRippleTime = 0;
    let lastBodyRippleTime = 0;

    function createRipple(parent, className, x, y) {
        if (prefersReducedMotion() || document.hidden) return;

        const ripple = document.createElement("span");
        ripple.className = className;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        parent.appendChild(ripple);

        ripple.addEventListener("animationend", () => {
            ripple.remove();
        }, {
            once: true
        });
    }

    if (aboutCard) {
        aboutCard.addEventListener("click", (event) => {
            event.stopPropagation();

            if (prefersReducedMotion()) return;
            if (window.getSelection().toString().length > 0) return;

            const now = performance.now();
            if (now - lastCardRippleTime < RIPPLE_COOLDOWN) return;

            lastCardRippleTime = now;

            const x = event.offsetX;
            const y = event.offsetY;

            createRipple(aboutCard, "ripple-card", x, y);
        });
    }

    document.body.addEventListener("click", (event) => {
        if (prefersReducedMotion()) return;

        const now = performance.now();
        if (now - lastBodyRippleTime < RIPPLE_COOLDOWN) return;

        lastBodyRippleTime = now;

        createRipple(document.body, "ripple-bg", event.pageX, event.pageY);
    });
    
    const canvas = document.getElementById("bubble-canvas");

    if (canvas && !prefersReducedMotion()) {
        const ctx = canvas.getContext("2d", {
            alpha: true
        });

        const bubbles = [];
        const MAX_BUBBLES = 30;
        const BASE_SPEED = 0.3;
        const SPAWN_INTERVAL = 650;
        const TARGET_FPS = 24;
        const FRAME_INTERVAL = 1000 / TARGET_FPS;

        let animationId = null;
        let lastFrameTime = 0;
        let lastSpawnTime = 0;

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

            canvas.width = Math.floor(window.innerWidth * dpr);
            canvas.height = Math.floor(window.innerHeight * dpr);
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function createBubble() {
            const docBottom = document.body.scrollHeight;

            return {
                x: Math.random() * window.innerWidth,
                y: docBottom + Math.random() * 60,
                radius: Math.random() * 12 + 5,
                speed: BASE_SPEED + Math.random() * 0.45,
                opacity: Math.random() * 0.2 + 0.04
            };
        }

        function updateBubbles() {
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const bubble = bubbles[i];

                bubble.y -= bubble.speed;

                if (bubble.y + bubble.radius < 0) {
                    bubbles.splice(i, 1);
                }
            }
        }

        function drawBubbles() {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            const scrollY = window.scrollY;

            for (const bubble of bubbles) {
                const viewportY = bubble.y - scrollY;

                if (viewportY + bubble.radius < 0 || viewportY - bubble.radius > window.innerHeight) {
                    continue;
                }

                ctx.beginPath();
                ctx.arc(bubble.x, viewportY, bubble.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${bubble.opacity})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(255,255,255,${bubble.opacity * 0.6})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        function animate(timestamp) {
            animationId = requestAnimationFrame(animate);

            if (document.hidden || prefersReducedMotion()) {
                return;
            }

            if (timestamp - lastFrameTime < FRAME_INTERVAL) {
                return;
            }

            lastFrameTime = timestamp;

            if (!lastSpawnTime) {
                lastSpawnTime = timestamp;
            }

            if (timestamp - lastSpawnTime >= SPAWN_INTERVAL && bubbles.length < MAX_BUBBLES) {
                bubbles.push(createBubble());
                lastSpawnTime = timestamp;
            }

            updateBubbles();
            drawBubbles();
        }

        function startAnimation() {
            if (!animationId && !prefersReducedMotion()) {
                lastFrameTime = 0;
                animationId = requestAnimationFrame(animate);
            }
        }

        function stopAnimation() {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }

        let resizeTimeout = null;

        window.addEventListener("resize", () => {
            clearTimeout(resizeTimeout);

            resizeTimeout = setTimeout(() => {
                resize();
            }, 150);
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });

        if (typeof prefersReducedMotionQuery.addEventListener === "function") {
            prefersReducedMotionQuery.addEventListener("change", () => {
                if (prefersReducedMotion()) {
                    stopAnimation();
                    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
                } else {
                    startAnimation();
                }
            });
        }

        resize();
        startAnimation();
    }
});