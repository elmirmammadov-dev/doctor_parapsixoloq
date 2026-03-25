const fetch = require('node-fetch');

const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

module.exports = async (req, res) => {
    const id = req.query.id;
    if (!id) {
        res.status(404).send('Not found');
        return;
    }

    try {
        // Look up slug for this article ID
        const seoRes = await fetch(`${FIREBASE_DB_URL}/articleSeo/${id}/slug.json`);
        const slug = await seoRes.json();

        if (slug) {
            // 301 permanent redirect to slug URL
            res.writeHead(301, { Location: '/' + slug });
            res.end();
        } else {
            // No slug found — 404
            res.status(404).send('Məqalə tapılmadı');
        }
    } catch (e) {
        res.status(404).send('Məqalə tapılmadı');
    }
};
