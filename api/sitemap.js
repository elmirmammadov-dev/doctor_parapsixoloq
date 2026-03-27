const fetch = require('node-fetch');

const CONTENTFUL_SPACE = 'q3fe87ca4p3k';
const CONTENTFUL_TOKEN = 'uyQ8WH4Rhs40Y1OBAoXI9nzQGunrNUAtEU4lizTZL-o';
const SITE_URL = 'https://www.sahseddinimanli.com';
const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

module.exports = async (req, res) => {
    try {
        // Fetch all blog posts from Contentful
        const contentfulRes = await fetch(
            `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries?access_token=${CONTENTFUL_TOKEN}&content_type=blogPost&order=-sys.createdAt&locale=az&select=sys.id,sys.updatedAt,fields.title`
        );
        const data = await contentfulRes.json();
        const articles = data.items || [];

        // Fetch SEO data (slugs) from Firebase
        let seoData = {};
        try {
            const seoRes = await fetch(`${FIREBASE_DB_URL}/articleSeo.json`);
            seoData = await seoRes.json() || {};
        } catch(e) {}

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${SITE_URL}/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${SITE_URL}/ru</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${SITE_URL}/en</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${SITE_URL}/tr</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${SITE_URL}/elanlar</loc>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>${SITE_URL}/privacy-policy.html</loc>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
    </url>
    <url>
        <loc>${SITE_URL}/terms-of-use.html</loc>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
    </url>`;

        // Add each blog post
        for (const article of articles) {
            const id = article.sys.id;
            const updated = article.sys.updatedAt ? article.sys.updatedAt.split('T')[0] : '';
            const slug = seoData[id] && seoData[id].slug ? seoData[id].slug : null;
            if (!slug) continue; // Skip articles without slug URL
            xml += `
    <url>
        <loc>${SITE_URL}/${slug}</loc>
        ${updated ? `<lastmod>${updated}</lastmod>` : ''}
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
        }

        // Add announcements page with language variants
        const langs = ['ru', 'en', 'tr'];
        for (const l of langs) {
            xml += `
    <url>
        <loc>${SITE_URL}/elanlar?lang=${l}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.5</priority>
    </url>`;
        }

        // Add individual announcement pages
        try {
            const annRes = await fetch(`${FIREBASE_DB_URL}/announcements.json`);
            const annData = await annRes.json() || {};
            for (const [id, a] of Object.entries(annData)) {
                if (a.active === false || !a.slug) continue;
                xml += `
    <url>
        <loc>${SITE_URL}/elanlar/${a.slug}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;
            }
        } catch(e) {}

        // Add campaigns page
        xml += `
    <url>
        <loc>${SITE_URL}/kampaniyalar</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
    </url>`;

        xml += '\n</urlset>';

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('CDN-Cache-Control', 'no-store');
        res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
        res.status(200).send(xml);
    } catch (err) {
        console.error('Sitemap error:', err);
        res.status(500).send('Error generating sitemap');
    }
};
