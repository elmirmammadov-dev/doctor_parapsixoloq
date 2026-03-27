const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const CONTENTFUL_SPACE = 'q3fe87ca4p3k';
const CONTENTFUL_TOKEN = 'uyQ8WH4Rhs40Y1OBAoXI9nzQGunrNUAtEU4lizTZL-o';
const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

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
        const htmlPath = path.join(process.cwd(), '_index.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');

        // Fetch blog posts, announcements, and reviews in parallel
        const [blogData, seoData, annData, reviewsData, campData] = await Promise.all([
            fetch(`https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries?access_token=${CONTENTFUL_TOKEN}&content_type=blogPost&include=1&order=-sys.createdAt&locale=az`)
                .then(r => r.json()).catch(() => ({})),
            fetch(`${FIREBASE_DB_URL}/articleSeo.json`)
                .then(r => r.json()).catch(() => ({})),
            fetch(`${FIREBASE_DB_URL}/announcements.json`)
                .then(r => r.json()).catch(() => ({})),
            fetch(`${FIREBASE_DB_URL}/reviews.json`)
                .then(r => r.json()).catch(() => ({})),
            fetch(`${FIREBASE_DB_URL}/campaigns.json`)
                .then(r => r.json()).catch(() => ({}))
        ]);

        // === SSR Blog Cards ===
        let blogHtml = '';
        if (blogData.items && blogData.items.length > 0) {
            const assets = {};
            if (blogData.includes && blogData.includes.Asset) {
                blogData.includes.Asset.forEach(a => {
                    assets[a.sys.id] = 'https:' + a.fields.file.url;
                });
            }
            const seo = seoData || {};
            // Sort by date descending
            const sorted = blogData.items.sort((a, b) => {
                const da = new Date(a.fields.date || 0);
                const db = new Date(b.fields.date || 0);
                return db - da;
            });
            // First 4 posts
            blogHtml = sorted.slice(0, 4).map(item => {
                const f = item.fields;
                const id = item.sys.id;
                const imgId = f.image && f.image.sys ? f.image.sys.id : null;
                let imgUrl = imgId ? assets[imgId] : null;
                let coverPos = '50% 50%';
                let coverZoom = 1;
                if (seo[id] && seo[id].coverImage) imgUrl = seo[id].coverImage;
                if (seo[id] && seo[id].coverPos) coverPos = seo[id].coverPos;
                if (seo[id] && seo[id].coverZoom) coverZoom = seo[id].coverZoom;
                const scaleStyle = coverZoom > 1 ? `transform:scale(${coverZoom});` : '';
                const blogUrl = (seo[id] && seo[id].slug) ? '/' + seo[id].slug : '#';
                return `<a href="${escapeHtml(blogUrl)}" class="blog-post-card" data-id="${id}" style="text-decoration:none;color:inherit;cursor:pointer;">
                    ${imgUrl ? `<div class="blog-post-cover" role="img" aria-label="${escapeHtml(f.title)}" style="background-image:url(${escapeHtml(imgUrl)});background-size:cover;background-position:${coverPos};background-repeat:no-repeat;${scaleStyle}"></div>` : `<div class="blog-post-placeholder" style="flex:1;background:#f0f7f3;display:flex;align-items:center;justify-content:center;color:#aaa;"><i class="fas fa-image" style="font-size:1.5rem;"></i></div>`}
                    <div class="blog-post-info">
                        <h4>${escapeHtml(f.title)}</h4>
                        <div style="display:flex;align-items:center;gap:12px;margin-top:4px;">
                            <span class="blog-post-date">${escapeHtml(f.date || '')}</span>
                            <span style="font-size:0.78rem;color:#999;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-eye" style="font-size:0.72rem;"></i> <span id="cardViews_${id}">0</span></span>
                            <span style="font-size:0.78rem;color:#999;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-thumbs-up" style="font-size:0.72rem;"></i> <span id="cardLikes_${id}">0</span></span>
                            <span style="font-size:0.78rem;color:#999;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-comment" style="font-size:0.72rem;"></i> <span id="cardComments_${id}">0</span></span>
                        </div>
                    </div>
                </a>`;
            }).join('');
        }

        // === SSR Announcement Cards ===
        // === SSR Announcement Cards (left column, max 2) ===
        let annHtml = '';
        if (annData && typeof annData === 'object') {
            const announcements = Object.values(annData)
                .filter(a => a.active !== false)
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .slice(0, 2);
            if (announcements.length > 0) {
                annHtml = announcements.map(a => {
                    const pos = a.coverPos || '50% 50%';
                    const zoom = a.coverZoom || 1;
                    const bgSize = zoom <= 1 ? 'cover' : (zoom * 100) + '%';
                    const aTitle = a.title_az || a.title || '';
                    const aDesc = a.desc_az || a.desc || '';
                    const annHref = a.slug ? `/elanlar/${a.slug}` : '';
                    const tag = annHref ? 'a' : 'div';
                    const href = annHref ? ` href="${escapeHtml(annHref)}"` : '';
                    return `<${tag} class="ann-section-card"${href} style="text-decoration:none;color:inherit;">
                        ${a.image ? `<div class="ann-section-card-img" style="background-image:url(${escapeHtml(a.image)});background-position:${pos};background-size:${bgSize};">${a.showBadge !== false ? '<span class="ann-section-badge">YEN\u0130</span>' : ''}</div>` : ''}
                        <div class="ann-section-card-body">
                            <div class="ann-section-card-title">${escapeHtml(aTitle)}</div>
                            ${aDesc ? `<div class="ann-section-card-desc">${escapeHtml(aDesc)}</div>` : ''}
                            <div class="ann-section-card-date">${escapeHtml(a.date || '')}</div>
                        </div>
                    </${tag}>`;
                }).join('');
            }
        }

        // === SSR Campaign Cards (right column, max 2) ===
        let campHtml = '';
        const now = Date.now();
        if (campData && typeof campData === 'object') {
            const campaigns = Object.entries(campData)
                .map(([id, c]) => ({ id, ...c }))
                .filter(c => c.active !== false)
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .slice(0, 2);
            if (campaigns.length > 0) {
                campHtml = campaigns.map(c => {
                    const expired = (c.endTimestamp && now > c.endTimestamp) || ((c.claimedCount || 0) >= c.maxCoupons);
                    const claimed = c.claimedCount || 0;
                    const max = c.maxCoupons || 1;
                    const pct = Math.min(100, Math.round((claimed / max) * 100));
                    return `<div class="camp-card"${expired ? ' style="opacity:0.7;"' : ''}>
                        ${expired ? '<div class="camp-ended-overlay"><div class="camp-ended-text">B\u0130T\u0130B</div></div>' : ''}
                        ${c.image ? `<div class="camp-card-img" style="background-image:url(${escapeHtml(c.image)});background-position:${c.coverPos || '50% 50%'};background-size:${(c.coverZoom || 1) <= 1 ? 'cover' : ((c.coverZoom || 1) * 100) + '%'};"><div class="camp-discount-badge">-${c.discountPercent}%</div></div>` : ''}
                        <div class="camp-card-body">
                            <div class="camp-card-title">${escapeHtml(c.title || '')}</div>
                            ${c.desc ? `<div class="camp-card-desc">${escapeHtml(c.desc)}</div>` : ''}
                            <div class="camp-progress-wrap"><div class="camp-progress-bar"><div class="camp-progress-fill" style="width:${pct}%;"></div></div><div class="camp-progress-text"><span>${claimed} / ${max} kupon</span><span>${max - claimed} qal\u0131b</span></div></div>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        // === SSR Review Cards ===
        let reviewsHtml = '';
        if (reviewsData && typeof reviewsData === 'object') {
            const months = ['Yan','Fev','Mar','Apr','May','\u0130yn','\u0130yl','Avq','Sen','Okt','Noy','Dek'];
            const reviews = Object.entries(reviewsData)
                .map(([key, r]) => ({ ...r, _key: key }))
                .filter(r => r.name && r.text)
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .slice(0, 6);
            if (reviews.length > 0) {
                reviewsHtml = reviews.map(r => {
                    const initial = r.name.charAt(0).toUpperCase();
                    const date = new Date(r.timestamp);
                    const dateStr = `${date.getDate()} ${months[date.getMonth()] || ''} ${date.getFullYear()}`;
                    let starsHtml = '';
                    for (let i = 0; i < 5; i++) {
                        starsHtml += `<i class="fas fa-star ${i < (r.rating || 0) ? '' : 'empty'}"></i>`;
                    }
                    const shortText = r.text.length > 150 ? r.text.substring(0, 150) + '...' : r.text;
                    return `<div class="review-card">
                        <div class="review-card-header">
                            ${r.photoURL ? `<img src="${escapeHtml(r.photoURL)}" class="review-card-avatar" style="width:42px;height:42px;border-radius:50%;object-fit:cover;object-position:top center;" alt="${escapeHtml(r.name)}" loading="lazy">` : `<div class="review-card-avatar">${escapeHtml(initial)}</div>`}
                            <div class="review-card-info">
                                <div class="review-card-name">${escapeHtml(r.name)}</div>
                                ${r.city ? `<div class="review-card-city"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(r.city)}</div>` : ''}
                            </div>
                            <div class="review-card-stars">${starsHtml}</div>
                        </div>
                        <div class="review-card-text">${escapeHtml(shortText)}</div>
                        <div class="review-card-date">${escapeHtml(dateStr)}</div>
                    </div>`;
                }).join('');
            }
        }

        // Inject SSR content into HTML
        if (blogHtml) {
            html = html.replace(
                /<div class="blog-grid blog-section-grid" id="blogGrid">[\s\S]*?<\/div>/,
                `<div class="blog-grid blog-section-grid" id="blogGrid">${blogHtml}</div>`
            );
        }
        if (annHtml) {
            html = html.replace(
                /<div class="ann-split-grid" id="annSplitGrid"><\/div>/,
                `<div class="ann-split-grid" id="annSplitGrid">${annHtml}</div>`
            );
        } else {
            html = html.replace(
                /<div class="ann-split-col" id="annSplitLeft">/,
                '<div class="ann-split-col" id="annSplitLeft" style="display:none;">'
            );
        }
        if (campHtml) {
            html = html.replace(
                /<div class="camp-split-grid" id="campSplitGrid"><\/div>/,
                `<div class="camp-split-grid" id="campSplitGrid">${campHtml}</div>`
            );
        } else {
            html = html.replace(
                /<div class="ann-split-col" id="annSplitRight">/,
                '<div class="ann-split-col" id="annSplitRight" style="display:none;">'
            );
        }
        if (!annHtml && !campHtml) {
            html = html.replace(
                /<section class="announcements-section" id="announcementsSection">/,
                '<section class="announcements-section" id="announcementsSection" style="display:none;">'
            );
        }
        if (reviewsHtml) {
            html = html.replace(
                /<div class="reviews-grid" id="reviewsGrid">[\s\S]*?<\/div>/,
                `<div class="reviews-grid" id="reviewsGrid">${reviewsHtml}</div>`
            );
        }

        // No cache - always serve fresh data
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('CDN-Cache-Control', 'no-store');
        res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);

    } catch (err) {
        console.error('SSR index error:', err);
        // Fallback: serve static index.html
        try {
            const htmlPath = path.join(process.cwd(), '_index.html');
            const html = fs.readFileSync(htmlPath, 'utf-8');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.status(200).send(html);
        } catch (e) {
            res.status(500).send('Server error');
        }
    }
};
