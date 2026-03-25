const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

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
        // Fetch announcements from Firebase
        const annRes = await fetch(`${FIREBASE_DB_URL}/announcements.json`);
        const annData = await annRes.json() || {};

        const announcements = Object.entries(annData)
            .map(([id, v]) => ({ id, ...v }))
            .filter(a => a.active !== false)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Build JSON-LD structured data
        const jsonLdItems = announcements.map(a => ({
            "@type": "Event",
            "name": a.title,
            "description": a.desc || '',
            "image": a.image || undefined,
            "url": a.link || `${SITE_URL}/elanlar`,
            "startDate": a.date || undefined,
            "organizer": {
                "@type": "Person",
                "name": "Şahsəddin İmanlı",
                "url": SITE_URL
            }
        }));

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Elanlar və Kampaniyalar | Şahsəddin İmanlı",
            "description": "Şahsəddin İmanlının ən son elanları, kampaniyaları və xüsusi təklifləri.",
            "url": `${SITE_URL}/elanlar`,
            "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": announcements.length,
                "itemListElement": jsonLdItems.map((item, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "item": item
                }))
            }
        };

        // Build announcement cards HTML for SSR
        const annCardsHtml = announcements.length === 0
            ? '<p style="text-align:center;color:#999;padding:40px 0;">Hazırda elan yoxdur.</p>'
            : announcements.map(a => `
                <article class="ann-card" itemscope itemtype="https://schema.org/Event">
                    ${a.image ? `<img class="ann-card-img" src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)}" itemprop="image" loading="lazy">` : ''}
                    <div class="ann-card-body">
                        <h2 class="ann-card-title" itemprop="name">${escapeHtml(a.title)}</h2>
                        ${a.desc ? `<p class="ann-card-desc" itemprop="description">${escapeHtml(a.desc)}</p>` : ''}
                        <time class="ann-card-date" itemprop="startDate">${escapeHtml(a.date || '')}</time>
                        ${a.link ? `<a href="${escapeHtml(a.link)}" class="ann-card-link" target="_blank" rel="noopener" itemprop="url">Ətraflı bax &rarr;</a>` : ''}
                    </div>
                </article>
            `).join('');

        const html = `<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Elanlar və Kampaniyalar | Şahsəddin İmanlı</title>
    <meta name="description" content="Şahsəddin İmanlının ən son elanları, kampaniyaları və xüsusi təklifləri. Yeni seans imkanları, endirimler və daha çox.">
    <meta name="keywords" content="elanlar, kampaniyalar, Şahsəddin İmanlı, parapsixologiya, xüsusi təkliflər, seans">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${SITE_URL}/elanlar">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Elanlar və Kampaniyalar | Şahsəddin İmanlı">
    <meta property="og:description" content="Ən son elanlar, kampaniyalar və xüsusi təkliflər.">
    <meta property="og:url" content="${SITE_URL}/elanlar">
    <meta property="og:image" content="${SITE_URL}/logo.webp">
    <meta property="og:site_name" content="Şahsəddin İmanlı">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Elanlar və Kampaniyalar | Şahsəddin İmanlı">
    <meta name="twitter:description" content="Ən son elanlar, kampaniyalar və xüsusi təkliflər.">
    <link rel="icon" type="image/png" href="/logo.webp">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="/style.css">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <style>
        .ann-page { max-width: 900px; margin: 30px auto 60px; padding: 0 16px; }
        .ann-page-header { text-align: center; margin-bottom: 40px; }
        .ann-page-header h1 { font-family: 'Montserrat', sans-serif; font-size: 2rem; font-weight: 700; color: #1a1a2e; margin: 0 0 10px; }
        .ann-page-header p { color: #777; font-size: 1rem; line-height: 1.6; max-width: 600px; margin: 0 auto; }
        .ann-page-back { display: inline-flex; align-items: center; gap: 8px; color: var(--gold, #1a8a5c); font-weight: 600; font-size: 0.95rem; text-decoration: none; margin-bottom: 24px; }
        .ann-page-back:hover { opacity: 0.8; }
        .ann-cards { display: flex; flex-direction: column; gap: 20px; }
        .ann-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f0f0f0; transition: box-shadow 0.3s; }
        .ann-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
        .ann-card-img { width: 100%; height: 250px; object-fit: cover; display: block; }
        .ann-card-body { padding: 20px 24px; }
        .ann-card-title { font-family: 'Montserrat', sans-serif; font-size: 1.2rem; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
        .ann-card-desc { font-size: 0.95rem; color: #555; line-height: 1.6; margin: 0 0 12px; }
        .ann-card-date { font-size: 0.82rem; color: #999; display: block; margin-bottom: 8px; }
        .ann-card-link { display: inline-flex; align-items: center; gap: 4px; color: var(--gold, #1a8a5c); font-weight: 600; font-size: 0.9rem; text-decoration: none; }
        .ann-card-link:hover { opacity: 0.8; }
        @media (max-width: 600px) {
            .ann-page-header h1 { font-size: 1.5rem; }
            .ann-card-img { height: 180px; }
        }
    </style>
</head>
<body>
    <nav class="navbar scrolled" id="navbar">
        <div class="container navbar-content">
            <a href="/" class="navbar-logo"></a>
            <a href="/" class="btn-session" style="text-decoration:none;">Ana Səhifə</a>
        </div>
    </nav>

    <div class="ann-page">
        <a href="/" class="ann-page-back"><i class="fas fa-arrow-left"></i> Geri qayıt</a>
        <div class="ann-page-header">
            <h1>Elanlar və Kampaniyalar</h1>
            <p>Ən son elanlarımız, xüsusi təkliflərimiz və kampaniyalarımız haqqında məlumat alın.</p>
        </div>
        <div class="ann-cards">
            ${annCardsHtml}
        </div>
    </div>

    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; 2026 Şahsəddin İmanlı. Bütün hüquqlar qorunur.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;

        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);

    } catch (err) {
        console.error('Announcements render error:', err);
        res.status(500).send('Xəta baş verdi');
    }
};
