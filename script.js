// ============================================
// ŞAHSƏDDIN İMANLI — Website Scripts
// ============================================

// Firebase is initialized in HTML before this script loads
var adminDb = (typeof firebase !== 'undefined') ? firebase.database() : null;
sessionStorage.removeItem('blogAdminAuth');

document.addEventListener('DOMContentLoaded', () => {

    // === ZENG BADGE TOOLTIP ===
    const zengBadge = document.getElementById('zengBadge');
    const zengTooltip = document.getElementById('zengTooltip');
    if (zengBadge && zengTooltip) {
        zengBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            zengTooltip.classList.toggle('active');
        });
        document.addEventListener('click', () => {
            zengTooltip.classList.remove('active');
        });
    }

    // === CALENDAR MODAL ===
    const openCalBtn = document.getElementById('openCalendarBtn');
    const calModal = document.getElementById('calendarModal');
    const calModalClose = document.getElementById('calendarModalClose');

    if (openCalBtn && calModal) {
        openCalBtn.addEventListener('click', () => {
            calModal.classList.add('active');
        });
    }
    if (calModalClose && calModal) {
        calModalClose.addEventListener('click', () => {
            calModal.classList.remove('active');
        });
    }
    if (calModal) {
        calModal.addEventListener('click', (e) => {
            if (e.target === calModal) calModal.classList.remove('active');
        });
    }

    // === LANGUAGE SWITCHER ===
    let currentLang = localStorage.getItem('lang') || 'az';

    const socialLinks = {
        az: {
            tiktok: 'https://www.tiktok.com/@shahseddinimanli',
            facebook: 'https://www.facebook.com/shahseddin.imanli',
            instagram: 'https://www.instagram.com/parapsixoloq_yoq/',
            whatsapp: 'https://wa.link/wcams9',
            youtube: 'https://www.youtube.com/@sahseddinimanli',
            telegram: 'https://web.telegram.org/k/#@menevi_shefaci'
        },
        ru: {
            tiktok: 'https://www.tiktok.com/@shahseddinimanli1',
            facebook: 'https://www.facebook.com/shahseddin.imanli',
            instagram: 'https://www.instagram.com/shahseddinimanli/',
            whatsapp: 'https://wa.link/wcams9',
            youtube: 'https://www.youtube.com/@%D0%A8%D0%B0%D1%85%D1%81%D0%B0%D0%B4%D0%B4%D0%B8%D0%BD%D0%98%D0%BC%D0%B0%D0%BD%D0%BB%D1%8B',
            telegram: 'https://web.telegram.org/k/#@menevi_shefaci'
        },
        en: {
            tiktok: 'https://www.tiktok.com/@shahseddinimanli',
            facebook: 'https://www.facebook.com/shahseddin.imanli',
            instagram: 'https://www.instagram.com/parapsixoloq_yoq/',
            whatsapp: 'https://wa.link/wcams9',
            youtube: 'https://www.youtube.com/@sahseddinimanli',
            telegram: 'https://web.telegram.org/k/#@menevi_shefaci'
        },
        tr: {
            tiktok: 'https://www.tiktok.com/@shahseddinimanli',
            facebook: 'https://www.facebook.com/shahseddin.imanli',
            instagram: 'https://www.instagram.com/parapsixoloq_yoq/',
            whatsapp: 'https://wa.link/wcams9',
            youtube: 'https://www.youtube.com/@sahseddinimanli',
            telegram: 'https://web.telegram.org/k/#@menevi_shefaci'
        }
    };

    function updateSocialLinks(lang) {
        const links = socialLinks[lang] || socialLinks.az;
        document.querySelectorAll('[data-social]').forEach(el => {
            const platform = el.getAttribute('data-social');
            if (links[platform]) {
                el.href = links[platform];
            }
        });
    }

    function applyTranslations(lang) {
        const t = translations[lang];
        if (!t) return;

        document.documentElement.lang = lang;
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.cookie = 'lang=' + lang + ';path=/;max-age=31536000;SameSite=Lax';

        // Text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });

        // HTML content (for <strong> tags etc.)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (t[key]) el.innerHTML = t[key];
        });

        // Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (t[key]) el.placeholder = t[key];
        });

        // Update active lang button
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });

        // Re-render calendar with new language
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderHeroCalendar === 'function') renderHeroCalendar();

        // Re-render blog posts (no re-fetch needed, all locales use az)
        try {
            if (allBlogCards && allBlogCards.length > 0 && typeof renderBlogPage === 'function') {
                renderBlogPage(1);
            } else if (typeof fetchBlogPosts === 'function') {
                fetchBlogPosts();
            }
        } catch(e) {}

        // Update auth navbar text
        try {
            if (typeof updateNavbarAuth === 'function' && typeof firebase !== 'undefined' && firebase.auth) {
                updateNavbarAuth(firebase.auth().currentUser);
            }
        } catch(e) {}
        try {
            if (typeof window.updateNavAnonLabel === 'function') window.updateNavAnonLabel();
        } catch(e) {}

        // Update social links based on language
        updateSocialLinks(lang);

        // Re-render announcements with new language
        if (typeof renderAnnSectionPage === 'function') renderAnnSectionPage();

        // Update campaign "view all" link with current language
        var campLink = document.getElementById('campViewAllLink');
        if (campLink) campLink.href = '/' + lang + '/kampaniyalar';
    }

    // Lang switcher click
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
            applyTranslations(opt.dataset.lang);
        });
    });

    // Re-sync language when returning via browser back/forward (bfcache)
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            setTimeout(function() {
                var savedLang = localStorage.getItem('lang') || 'az';
                if (savedLang !== currentLang) {
                    applyTranslations(savedLang);
                } else {
                    if (typeof renderAnnSectionPage === 'function') renderAnnSectionPage();
                }
                try {
                    if (typeof updateNavbarAuth === 'function' && typeof firebase !== 'undefined') {
                        updateNavbarAuth(firebase.auth().currentUser);
                    }
                } catch(e) {}
            }, 0);
        }
    });

    // === NAVBAR SCROLL ===
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section, .hero');

    window.addEventListener('scroll', () => {
        // Navbar background
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active nav link
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // === HAMBURGER MENU ===
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // === SMOOTH SCROLL ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // === SCROLL ANIMATIONS ===
    const animateElements = document.querySelectorAll('.animate-fade-up, .service-card, .problem-card, .contact-card, .faq-item, .format-card, .stat-item, .calendar-side, .blog-side, .blog-card, .calendar-wrapper, .about-image-col, .about-text-col, .section-header, .hero-form, .approach-banner, .highlight-item, .problem-disclaimer, .call-form-wrapper');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animateElements.forEach(el => {
        el.classList.add('animate-fade-up');
        observer.observe(el);
    });

    // === COUNTER ANIMATION ===
    const counters = document.querySelectorAll('.stat-number');
    let countersAnimated = false;

    function animateCounters() {
        if (countersAnimated) return;
        countersAnimated = true;

        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.textContent = formatNumber(Math.floor(current));
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = formatNumber(target);
                }
            };

            updateCounter();
        });
    }

    function formatNumber(num) {
        return num.toLocaleString('az-AZ');
    }

    const statsSection = document.querySelector('.stats-bar');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        statsObserver.observe(statsSection);
    }

    // === PROBLEM TABS ===
    const problemTabs = document.querySelectorAll('.problem-tab');
    const problemContents = document.querySelectorAll('.problem-content');

    problemTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            problemTabs.forEach(t => t.classList.remove('active'));
            problemContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById('tab-' + targetTab).classList.add('active');
        });
    });

    // === FAQ ACCORDION ===
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all
            faqItems.forEach(i => i.classList.remove('active'));

            // Open clicked (if it wasn't active)
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // === CALENDAR ===
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarPrev = document.getElementById('calendarPrev');
    const calendarNext = document.getElementById('calendarNext');

    if (calendarDays) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let currentMonth = today.getMonth();
        let currentYear = today.getFullYear();

        window.renderCalendar = function() {
            const t = translations[currentLang];
            const months = t.cal_months;

            calendarDays.innerHTML = '';
            calendarMonth.textContent = months[currentMonth] + ' ' + currentYear;

            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const startDay = firstDay === 0 ? 6 : firstDay - 1;

            for (let i = 0; i < startDay; i++) {
                const empty = document.createElement('div');
                empty.className = 'calendar-day empty';
                calendarDays.appendChild(empty);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dayEl = document.createElement('div');
                dayEl.className = 'calendar-day';
                dayEl.textContent = day;
                dayEl.style.opacity = '0';
                dayEl.style.transform = 'scale(0.5)';
                dayEl.style.animation = `dayFadeIn 0.3s ease forwards ${(startDay + day) * 20}ms`;

                const thisDate = new Date(currentYear, currentMonth, day);
                thisDate.setHours(0, 0, 0, 0);

                if (thisDate.getTime() === today.getTime()) {
                    dayEl.classList.add('today');
                }

                if (thisDate <= today) {
                    dayEl.classList.add('disabled');
                } else {
                    dayEl.addEventListener('click', () => {
                        const msgTemplate = t.cal_whatsapp_msg;
                        const msg = msgTemplate
                            .replace('{day}', day)
                            .replace('{month}', months[currentMonth].toLowerCase())
                            .replace('{year}', currentYear);
                        window.open('https://wa.me/994518499998?text=' + encodeURIComponent(msg), '_blank');
                    });
                }

                calendarDays.appendChild(dayEl);
            }
        };

        calendarPrev.addEventListener('click', () => {
            const minMonth = today.getMonth();
            const minYear = today.getFullYear();
            if (currentYear > minYear || (currentYear === minYear && currentMonth > minMonth)) {
                currentMonth--;
                if (currentMonth < 0) { currentMonth = 11; currentYear--; }
                renderCalendar();
            }
        });

        calendarNext.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            renderCalendar();
        });

        renderCalendar();
    }

    // === HERO CALENDAR ===
    const heroCalendarDays = document.getElementById('heroCalendarDays');
    const heroCalendarMonth = document.getElementById('heroCalendarMonth');
    const heroCalendarPrev = document.getElementById('heroCalendarPrev');
    const heroCalendarNext = document.getElementById('heroCalendarNext');

    if (heroCalendarDays) {
        const today2 = new Date();
        today2.setHours(0, 0, 0, 0);
        let hMonth = today2.getMonth();
        let hYear = today2.getFullYear();

        window.renderHeroCalendar = function() {
            const t = translations[currentLang];
            const months = t.cal_months;

            heroCalendarDays.innerHTML = '';
            heroCalendarMonth.textContent = months[hMonth] + ' ' + hYear;

            const firstDay = new Date(hYear, hMonth, 1).getDay();
            const daysInMonth = new Date(hYear, hMonth + 1, 0).getDate();
            const startDay = firstDay === 0 ? 6 : firstDay - 1;

            for (let i = 0; i < startDay; i++) {
                const empty = document.createElement('div');
                empty.className = 'calendar-day empty';
                heroCalendarDays.appendChild(empty);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dayEl = document.createElement('div');
                dayEl.className = 'calendar-day';
                dayEl.textContent = day;
                dayEl.style.opacity = '0';
                dayEl.style.transform = 'scale(0.5)';
                dayEl.style.animation = `dayFadeIn 0.3s ease forwards ${(startDay + day) * 20}ms`;

                const thisDate = new Date(hYear, hMonth, day);
                thisDate.setHours(0, 0, 0, 0);

                if (thisDate.getTime() === today2.getTime()) {
                    dayEl.classList.add('today');
                }

                if (thisDate <= today2) {
                    dayEl.classList.add('disabled');
                } else {
                    dayEl.addEventListener('click', () => {
                        const msgTemplate = t.cal_whatsapp_msg;
                        const msg = msgTemplate
                            .replace('{day}', day)
                            .replace('{month}', months[hMonth].toLowerCase())
                            .replace('{year}', hYear);
                        window.open('https://wa.me/994518499998?text=' + encodeURIComponent(msg), '_blank');
                    });
                }

                heroCalendarDays.appendChild(dayEl);
            }
        };

        heroCalendarPrev.addEventListener('click', () => {
            const minMonth = today2.getMonth();
            const minYear = today2.getFullYear();
            if (hYear > minYear || (hYear === minYear && hMonth > minMonth)) {
                hMonth--;
                if (hMonth < 0) { hMonth = 11; hYear--; }
                renderHeroCalendar();
            }
        });

        heroCalendarNext.addEventListener('click', () => {
            hMonth++;
            if (hMonth > 11) { hMonth = 0; hYear++; }
            renderHeroCalendar();
        });

        renderHeroCalendar();
    }

    // === DISCLAIMER MODAL ===
    const disclaimerOverlay = document.getElementById('disclaimerOverlay');
    const disclaimerClose = document.getElementById('disclaimerClose');
    const disclaimerAccept = document.getElementById('disclaimerAccept');

    if (sessionStorage.getItem('disclaimerAccepted') && disclaimerOverlay) {
        disclaimerOverlay.classList.add('hidden');
    } else if (disclaimerOverlay) {
        document.body.style.overflow = 'hidden';
    }

    function closeDisclaimer() {
        if (disclaimerOverlay) {
            disclaimerOverlay.classList.add('hidden');
            sessionStorage.setItem('disclaimerAccepted', '1');
            document.body.style.overflow = '';
        }
    }

    if (disclaimerClose) disclaimerClose.addEventListener('click', closeDisclaimer);
    if (disclaimerAccept) disclaimerAccept.addEventListener('click', closeDisclaimer);
    if (disclaimerOverlay) {
        disclaimerOverlay.addEventListener('click', (e) => {
            if (e.target === disclaimerOverlay) closeDisclaimer();
        });
    }

    // === FORM SUBMISSION ===
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbw869YoQXmQIJDknvOoLkBjetn7dT3BF8W7GXOgHhlk8FbAGclnCbDHDKIgX5S-UHr1/exec';

    function handleFormSubmit(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const ad = form.querySelector('input[name="ad"]').value.trim();
            const soyad = form.querySelector('input[name="soyad"]').value.trim();
            const telefon = form.querySelector('input[name="telefon"]').value.trim();
            const tarixInput = form.querySelector('input[name="tarix"]');
            const tarix = tarixInput ? tarixInput.value : '';

            if (telefon) {
                const t = translations[currentLang];
                const btn = form.querySelector('button[type="submit"]');
                const originalText = btn.textContent;
                btn.textContent = t.form_sending;
                btn.disabled = true;

                // Google Sheets-ə göndər
                const phoneCode = form.querySelector('.phone-prefix-select') ? form.querySelector('.phone-prefix-select').value : '+994';
                let url = GOOGLE_SHEET_URL
                    + '?ad=' + encodeURIComponent(ad)
                    + '&soyad=' + encodeURIComponent(soyad)
                    + '&telefon=' + encodeURIComponent(phoneCode + telefon);
                if (tarix) {
                    url += '&seansGunu=' + encodeURIComponent(tarix);
                }
                fetch(url, { mode: 'no-cors' }).then(() => {
                    btn.textContent = t.form_sent;
                    btn.style.background = '#28a745';
                    form.reset();
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 3000);
                }).catch(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    alert(t.form_error);
                });
            }
        });
    }

    // Xüsusi validasiya mesajı
    document.querySelectorAll('#callForm input, #heroCallForm input').forEach(input => {
        input.addEventListener('invalid', () => {
            const t = translations[currentLang];
            input.setCustomValidity(t.form_required);
        });
        input.addEventListener('input', () => {
            input.setCustomValidity('');
        });
    });

    const callForm = document.getElementById('callForm');
    if (callForm) handleFormSubmit(callForm);

    const heroCallForm = document.getElementById('heroCallForm');
    if (heroCallForm) handleFormSubmit(heroCallForm);

    // === PARTICLES ===
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        for (let i = 0; i < 40; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: rgba(45, 129, 87, ${Math.random() * 0.3 + 0.05});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: particleFloat ${Math.random() * 10 + 10}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            particlesContainer.appendChild(particle);
        }
    }

    // Add particle animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0%, 100% {
                transform: translate(0, 0) scale(1);
                opacity: 0.3;
            }
            25% {
                transform: translate(${Math.random() * 60 - 30}px, ${Math.random() * -60}px) scale(1.2);
                opacity: 0.6;
            }
            50% {
                transform: translate(${Math.random() * 80 - 40}px, ${Math.random() * -80}px) scale(0.8);
                opacity: 0.2;
            }
            75% {
                transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * -40}px) scale(1.1);
                opacity: 0.5;
            }
        }
    `;
    document.head.appendChild(style);

    // === FAYDALI MƏLUMATLAR — CONTENTFUL BLOG ===
    var CONTENTFUL_SPACE = 'q3fe87ca4p3k';
    var CONTENTFUL_TOKEN = 'uyQ8WH4Rhs40Y1OBAoXI9nzQGunrNUAtEU4lizTZL-o';
    var LANG_TO_LOCALE = { az: 'az', ru: 'az', en: 'az', tr: 'az' };

    var BLOG_PER_PAGE = 4;
    var allBlogCards = [];
    var blogCurrentPage = 1;
    var MOST_READ_LABELS = { az: 'Ən Çox Oxunan', ru: 'Самое читаемое', en: 'Most Read', tr: 'En Çok Okunan' };

    // Apply saved language on load
    if (currentLang !== 'az') {
        applyTranslations(currentLang);
    } else {
        // Just mark AZ as active
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === 'az');
        });
    }

    function renderBlogPage(page) {
        const grid = document.getElementById('blogGrid');
        if (!grid) return;
        blogCurrentPage = page;
        const totalPages = Math.ceil(allBlogCards.length / BLOG_PER_PAGE);
        const start = (page - 1) * BLOG_PER_PAGE;
        const pageItems = allBlogCards.slice(start, start + BLOG_PER_PAGE);

        grid.innerHTML = pageItems.map(c => c.html).join('');

        // Load view/like counts from Firebase and highlight most-read/most-liked
        if (typeof adminDb !== 'undefined') {
            const viewCounts = {};
            const likeCounts = {};
            let loaded = 0;
            const total = pageItems.filter(c => c.id).length;

            pageItems.forEach(c => {
                if (!c.id) return;
                adminDb.ref('postStats/' + c.id).once('value', snap => {
                    const data = snap.val() || {};
                    const views = data.views || 0;
                    const likes = data.likes || 0;
                    viewCounts[c.id] = views;
                    likeCounts[c.id] = likes;
                    const viewsEl = document.getElementById('cardViews_' + c.id);
                    const likesEl = document.getElementById('cardLikes_' + c.id);
                    if (viewsEl) viewsEl.textContent = views;
                    if (likesEl) likesEl.textContent = likes;

                    loaded++;
                    if (loaded === total) highlightCards(viewCounts, likeCounts);
                });
                adminDb.ref('comments/' + c.id).once('value', snap => {
                    const commentsEl = document.getElementById('cardComments_' + c.id);
                    if (commentsEl) commentsEl.textContent = snap.numChildren();
                });
            });
        }

        // Pagination
        let pagEl = document.getElementById('blogPagination');
        if (!pagEl) {
            pagEl = document.createElement('div');
            pagEl.id = 'blogPagination';
            pagEl.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:8px;margin-top:40px;';
            grid.parentNode.appendChild(pagEl);
        }

        if (totalPages <= 1) {
            pagEl.style.display = 'none';
            return;
        }

        let pagHtml = '';
        if (page > 1) {
            pagHtml += `<button onclick="window.blogGoPage(${page - 1})" style="padding:8px 14px;border:none;background:var(--gold);color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;"><i class="fas fa-chevron-left"></i></button>`;
        }
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === page;
            pagHtml += `<button onclick="window.blogGoPage(${i})" style="padding:8px 14px;border:${isActive ? 'none' : '1px solid #ddd'};background:${isActive ? 'var(--gold)' : '#fff'};color:${isActive ? '#fff' : 'var(--text-secondary)'};border-radius:8px;cursor:pointer;font-weight:${isActive ? '700' : '500'};font-size:0.85rem;">${i}</button>`;
        }
        if (page < totalPages) {
            pagHtml += `<button onclick="window.blogGoPage(${page + 1})" style="padding:8px 14px;border:none;background:var(--gold);color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;"><i class="fas fa-chevron-right"></i></button>`;
        }
        pagEl.innerHTML = pagHtml;
        pagEl.style.display = 'flex';
    }

    function highlightCards(viewCounts, likeCounts) {
        // Remove previous highlights
        document.querySelectorAll('.blog-post-card.most-read').forEach(el => {
            el.classList.remove('most-read');
            const badge = el.querySelector('.blog-most-read-badge');
            if (badge) badge.remove();
        });

        // Find most viewed
        const viewSorted = Object.entries(viewCounts).filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]);
        const mostReadId = viewSorted[0] ? viewSorted[0][0] : null;

        const cards = document.querySelectorAll('.blog-post-card');
        cards.forEach(card => {
            if (mostReadId && card.dataset.id === mostReadId) {
                card.classList.add('most-read');
                // Wrap card + badge together
                const wrapper = document.createElement('div');
                wrapper.className = 'most-read-wrapper';
                card.parentNode.insertBefore(wrapper, card);
                wrapper.appendChild(card);
                const badge = document.createElement('span');
                badge.className = 'blog-most-read-badge';
                badge.textContent = MOST_READ_LABELS[currentLang] || MOST_READ_LABELS.az;
                wrapper.appendChild(badge);
            }
        });
    }

    window.blogGoPage = function(page) {
        renderBlogPage(page);
        const sidebar = document.querySelector('.blog-sidebar');
        if (sidebar) sidebar.scrollTop = 0;
    };

    async function fetchBlogPosts() {
        const grid = document.getElementById('blogGrid');
        if (!grid) return;
        grid.innerHTML = '<p style="color:#999;font-size:0.9rem;">Yüklənir...</p>';
        const locale = LANG_TO_LOCALE[currentLang] || 'az';
        try {
            const res = await fetch(
                `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries?access_token=${CONTENTFUL_TOKEN}&content_type=blogPost&include=1&order=-sys.createdAt&locale=${locale}`
            );
            const data = await res.json();
            if (!data.items || data.items.length === 0) {
                grid.innerHTML = '<p style="color:#999;font-size:0.9rem;">Hələ heç bir məlumat əlavə edilməyib.</p>';
                return;
            }
            const assets = {};
            if (data.includes && data.includes.Asset) {
                data.includes.Asset.forEach(a => {
                    assets[a.sys.id] = 'https:' + a.fields.file.url;
                });
            }
            // Fetch ImgBB cover images from Firebase SEO data
            let seoData = {};
            try {
                const seoRes = await fetch('https://hekim-sayti-comments-default-rtdb.firebaseio.com/articleSeo.json');
                seoData = await seoRes.json() || {};
            } catch(e) {}

            allBlogCards = data.items.map(item => {
                const f = item.fields;
                const id = item.sys.id;
                const imgId = f.image && f.image.sys ? f.image.sys.id : null;
                let imgUrl = imgId ? assets[imgId] : null;
                // Prefer ImgBB cover image from Firebase SEO
                let coverPos = '50% 50%';
                let coverZoom = 1;
                if (seoData[id] && seoData[id].coverImage) {
                    imgUrl = seoData[id].coverImage;
                }
                if (seoData[id] && seoData[id].coverPos) {
                    coverPos = seoData[id].coverPos;
                }
                if (seoData[id] && seoData[id].coverZoom) {
                    coverZoom = seoData[id].coverZoom;
                }
                // Use background-image with cover + scale for zoom (matches admin preview)
                const scaleStyle = coverZoom > 1 ? `transform:scale(${coverZoom});` : '';
                const blogUrl = (seoData[id] && seoData[id].slug) ? '/' + seoData[id].slug : '#';
                return {
                    id: id,
                    date: f.date || '',
                    html: `
                    <a href="${blogUrl}" class="blog-post-card" data-id="${id}" style="text-decoration:none;color:inherit;cursor:pointer;">
                        ${imgUrl ? `<div class="blog-post-cover" role="img" aria-label="${f.title}" style="background-image:url(${imgUrl});background-size:cover;background-position:${coverPos};background-repeat:no-repeat;${scaleStyle}"></div>` : `<div class="blog-post-placeholder" style="flex:1;background:#f0f7f3;display:flex;align-items:center;justify-content:center;color:#aaa;"><i class="fas fa-image" style="font-size:1.5rem;"></i></div>`}
                        <div class="blog-post-info">
                            <h4>${f.title}</h4>
                            <div style="display:flex;align-items:center;gap:12px;margin-top:4px;">
                                <span class="blog-post-date">${f.date || ''}</span>
                                <span style="font-size:0.78rem;color:#999;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-eye" style="font-size:0.72rem;"></i> <span id="cardViews_${id}">0</span></span>
                                <span style="font-size:0.78rem;color:#999;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-thumbs-up" style="font-size:0.72rem;"></i> <span id="cardLikes_${id}">0</span></span>
                                <span style="font-size:0.78rem;color:#999;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-comment" style="font-size:0.72rem;"></i> <span id="cardComments_${id}">0</span></span>
                            </div>
                        </div>
                    </a>
                    `
                };
            });
            // Sort by date (newest first)
            allBlogCards.sort((a, b) => {
                const da = new Date(a.date);
                const db = new Date(b.date);
                if (isNaN(da.getTime()) && isNaN(db.getTime())) return 0;
                if (isNaN(da.getTime())) return 1;
                if (isNaN(db.getTime())) return -1;
                return db - da;
            });
            renderBlogPage(1);
        } catch (err) {
            grid.innerHTML = '<p style="color:#999;font-size:0.9rem;">Məlumatlar yüklənə bilmədi.</p>';
        }
    }

    fetchBlogPosts();

    // === ANNOUNCEMENTS & CAMPAIGNS SECTION (Homepage Split) ===
    const FIREBASE_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

    // Cookie helpers for coupon claim tracking
    function setCampCookie(campId, code) {
        var d = new Date(); d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
        document.cookie = 'camp_' + campId + '=' + encodeURIComponent(code) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    }
    function getCampCookie(campId) {
        var name = 'camp_' + campId + '=';
        var parts = document.cookie.split(';');
        for (var i = 0; i < parts.length; i++) {
            var c = parts[i].trim();
            if (c.indexOf(name) === 0) return decodeURIComponent(c.substring(name.length));
        }
        return null;
    }

    // Browser fingerprint for duplicate protection
    function getBrowserFingerprint() {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fingerprint', 2, 2);
        var canvasData = canvas.toDataURL();

        var raw = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 0,
            navigator.deviceMemory || 0,
            (navigator.platform || ''),
            canvasData
        ].join('|');

        // Simple hash
        var hash = 0;
        for (var i = 0; i < raw.length; i++) {
            hash = ((hash << 5) - hash) + raw.charCodeAt(i);
            hash = hash & hash;
        }
        return 'fp_' + Math.abs(hash).toString(36);
    }

    var browserFingerprint = getBrowserFingerprint();

    function renderAnnCardLarge(a) {
        const pos = a.coverPos || '50% 50%';
        const zoom = a.coverZoom || 1;
        const bgSize = zoom <= 1 ? 'cover' : (zoom * 100) + '%';
        const aTitle = a['title_' + currentLang] || a.title;
        const hasShort = !!(a['shortDesc_' + currentLang]);
        const aShortDesc = hasShort ? a['shortDesc_' + currentLang] : (a['desc_' + currentLang] || a.desc);
        const descClass = hasShort ? 'ann-section-card-desc ann-desc-full' : 'ann-section-card-desc';
        const annHref = a.slug ? '/elanlar/' + a.slug : (a.link || '');
        const tag = annHref ? 'a' : 'div';
        const href = annHref ? ' href="' + annHref + '"' : '';
        return '<' + tag + ' class="ann-section-card ann-card-large"' + href + ' style="text-decoration:none;color:inherit;">' +
            (a.image ? '<div class="ann-section-card-img" style="background-image:url(' + a.image + ');background-position:' + pos + ';background-size:' + bgSize + ';">' + (a.showBadge !== false ? '<span class="ann-section-badge">YENİ</span>' : '') + '</div>' : '') +
            '<div class="ann-section-card-body">' +
                '<div class="ann-section-card-date">' + (a.date || '') + '</div>' +
                '<div class="ann-section-card-title">' + aTitle + '</div>' +
                (aShortDesc ? '<div class="' + descClass + '">' + aShortDesc + '</div>' : '') +
                '<span class="ann-section-card-link">Daha ətraflı <i class="fas fa-arrow-right"></i></span>' +
            '</div>' +
        '</' + tag + '>';
    }

    function renderAnnCardSmall(a) {
        const aTitle = a['title_' + currentLang] || a.title;
        const hasShort = !!(a['shortDesc_' + currentLang]);
        const aShortDesc = hasShort ? a['shortDesc_' + currentLang] : (a['desc_' + currentLang] || a.desc);
        const descClass = hasShort ? 'ann-section-card-desc ann-desc-full' : 'ann-section-card-desc';
        const annHref = a.slug ? '/elanlar/' + a.slug : (a.link || '');
        const tag = annHref ? 'a' : 'div';
        const href = annHref ? ' href="' + annHref + '"' : '';
        return '<' + tag + ' class="ann-section-card ann-card-small"' + href + ' style="text-decoration:none;color:inherit;">' +
            '<div class="ann-section-card-body">' +
                '<div class="ann-section-card-date">' + (a.date || '') + '</div>' +
                '<div class="ann-section-card-title">' + aTitle + '</div>' +
                (aShortDesc ? '<div class="' + descClass + '">' + aShortDesc + '</div>' : '') +
                '<span class="ann-section-card-link ann-link-upper">DAHA ƏTRAFLI</span>' +
            '</div>' +
        '</' + tag + '>';
    }

    // Campaign UI translations
    var campTexts = {
        az: { day:'Gün', hour:'Saat', min:'Dəq', sec:'San', ended:'BİTİB', claimed:'Kupon alınıb', coupon:'kupon', claimBtn:'Kuponu əldə et', alreadyClaimed:'Kupon alınıb', discount:'ENDİRİM', name:'Ad *', surname:'Soyad *', phone:'Telefon (+994...)', submit:'Kuponu al', cancel:'Ləğv et', close:'Bağla', copy:'Kodu kopyala', copied:'Kopyalandı!', congrats:'Təbriklər!', yourCoupon:'Sizin endirim kuponunuz:', fillAll:'Bütün sahələri doldurun!', loading:'Yüklənir...', error:'Xəta baş verdi', alreadyGot:'Bu kampaniyadan artıq kupon almısınız.', instructions:'Endirimi əldə etmək üçün bu kodu WhatsApp-da Şahsəddin İmanlıya göndərin və ya canlı seans zamanı telefonda göstərin.' },
        ru: { day:'Дн.', hour:'Час', min:'Мин', sec:'Сек', ended:'ЗАВЕРШЕНО', claimed:'Купон получен', coupon:'купон', claimBtn:'Получить купон', alreadyClaimed:'Купон получен', discount:'СКИДКА', name:'Имя *', surname:'Фамилия *', phone:'Телефон (+7...)', submit:'Получить купон', cancel:'Отмена', close:'Закрыть', copy:'Копировать код', copied:'Скопировано!', congrats:'Поздравляем!', yourCoupon:'Ваш купон на скидку:', fillAll:'Заполните все поля!', loading:'Загрузка...', error:'Произошла ошибка', alreadyGot:'Вы уже получили купон по этой акции.', instructions:'Чтобы получить скидку, отправьте этот код в WhatsApp Шахсаддину Иманлы или покажите на очном сеансе.' },
        en: { day:'Day', hour:'Hr', min:'Min', sec:'Sec', ended:'ENDED', claimed:'Coupon claimed', coupon:'coupon', claimBtn:'Get coupon', alreadyClaimed:'Coupon claimed', discount:'DISCOUNT', name:'Name *', surname:'Surname *', phone:'Phone (+44...)', submit:'Get coupon', cancel:'Cancel', close:'Close', copy:'Copy code', copied:'Copied!', congrats:'Congratulations!', yourCoupon:'Your discount coupon:', fillAll:'Fill in all fields!', loading:'Loading...', error:'An error occurred', alreadyGot:'You have already claimed a coupon from this campaign.', instructions:'To get the discount, send this code to Shahsaddin Imanli on WhatsApp or show it during a live session.' },
        tr: { day:'Gün', hour:'Saat', min:'Dk', sec:'Sn', ended:'BİTTİ', claimed:'Kupon alındı', coupon:'kupon', claimBtn:'Kuponu al', alreadyClaimed:'Kupon alındı', discount:'İNDİRİM', name:'Ad *', surname:'Soyad *', phone:'Telefon (+90...)', submit:'Kuponu al', cancel:'İptal', close:'Kapat', copy:'Kodu kopyala', copied:'Kopyalandı!', congrats:'Tebrikler!', yourCoupon:'İndirim kuponunuz:', fillAll:'Tüm alanları doldurun!', loading:'Yükleniyor...', error:'Bir hata oluştu', alreadyGot:'Bu kampanyadan zaten kupon aldınız.', instructions:'İndirimi almak için bu kodu WhatsApp\'ta Şahseddin İmanlı\'ya gönderin veya canlı seansta telefonda gösterin.' }
    };
    function CT() { return campTexts[currentLang] || campTexts.az; }

    function isCampExpired(c) {
        return (c.endTimestamp && Date.now() > c.endTimestamp) || (c.claimedCount >= c.maxCoupons);
    }

    function campCountdownHtml(endTs) {
        var t = CT();
        var diff = Math.max(0, endTs - Date.now());
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        var html = '<div class="camp-countdown" data-end="' + endTs + '">';
        if (d > 0) html += '<div class="camp-countdown-item camp-countdown-day"><div class="camp-countdown-num">' + d + '</div><div class="camp-countdown-label">' + t.day + '</div></div>';
        if (d > 0 || h > 0) html += '<div class="camp-countdown-item camp-countdown-hour"><div class="camp-countdown-num">' + h + '</div><div class="camp-countdown-label">' + t.hour + '</div></div>';
        html += '<div class="camp-countdown-item"><div class="camp-countdown-num">' + m + '</div><div class="camp-countdown-label">' + t.min + '</div></div>' +
            '<div class="camp-countdown-item"><div class="camp-countdown-num">' + s + '</div><div class="camp-countdown-label">' + t.sec + '</div></div>' +
        '</div>';
        return html;
    }

    function campInlineTimerHtml(endTs) {
        var diff = Math.max(0, endTs - Date.now());
        if (diff <= 0) return '<span class="camp-card-timer-inline" style="color:#e74c3c;">BİTİB</span>';
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        var parts = [];
        if (d > 0) parts.push(d + ' GÜN');
        parts.push(h + ' SAAT');
        parts.push(m + ' DƏQ');
        parts.push(s + ' SAN');
        return '<span class="camp-card-timer-inline" data-camp-timer="' + endTs + '"><i class="far fa-clock" style="margin-right:3px;"></i> BİTMƏ VAXTİ: <span style="margin-left:4px;">' + parts.join(' ') + '</span></span>';
    }

    function renderCampCard(c) {
        var t = CT();
        var expired = isCampExpired(c);
        var claimed = c.claimedCount || 0;
        var max = c.maxCoupons || 1;
        var pct = Math.min(100, Math.round((claimed / max) * 100));
        var alreadyClaimed = getCampCookie(c.id);

        var html = '<div class="camp-card" data-camp-id="' + c.id + '">';
        if (expired) html += '<div class="camp-ended-overlay"><div class="camp-ended-text">' + t.ended + '</div></div>';
        if (c.image) {
            var cPos = c.coverPos || '50% 50%';
            var cZoom = c.coverZoom || 1;
            var cBgSize = cZoom <= 1 ? 'cover' : (cZoom * 100) + '%';
            html += '<div class="camp-card-img" style="background-image:url(' + c.image + ');background-position:' + cPos + ';background-size:' + cBgSize + ';">';
            html += '<div class="camp-discount-badge">-' + c.discountPercent + '%</div>';
            html += '</div>';
        }
        var campTitle = c['title_' + currentLang] || c.title || '';
        var campDesc = c['desc_' + currentLang] || c.desc || '';
        html += '<div class="camp-card-body">';
        html += '<div class="camp-card-title">' + campTitle + '</div>';
        if (campDesc) html += '<div class="camp-card-desc">' + campDesc + '</div>';
        if (!expired && c.endTimestamp) html += campCountdownHtml(c.endTimestamp);
        html += '<div class="camp-progress-wrap">';
        html += '<div class="camp-progress-info"><span>' + t.claimed + '</span><strong>' + claimed + '/' + max + ' ' + t.coupon + '</strong></div>';
        html += '<div class="camp-progress-bar"><div class="camp-progress-fill" style="width:' + pct + '%;"></div></div></div>';
        if (!expired && !alreadyClaimed) {
            html += '<button class="camp-claim-btn" onclick="openCampClaimModal(\'' + c.id + '\',\'' + (campTitle).replace(/'/g, "\\'") + '\',' + c.discountPercent + ')">' + t.claimBtn + '</button>';
        } else if (alreadyClaimed) {
            html += '<button class="camp-claim-btn" disabled><i class="fas fa-check"></i> ' + t.alreadyClaimed + '</button>';
        }
        html += '</div></div>';
        return html;
    }

    var cachedAnnouncements = [];
    var cachedCampaigns = [];

    function renderAnnSectionPage() {
        var section = document.getElementById('announcementsSection');
        var leftCol = document.getElementById('annSplitLeft');
        var rightCol = document.getElementById('annSplitRight');
        var annGrid = document.getElementById('annSplitGrid');
        var campGrid = document.getElementById('campSplitGrid');
        if (!section) return;

        var hasAnn = cachedAnnouncements && cachedAnnouncements.length > 0;
        var hasCamp = cachedCampaigns && cachedCampaigns.length > 0;

        if (!hasAnn && !hasCamp) { section.style.display = 'none'; return; }
        section.style.display = '';

        if (hasAnn && leftCol && annGrid) {
            leftCol.style.display = '';
            var annHtml = '';

            // Check for manually positioned announcements
            var featured = cachedAnnouncements.find(function(a) { return a.homePosition === 'featured'; });
            var small1 = cachedAnnouncements.find(function(a) { return a.homePosition === 'small1'; });
            var small2 = cachedAnnouncements.find(function(a) { return a.homePosition === 'small2'; });

            // Fallback to auto if no manual positions set
            if (!featured && !small1 && !small2) {
                featured = cachedAnnouncements[0];
                small1 = cachedAnnouncements[1];
                small2 = cachedAnnouncements[2];
            }

            if (featured) {
                annHtml += renderAnnCardLarge(featured);
            }
            if (small1 || small2) {
                annHtml += '<div class="ann-small-row">';
                if (small1) annHtml += renderAnnCardSmall(small1);
                if (small2) annHtml += renderAnnCardSmall(small2);
                annHtml += '</div>';
            }
            annGrid.innerHTML = annHtml;
        } else if (leftCol) {
            leftCol.style.display = 'none';
        }

        var langCampaigns = (cachedCampaigns || []).filter(function(c) {
            return c['title_' + currentLang] && c['title_' + currentLang].trim() !== '';
        });
        hasCamp = langCampaigns.length > 0;

        if (hasCamp && rightCol && campGrid) {
            rightCol.style.display = '';
            campGrid.innerHTML = langCampaigns.slice(0, 2).map(renderCampCard).join('');
            startCampCountdowns();
        } else if (rightCol) {
            rightCol.style.display = 'none';
        }
    }

    async function fetchAnnouncementsAndCampaigns() {
        var section = document.getElementById('announcementsSection');
        if (!section) return;

        try {
            var [annRes, campRes] = await Promise.all([
                fetch(FIREBASE_URL + '/announcements.json'),
                fetch(FIREBASE_URL + '/campaigns.json')
            ]);
            var annData = await annRes.json();
            var campData = await campRes.json();

            cachedAnnouncements = annData ? Object.values(annData).filter(function(a) { return a.active !== false; }).sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); }) : [];

            cachedCampaigns = campData ? Object.entries(campData).map(function(e) { return Object.assign({ id: e[0] }, e[1]); }).filter(function(c) { return c.active !== false; }).sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); }) : [];

            renderAnnSectionPage();
        } catch(e) {
            if (section) section.style.display = 'none';
        }
    }

    // Countdown timer
    var campCountdownInterval = null;
    function startCampCountdowns() {
        if (campCountdownInterval) clearInterval(campCountdownInterval);
        campCountdownInterval = setInterval(function() {
            document.querySelectorAll('.camp-countdown').forEach(function(el) {
                var endTs = parseInt(el.dataset.end);
                var diff = Math.max(0, endTs - Date.now());
                if (diff <= 0) { el.innerHTML = '<div class="camp-countdown-item"><div class="camp-countdown-num" style="color:#e74c3c;">Bitdi</div></div>'; return; }
                var d = Math.floor(diff / 86400000);
                var h = Math.floor((diff % 86400000) / 3600000);
                var m = Math.floor((diff % 3600000) / 60000);
                var s = Math.floor((diff % 60000) / 1000);
                // Day
                var dayEl = el.querySelector('.camp-countdown-day');
                if (d > 0 && !dayEl) {
                    el.insertAdjacentHTML('afterbegin', '<div class="camp-countdown-item camp-countdown-day"><div class="camp-countdown-num">' + d + '</div><div class="camp-countdown-label">Gün</div></div>');
                } else if (d > 0 && dayEl) {
                    dayEl.querySelector('.camp-countdown-num').textContent = d;
                } else if (d === 0 && dayEl) {
                    dayEl.remove();
                }
                // Hour
                var hourEl = el.querySelector('.camp-countdown-hour');
                if ((d > 0 || h > 0) && !hourEl) {
                    var afterDay = el.querySelector('.camp-countdown-day');
                    var ref = afterDay ? afterDay.nextSibling : el.firstChild;
                    var tmp = document.createElement('div');
                    tmp.innerHTML = '<div class="camp-countdown-item camp-countdown-hour"><div class="camp-countdown-num">' + h + '</div><div class="camp-countdown-label">Saat</div></div>';
                    el.insertBefore(tmp.firstChild, ref);
                } else if ((d > 0 || h > 0) && hourEl) {
                    hourEl.querySelector('.camp-countdown-num').textContent = h;
                } else if (d === 0 && h === 0 && hourEl) {
                    hourEl.remove();
                }
                // Min + Sec (always last 2 items)
                var rest = el.querySelectorAll('.camp-countdown-item:not(.camp-countdown-day):not(.camp-countdown-hour)');
                if (rest.length >= 2) {
                    rest[0].querySelector('.camp-countdown-num').textContent = m;
                    rest[1].querySelector('.camp-countdown-num').textContent = s;
                }
            });
        }, 1000);
    }

    // Claim modal
    window.openCampClaimModal = function(campId, title, discount) {
        var t = CT();
        if (getCampCookie(campId)) { alert(t.alreadyGot); return; }
        var overlay = document.createElement('div');
        overlay.className = 'camp-modal-overlay';
        overlay.innerHTML = '<div class="camp-modal">' +
            '<h3>' + title + '</h3>' +
            '<div class="camp-modal-discount">-' + discount + '% ' + t.discount + '</div>' +
            '<input type="text" id="campClaimName" placeholder="' + t.name + '">' +
            '<input type="text" id="campClaimSurname" placeholder="' + t.surname + '">' +
            '<input type="tel" id="campClaimPhone" placeholder="' + t.phone + '">' +
            '<button class="camp-modal-submit" id="campClaimSubmit"><i class="fas fa-ticket-alt"></i> ' + t.submit + '</button>' +
            '<button class="camp-modal-cancel" onclick="this.closest(\'.camp-modal-overlay\').remove()">' + t.cancel + '</button>' +
            '<p id="campClaimError" style="color:#e74c3c;font-size:0.82rem;text-align:center;margin-top:8px;min-height:1em;"></p>' +
        '</div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        document.getElementById('campClaimSubmit').addEventListener('click', async function() {
            var name = document.getElementById('campClaimName').value.trim();
            var surname = document.getElementById('campClaimSurname').value.trim();
            var phone = document.getElementById('campClaimPhone').value.trim();
            var errEl = document.getElementById('campClaimError');
            if (!name || !surname || !phone) { errEl.textContent = CT().fillAll; return; }
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + CT().loading;
            errEl.textContent = '';
            try {
                var res = await fetch('/api/claim-coupon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ campaignId: campId, name: name, surname: surname, phone: phone, fingerprint: browserFingerprint, lang: currentLang })
                });
                var data = await res.json();
                var t = CT();
                if (data.success) {
                    setCampCookie(campId, data.couponCode);
                    overlay.innerHTML = '<div class="camp-modal">' +
                        '<h3 style="text-align:center;color:#27ae60;"><i class="fas fa-check-circle"></i> ' + t.congrats + '</h3>' +
                        '<p style="text-align:center;color:#666;margin:8px 0;">' + t.yourCoupon + '</p>' +
                        '<div class="camp-success-code"><span>' + data.couponCode + '</span></div>' +
                        '<button class="camp-copy-btn" onclick="navigator.clipboard.writeText(\'' + data.couponCode + '\');this.textContent=\'' + t.copied + '\'"><i class="fas fa-copy"></i> ' + t.copy + '</button>' +
                        '<p style="text-align:center;font-size:0.78rem;color:#999;margin-top:12px;">' + t.instructions + '</p>' +
                        '<button class="camp-modal-cancel" onclick="this.closest(\'.camp-modal-overlay\').remove()" style="margin-top:12px;">' + t.close + '</button>' +
                    '</div>';
                    var card = document.querySelector('[data-camp-id="' + campId + '"]');
                    if (card) { var btn = card.querySelector('.camp-claim-btn'); if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-check"></i> ' + t.alreadyClaimed; } }
                } else {
                    errEl.textContent = data.error || t.error;
                    this.disabled = false;
                    this.innerHTML = '<i class="fas fa-ticket-alt"></i> ' + t.submit;
                }
            } catch(e) {
                errEl.textContent = CT().error;
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-ticket-alt"></i> ' + CT().submit;
            }
        });
    };

    fetchAnnouncementsAndCampaigns();

    // === REVIEWS SECTION ===
    const REVIEWS_PER_PAGE = 6;
    let currentReviewPage = 0;
    let allReviews = [];
    let selectedRating = 5;

    // Star rating input
    const starsInput = document.querySelectorAll('.review-stars-input i');
    starsInput.forEach(star => {
        star.addEventListener('mouseenter', function() {
            const val = parseInt(this.dataset.star);
            starsInput.forEach((s, i) => {
                s.style.color = i < val ? '#ffa534' : '#ddd';
                s.style.transform = i < val ? 'scale(1.15)' : 'scale(1)';
            });
        });
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.star);
            starsInput.forEach((s, i) => {
                s.classList.toggle('active', i < selectedRating);
            });
        });
    });
    const starsContainer = document.querySelector('.review-stars-input');
    if (starsContainer) {
        starsContainer.addEventListener('mouseleave', function() {
            starsInput.forEach((s, i) => {
                s.style.color = i < selectedRating ? '#ffa534' : '#ddd';
                s.style.transform = i < selectedRating ? 'scale(1.15)' : 'scale(1)';
            });
        });
        // Init stars
        starsInput.forEach((s, i) => {
            s.style.color = i < selectedRating ? '#ffa534' : '#ddd';
            s.style.transform = i < selectedRating ? 'scale(1.15)' : 'scale(1)';
        });
    }

    // Auto-fill review form for logged-in users
    function prefillReviewForm() {
        try {
            const user = firebase.auth && firebase.auth().currentUser;
            const nameInput = document.getElementById('reviewName');
            if (!nameInput) return;
            // If already has a saved name, keep it
            const savedName = sessionStorage.getItem('reviewUserName');
            if (user && !user.isAnonymous) {
                // Registered user - show only first name
                const firstName = (user.displayName || '').split(' ')[0];
                nameInput.value = firstName;
                nameInput.readOnly = true;
                nameInput.style.opacity = '0.7';
                sessionStorage.setItem('reviewUserName', firstName);
            } else if (user && user.isAnonymous) {
                // Anonymous user
                nameInput.value = 'Anonim';
                nameInput.readOnly = true;
                nameInput.style.opacity = '0.7';
                sessionStorage.setItem('reviewUserName', 'Anonim');
            } else {
                // Logged out or no user - clear and make editable
                nameInput.readOnly = false;
                nameInput.style.opacity = '1';
                if (savedName && savedName !== 'Anonim') {
                    nameInput.value = savedName;
                } else {
                    nameInput.value = '';
                    sessionStorage.removeItem('reviewUserName');
                }
            }
        } catch(e) {}
    }
    // Listen for auth state changes
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function() { prefillReviewForm(); });
    }
    // Restore saved name on page load
    (function() {
        const savedName = sessionStorage.getItem('reviewUserName');
        const nameInput = document.getElementById('reviewName');
        if (savedName && nameInput && !nameInput.value) {
            nameInput.value = savedName;
        }
    })();

    // Submit review
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('reviewName').value.trim();
            const city = document.getElementById('reviewCity').value.trim();
            const text = document.getElementById('reviewText').value.trim();
            if (!name || !text) return;

            // Check if already submitted a review
            if (sessionStorage.getItem('reviewSubmitted')) {
                const errorEl = document.getElementById('reviewSuccess');
                if (errorEl) {
                    errorEl.style.display = 'block';
                    errorEl.style.color = '#e74c3c';
                    errorEl.textContent = 'Siz artıq rəy göndərmisiniz. Təşəkkürlər!';
                    setTimeout(() => { errorEl.style.display = 'none'; errorEl.style.color = ''; }, 4000);
                }
                return;
            }

            const btn = document.getElementById('reviewSubmitBtn');
            btn.disabled = true;
            btn.textContent = 'Göndərilir...';

            const reviewData = {
                name: name,
                city: city || '',
                rating: selectedRating,
                text: text,
                timestamp: Date.now()
            };
            // Add user photo if logged in
            const currentUser = firebase.auth && firebase.auth().currentUser;
            if (currentUser && !currentUser.isAnonymous && currentUser.photoURL) {
                reviewData.photoURL = currentUser.photoURL;
            }

            // Save name for persistence
            sessionStorage.setItem('reviewUserName', name);

            adminDb.ref('reviews').push(reviewData).then(() => {
                btn.disabled = false;
                btn.textContent = 'Rəy Göndər';
                const savedCity = city;
                reviewForm.reset();
                // Restore name and city after reset
                document.getElementById('reviewName').value = name;
                if (savedCity) document.getElementById('reviewCity').value = savedCity;
                selectedRating = 5;
                starsInput.forEach((s, i) => {
                    s.style.color = i < 5 ? '#ffa534' : '#ddd';
                    s.style.transform = i < 5 ? 'scale(1.15)' : 'scale(1)';
                    s.classList.toggle('active', i < 5);
                });
                sessionStorage.setItem('reviewSubmitted', 'true');
                const successEl = document.getElementById('reviewSuccess');
                successEl.style.display = 'block';
                setTimeout(() => { successEl.style.display = 'none'; }, 4000);
                // Disable form after submission
                btn.disabled = true;
                btn.style.opacity = '0.6';
                document.getElementById('reviewText').disabled = true;
            }).catch(() => {
                btn.disabled = false;
                btn.textContent = 'Rəy Göndər';
            });
        });
    }

    // Render reviews
    function renderReviews() {
        const grid = document.getElementById('reviewsGrid');
        if (!grid) return;

        const start = currentReviewPage * REVIEWS_PER_PAGE;
        const visible = allReviews.slice(start, start + REVIEWS_PER_PAGE);
        const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);
        const months = ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'];

        grid.innerHTML = visible.map(r => {
            const initial = r.name.charAt(0).toUpperCase();
            const date = new Date(r.timestamp);
            const dateStr = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                starsHtml += `<i class="fas fa-star ${i < r.rating ? '' : 'empty'}"></i>`;
            }
            return `
                <div class="review-card">
                    <div class="review-card-header">
                        ${r.photoURL ? `<img src="${r.photoURL}" class="review-card-avatar" style="width:42px;height:42px;border-radius:50%;object-fit:cover;object-position:top center;" alt="${r.name}">` : `<div class="review-card-avatar">${initial}</div>`}
                        <div class="review-card-info">
                            <div class="review-card-name">${r.name}</div>
                            ${r.city ? `<div class="review-card-city"><i class="fas fa-map-marker-alt"></i> ${r.city}</div>` : ''}
                        </div>
                        <div class="review-card-stars">${starsHtml}</div>
                    </div>
                    <div class="review-card-text" id="reviewCardText_${r._key}" data-full-text="${r.text.replace(/"/g, '&quot;')}" data-shown="150">${r.text.length > 150 ? r.text.substring(0, 150) + '...' : r.text}</div>
                    ${r.text.length > 150 ? `<button class="review-read-more" id="reviewReadMore_${r._key}" onclick="toggleReviewText('${r._key}')">Ardını oxu</button>` : ''}
                    <div class="review-card-date">${dateStr}</div>
                </div>
            `;
        }).join('');

        // Pagination
        const paginationEl = document.getElementById('reviewsLoadMore');
        if (paginationEl && totalPages > 1) {
            paginationEl.style.display = 'flex';
            let paginationHtml = '';
            if (currentReviewPage > 0) {
                paginationHtml += `<button class="review-page-btn" onclick="changeReviewPage(${currentReviewPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
            }
            for (let i = 0; i < totalPages; i++) {
                paginationHtml += `<button class="review-page-btn ${i === currentReviewPage ? 'active' : ''}" onclick="changeReviewPage(${i})">${i + 1}</button>`;
            }
            if (currentReviewPage < totalPages - 1) {
                paginationHtml += `<button class="review-page-btn" onclick="changeReviewPage(${currentReviewPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
            }
            paginationEl.innerHTML = paginationHtml;
        } else if (paginationEl) {
            paginationEl.style.display = 'none';
        }

    }

    // Page change
    window.changeReviewPage = function(page) {
        currentReviewPage = page;
        renderReviews();
        // On mobile/tablet only, scroll to reviews grid
        if (window.innerWidth <= 1024) {
            const grid = document.getElementById('reviewsGrid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    window.toggleReviewText = function(key) {
        const el = document.getElementById('reviewCardText_' + key);
        const btn = document.getElementById('reviewReadMore_' + key);
        if (!el || !btn) return;
        const fullText = el.getAttribute('data-full-text');
        const pageSize = 150;
        const currentPage = parseInt(el.getAttribute('data-page') || '0');
        const totalPages = Math.ceil(fullText.length / pageSize);
        const nextPage = currentPage + 1;

        if (nextPage >= totalPages) {
            // Son səhifə - əvvələ qaytar
            el.textContent = fullText.substring(0, pageSize) + (fullText.length > pageSize ? '...' : '');
            el.setAttribute('data-page', '0');
            btn.textContent = 'Ardını oxu';
        } else {
            const start = nextPage * pageSize;
            const end = Math.min(start + pageSize, fullText.length);
            const chunk = fullText.substring(start, end);
            el.textContent = chunk + (end < fullText.length ? '...' : '');
            el.setAttribute('data-page', nextPage);
            btn.textContent = nextPage >= totalPages - 1 ? 'Əvvələ qayıt' : 'Ardını oxu';
        }
    };

    // Listen for reviews from Firebase
    if (typeof adminDb !== 'undefined') {
        adminDb.ref('reviews').orderByChild('timestamp').on('value', snapshot => {
            allReviews = [];
            snapshot.forEach(child => {
                const r = child.val();
                r._key = child.key;
                allReviews.push(r);
            });
            allReviews.reverse();
            renderReviews();
            updateRatingBadge(allReviews);
        });
    }

    // Update rating badge and stars from reviews data
    function updateRatingBadge(reviews) {
        if (!reviews || reviews.length === 0) return;

        const total = reviews.length;
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;

        reviews.forEach(r => {
            const rating = r.rating || 5;
            counts[rating] = (counts[rating] || 0) + 1;
            sum += rating;
        });

        const avg = (sum / total).toFixed(1);

        // Update badge count
        const countEl = document.getElementById('reviewBadgeCount');
        if (countEl) countEl.textContent = total;

        // Update rating score
        const scoreEl = document.getElementById('ratingScore');
        if (scoreEl) scoreEl.textContent = avg;

        // Update top stars (fill based on avg)
        const starsContainer = document.getElementById('aboutRatingStars');
        if (starsContainer) {
            const stars = starsContainer.querySelectorAll('.rating-stars-inner i');
            const fullStars = Math.floor(avg);
            stars.forEach((star, i) => {
                star.style.color = i < fullStars ? '#ffa534' : '#ddd';
            });
        }

        // Update tooltip
        const tooltipScore = document.getElementById('tooltipScore');
        if (tooltipScore) tooltipScore.textContent = avg;

        const tooltipTotal = document.getElementById('tooltipTotal');
        if (tooltipTotal) tooltipTotal.textContent = total;

        // Update tooltip stars
        const tooltipStars = document.getElementById('tooltipStars');
        if (tooltipStars) {
            const stars = tooltipStars.querySelectorAll('i');
            const fullStars = Math.floor(avg);
            stars.forEach((star, i) => {
                star.style.color = i < fullStars ? '#ffa534' : '#ddd';
            });
        }

        // Update bars (both tooltips)
        for (let i = 1; i <= 5; i++) {
            const pct = total > 0 ? (counts[i] / total) * 100 : 0;
            ['', 'b'].forEach(suffix => {
                const bar = document.getElementById('bar' + i + suffix);
                const countSpan = document.getElementById('count' + i + suffix);
                if (bar) bar.style.width = pct + '%';
                if (countSpan) countSpan.textContent = counts[i];
            });
        }

        // Update second tooltip (rating stars tooltip)
        const tooltipScore2 = document.getElementById('tooltipScore2');
        if (tooltipScore2) tooltipScore2.textContent = avg;

        const tooltipTotal2 = document.getElementById('tooltipTotal2');
        if (tooltipTotal2) tooltipTotal2.textContent = total;

        const tooltipStars2 = document.getElementById('tooltipStars2');
        if (tooltipStars2) {
            const stars = tooltipStars2.querySelectorAll('i');
            const fullStars2 = Math.floor(avg);
            stars.forEach((star, i) => {
                star.style.color = i < fullStars2 ? '#ffa534' : '#ddd';
            });
        }
    }

    // === CAMPAIGN NOTIFICATION SUBSCRIPTION ===
    var notifyForm = document.getElementById('notifyEmailForm');
    var notifyMsg = document.getElementById('notifyMsg');
    var notifyPushBtn = document.getElementById('notifyPushBtn');

    // Show push button if browser supports notifications
    if ('Notification' in window && notifyPushBtn) {
        if (Notification.permission === 'granted') {
            notifyPushBtn.style.display = 'inline-flex';
            notifyPushBtn.innerHTML = '<i class="fas fa-check-circle"></i> Bildirişlər aktivdir';
            notifyPushBtn.disabled = true;
            notifyPushBtn.style.opacity = '0.6';
        } else if (Notification.permission !== 'denied') {
            notifyPushBtn.style.display = 'inline-flex';
        }
    }

    // Email subscription
    if (notifyForm) {
        notifyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('notifyEmailInput').value.trim();
            if (!email) return;
            notifyMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gözləyin...';
            notifyMsg.style.color = 'var(--gold)';

            var fbUrl = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';
            var safeKey = email.replace(/\./g, ',');

            fetch(fbUrl + '/campaign_subscribers/' + safeKey + '.json')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data && data.email) {
                        notifyMsg.textContent = 'Bu email artıq abunədir!';
                        notifyMsg.style.color = '#e67e22';
                        return;
                    }
                    return fetch(fbUrl + '/campaign_subscribers/' + safeKey + '.json', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email, subscribedAt: Date.now(), lang: currentLang })
                    }).then(function() {
                        notifyMsg.textContent = 'Abunəliyiniz aktivləşdirildi!';
                        notifyMsg.style.color = '#27ae60';
                        document.getElementById('notifyEmailInput').value = '';
                    });
                })
                .catch(function(err) {
                    notifyMsg.textContent = 'Xəta baş verdi, yenidən cəhd edin.';
                    notifyMsg.style.color = '#e74c3c';
                });
        });

    }

    // Push notification permission
    if (notifyPushBtn && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        notifyPushBtn.addEventListener('click', function() {
            Notification.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    notifyPushBtn.innerHTML = '<i class="fas fa-check-circle"></i> Bildirişlər aktivdir';
                    notifyPushBtn.disabled = true;
                    notifyPushBtn.style.opacity = '0.6';
                    localStorage.setItem('campPushEnabled', '1');
                    // Save push subscriber to Firebase
                    var db = firebase.database();
                    var pushId = 'push_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                    db.ref('campaign_push_subscribers/' + pushId).set({
                        enabledAt: Date.now(),
                        userAgent: navigator.userAgent,
                        lang: currentLang
                    });
                    new Notification('Bildirişlər aktivdir!', {
                        body: 'Yeni kampaniyalar haqqında xəbərdar olacaqsınız.',
                        icon: '/icon-192.png'
                    });
                }
            });
        });
    }


});
