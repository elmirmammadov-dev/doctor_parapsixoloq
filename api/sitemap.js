const fetch = require('node-fetch');

const CONTENTFUL_SPACE = 'q3fe87ca4p3k';
const CONTENTFUL_TOKEN = 'uyQ8WH4Rhs40Y1OBAoXI9nzQGunrNUAtEU4lizTZL-o';
const SITE_URL = 'https://www.sahseddinimanli.com';

module.exports = async (req, res) => {
    try {
        // Fetch all blog posts from Contentful
        const contentfulRes = await fetch(
            `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries?access_token=${CONTENTFUL_TOKEN}&content_type=blogPost&order=-sys.createdAt&locale=az&select=sys.id,sys.updatedAt,fields.title`
        );
        const data = await contentfulRes.json();
        const articles = data.items || [];

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
            xml += `
    <url>
        <loc>${SITE_URL}/blog/${id}</loc>
        ${updated ? `<lastmod>${updated}</lastmod>` : ''}
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
        }

        xml += '\n</urlset>';

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(xml);
    } catch (err) {
        console.error('Sitemap error:', err);
        res.status(500).send('Error generating sitemap');
    }
};
