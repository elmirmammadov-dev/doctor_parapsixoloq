const fetch = require('node-fetch');

const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';
const SITE_URL = 'https://www.sahseddinimanli.com';

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

module.exports = async (req, res) => {
    try {
        const slug = req.query.slug;
        if (!slug) { res.status(404).send('Elan tapılmadı'); return; }

        const lang = req.query.lang || 'az';

        // Fetch all announcements
        const annRes = await fetch(`${FIREBASE_DB_URL}/announcements.json`);
        const annData = await annRes.json() || {};

        // Find announcement by slug
        let announcement = null;
        let annId = null;
        for (const [id, a] of Object.entries(annData)) {
            if (a.slug === slug && a.active !== false) {
                announcement = a;
                annId = id;
                break;
            }
        }

        if (!announcement) {
            res.status(404).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Elan tapılmadı</title><meta name="robots" content="noindex"></head><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;"><div style="text-align:center;"><h1>Elan tapılmadı</h1><a href="/elanlar" style="color:#1a8a5c;">Elanlara qayıt</a></div></body></html>`);
            return;
        }

        const a = announcement;
        const L = (field) => a[field + '_' + lang] || a[field + '_az'] || a[field] || '';
        const title = L('title');
        const desc = L('desc');
        const pos = a.coverPos || '50% 50%';
        const zoom = a.coverZoom || 1;
        const bgSize = zoom <= 1 ? 'cover' : (zoom * 100) + '%';
        const pageUrl = `${SITE_URL}/elanlar/${slug}`;

        // Get other announcements for "related" section
        const otherAnns = Object.entries(annData)
            .map(([id, v]) => ({ id, ...v }))
            .filter(o => o.active !== false && o.slug !== slug)
            .sort((x, y) => (y.timestamp || 0) - (x.timestamp || 0))
            .slice(0, 3);

        const otherHtml = otherAnns.length > 0 ? otherAnns.map(o => {
            const oTitle = o['title_' + lang] || o.title_az || o.title || '';
            const oPos = o.coverPos || '50% 50%';
            const oZoom = o.coverZoom || 1;
            const oBgSize = oZoom <= 1 ? 'cover' : (oZoom * 100) + '%';
            const oSlug = o.slug || '';
            return `<a href="/elanlar/${escapeHtml(oSlug)}" class="ann-related-card" style="text-decoration:none;color:inherit;">
                ${o.image ? `<div class="ann-related-img" style="background-image:url(${escapeHtml(o.image)});background-position:${oPos};background-size:${oBgSize};"></div>` : ''}
                <div class="ann-related-body">
                    <div class="ann-related-title">${escapeHtml(oTitle)}</div>
                    <div class="ann-related-date">${escapeHtml(o.date || '')}</div>
                </div>
            </a>`;
        }).join('') : '';

        // JSON-LD: Article (not Event — Event requires location/offers for rich results)
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": desc,
            "image": a.image || `${SITE_URL}/logo.webp`,
            "url": pageUrl,
            "datePublished": a.dateRaw || undefined,
            "dateModified": a.dateRaw || undefined,
            "inLanguage": lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : lang === 'tr' ? 'tr' : 'az',
            "author": {
                "@type": "Person",
                "name": "Şahsəddin İmanlı",
                "url": SITE_URL
            },
            "publisher": {
                "@type": "Organization",
                "name": "Şahsəddin İmanlı",
                "url": SITE_URL,
                "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.webp` }
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl }
        };
        Object.keys(jsonLd).forEach(k => jsonLd[k] === undefined && delete jsonLd[k]);

        const html = `<!DOCTYPE html>
<html lang="${lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : lang === 'tr' ? 'tr' : 'az'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} | Şahsəddin İmanlı</title>
    <meta name="description" content="${escapeHtml(desc || title)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${pageUrl}">
    <link rel="alternate" hreflang="az" href="${SITE_URL}/elanlar/${slug}">
    <link rel="alternate" hreflang="ru" href="${SITE_URL}/elanlar/${slug}?lang=ru">
    <link rel="alternate" hreflang="en" href="${SITE_URL}/elanlar/${slug}?lang=en">
    <link rel="alternate" hreflang="tr" href="${SITE_URL}/elanlar/${slug}?lang=tr">
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/elanlar/${slug}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(title)} | Şahsəddin İmanlı">
    <meta property="og:description" content="${escapeHtml(desc || title)}">
    <meta property="og:url" content="${pageUrl}">
    ${a.image ? `<meta property="og:image" content="${escapeHtml(a.image)}">` : `<meta property="og:image" content="${SITE_URL}/logo.webp">`}
    <meta property="og:site_name" content="Şahsəddin İmanlı">
    <meta property="og:locale" content="az_AZ">
    <meta property="og:locale:alternate" content="ru_RU">
    <meta property="og:locale:alternate" content="en_US">
    <meta property="og:locale:alternate" content="tr_TR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)} | Şahsəddin İmanlı">
    <meta name="twitter:description" content="${escapeHtml(desc || title)}">
    ${a.image ? `<meta name="twitter:image" content="${escapeHtml(a.image)}">` : ''}
    <link rel="icon" type="image/png" href="/logo.webp">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></noscript>
    <link rel="stylesheet" href="/style.css">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <style>
        .ann-detail-page { max-width: 800px; margin: 30px auto 60px; padding: 0 16px; }
        .ann-detail-back { display: inline-flex; align-items: center; gap: 8px; color: var(--gold, #1a8a5c); font-weight: 600; font-size: 0.95rem; text-decoration: none; margin-bottom: 24px; }
        .ann-detail-back:hover { opacity: 0.8; }
        .ann-detail-card { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1.5px solid #f0f0f0; }
        .ann-detail-img { width: 100%; aspect-ratio: 16/9; background-size: cover; background-position: center; background-repeat: no-repeat; position: relative; }
        .ann-detail-badge { position: absolute; top: 14px; left: 14px; background: #e74c3c; color: #fff; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; padding: 5px 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(231,76,60,0.4); }
        .ann-detail-body { padding: 28px 32px; }
        .ann-detail-title { font-family: 'Montserrat', sans-serif; font-size: 1.6rem; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; line-height: 1.3; word-break: break-word; overflow-wrap: break-word; }
        .ann-detail-date { font-size: 0.85rem; color: #e74c3c; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 16px; }
        .ann-detail-desc { font-size: 1.05rem; color: #444; line-height: 1.75; margin: 0 0 20px; white-space: pre-line; word-break: break-word; overflow-wrap: break-word; }
        .ann-detail-link { display: inline-flex; align-items: center; gap: 6px; background: var(--gold, #1a8a5c); color: #fff; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 0.95rem; text-decoration: none; transition: 0.3s; }
        .ann-detail-link:hover { opacity: 0.85; transform: translateY(-2px); }
        .ann-related-section { margin-top: 50px; }
        .ann-related-section h3 { font-family: 'Montserrat', sans-serif; font-size: 1.2rem; font-weight: 700; color: #1a1a2e; margin: 0 0 20px; }
        .ann-related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .ann-related-card { background: #fff; border-radius: 14px; overflow: hidden; border: 1.5px solid #f0f0f0; transition: 0.3s; }
        .ann-related-card:hover { border-color: #e74c3c; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .ann-related-img { width: 100%; aspect-ratio: 16/9; background-size: cover; background-position: center; }
        .ann-related-body { padding: 12px 14px; }
        .ann-related-title { font-weight: 600; font-size: 0.9rem; color: #1a1a2e; margin-bottom: 4px; }
        .ann-related-date { font-size: 0.78rem; color: #999; }
        .navbar-menu { margin: 0 auto; }
        @media (max-width: 600px) {
            .ann-detail-body { padding: 20px 18px; }
            .ann-detail-title { font-size: 1.25rem; }
            .ann-detail-img { aspect-ratio: 4/3; }
        }
    </style>
</head>
<body>
    <nav class="navbar scrolled" id="navbar">
        <div class="container navbar-content">
            <a href="/" class="navbar-logo"></a>
            <ul class="navbar-menu" id="navMenu">
                <li><a href="/#about" class="nav-link">Ana Səhifə</a></li>
                <li><a href="/#blogSection" class="nav-link">Blog</a></li>
                <li><a href="/#services" class="nav-link">Xidmətlər</a></li>
                <li><a href="/#problems" class="nav-link">Fəaliyyətlər</a></li>
                <li><a href="/#faq" class="nav-link">Sual-Cavab</a></li>
                <li><a href="/#reviews" class="nav-link">Rəylər</a></li>
                <li><a href="/#contact" class="nav-link">Əlaqə</a></li>
            </ul>
            <a href="https://wa.link/wcams9" target="_blank" class="btn-session" style="text-decoration:none;">Seansa Yazıl</a>
            <button class="hamburger" id="hamburger" aria-label="Menyu" onclick="document.getElementById('navMenu').classList.toggle('active');this.classList.toggle('active');">
                <span></span><span></span><span></span>
            </button>
        </div>
    </nav>

    <main class="ann-detail-page">
        <a href="javascript:history.back()" class="ann-detail-back"><i class="fas fa-arrow-left"></i> Geri qayıt</a>

        <article class="ann-detail-card">
            ${a.image ? `<div class="ann-detail-img" style="background-image:url(${escapeHtml(a.image)});background-position:${pos};background-size:${bgSize};" role="img" aria-label="${escapeHtml(title)}">
                ${a.showBadge !== false ? '<span class="ann-detail-badge">YEN\u0130</span>' : ''}
            </div>` : ''}
            <div class="ann-detail-body">
                <h1 class="ann-detail-title">${escapeHtml(title)}</h1>
                <time class="ann-detail-date" datetime="${escapeHtml(a.dateRaw || '')}"><i class="fas fa-calendar-alt"></i> ${escapeHtml(a.date || '')}</time>
                ${desc ? `<div class="ann-detail-desc">${escapeHtml(desc)}</div>` : ''}
                ${a.link ? `<a href="${escapeHtml(a.link)}" class="ann-detail-link" target="_blank" rel="noopener nofollow"><i class="fas fa-external-link-alt"></i> Xarici linkə keç</a>` : ''}
            </div>
        </article>

        ${otherAnns.length > 0 ? `
        <div class="ann-related-section">
            <h3>Digər Elanlar</h3>
            <div class="ann-related-grid">${otherHtml}</div>
        </div>` : ''}
    </main>

    <a href="https://wa.link/wcams9" target="_blank" class="whatsapp-float" aria-label="WhatsApp ilə əlaqə">
        <i class="fab fa-whatsapp"></i>
        <span class="whatsapp-pulse"></span>
        <span class="whatsapp-pulse delay"></span>
    </a>

    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; 2026 Şahsəddin İmanlı. Bütün hüquqlar qorunur.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('CDN-Cache-Control', 'no-store');
        res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);

    } catch (err) {
        console.error('Announcement detail error:', err);
        res.status(500).send('Xəta baş verdi');
    }
};
