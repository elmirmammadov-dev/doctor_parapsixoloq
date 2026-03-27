const fetch = require('node-fetch');

const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async (req, res) => {
    try {
        const campRes = await fetch(`${FIREBASE_DB_URL}/campaigns.json`);
        const campData = await campRes.json();

        const campaigns = campData ? Object.entries(campData)
            .map(([id, c]) => ({ id, ...c }))
            .filter(c => c.active !== false)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : [];

        const now = Date.now();
        const siteUrl = 'https://www.sahseddinimanli.com';

        // JSON-LD for SEO
        const jsonLdItems = campaigns.map(c => ({
            "@type": "Offer",
            "name": escapeHtml(c.title || ''),
            "description": escapeHtml(c.desc || ''),
            "discount": c.discountPercent + '%',
            "validThrough": c.endTimestamp ? new Date(c.endTimestamp).toISOString() : '',
            "url": siteUrl + '/kampaniyalar',
            "seller": { "@type": "Person", "name": "Şahsəddin İmanlı" }
        }));

        const campCardsHtml = campaigns.length > 0 ? campaigns.map(c => {
            const expired = (c.endTimestamp && now > c.endTimestamp) || ((c.claimedCount || 0) >= c.maxCoupons);
            const claimed = c.claimedCount || 0;
            const max = c.maxCoupons || 1;
            const pct = Math.min(100, Math.round((claimed / max) * 100));

            return `<div class="camp-archive-card" style="background:#fff;border-radius:16px;overflow:hidden;border:2px solid ${expired ? '#ccc' : '#c5a637'};margin-bottom:20px;${expired ? 'opacity:0.7;' : ''}position:relative;">
                ${expired ? '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:2;border-radius:14px;"><span style="background:#e74c3c;color:#fff;padding:10px 28px;border-radius:10px;font-weight:800;font-size:1.1rem;letter-spacing:1px;">BİTİB</span></div>' : ''}
                ${c.image ? `<div style="width:100%;aspect-ratio:3/1;background-image:url(${escapeHtml(c.image)});background-position:${c.coverPos || '50% 50%'};background-size:${(c.coverZoom || 1) <= 1 ? 'cover' : ((c.coverZoom || 1) * 100) + '%'};background-repeat:no-repeat;position:relative;">
                    <div style="position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-size:1.1rem;font-weight:800;padding:6px 14px;border-radius:10px;box-shadow:0 3px 12px rgba(231,76,60,0.5);">-${c.discountPercent}%</div>
                </div>` : ''}
                <div style="padding:16px;">
                    <h3 style="font-size:1rem;font-weight:700;margin:0 0 8px;">${escapeHtml(c.title || '')}</h3>
                    ${c.desc ? `<p style="font-size:0.85rem;color:#666;margin:0 0 12px;line-height:1.5;">${escapeHtml(c.desc)}</p>` : ''}
                    <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:#999;">
                        <span>${claimed} / ${max} kupon alınıb</span>
                        <span>${max - claimed} qalıb</span>
                    </div>
                    <div style="height:6px;background:#eee;border-radius:3px;margin:6px 0 12px;overflow:hidden;">
                        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#e74c3c,#c5a637);border-radius:3px;"></div>
                    </div>
                    ${!expired ? `<button class="camp-claim-btn" onclick="openCampClaimModal('${c.id}','${escapeHtml(c.title || '').replace(/'/g, "\\'")}',${c.discountPercent})" style="width:100%;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#c5a637,#d4b445);color:#fff;font-weight:700;font-size:0.88rem;cursor:pointer;">
                        <i class="fas fa-ticket-alt"></i> Kuponu al
                    </button>` : ''}
                </div>
            </div>`;
        }).join('') : '<p style="text-align:center;color:#999;padding:40px 0;">Hazırda aktiv kampaniya yoxdur.</p>';

        const html = `<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kampaniyalar | Şahsəddin İmanlı</title>
    <meta name="description" content="Şahsəddin İmanlının xüsusi endirim kampaniyaları. Kupon alın və endirimdən yararlanın.">
    <meta name="keywords" content="kampaniya, endirim, kupon, Şahsəddin İmanlı, parapsixologiya">
    <link rel="canonical" href="${siteUrl}/kampaniyalar">
    <meta property="og:title" content="Kampaniyalar | Şahsəddin İmanlı">
    <meta property="og:description" content="Xüsusi endirim kampaniyaları">
    <meta property="og:url" content="${siteUrl}/kampaniyalar">
    <meta property="og:type" content="website">
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="application/ld+json">${JSON.stringify(jsonLdItems)}</script>
</head>
<body>
    <nav class="navbar" id="navbar">
        <div class="container" style="display:flex;justify-content:space-between;align-items:center;">
            <a href="/" style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:1.2rem;color:var(--text-primary);text-decoration:none;">Şahsəddin İmanlı</a>
            <a href="/" style="color:var(--gold);text-decoration:none;font-weight:600;font-size:0.9rem;"><i class="fas fa-arrow-left"></i> Ana Səhifə</a>
        </div>
    </nav>
    <main style="padding:100px 0 60px;">
        <div class="container" style="max-width:700px;">
            <h1 style="font-family:'Montserrat',sans-serif;font-size:1.8rem;font-weight:800;margin-bottom:8px;">Kampaniyalar</h1>
            <p style="color:#666;margin-bottom:32px;">Xüsusi endirim kuponları. Kuponu alın, WhatsApp-da və ya canlı seansda göstərin.</p>
            ${campCardsHtml}
        </div>
    </main>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
    <script src="/style.css"></script>
    <script>
        function setCampCookie(id,v){var d=new Date();d.setTime(d.getTime()+365*24*60*60*1000);document.cookie='camp_'+id+'='+encodeURIComponent(v)+';expires='+d.toUTCString()+';path=/;SameSite=Lax';}
        function getCampCookie(id){var n='camp_'+id+'=',p=document.cookie.split(';');for(var i=0;i<p.length;i++){var c=p[i].trim();if(c.indexOf(n)===0)return decodeURIComponent(c.substring(n.length));}return null;}
        function getBrowserFingerprint(){var c=document.createElement('canvas'),x=c.getContext('2d');x.textBaseline='top';x.font='14px Arial';x.fillText('fingerprint',2,2);var r=[navigator.userAgent,navigator.language,screen.width+'x'+screen.height,screen.colorDepth,new Date().getTimezoneOffset(),navigator.hardwareConcurrency||0,navigator.deviceMemory||0,navigator.platform||'',c.toDataURL()].join('|');var h=0;for(var i=0;i<r.length;i++){h=((h<<5)-h)+r.charCodeAt(i);h=h&h;}return 'fp_'+Math.abs(h).toString(36);}
        var browserFingerprint=getBrowserFingerprint();
        // Claim modal
        window.openCampClaimModal = function(campId, title, discount) {
            if (getCampCookie(campId)) { alert('Bu kampaniyadan artıq kupon almısınız.'); return; }
            var overlay = document.createElement('div');
            overlay.className = 'camp-modal-overlay';
            overlay.innerHTML = '<div class="camp-modal">' +
                '<h3>' + title + '</h3>' +
                '<div class="camp-modal-discount">-' + discount + '% ENDİRİM</div>' +
                '<input type="text" id="campClaimName" placeholder="Ad *">' +
                '<input type="text" id="campClaimSurname" placeholder="Soyad *">' +
                '<input type="tel" id="campClaimPhone" placeholder="Telefon (+994...)">' +
                '<button class="camp-modal-submit" id="campClaimSubmit"><i class="fas fa-ticket-alt"></i> Kuponu al</button>' +
                '<button class="camp-modal-cancel" onclick="this.closest(\\'.camp-modal-overlay\\').remove()">Ləğv et</button>' +
                '<p id="campClaimError" style="color:#e74c3c;font-size:0.82rem;text-align:center;margin-top:8px;"></p>' +
            '</div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
            document.getElementById('campClaimSubmit').addEventListener('click', async function() {
                var name = document.getElementById('campClaimName').value.trim();
                var surname = document.getElementById('campClaimSurname').value.trim();
                var phone = document.getElementById('campClaimPhone').value.trim();
                var errEl = document.getElementById('campClaimError');
                if (!name || !surname || !phone) { errEl.textContent = 'Bütün sahələri doldurun!'; return; }
                this.disabled = true; this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                try {
                    var res = await fetch('/api/claim-coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: campId, name: name, surname: surname, phone: phone, fingerprint: browserFingerprint }) });
                    var data = await res.json();
                    if (data.success) {
                        setCampCookie(campId, data.couponCode);
                        overlay.innerHTML = '<div class="camp-modal"><h3 style="text-align:center;color:#27ae60;"><i class="fas fa-check-circle"></i> Təbriklər!</h3><p style="text-align:center;">Sizin ' + data.discount + '% endirim kuponunuz:</p><div class="camp-success-code"><span>' + data.couponCode + '</span></div><button class="camp-copy-btn" onclick="navigator.clipboard.writeText(\\'' + data.couponCode + '\\');this.textContent=\\'Kopyalandı!\\'"><i class="fas fa-copy"></i> Kodu kopyala</button><p style="text-align:center;font-size:0.78rem;color:#999;margin-top:12px;">Bu kodu WhatsApp-da göstərin.</p><button class="camp-modal-cancel" onclick="this.closest(\\'.camp-modal-overlay\\').remove()" style="margin-top:12px;">Bağla</button></div>';
                    } else { errEl.textContent = data.error || 'Xəta'; this.disabled = false; this.innerHTML = '<i class="fas fa-ticket-alt"></i> Kuponu al'; }
                } catch(e) { errEl.textContent = 'Bağlantı xətası'; this.disabled = false; this.innerHTML = '<i class="fas fa-ticket-alt"></i> Kuponu al'; }
            });
        };
    </script>
</body>
</html>`;

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('CDN-Cache-Control', 'no-store');
        res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    } catch (err) {
        console.error('Render campaigns error:', err);
        res.status(500).send('Xəta baş verdi');
    }
};
