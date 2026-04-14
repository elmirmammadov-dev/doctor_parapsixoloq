const crypto = require('crypto');
const fetch = require('node-fetch');

// Google Indexing API — submits a single URL notification
// Requires env var GOOGLE_INDEXING_KEY = full service-account JSON (as string)

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
    if (!tokenData.access_token) {
        throw new Error('Token fetch failed: ' + JSON.stringify(tokenData));
    }
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

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Graceful skip when not configured — keeps admin flow non-blocking
    if (!process.env.GOOGLE_INDEXING_KEY) {
        res.status(200).json({ skipped: true, reason: 'GOOGLE_INDEXING_KEY not configured' });
        return;
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const urls = Array.isArray(body.urls) ? body.urls : (body.url ? [body.url] : []);
        const type = body.type === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED';

        if (urls.length === 0) {
            res.status(400).json({ error: 'url or urls required' });
            return;
        }

        const token = await getAccessToken();
        const results = [];
        for (const u of urls) {
            try {
                const r = await publishUrl(token, u, type);
                results.push({ url: u, ok: r.ok, status: r.status, data: r.data });
            } catch (e) {
                results.push({ url: u, ok: false, error: e.message });
            }
        }
        const submitted = results.filter(r => r.ok).length;
        res.status(200).json({ submitted, total: urls.length, type, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
