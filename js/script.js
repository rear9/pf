document.addEventListener("DOMContentLoaded", () => {

    const sectionLinks = document.querySelectorAll('a[href^="#"]');
    const navDropdowns = document.querySelectorAll(".nav-dropdown");
    const navTriggers = document.querySelectorAll(".nav-trigger");
    const subTriggers = document.querySelectorAll(".dropdown-subtrigger");
    let lastSpawnTime = 0;
    
    sectionLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");
            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    navTriggers.forEach((trigger) => {
        trigger.addEventListener("click", () => {
            const dropdown = trigger.closest(".nav-dropdown");
            const isOpen = dropdown.classList.contains("open");

            navDropdowns.forEach((item) => {
                item.classList.remove("open");
                const t = item.querySelector(".nav-trigger");
                if (t) t.setAttribute("aria-expanded", "false");
            });

            if (!isOpen) {
                dropdown.classList.add("open");
                trigger.setAttribute("aria-expanded", "true");
            }
        });
    });
    
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".nav-dropdown")) {
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
        }
    });

    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach((button, index) => {
        button.addEventListener('click', async (e) => {
            const textToCopy = button.getAttribute('data-copy');
            const originalText = button.textContent;
            button.classList.add('copied');
            button.textContent = 'Copied!';
            try {
                await navigator.clipboard.writeText(textToCopy);
            } catch (err) {
                try {
                    const textarea = document.createElement('textarea');
                    textarea.value = textToCopy;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                } catch (fallbackErr) {
                    console.error('Failed to copy: ', fallbackErr);
                    button.textContent = 'Error';
                    setTimeout(() => {
                        button.classList.remove('copied');
                        button.textContent = originalText;
                    }, 1500);
                    return;
                }
            }

            setTimeout(() => {
                button.classList.remove('copied');
                button.textContent = originalText;
            }, 1500);
        });
    });

    // ---------- 3D Tilt for About Me card ----------
    const aboutCard = document.getElementById('about');
    if (aboutCard) {
        // Glare CSS custom properties
        aboutCard.style.setProperty('--glare-x', '50%');
        aboutCard.style.setProperty('--glare-y', '50%');

        const maxTilt = 3; // degrees

        function handleMouseMove(e) {
            const rect = aboutCard.getBoundingClientRect();
            const x = e.clientX - rect.left;   // mouse X relative to card
            const y = e.clientY - rect.top;    // mouse Y relative to card

            // Convert to percentage of card size
            const xPercent = (x / rect.width);
            const yPercent = (y / rect.height);

            // Map to rotation: -maxTilt to +maxTilt
            // rotateY: horizontal mouse movement → horizontal rotation
            // rotateX: vertical mouse movement → vertical rotation (negative so moving up tilts back)
            const rotateY = (xPercent - 0.5) * maxTilt;
            const rotateX = (0.5 - yPercent) * maxTilt;

            // Apply transform – remove transition during mousemove for responsiveness
            aboutCard.style.transition = 'none';
            aboutCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            // Update glare position (in % from top-left)
            aboutCard.style.setProperty('--glare-x', `${xPercent * 100}%`);
            aboutCard.style.setProperty('--glare-y', `${yPercent * 100}%`);
        }

        function resetCard() {
            aboutCard.style.transition = 'transform 0.5s ease-out';
            aboutCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
            // Reset glare to center
            aboutCard.style.setProperty('--glare-x', '50%');
            aboutCard.style.setProperty('--glare-y', '50%');
        }

        aboutCard.addEventListener('mousemove', handleMouseMove);
        aboutCard.addEventListener('mouseleave', resetCard);
    }
    // ---------- Ripple effect on click for About Me card ----------
    if (aboutCard) {
        aboutCard.addEventListener('click', function(e) {
            e.stopPropagation();   // ← prevent body from also firing

            if (window.getSelection().toString().length > 0) return;

            const rect = aboutCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top - 5;
            const ripple = document.createElement('span');
            ripple.className = 'ripple-card';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            aboutCard.appendChild(ripple);

            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });
    }

    document.body.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-bg';
        ripple.style.left = e.pageX + 'px';   // document‑relative horizontal
        ripple.style.top = e.pageY + 'px';    // document‑relative vertical
        document.body.appendChild(ripple);    // attach to the scrollable body

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    });

    // ---------- Rising bubbles (viewport‑fixed canvas, document‑relative bubbles) ----------
    const canvas = document.getElementById('bubble-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        const bubbles = [];
        const MAX_BUBBLES = 80;
        const BASE_SPEED = 0.3;
        const SPAWN_INTERVAL = 500; // ms

        function createBubble() {
            // spawn below the current document bottom
            const docBottom = document.body.scrollHeight;
            return {
                x: Math.random() * canvas.width,
                y: docBottom + Math.random() * 60,          // document‑relative
                radius: Math.random() * 14 + 6,
                speed: BASE_SPEED + Math.random() * 0.5,
                opacity: Math.random() * 0.25 + 0.05,
            };
        }

        function updateBubbles() {
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const b = bubbles[i];
                b.y -= b.speed;
                // Remove when totally above the document (or when the bubble is off‑screen)
                if (b.y + b.radius < 0) {
                    bubbles.splice(i, 1);
                }
            }
        }

        function drawBubbles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const scrollY = window.scrollY;
            for (const b of bubbles) {
                const viewportY = b.y - scrollY;
                // Only draw if visible in the viewport
                if (viewportY + b.radius < 0 || viewportY - b.radius > canvas.height) continue;
                ctx.beginPath();
                ctx.arc(b.x, viewportY, b.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(255, 255, 255, ${b.opacity * 0.6})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        let lastSpawnTime = 0;
        function animate(timestamp) {
            if (!lastSpawnTime) lastSpawnTime = timestamp;

            if (timestamp - lastSpawnTime >= SPAWN_INTERVAL && bubbles.length < MAX_BUBBLES) {
                bubbles.push(createBubble());
                lastSpawnTime = timestamp;
            }

            updateBubbles();
            drawBubbles();
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }
    
});