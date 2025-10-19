document.addEventListener('DOMContentLoaded', function() {
    const hasGSAP = typeof window.gsap !== 'undefined';
    const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';
    if (hasGSAP && hasScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // --- Enhanced Custom Cursor ---
    if (!prefersReduced && !isTouch) {
        const cursorDot = document.querySelector(".cursor-dot");
        const cursorOutline = document.querySelector(".cursor-outline");
        let mouseX = 0, mouseY = 0;
        let outlineX = 0, outlineY = 0;

        // Smooth cursor movement with GSAP
        window.addEventListener("mousemove", function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
            cursorDot.style.opacity = '1';
            cursorOutline.style.opacity = '1';
        });

        // Smooth outline following with GSAP
        function animateCursor() {
            outlineX += (mouseX - outlineX) * 0.1;
            outlineY += (mouseY - outlineY) * 0.1;
            if (hasGSAP) {
                gsap.set(cursorOutline, { left: outlineX, top: outlineY });
            } else {
                cursorOutline.style.left = outlineX + 'px';
                cursorOutline.style.top = outlineY + 'px';
            }
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hide/Show on window enter/leave
        window.addEventListener("mouseleave", function() {
            cursorDot.style.opacity = '0';
            cursorOutline.style.opacity = '0';
        });
        window.addEventListener("mouseenter", function() {
            cursorDot.style.opacity = '1';
            cursorOutline.style.opacity = '1';
        });

        // Hover effects for interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .service-card, .btn-premium, .gallery-item, .group, .testimonial-card, input, textarea');
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                cursorOutline.classList.add('cursor-hover');
                if (hasGSAP) gsap.to(cursorOutline, { scale: 1.8, duration: 0.3, ease: "power2.out" });
            });
            element.addEventListener('mouseleave', function() {
                cursorOutline.classList.remove('cursor-hover');
                if (hasGSAP) gsap.to(cursorOutline, { scale: 1, duration: 0.3, ease: "power2.out" });
            });
        });

        // Click animation
        document.addEventListener('mousedown', function() {
            cursorOutline.classList.add('cursor-click');
            if (hasGSAP) gsap.to(cursorOutline, { scale: 0.8, duration: 0.1, ease: "power2.out" });
        });
        document.addEventListener('mouseup', function() {
            cursorOutline.classList.remove('cursor-click');
            if (hasGSAP) gsap.to(cursorOutline, { scale: (cursorOutline.classList.contains('cursor-hover') ? 1.8 : 1), duration: 0.2, ease: "power2.out" });
        });
    }

    // --- Enhanced Preloader & Hero Animation ---
    const preloader = document.getElementById('preloader');
    let preloaderHidden = false;
    function hidePreloader() {
        if (!preloader || preloaderHidden || preloader.style.display === 'none') return;
        preloaderHidden = true;
        if (hasGSAP) {
            gsap.to(preloader, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: () => (preloader.style.display = 'none')
            });
        } else {
            preloader.style.opacity = '0';
            preloader.style.display = 'none';
        }
    }

    async function checkBackendReady(timeoutMs = 1500) {
        try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), timeoutMs);
            const resp = await fetch('/health', { cache: 'no-store', signal: ctrl.signal });
            clearTimeout(t);
            if (resp.ok) return true;
        } catch (_) { /* ignore */ }
        return false;
    }

    // Fallback: hide preloader after a short delay even if some heavy resources block window load
    setTimeout(() => hidePreloader(), 4000);

    window.addEventListener('load', async () => {
        // Prefer to ensure backend is reachable quickly, but don't block UI if it isn't
        await checkBackendReady(1500);
        hidePreloader();
        
        if (hasGSAP) {
            const tl = gsap.timeline({defaults: { ease: "power3.out" }});
            tl.fromTo("#hero-title", { 
                opacity: 0, 
                y: 80, 
                scale: 0.9 
            }, { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                duration: 1.2, 
                delay: 0.3 
            })
            .fromTo("#hero-subtitle", { 
                opacity: 0, 
                y: 30,
                filter: "blur(10px)"
            }, { 
                opacity: 1, 
                y: 0,
                filter: "blur(0px)",
                duration: 1, 
                ease: "power2.out"
            }, "-=0.8")
            .fromTo("#hero-button", { 
                opacity: 0, 
                y: 30,
                scale: 0.9
            }, { 
                opacity: 1, 
                y: 0,
                scale: 1,
                duration: 0.8 
            }, "-=0.6")
            .fromTo("#scroll-indicator", { 
                opacity: 0,
                y: 20
            }, { 
                opacity: 1,
                y: 0,
                duration: 0.6 
            }, "-=0.4");
        }
    });
    
    // --- Mobile Menu ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const icon = mobileMenuButton.querySelector('i');
    const toggleMenu = () => {
        mobileMenu.classList.toggle('hidden');
        document.body.style.overflow = mobileMenu.classList.contains('hidden') ? 'auto' : 'hidden';
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    };
    mobileMenuButton.addEventListener('click', toggleMenu);
    document.querySelectorAll('.menu-link').forEach(link => link.addEventListener('click', toggleMenu));

    // --- Parallax Icons ---
    const parallaxBg = document.getElementById('parallax-bg');
    const icons = ['<path d="M12 2L2 22h20L12 2z"/>', '<circle cx="12" cy="12" r="10"/>', '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>', '<path d="M3 3h18v18H3z"/>' ];
    const iconCount = prefersReduced ? 0 : (isTouch ? 18 : 40);
    for (let i = 0; i < iconCount; i++) {
        const iconEl = document.createElement('div');
        iconEl.classList.add('parallax-icon');
        const size = Math.random() * 40 + 15;
        iconEl.style.cssText = `width:${size}px; height:${size}px; top:${Math.random()*200}vh; left:${Math.random()*100}vw;`;
        iconEl.dataset.speed = Math.random() * 2 - 1;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'currentColor');
        svg.innerHTML = icons[Math.floor(Math.random() * icons.length)];
        iconEl.appendChild(svg);
        if (Math.random() > 0.8) {
            iconEl.classList.add(Math.random() > 0.5 ? 'pulsing-red' : 'pulsing-green');
            iconEl.style.animationDelay = `${Math.random() * 5}s`;
        }
        parallaxBg.appendChild(iconEl);
    }
    
    if (!prefersReduced && iconCount > 0) {
        gsap.to(".parallax-icon", {
            scrollTrigger: { scrub: 1.5 },
            y: (i, target) => -ScrollTrigger.maxScroll(window) * target.dataset.speed * 0.2
        });
    }

    // --- Enhanced Scroll Animations for Sections ---
    gsap.utils.toArray('.reveal').forEach((el, index) => {
        gsap.fromTo(el, { 
            opacity: 0, 
            y: 60,
            scale: 0.95,
            filter: "blur(5px)"
        }, { 
            opacity: 1, 
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: prefersReduced ? 0.01 : 1.2, 
            ease: 'power2.out', 
            scrollTrigger: { 
                trigger: el, 
                start: 'top 80%', 
                toggleActions: 'play none none reverse',
                delay: index * 0.1
            } 
        });
    });

    // Enhanced service card animations
    gsap.utils.toArray('.service-card').forEach((card, index) => {
        gsap.fromTo(card, {
            opacity: 0,
            y: 50,
            rotationX: 15
        }, {
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: prefersReduced ? 0.01 : 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            delay: index * 0.15
        });
    });

    // Enhanced gallery item animations
    gsap.utils.toArray('.group').forEach((item, index) => {
        gsap.fromTo(item, {
            opacity: 0,
            y: 40,
            scale: 0.9
        }, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: prefersReduced ? 0.01 : 0.6,
            ease: 'back.out(1.7)',
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                toggleActions: 'play none none reverse'
            },
            delay: index * 0.1
        });
    });

    // Enhanced video section animations
    gsap.utils.toArray('#video-showcase .reveal').forEach((element, index) => {
        gsap.fromTo(element, {
            opacity: 0,
            y: 60,
            scale: 0.95,
            filter: "blur(5px)"
        }, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: prefersReduced ? 0.01 : 1.2,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: element,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            delay: index * 0.15
        });
    });

    // Video container hover effects
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer && !prefersReduced) {
        videoContainer.addEventListener('mouseenter', function() {
            gsap.to(this, {
                scale: 1.02,
                duration: 0.4,
                ease: "power2.out"
            });
        });
        
        videoContainer.addEventListener('mouseleave', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.4,
                ease: "power2.out"
            });
        });
    }

    // --- Enhanced Header Style on Scroll ---
    const header = document.getElementById('header');
    ScrollTrigger.create({
        start: 'top -80',
        end: 99999,
        toggleClass: { className: 'header-scrolled', targets: header }
    });

    // Enhanced hero parallax effect
    if (!prefersReduced) {
    gsap.to("#hero-video", {
        yPercent: -50,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });

    // Smooth hero content parallax
    gsap.to(".hero-content", {
        yPercent: -30,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });
    }

    // --- Countdown Timer Logic ---
    const countdownTimer = () => {
        const now = new Date();
        const target = new Date(now);
        target.setHours(14, 0, 0, 0); // Hedef saat 14:00

        if(now.getHours() >= 14 || now.getHours() < 10) { 
            // Eğer saat 14:00'ü geçtiyse veya sabah 10'dan önceyse
            // Sayacı gösterme, bitti mesajı ver
            document.getElementById("countdown").innerHTML = "<div class='text-xl col-span-4 font-orbitron'>Fırsat Yarın 10:00'da!</div>";
            return;
        }

        const distance = target.getTime() - now.getTime();
        
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
    };

    setInterval(countdownTimer, 1000);
    countdownTimer();

    // --- Reservation Form Submit -> Backend -> WhatsApp Redirect ---
    const form = document.getElementById('reservation-form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = new URLSearchParams(new FormData(form));
            try {
                const resp = await fetch('/api/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString(),
                });
                const data = await resp.json();
                if (data && data.redirect) {
                    window.location.href = data.redirect;
                } else if (data && data.ok) {
                    alert('Talebiniz alındı. Teşekkürler!');
                    form.reset();
                } else {
                    alert('Bir hata oluştu. Lütfen tekrar deneyin.');
                }
            } catch (err) {
                alert('Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.');
            }
        });
    }

});
