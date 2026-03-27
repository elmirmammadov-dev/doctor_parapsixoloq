const fetch = require('node-fetch');

const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
        const { campaignId, name, surname, phone, fingerprint } = req.body || {};

        // Validate inputs
        if (!campaignId || !name || !surname || !phone) {
            return res.status(400).json({ error: 'Ad, soyad və telefon nömrəsi tələb olunur' });
        }
        const phoneTrimmed = phone.replace(/\s+/g, '');
        if (!/^\+?\d{7,15}$/.test(phoneTrimmed)) {
            return res.status(400).json({ error: 'Telefon nömrəsi düzgün deyil' });
        }

        // Get client IP
        const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown').split(',')[0].trim();
        const sanitizedIP = ip.replace(/[.\/:]/g, '_');

        // Fetch campaign
        const campRes = await fetch(`${FIREBASE_DB_URL}/campaigns/${campaignId}.json`);
        const campaign = await campRes.json();
        if (!campaign) {
            return res.status(404).json({ error: 'Kampaniya tapılmadı' });
        }
        if (campaign.active === false) {
            return res.status(400).json({ error: 'Kampaniya aktiv deyil' });
        }
        if (campaign.endTimestamp && Date.now() > campaign.endTimestamp) {
            return res.status(400).json({ error: 'Kampaniyanın vaxtı bitib' });
        }
        if (campaign.claimedCount >= campaign.maxCoupons) {
            return res.status(400).json({ error: 'Bütün kuponlar tükənib' });
        }

        // Check IP duplicate
        const ipCheckRes = await fetch(`${FIREBASE_DB_URL}/campaignClaimIndex/${campaignId}/${sanitizedIP}.json`);
        const ipExists = await ipCheckRes.json();
        if (ipExists) {
            return res.status(400).json({ error: 'Bu cihazdan artıq kupon alınıb' });
        }

        // Check phone duplicate
        const sanitizedPhone = phoneTrimmed.replace(/[.\/:+]/g, '_');
        const phoneCheckRes = await fetch(`${FIREBASE_DB_URL}/campaignClaimIndex/${campaignId}/phone_${sanitizedPhone}.json`);
        const phoneExists = await phoneCheckRes.json();
        if (phoneExists) {
            return res.status(400).json({ error: 'Bu telefon nömrəsi ilə artıq kupon alınıb' });
        }

        // Check browser fingerprint duplicate
        if (fingerprint) {
            const fpCheckRes = await fetch(`${FIREBASE_DB_URL}/campaignClaimIndex/${campaignId}/fp_${fingerprint}.json`);
            const fpExists = await fpCheckRes.json();
            if (fpExists) {
                return res.status(400).json({ error: 'Bu cihazdan artıq kupon alınıb' });
            }
        }

        // Increment claimedCount with ETag for race condition safety
        const countUrl = `${FIREBASE_DB_URL}/campaigns/${campaignId}/claimedCount.json`;
        let claimed = false;
        for (let attempt = 0; attempt < 5; attempt++) {
            const countRes = await fetch(countUrl, { headers: { 'X-Firebase-ETag': 'true' } });
            const etag = countRes.headers.get('etag');
            const currentCount = await countRes.json() || 0;

            if (currentCount >= campaign.maxCoupons) {
                return res.status(400).json({ error: 'Bütün kuponlar tükənib' });
            }

            const putRes = await fetch(countUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'if-match': etag },
                body: JSON.stringify(currentCount + 1)
            });

            if (putRes.status === 200) {
                claimed = true;
                break;
            }
            // 412 = ETag mismatch, retry
            if (putRes.status !== 412) {
                const errData = await putRes.json();
                throw new Error(errData.error || 'Firebase xətası');
            }
        }

        if (!claimed) {
            return res.status(500).json({ error: 'Kupon alma uğursuz oldu, yenidən cəhd edin' });
        }

        // Save claim record
        const claimData = {
            name: name.trim(),
            surname: surname.trim(),
            phone: phoneTrimmed,
            ip: ip,
            fingerprint: fingerprint || null,
            couponCode: campaign.couponCode,
            claimedAt: Date.now()
        };
        await fetch(`${FIREBASE_DB_URL}/campaignClaims/${campaignId}.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claimData)
        });

        // Save IP, phone and fingerprint index for duplicate prevention
        const indexWrites = [
            fetch(`${FIREBASE_DB_URL}/campaignClaimIndex/${campaignId}/${sanitizedIP}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(true)
            }),
            fetch(`${FIREBASE_DB_URL}/campaignClaimIndex/${campaignId}/phone_${sanitizedPhone}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(true)
            })
        ];
        if (fingerprint) {
            indexWrites.push(fetch(`${FIREBASE_DB_URL}/campaignClaimIndex/${campaignId}/fp_${fingerprint}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(true)
            }));
        }
        await Promise.all(indexWrites);

        return res.status(200).json({
            success: true,
            couponCode: campaign.couponCode,
            discount: campaign.discountPercent,
            message: `Təbrik edirik! ${campaign.discountPercent}% endirim kuponunuz: ${campaign.couponCode}`
        });

    } catch (err) {
        console.error('Claim coupon error:', err);
        return res.status(500).json({ error: 'Xəta baş verdi: ' + err.message });
    }
};
