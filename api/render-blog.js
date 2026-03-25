const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const CONTENTFUL_SPACE = 'q3fe87ca4p3k';
const CONTENTFUL_TOKEN = 'uyQ8WH4Rhs40Y1OBAoXI9nzQGunrNUAtEU4lizTZL-o';
const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

module.exports = async (req, res) => {
    let postId = req.query.id;
    const slug = req.query.slug;

    // If slug provided, resolve to ID from Firebase
    if (!postId && slug) {
        try {
            const slugRes = await fetch(`${FIREBASE_DB_URL}/articleSlugs/${slug}.json`);
            const resolvedId = await slugRes.json();
            if (resolvedId) postId = resolvedId;
        } catch (e) {}
    }

    if (!postId) {
        res.status(400).send('Missing article ID');
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

        // Fetch SEO data from Firebase
        let seoData = {};
        try {
            const seoRes = await fetch(`${FIREBASE_DB_URL}/articleSeo/${postId}.json`);
            seoData = await seoRes.json() || {};
        } catch (e) {}

        const metaDesc = seoData.metaDesc || title + ' - Şahsəddin İmanlı tərəfindən yazılmış məqalə.';
        const keyword = seoData.keyword || 'parapsixologiya, Şahsəddin İmanlı';
        const imageAlt = seoData.imageAlt || title;
        const siteUrl = 'https://www.sahseddinimanli.com';
        const pageUrl = seoData.slug ? `${siteUrl}/${seoData.slug}` : `${siteUrl}/blog/${postId}`;

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

        // Inject canonical URL and JSON-LD before </head>
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": metaDesc,
            "image": imageUrl || '',
            "datePublished": date,
            "author": { "@type": "Person", "name": "Şahsəddin İmanlı" },
            "publisher": {
                "@type": "Organization",
                "name": "Şahsəddin İmanlı",
                "url": siteUrl
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
            "keywords": keyword
        };

        const headInject = `
    <link rel="canonical" href="${pageUrl}">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

        html = html.replace('</head>', headInject + '\n</head>');

        // Set cache headers
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
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
