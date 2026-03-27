const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const CONTENTFUL_SPACE = 'q3fe87ca4p3k';
const CONTENTFUL_TOKEN = 'uyQ8WH4Rhs40Y1OBAoXI9nzQGunrNUAtEU4lizTZL-o';
const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

module.exports = async (req, res) => {
    let postId = null;
    const slug = req.query.slug;

    // Resolve slug to article ID from Firebase
    if (slug) {
        try {
            const slugRes = await fetch(`${FIREBASE_DB_URL}/articleSlugs/${slug}.json`);
            const resolvedId = await slugRes.json();
            if (resolvedId) postId = resolvedId;
        } catch (e) {}
    }

    if (!postId) {
        res.status(404).send('Məqalə tapılmadı');
        return;
    }

    try {
        // Fetch article from Contentful
        const contentfulRes = await fetch(
            `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries/${postId}?access_token=${CONTENTFUL_TOKEN}&locale=az`
        );
        const article = await contentfulRes.json();

        if (!article.fields) {
            res.status(404).send('Article not found');
            return;
        }

        const title = article.fields.title || '';
        const date = article.fields.date || '';

        // Fetch image URL if exists
        let imageUrl = '';
        if (article.fields.image && article.fields.image.sys) {
            const assetRes = await fetch(
                `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/assets/${article.fields.image.sys.id}?access_token=${CONTENTFUL_TOKEN}&locale=az`
            );
            const asset = await assetRes.json();
            if (asset.fields && asset.fields.file) {
                imageUrl = 'https:' + asset.fields.file.url;
            }
        }

        // Fetch SEO data, article HTML and announcements from Firebase in parallel
        let seoData = {};
        let articleHtmlAz = '';
        let articleHtmlRu = '';
        let announcementsData = {};
        try {
            const [seoRes, htmlRes, annRes] = await Promise.all([
                fetch(`${FIREBASE_DB_URL}/articleSeo/${postId}.json`),
                fetch(`${FIREBASE_DB_URL}/articleHtml/${postId}.json`),
                fetch(`${FIREBASE_DB_URL}/announcements.json`)
            ]);
            seoData = await seoRes.json() || {};
            const htmlData = await htmlRes.json() || {};
            articleHtmlAz = htmlData.az || '';
            articleHtmlRu = htmlData.ru || '';
            announcementsData = await annRes.json() || {};
        } catch (e) {}

        // Prefer ImgBB cover image from SEO data
        if (seoData.coverImage) imageUrl = seoData.coverImage;

        const metaDesc = seoData.metaDesc || title + ' - Şahsəddin İmanlı tərəfindən yazılmış məqalə.';
        const keyword = seoData.keyword || 'parapsixologiya, Şahsəddin İmanlı';
        const imageAlt = seoData.imageAlt || title;
        const siteUrl = 'https://www.sahseddinimanli.com';
        const pageUrl = seoData.slug ? `${siteUrl}/${seoData.slug}` : `${siteUrl}/blog/${postId}`;
        const dateModified = article.sys.updatedAt || '';

        // Read the blog-post.html template
        const templatePath = path.join(process.cwd(), 'blog-post.html');
        let html = fs.readFileSync(templatePath, 'utf-8');

        // Replace static meta tags with dynamic ones
        html = html.replace(
            '<title>Məqalə | Şahsəddin İmanlı</title>',
            `<title>${escapeHtml(title)} | Şahsəddin İmanlı</title>`
        );

        html = html.replace(
            '<meta name="description" content="Şahsəddin İmanlı - Parapsixologiya, sağlamlıq və mənəvi inkişaf haqqında faydalı məqalələr və yazılar.">',
            `<meta name="description" content="${escapeHtml(metaDesc)}">`
        );

        html = html.replace(
            '<meta name="keywords" content="parapsixologiya məqalələr, Şahsəddin İmanlı bloq, sağlamlıq, mənəvi inkişaf, nəfəs terapiyası, tantra yoqa">',
            `<meta name="keywords" content="${escapeHtml(keyword)}, parapsixologiya, Şahsəddin İmanlı">`
        );

        // Replace Open Graph tags
        html = html.replace(
            '<meta property="og:title" content="Məqalə | Şahsəddin İmanlı">',
            `<meta property="og:title" content="${escapeHtml(title)} | Şahsəddin İmanlı">`
        );
        html = html.replace(
            '<meta property="og:description" content="Parapsixologiya, sağlamlıq və mənəvi inkişaf haqqında faydalı məqalələr.">',
            `<meta property="og:description" content="${escapeHtml(metaDesc)}">`
        );
        if (imageUrl) {
            html = html.replace(
                '<meta property="og:image" content="https://www.sahseddinimanli.com/logo.webp">',
                `<meta property="og:image" content="${imageUrl}">`
            );
        }

        // Replace Twitter Card tags
        html = html.replace(
            '<meta name="twitter:title" content="Məqalə | Şahsəddin İmanlı">',
            `<meta name="twitter:title" content="${escapeHtml(title)} | Şahsəddin İmanlı">`
        );
        html = html.replace(
            '<meta name="twitter:description" content="Parapsixologiya, sağlamlıq və mənəvi inkişaf haqqında faydalı məqalələr.">',
            `<meta name="twitter:description" content="${escapeHtml(metaDesc)}">`
        );
        if (imageUrl) {
            html = html.replace(
                '<meta name="twitter:image" content="https://www.sahseddinimanli.com/logo.webp">',
                `<meta name="twitter:image" content="${imageUrl}">`
            );
        }

        // Inject canonical URL, og:url, and JSON-LD before </head>
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": metaDesc,
            "image": imageUrl || undefined,
            "datePublished": date || undefined,
            "dateModified": dateModified || undefined,
            "author": { "@type": "Person", "name": "Şahsəddin İmanlı", "url": siteUrl },
            "publisher": {
                "@type": "Organization",
                "name": "Şahsəddin İmanlı",
                "url": siteUrl,
                "logo": { "@type": "ImageObject", "url": siteUrl + "/logo.webp" }
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
            "keywords": keyword,
            "inLanguage": "az"
        };
        // Remove undefined values
        Object.keys(jsonLd).forEach(k => jsonLd[k] === undefined && delete jsonLd[k]);

        // Pre-load all data so client doesn't need extra fetches
        const preloadData = {
            postId: postId,
            fields: article.fields,
            seo: seoData,
            imageUrl: imageUrl,
            htmlAz: articleHtmlAz,
            htmlRu: articleHtmlRu
        };

        const headInject = `
    <link rel="canonical" href="${pageUrl}">
    <meta property="og:url" content="${pageUrl}">
    <script>window.__POST_ID__ = "${postId}";
window.__POST_DATA__ = ${JSON.stringify(JSON.stringify(preloadData))};</script>
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

        html = html.replace('</head>', headInject + '\n</head>');

        // Inject SSR announcements as noscript/hidden content for SEO
        const activeAnns = Object.values(announcementsData)
            .filter(a => a.active !== false)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 10);
        if (activeAnns.length > 0) {
            const annSeoHtml = activeAnns.map(a =>
                `<div itemscope itemtype="https://schema.org/Event"><meta itemprop="name" content="${escapeHtml(a.title)}"><meta itemprop="description" content="${escapeHtml(a.desc || '')}">` +
                (a.image ? `<meta itemprop="image" content="${escapeHtml(a.image)}">` : '') +
                (a.date ? `<meta itemprop="startDate" content="${escapeHtml(a.date)}">` : '') +
                `<meta itemprop="organizer" content="Şahsəddin İmanlı"></div>`
            ).join('');
            html = html.replace('</body>', `<div style="display:none" aria-hidden="true">${annSeoHtml}</div>\n</body>`);
        }

        // No cache - always serve fresh data
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('CDN-Cache-Control', 'no-store');
        res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);

    } catch (err) {
        console.error('Render error:', err);
        // Fallback: serve original blog-post.html
        const templatePath = path.join(process.cwd(), 'blog-post.html');
        const html = fs.readFileSync(templatePath, 'utf-8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
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
