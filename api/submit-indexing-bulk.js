const crypto = require('crypto');
const fetch = require('node-fetch');

// Bulk resubmit: collects every public URL (in priority order) and publishes
// to Google Indexing API. Intended for the admin-panel "Resubmit all" button.

const CONTENTFUL_SPACE = 'q3fe87ca4p3k';
const CONTENTFUL_TOKEN = 'uyQ8WH4Rhs40Y1OBAoXI9nzQGunrNUAtEU4lizTZL-o';
const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';
const SITE_URL = 'https://www.sahseddinimanli.com';

async function getAccessToken() {
    const raw = process.env.GOOGLE_INDEXING_KEY;
    if (!raw) throw new Error('GOOGLE_INDEXING_KEY env var not set');
    const key = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
        iss: key.client_email,
        scope: 'https://www.googleapis.com/auth/indexing',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };
    const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsigned = `${b64(header)}.${b64(claim)}`;
    const signature = crypto
        .createSign('RSA-SHA256')
        .update(unsigned)
        .sign(key.private_key)
        .toString('base64url');
    const jwt = `${unsigned}.${signature}`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Token fetch failed: ' + JSON.stringify(tokenData));
    return tokenData.access_token;
}

async function publishUrl(token, url, type) {
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, type })
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}

async function collectUrls() {
    // Priority order: homepage → blog articles → announcements → campaigns → lang homes
    const urls = [];

    // 1. Homepage
    urls.push(SITE_URL + '/');

    // 2. Blog articles (AZ + RU if available)
    try {
        const contentfulRes = await fetch(
            `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries?access_token=${CONTENTFUL_TOKEN}&content_type=blogPost&order=-sys.createdAt&locale=az&select=sys.id`
        );
        const cfData = await contentfulRes.json();
        const articles = cfData.items || [];

        const [seoRes, htmlRes] = await Promise.all([
            fetch(`${FIREBASE_DB_URL}/articleSeo.json`),
            fetch(`${FIREBASE_DB_URL}/articleHtml.json`)
        ]);
        const seoData = (await seoRes.json()) || {};
        const htmlData = (await htmlRes.json()) || {};

        for (const a of articles) {
            const id = a.sys.id;
            const slug = seoData[id] && seoData[id].slug;
            if (!slug) continue;
            urls.push(`${SITE_URL}/${slug}`);
            const hasRu = htmlData[id] && htmlData[id].ru;
            if (hasRu) {
                const slugRu = (seoData[id] && seoData[id].slugRu) || slug;
                urls.push(`${SITE_URL}/ru/${slugRu}`);
            }
        }
    } catch (e) {}

    // 3. Individual announcements
    try {
        const annRes = await fetch(`${FIREBASE_DB_URL}/announcements.json`);
        const annData = (await annRes.json()) || {};
        for (const a of Object.values(annData)) {
            if (a.active === false || !a.slug) continue;
            urls.push(`${SITE_URL}/elanlar/${a.slug}`);
        }
    } catch (e) {}

    // 4. Announcements list
    urls.push(SITE_URL + '/elanlar');

    // 5. Campaigns
    urls.push(SITE_URL + '/kampaniyalar');

    // 6. Language homepages
    urls.push(SITE_URL + '/ru');
    urls.push(SITE_URL + '/en');
    urls.push(SITE_URL + '/tr');

    // 7. Legal pages
    urls.push(SITE_URL + '/privacy-policy.html');
    urls.push(SITE_URL + '/terms-of-use.html');

    return urls;
}

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    if (!process.env.GOOGLE_INDEXING_KEY) {
        res.status(200).json({ skipped: true, reason: 'GOOGLE_INDEXING_KEY not configured' });
        return;
    }

    try {
        const urls = await collectUrls();
        const token = await getAccessToken();

        // Google Indexing API allows 200 requests/day for non-JobPosting content types.
        // Submit sequentially with small delay to avoid rate issues.
        const results = [];
        for (const u of urls) {
            try {
                const r = await publishUrl(token, u, 'URL_UPDATED');
                results.push({ url: u, ok: r.ok, status: r.status });
            } catch (e) {
                results.push({ url: u, ok: false, error: e.message });
            }
        }
        const submitted = results.filter(r => r.ok).length;
        res.status(200).json({ submitted, total: urls.length, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
