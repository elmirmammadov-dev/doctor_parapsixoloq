// ===== SITE TRAFFIC TRACKER =====
(function() {
    const db = firebase.database();
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const entryTime = Date.now();
    let visitRecorded = false;
    let durationRecorded = false;
    let anonNumber = null;
    let visitorIpKey = null;

    function getAnonLabel(num) {
        const lang = localStorage.getItem('lang') || 'az';
        const prefixes = { az: 'Anonim iştirakçı', ru: 'Анонимный участник', en: 'Anonymous visitor', tr: 'Anonim katılımcı' };
        const prefix = prefixes[lang] || prefixes.az;
        return num ? prefix + '-' + num : prefix;
    }

    // Convert IP to Firebase-safe key (replace dots/colons with underscores)
    function ipToKey(ip) {
        return ip.replace(/[.\/:]/g, '_');
    }

    // Get or assign anonymous visitor number by IP (stored in Firebase)
    function getAnonName() {
        return new Promise(resolve => {
            fetch('https://polished-mouse-8b71contentful-proxy.abdullayevmeherrem10.workers.dev/get-ip')
                .then(r => r.json())
                .then(data => {
                    const ipKey = ipToKey(data.ip || 'unknown');
                    visitorIpKey = ipKey;
                    db.ref('siteTraffic/anonVisitors/' + ipKey).once('value', snap => {
                        if (snap.val()) {
                            anonNumber = snap.val();
                            resolve(getAnonLabel(anonNumber));
                        } else {
                            db.ref('siteTraffic/anonCounter').transaction(count => (count || 0) + 1, (err, committed, counterSnap) => {
                                if (err || !committed) {
                                    anonNumber = null;
                                    resolve(getAnonLabel(null));
                                } else {
                                    anonNumber = counterSnap.val();
                                    db.ref('siteTraffic/anonVisitors/' + ipKey).set(anonNumber);
                                    resolve(getAnonLabel(anonNumber));
                                }
                            });
                        }
                    });
                })
                .catch(() => {
                    anonNumber = null;
                    resolve(getAnonLabel(null));
                });
        });
    }

    function getDateKey() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    // Get readable page description
    function getPageDescription() {
        const path = location.pathname;
        if (path === '/' || path.endsWith('/index.html') || path === '/index.html') {
            return 'Ana səhifə';
        }
        if (path.includes('blog-post.html')) {
            const titleEl = document.querySelector('.blog-post-title, h1');
            if (titleEl && titleEl.textContent.trim()) {
                return titleEl.textContent.trim();
            }
            return 'Bloq yazısı';
        }
        return path;
    }

    // Record visit — only once per session
    function recordVisit() {
        if (visitRecorded) return;
        visitRecorded = true;

        const dateKey = getDateKey();
        const user = firebase.auth().currentUser;
        const pageDesc = getPageDescription();
        const visitData = {
            page: pageDesc,
            enteredAt: entryTime,
            userAgent: navigator.userAgent.substring(0, 150),
            referrer: document.referrer || 'direct'
        };
        if (user && !user.isAnonymous) {
            visitData.uid = user.uid;
            visitData.userName = user.displayName || user.email || '';
        } else {
            visitData.userName = getAnonLabel(anonNumber);
        }

        db.ref('siteTraffic/visits/' + dateKey + '/' + sessionId).set(visitData);

        // Keep only last 100 sessions per day
        db.ref('siteTraffic/visits/' + dateKey).once('value', snap => {
            const count = snap.numChildren();
            if (count > 100) {
                let deleteCount = count - 100;
                snap.forEach(child => {
                    if (deleteCount > 0) {
                        child.ref.remove();
                        deleteCount--;
                    }
                });
            }
        });

        // Only count unique IPs per day (or unique users)
        const uniqueKey = (user && !user.isAnonymous) ? user.uid : visitorIpKey;
        if (uniqueKey) {
            db.ref('siteTraffic/uniqueVisitors/' + dateKey + '/' + uniqueKey).once('value', snap => {
                if (!snap.val()) {
                    db.ref('siteTraffic/uniqueVisitors/' + dateKey + '/' + uniqueKey).set(true);
                    db.ref('siteTraffic/dailyCounts/' + dateKey).transaction(count => (count || 0) + 1);
                }
            });
        } else {
            db.ref('siteTraffic/dailyCounts/' + dateKey).transaction(count => (count || 0) + 1);
        }
    }

    // Record activity — filters out admin panel actions
    function logActivity(action, details) {
        // Skip admin panel related activities
        if (action === 'admin' || (details && details.indexOf('Admin panel') !== -1)) return;

        const user = firebase.auth().currentUser;
        const activityData = {
            action: action,
            details: details || '',
            timestamp: Date.now()
        };
        if (user && !user.isAnonymous) {
            activityData.uid = user.uid;
            activityData.userName = user.displayName || user.email || '';
        } else {
            activityData.userName = getAnonLabel(anonNumber);
        }
        db.ref('siteTraffic/activities').push(activityData);

        // Keep only last 100 activities
        db.ref('siteTraffic/activities').once('value', snap => {
            const count = snap.numChildren();
            if (count > 100) {
                let deleteCount = count - 100;
                snap.forEach(child => {
                    if (deleteCount > 0) {
                        child.ref.remove();
                        deleteCount--;
                    }
                });
            }
        });
    }

    // Record session duration — only once
    function recordDuration() {
        if (durationRecorded) return;
        durationRecorded = true;

        const dateKey = getDateKey();
        const duration = Math.round((Date.now() - entryTime) / 1000);
        if (duration < 1) return;

        db.ref('siteTraffic/visits/' + dateKey + '/' + sessionId + '/duration').set(duration);

        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        const durationText = mins > 0 ? mins + ' dəq ' + secs + ' san' : secs + ' san';
        const pageDesc = getPageDescription();
        logActivity('exit', pageDesc + ' səhifəsindən çıxdı (' + durationText + ')');
    }

    // Clean up old data (older than 30 days)
    function cleanOldData() {
        const lastClean = localStorage.getItem('lastTrafficClean');
        const now = Date.now();
        if (lastClean && now - parseInt(lastClean) < 86400000) return;
        localStorage.setItem('lastTrafficClean', now);

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffKey = cutoff.getFullYear() + '-' + String(cutoff.getMonth()+1).padStart(2,'0') + '-' + String(cutoff.getDate()).padStart(2,'0');

        db.ref('siteTraffic/visits').orderByKey().endAt(cutoffKey).once('value', snap => {
            snap.forEach(child => { child.ref.remove(); });
        });
        db.ref('siteTraffic/dailyCounts').orderByKey().endAt(cutoffKey).once('value', snap => {
            snap.forEach(child => { child.ref.remove(); });
        });
        db.ref('siteTraffic/uniqueVisitors').orderByKey().endAt(cutoffKey).once('value', snap => {
            snap.forEach(child => { child.ref.remove(); });
        });
    }

    // Skip all tracking if admin panel is open
    if (location.hash.startsWith('#admin-')) return;

    // Record visit once on first auth state
    firebase.auth().onAuthStateChanged(function(user) {
        if (!visitRecorded) {
            if (user && !user.isAnonymous) {
                // Logged-in user — record immediately
                const pageDesc = getPageDescription();
                recordVisit();
                logActivity('visit', pageDesc + ' səhifəsinə baxış keçirdi');
                cleanOldData();
            } else {
                // Anonymous — get number first, then record
                getAnonName().then(() => {
                    updateNavAnonLabel();
                    // Update comment form with anon name
                    if (typeof updateCommentFormAuth === 'function') {
                        updateCommentFormAuth(firebase.auth().currentUser);
                    }
                    const pageDesc = getPageDescription();
                    recordVisit();
                    logActivity('visit', pageDesc + ' səhifəsinə baxış keçirdi');
                    cleanOldData();
                });
            }
        }
    });

    // Track page leave — only once
    window.addEventListener('beforeunload', recordDuration);
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            recordDuration();
        }
    });

    // Show anon label in navbar
    function updateNavAnonLabel() {
        const label = document.getElementById('navAnonLabel');
        if (!label) return;
        const user = firebase.auth().currentUser;
        if (user && !user.isAnonymous) {
            label.style.display = 'none';
        } else if (anonNumber !== null) {
            label.textContent = getAnonLabel(anonNumber);
            label.style.display = '';
        }
    }

    // Make logActivity and anonName global
    window.siteLogActivity = logActivity;
    window.getAnonVisitorName = function() { return anonNumber !== null ? getAnonLabel(anonNumber) : null; };
    window.updateNavAnonLabel = updateNavAnonLabel;

    // ===== UNIQUE IP CLICK TRACKING (Potensial Müştərilər) =====
    function getPageType() {
        const path = location.pathname;
        if (path.includes('blog-post.html')) return 'blog';
        return 'main';
    }

    function trackUniqueClick(elementKey) {
        if (!visitorIpKey) return;
        const pageType = getPageType();
        const ref = db.ref('siteTraffic/clickStats/' + pageType + '/' + elementKey + '/' + visitorIpKey);
        ref.once('value', snap => {
            if (!snap.val()) {
                ref.set(true);
            }
        });
    }
    window.trackUniqueClick = trackUniqueClick;

    // ===== AUTO-TRACK INTERACTIVE ELEMENTS =====
    document.addEventListener('DOMContentLoaded', function() {

        // --- "Seansa Yazıl" button ---
        document.querySelectorAll('.btn-session').forEach(btn => {
            btn.addEventListener('click', () => {
                logActivity('click', '"Seansa Yazıl" düyməsinə kliklədi');
                trackUniqueClick('seansaYazil');
            });
        });

        // --- Social media links ---
        document.querySelectorAll('.navbar-socials a, .footer-socials a, .social-links a').forEach(link => {
            link.addEventListener('click', () => {
                const label = link.getAttribute('aria-label') || '';
                if (label) {
                    logActivity('click', label + ' sosial şəbəkə linkinə kliklədi');
                    const keyMap = { TikTok: 'tiktok', Facebook: 'facebook', Instagram: 'instagram', WhatsApp: 'whatsapp_social', YouTube: 'youtube' };
                    const clickKey = keyMap[label] || label.toLowerCase().replace(/\s+/g, '_');
                    trackUniqueClick(clickKey);
                }
            });
        });

        // --- Floating WhatsApp button ---
        const floatWa = document.querySelector('.whatsapp-float, a[href*="wa.link"], a[href*="wa.me"]');
        if (floatWa && !floatWa.closest('.navbar-socials')) {
            floatWa.addEventListener('click', () => {
                logActivity('click', 'WhatsApp düyməsinə kliklədi');
                trackUniqueClick('whatsapp_float');
            });
        }

        // --- Language switcher ---
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const lang = opt.dataset.lang || '';
                const langNames = { az: 'Azərbaycan', ru: 'Rus', en: 'İngilis', tr: 'Türk' };
                logActivity('lang', (langNames[lang] || lang) + ' dilinə keçid etdi');
            });
        });

        // --- FAQ accordion ---
        document.querySelectorAll('.faq-question').forEach(q => {
            q.addEventListener('click', () => {
                const text = q.querySelector('span') ? q.querySelector('span').textContent.trim() : q.textContent.trim();
                const short = text.length > 50 ? text.substring(0, 50) + '...' : text;
                logActivity('faq', '"' + short + '" sualına baxdı');
            });
        });

        // --- Problem tabs ---
        document.querySelectorAll('.problem-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabText = tab.textContent.trim();
                logActivity('tab', '"' + tabText + '" problem tabına kliklədi');
            });
        });

        // --- Blog post card clicks ---
        document.querySelectorAll('#blogGrid a, .blog-card a').forEach(link => {
            link.addEventListener('click', () => {
                const card = link.closest('.blog-card') || link;
                const titleEl = card.querySelector('h3, .blog-title');
                const title = titleEl ? titleEl.textContent.trim() : 'Bloq yazısı';
                logActivity('blog', '"' + title + '" bloq yazısını oxumağa keçdi');
            });
        });

        // --- Calendar date clicks ---
        function trackCalendarClicks(container) {
            if (!container) return;
            const observer = new MutationObserver(() => {
                container.querySelectorAll('.cal-day:not([data-tracked])').forEach(day => {
                    day.setAttribute('data-tracked', '1');
                    day.addEventListener('click', () => {
                        if (day.classList.contains('disabled') || day.classList.contains('empty')) return;
                        const dayNum = day.textContent.trim();
                        logActivity('calendar', 'Seans üçün ' + dayNum + '-ci gün seçiminə kliklədi');
                        trackUniqueClick('calendar');
                    });
                });
            });
            observer.observe(container, { childList: true, subtree: true });
            container.querySelectorAll('.cal-day:not([data-tracked])').forEach(day => {
                day.setAttribute('data-tracked', '1');
                day.addEventListener('click', () => {
                    if (day.classList.contains('disabled') || day.classList.contains('empty')) return;
                    const dayNum = day.textContent.trim();
                    logActivity('calendar', 'Seans üçün ' + dayNum + '-ci gün seçiminə kliklədi');
                    trackUniqueClick('calendar');
                });
            });
        }
        trackCalendarClicks(document.getElementById('heroCalendarDays'));
        trackCalendarClicks(document.getElementById('calendarDays'));
        trackCalendarClicks(document.getElementById('blogCalendarDays'));

        // --- Call order form ---
        ['heroCallForm', 'callForm', 'blogCallForm'].forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', () => {
                    logActivity('form', 'Zəng sifarişi yerləşdirdi');
                    trackUniqueClick('callForm');
                });
            }
        });

        // --- Comment form (blog-post) ---
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', () => {
                const pageDesc = getPageDescription();
                logActivity('comment', '"' + pageDesc + '" bloq yazısına şərh yazdı');
            });
        }

        // --- Like/dislike buttons (blog-post) ---
        document.querySelectorAll('.like-btn, .dislike-btn, [onclick*="toggleReaction"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const pageDesc = getPageDescription();
                const isLike = btn.classList.contains('like-btn') || (btn.getAttribute('onclick') || '').includes("'like'");
                if (isLike) {
                    logActivity('like', '"' + pageDesc + '" bloq yazısını bəyəndi');
                } else {
                    logActivity('dislike', '"' + pageDesc + '" bloq yazısını bəyənmədi');
                }
            });
        });

        // --- Auth modal tracking ---
        const authBtn = document.getElementById('userAuthBtn');
        if (authBtn) {
            authBtn.addEventListener('click', () => {
                const user = firebase.auth().currentUser;
                if (!user) {
                    logActivity('auth', 'Giriş pəncərəsini açdı');
                }
            });
        }

        // --- Disclaimer modal ---
        const disclaimerAccept = document.querySelector('.disclaimer-accept, #disclaimerAccept');
        if (disclaimerAccept) {
            disclaimerAccept.addEventListener('click', () => {
                logActivity('click', 'Xəbərdarlıq bildirişini qəbul etdi');
            });
        }

        // --- Hamburger menu ---
        const hamburger = document.getElementById('hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                logActivity('click', 'Mobil menyunu açdı/bağladı');
            });
        }
    });
})();
