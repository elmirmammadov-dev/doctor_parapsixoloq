const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.sahseddinimanli.com';
const CONTENTFUL_SPACE = 'q3fe87ca4p3k';
const CONTENTFUL_TOKEN = 'uyQ8WH4Rhs40Y1OBAoXI9nzQGunrNUAtEU4lizTZL-o';
const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

const LANG_META = {
    ru: {
        title: 'Шахсаддин Иманлы | Парапсихолог и Преподаватель Тантра-Йоги',
        description: 'Шахсаддин Иманлы — парапсихолог, психолог и специалист по тантра-йоге. 35+ лет опыта, 15000+ успешных сеансов. Панические атаки, стресс, семейные проблемы. Онлайн и очный приём. Баку и Нахчыван.',
        keywords: 'парапсихолог, Шахсаддин Иманлы, тантра йога, дыхательная терапия, психолог Баку, панические атаки, депрессия, чакры, развод, лечение, обследование, психолог',
        h1: 'Шахсаддин Иманлы — Парапсихолог & Психолог & Йог',
        htmlLang: 'ru',
        ogLocale: 'ru_RU'
    },
    en: {
        title: 'Shahsaddin Imanli | Parapsychologist & Tantra Yoga Instructor',
        description: 'Shahsaddin Imanli — parapsychologist, psychologist and tantra yoga specialist. 35+ years of experience, 15000+ successful sessions. Panic attacks, stress, family problems. Online and in-person appointments. Baku & Nakhchivan.',
        keywords: 'parapsychologist, Shahsaddin Imanli, tantra yoga, breath therapy, psychologist Baku, panic attacks, depression, chakras, treatment, examination, psychologist',
        h1: 'Shahsaddin Imanli — Parapsychologist & Psychologist & Yogi',
        htmlLang: 'en',
        ogLocale: 'en_US'
    },
    tr: {
        title: 'Şahseddin İmanlı | Parapsikolojist & Tantra Yoga Eğitmeni',
        description: 'Şahseddin İmanlı — parapsikolojist, psikolog ve tantra yoga uzmanı. 35+ yıllık deneyim, 15000+ başarılı seans. Panik atak, stres, aile sorunları. Online ve yüz yüze kabul. Bakü & Nahçıvan.',
        keywords: 'parapsikolojist, Şahseddin İmanlı, tantra yoga, nefes terapisi, psikolog Bakü, panik atak, depresyon, çakra, boşanma, tedavi, muayene, psikolog',
        h1: 'Şahseddin İmanlı — Parapsikolojist & Psikolog & Yogi',
        htmlLang: 'tr',
        ogLocale: 'tr_TR'
    }
};

module.exports = async (req, res) => {
    const lang = req.query.lang || 'ru';
    const meta = LANG_META[lang];

    if (!meta) {
        res.writeHead(302, { Location: '/' });
        res.end();
        return;
    }

    try {
        // Read index.html
        const htmlPath = path.join(process.cwd(), '_index.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');

        // Read translations
        const transPath = path.join(process.cwd(), 'translations.json');
        const allTranslations = JSON.parse(fs.readFileSync(transPath, 'utf-8'));
        const t = allTranslations[lang] || {};

        // 1. Change html lang
        html = html.replace('<html lang="az">', `<html lang="${meta.htmlLang}">`);

        // 2. Change title
        html = html.replace(
            /<title>.*?<\/title>/,
            `<title>${escapeHtml(meta.title)}</title>`
        );

        // 3. Change meta description
        html = html.replace(
            /<meta name="description" content="[^"]*">/,
            `<meta name="description" content="${escapeHtml(meta.description)}">`
        );

        // 4. Change meta keywords
        html = html.replace(
            /<meta name="keywords" content="[^"]*">/,
            `<meta name="keywords" content="${escapeHtml(meta.keywords)}">`
        );

        // 5. Change canonical
        html = html.replace(
            /<link rel="canonical" href="[^"]*">/,
            `<link rel="canonical" href="${SITE_URL}/${lang}">`
        );

        // 6. Change OG tags
        html = html.replace(
            /<meta property="og:title" content="[^"]*">/,
            `<meta property="og:title" content="${escapeHtml(meta.title)}">`
        );
        html = html.replace(
            /<meta property="og:description" content="[^"]*">/,
            `<meta property="og:description" content="${escapeHtml(meta.description)}">`
        );
        html = html.replace(
            /<meta property="og:url" content="[^"]*">/,
            `<meta property="og:url" content="${SITE_URL}/${lang}">`
        );
        html = html.replace(
            /<meta property="og:locale" content="[^"]*">/,
            `<meta property="og:locale" content="${meta.ogLocale}">`
        );
        // Update og:locale:alternate - remove current lang, add az
        html = html.replace(
            `<meta property="og:locale:alternate" content="${meta.ogLocale}">`,
            `<meta property="og:locale:alternate" content="az_AZ">`
        );

        // 7. Change Twitter tags
        html = html.replace(
            /<meta name="twitter:title" content="[^"]*">/,
            `<meta name="twitter:title" content="${escapeHtml(meta.title)}">`
        );
        html = html.replace(
            /<meta name="twitter:description" content="[^"]*">/,
            `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`
        );

        // 8. Change H1
        html = html.replace(
            /<h1 class="hero-banner-h1">.*?<\/h1>/,
            `<h1 class="hero-banner-h1">${escapeHtml(meta.h1)}</h1>`
        );

        // 9. Replace all data-i18n text content
        for (const [key, value] of Object.entries(t)) {
            if (typeof value !== 'string') continue;
            // data-i18n="key">...text...</tag>
            const regex = new RegExp(
                `(data-i18n="${escapeRegex(key)}"[^>]*>)[^<]*(</)`,
                'g'
            );
            html = html.replace(regex, `$1${value}$2`);
        }

        // 10. Replace data-i18n-html content
        for (const [key, value] of Object.entries(t)) {
            if (typeof value !== 'string') continue;
            const regex = new RegExp(
                `(data-i18n-html="${escapeRegex(key)}"[^>]*>)[\\s\\S]*?(</(p|span|h1|h2|h3|h4|h5|h6|div|button|li|a))`,
                'g'
            );
            html = html.replace(regex, `$1${value}$2`);
        }

        // 11. SSR: Inject blog, announcements, reviews
        try {
            const [blogData, seoData, annData, reviewsData] = await Promise.all([
                fetch(`https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries?access_token=${CONTENTFUL_TOKEN}&content_type=blogPost&include=1&order=-sys.createdAt&locale=az`)
                    .then(r => r.json()).catch(() => ({})),
                fetch(`${FIREBASE_DB_URL}/articleSeo.json`)
                    .then(r => r.json()).catch(() => ({})),
                fetch(`${FIREBASE_DB_URL}/announcements.json`)
                    .then(r => r.json()).catch(() => ({})),
                fetch(`${FIREBASE_DB_URL}/reviews.json`)
                    .then(r => r.json()).catch(() => ({}))
            ]);

            // SSR Blog
            if (blogData.items && blogData.items.length > 0) {
                const assets = {};
                if (blogData.includes && blogData.includes.Asset) {
                    blogData.includes.Asset.forEach(a => { assets[a.sys.id] = 'https:' + a.fields.file.url; });
                }
                const seo = seoData || {};
                const sorted = blogData.items.sort((a, b) => new Date(b.fields.date || 0) - new Date(a.fields.date || 0));
                const blogHtml = sorted.slice(0, 4).map(item => {
                    const f = item.fields; const id = item.sys.id;
                    const imgId = f.image && f.image.sys ? f.image.sys.id : null;
                    let imgUrl = imgId ? assets[imgId] : null;
                    let coverPos = '50% 50%', coverZoom = 1;
                    if (seo[id] && seo[id].coverImage) {
                        imgUrl = seo[id].coverImage;
                        if (seo[id].coverPos) coverPos = seo[id].coverPos;
                        if (seo[id].coverZoom) coverZoom = seo[id].coverZoom;
                    }
                    const bgSize = coverZoom <= 1 ? 'cover' : (coverZoom * 100) + '%';
                    const blogUrl = (seo[id] && seo[id].slug) ? '/' + seo[id].slug : '#';
                    return `<a href="${escapeHtml(blogUrl)}" class="blog-post-card" data-id="${id}" style="text-decoration:none;color:inherit;cursor:pointer;">
                        ${imgUrl ? `<div class="blog-post-cover" role="img" aria-label="${escapeHtml(f.title)}" style="background-image:url(${escapeHtml(imgUrl)});background-size:${bgSize};background-position:${coverPos};"></div>` : ''}
                        <div class="blog-post-info"><h4>${escapeHtml(f.title)}</h4><span class="blog-post-date">${escapeHtml(f.date || '')}</span></div>
                    </a>`;
                }).join('');
                html = html.replace(/<div class="blog-grid blog-section-grid" id="blogGrid">[\s\S]*?<\/div>/, `<div class="blog-grid blog-section-grid" id="blogGrid">${blogHtml}</div>`);
            }

            // SSR Announcements
            if (annData && typeof annData === 'object') {
                const anns = Object.values(annData).filter(a => a.active !== false).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 6);
                if (anns.length === 0) {
                    html = html.replace(/<section class="announcements-section" id="announcementsSection">/, '<section class="announcements-section" id="announcementsSection" style="display:none;">');
                }
                if (anns.length > 0) {
                    const annHtml = anns.map(a => {
                        const pos = a.coverPos || '50% 50%'; const zoom = a.coverZoom || 1;
                        const bgSize = zoom <= 1 ? 'cover' : (zoom * 100) + '%';
                        const aTitle = a['title_' + lang] || a.title_az || a.title || '';
                        const aDesc = a['desc_' + lang] || a.desc_az || a.desc || '';
                        const annHref = a.slug ? `/elanlar/${a.slug}` : '';
                        const tag = annHref ? 'a' : 'div';
                        const href = annHref ? ` href="${escapeHtml(annHref)}"` : '';
                        return `<${tag} class="ann-section-card"${href} style="text-decoration:none;color:inherit;">
                            ${a.image ? `<div class="ann-section-card-img" style="background-image:url(${escapeHtml(a.image)});background-position:${pos};background-size:${bgSize};">${a.showBadge !== false ? '<span class="ann-section-badge">YEN\u0130</span>' : ''}</div>` : ''}
                            <div class="ann-section-card-body"><div class="ann-section-card-title">${escapeHtml(aTitle)}</div>${aDesc ? `<div class="ann-section-card-desc">${escapeHtml(aDesc)}</div>` : ''}<div class="ann-section-card-date">${escapeHtml(a.date || '')}</div></div>
                        </${tag}>`;
                    }).join('');
                    html = html.replace(/<div class="ann-section-grid" id="annSectionGrid">[\s\S]*?<\/div>/, `<div class="ann-section-grid" id="annSectionGrid">${annHtml}</div>`);
                }
            }

            // SSR Reviews
            if (reviewsData && typeof reviewsData === 'object') {
                const reviews = Object.values(reviewsData).filter(r => r.name && r.text).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 6);
                if (reviews.length > 0) {
                    const months = ['Yan','Fev','Mar','Apr','May','\u0130yn','\u0130yl','Avq','Sen','Okt','Noy','Dek'];
                    const revHtml = reviews.map(r => {
                        const initial = r.name.charAt(0).toUpperCase();
                        const date = new Date(r.timestamp);
                        const dateStr = `${date.getDate()} ${months[date.getMonth()] || ''} ${date.getFullYear()}`;
                        let stars = '';
                        for (let i = 0; i < 5; i++) stars += `<i class="fas fa-star ${i < (r.rating || 0) ? '' : 'empty'}"></i>`;
                        const shortText = r.text.length > 150 ? r.text.substring(0, 150) + '...' : r.text;
                        return `<div class="review-card"><div class="review-card-header">${r.photoURL ? `<img src="${escapeHtml(r.photoURL)}" class="review-card-avatar" style="width:42px;height:42px;border-radius:50%;object-fit:cover;" alt="${escapeHtml(r.name)}" loading="lazy">` : `<div class="review-card-avatar">${escapeHtml(initial)}</div>`}<div class="review-card-info"><div class="review-card-name">${escapeHtml(r.name)}</div>${r.city ? `<div class="review-card-city"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(r.city)}</div>` : ''}</div><div class="review-card-stars">${stars}</div></div><div class="review-card-text">${escapeHtml(shortText)}</div><div class="review-card-date">${escapeHtml(dateStr)}</div></div>`;
                    }).join('');
                    html = html.replace(/<div class="reviews-grid" id="reviewsGrid">[\s\S]*?<\/div>/, `<div class="reviews-grid" id="reviewsGrid">${revHtml}</div>`);
                }
            }
        } catch (ssrErr) {
            // SSR failed, continue with client-side rendering
        }

        // 12. Inject script to set language on client side
        html = html.replace(
            '</body>',
            `<script>localStorage.setItem('lang','${lang}');</script>\n</body>`
        );

        // Set cache headers
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);

    } catch (err) {
        console.error('Language render error:', err);
        res.writeHead(302, { Location: '/' });
        res.end();
    }
};

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
