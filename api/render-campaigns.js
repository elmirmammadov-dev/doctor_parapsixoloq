const fetch = require('node-fetch');

const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async (req, res) => {
    try {
        const cookieLang = ((req.headers.cookie || '').match(/(?:^|; )lang=([a-z]{2})/) || [])[1];
        const lang = req.query.lang || cookieLang || 'az';
        const L = (c, field) => c[field + '_' + lang] || c[field] || '';

        const campRes = await fetch(`${FIREBASE_DB_URL}/campaigns.json`);
        const campData = await campRes.json();

        const campaigns = campData ? Object.entries(campData)
            .map(([id, c]) => ({ id, ...c }))
            .filter(c => c.active !== false)
            .filter(c => c['title_' + lang] && c['title_' + lang].trim() !== '')
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : [];

        const now = Date.now();
        const siteUrl = 'https://www.sahseddinimanli.com';

        // JSON-LD for SEO
        const jsonLdItems = campaigns.map(c => ({
            "@type": "Offer",
            "name": escapeHtml(L(c, 'title')),
            "description": escapeHtml(L(c, 'desc')),
            "discount": c.discountPercent + '%',
            "validThrough": c.endTimestamp ? new Date(c.endTimestamp).toISOString() : '',
            "url": siteUrl + '/kampaniyalar',
            "seller": { "@type": "Person", "name": "Şahsəddin İmanlı" }
        }));

        const CARD_T = {
            az: { claimed: 'kupon alınıb', left: 'qalıb', claimBtn: 'Kuponu al', ended: 'BİTİB' },
            ru: { claimed: 'купонов получено', left: 'осталось', claimBtn: 'Получить купон', ended: 'ЗАВЕРШЕНО' },
            en: { claimed: 'coupons claimed', left: 'left', claimBtn: 'Get coupon', ended: 'ENDED' },
            tr: { claimed: 'kupon alındı', left: 'kaldı', claimBtn: 'Kuponu al', ended: 'BİTTİ' }
        };
        const ct = CARD_T[lang] || CARD_T.az;

        const campCardsHtml = campaigns.length > 0 ? campaigns.map(c => {
            const expired = (c.endTimestamp && now > c.endTimestamp) || ((c.claimedCount || 0) >= c.maxCoupons);
            const claimed = c.claimedCount || 0;
            const max = c.maxCoupons || 1;
            const pct = Math.min(100, Math.round((claimed / max) * 100));

            return `<div class="camp-archive-card" style="background:#fff;border-radius:16px;overflow:hidden;border:2px solid ${expired ? '#ccc' : '#1a3a2a'};margin-bottom:20px;${expired ? 'opacity:0.7;' : ''}position:relative;">
                ${expired ? `<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:2;border-radius:14px;"><span style="background:#e74c3c;color:#fff;padding:10px 28px;border-radius:10px;font-weight:800;font-size:1.1rem;letter-spacing:1px;">${ct.ended}</span></div>` : ''}
                ${c.image ? `<div style="width:100%;aspect-ratio:3/1;background-image:url(${escapeHtml(c.image)});background-position:${c.coverPos || '50% 50%'};background-size:${(c.coverZoom || 1) <= 1 ? 'cover' : ((c.coverZoom || 1) * 100) + '%'};background-repeat:no-repeat;position:relative;">
                    <div style="position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-size:1.1rem;font-weight:800;padding:6px 14px;border-radius:10px;box-shadow:0 3px 12px rgba(231,76,60,0.5);">-${c.discountPercent}%</div>
                </div>` : ''}
                <div style="padding:16px;">
                    <h3 style="font-size:1rem;font-weight:700;margin:0 0 8px;">${escapeHtml(L(c, 'title'))}</h3>
                    ${L(c, 'desc') ? `<p style="font-size:0.85rem;color:#666;margin:0 0 12px;line-height:1.5;">${escapeHtml(L(c, 'desc'))}</p>` : ''}
                    <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:#999;">
                        <span>${claimed} / ${max} ${ct.claimed}</span>
                        <span>${max - claimed} ${ct.left}</span>
                    </div>
                    <div style="height:6px;background:#eee;border-radius:3px;margin:6px 0 12px;overflow:hidden;">
                        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#e74c3c,#c5a637);border-radius:3px;"></div>
                    </div>
                    ${!expired ? `<button class="camp-claim-btn" onclick="openCampClaimModal('${c.id}','${escapeHtml(L(c, 'title')).replace(/'/g, "\\'")}',${c.discountPercent})" style="width:100%;padding:10px;border:none;border-radius:10px;background:#1a3a2a;color:#fff;font-weight:700;font-size:0.88rem;cursor:pointer;">
                        <i class="fas fa-ticket-alt"></i> ${ct.claimBtn}
                    </button>` : ''}
                </div>
            </div>`;
        }).join('') : '<p style="text-align:center;color:#999;padding:40px 0;">' + ({az:'Hazırda aktiv kampaniya yoxdur.',ru:'В настоящее время нет активных акций.',en:'No active campaigns at the moment.',tr:'Şu anda aktif kampanya yok.'}[lang] || 'Hazırda aktiv kampaniya yoxdur.') + '</p>';

        const META = {
            az: { title: 'Kampaniyalar | Şahsəddin İmanlı', desc: 'Şahsəddin İmanlının xüsusi endirim kampaniyaları. Kupon alın və endirimdən yararlanın.', keywords: 'kampaniya, endirim, kupon, Şahsəddin İmanlı, parapsixologiya', h1: 'Kampaniyalar', subtitle: 'Xüsusi endirim kuponları. Kuponu alın, WhatsApp-da və ya canlı seansda göstərin.' },
            ru: { title: 'Акции | Шахсаддин Иманлы', desc: 'Специальные скидочные акции Шахсаддина Иманлы. Получите купон и воспользуйтесь скидкой.', keywords: 'акция, скидка, купон, Шахсаддин Иманлы, парапсихология', h1: 'Акции', subtitle: 'Специальные скидочные купоны. Получите купон и покажите в WhatsApp или на сеансе.' },
            en: { title: 'Campaigns | Shahsaddin Imanli', desc: 'Special discount campaigns by Shahsaddin Imanli. Get your coupon and enjoy the discount.', keywords: 'campaign, discount, coupon, Shahsaddin Imanli, parapsychology', h1: 'Campaigns', subtitle: 'Special discount coupons. Get your coupon and show it on WhatsApp or during a live session.' },
            tr: { title: 'Kampanyalar | Şahseddin İmanlı', desc: 'Şahseddin İmanlının özel indirim kampanyaları. Kupon alın ve indirimden yararlanın.', keywords: 'kampanya, indirim, kupon, Şahseddin İmanlı, parapsikoloji', h1: 'Kampanyalar', subtitle: 'Özel indirim kuponları. Kuponu alın, WhatsApp\'ta veya canlı seansta gösterin.' }
        };
        const meta = META[lang] || META.az;

        const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${meta.title}</title>
    <meta name="description" content="${meta.desc}">
    <meta name="keywords" content="${meta.keywords}">
    <link rel="canonical" href="${siteUrl}/${lang}/kampaniyalar">
    <link rel="alternate" hreflang="az" href="${siteUrl}/az/kampaniyalar">
    <link rel="alternate" hreflang="ru" href="${siteUrl}/ru/kampaniyalar">
    <link rel="alternate" hreflang="en" href="${siteUrl}/en/kampaniyalar">
    <link rel="alternate" hreflang="tr" href="${siteUrl}/tr/kampaniyalar">
    <link rel="alternate" hreflang="x-default" href="${siteUrl}/az/kampaniyalar">
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.desc}">
    <meta property="og:url" content="${siteUrl}/${lang}/kampaniyalar">
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
            <a href="/" style="color:var(--gold);text-decoration:none;font-weight:600;font-size:0.9rem;"><i class="fas fa-arrow-left"></i> ${{az:'Ana Səhifə',ru:'Главная',en:'Home',tr:'Ana Sayfa'}[lang] || 'Ana Səhifə'}</a>
        </div>
    </nav>
    <main style="padding:100px 0 60px;">
        <div class="container" style="max-width:700px;">
            <h1 style="font-family:'Montserrat',sans-serif;font-size:1.8rem;font-weight:800;margin-bottom:8px;">${meta.h1}</h1>
            <p style="color:#666;margin-bottom:32px;">${meta.subtitle}</p>
            ${campCardsHtml}
        </div>
    </main>
    <script>
        (function(){
            var path = window.location.pathname;
            if (path === '/kampaniyalar') {
                var m = document.cookie.match(/(?:^|; )lang=([a-z]{2})/);
                var savedLang = m ? m[1] : 'az';
                window.location.replace('/' + savedLang + '/kampaniyalar');
            }
        })();
    </script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
    <script src="/style.css"></script>
    <script>
        function setCampCookie(id,v){var d=new Date();d.setTime(d.getTime()+365*24*60*60*1000);document.cookie='camp_'+id+'='+encodeURIComponent(v)+';expires='+d.toUTCString()+';path=/;SameSite=Lax';}
        function getCampCookie(id){var n='camp_'+id+'=',p=document.cookie.split(';');for(var i=0;i<p.length;i++){var c=p[i].trim();if(c.indexOf(n)===0)return decodeURIComponent(c.substring(n.length));}return null;}
        function getBrowserFingerprint(){var c=document.createElement('canvas'),x=c.getContext('2d');x.textBaseline='top';x.font='14px Arial';x.fillText('fingerprint',2,2);var r=[navigator.userAgent,navigator.language,screen.width+'x'+screen.height,screen.colorDepth,new Date().getTimezoneOffset(),navigator.hardwareConcurrency||0,navigator.deviceMemory||0,navigator.platform||'',c.toDataURL()].join('|');var h=0;for(var i=0;i<r.length;i++){h=((h<<5)-h)+r.charCodeAt(i);h=h&h;}return 'fp_'+Math.abs(h).toString(36);}
        var browserFingerprint=getBrowserFingerprint();
        // Claim modal translations
        var MT = {
            az: { alreadyClaimed:'Bu kampaniyadan artıq kupon almısınız.', discount:'ENDİRİM', namePh:'Ad *', surnamePh:'Soyad *', phonePh:'Telefon (+994...)', claimBtn:'Kuponu al', cancel:'Ləğv et', fillAll:'Bütün sahələri doldurun!', congrats:'Təbriklər!', yourCoupon:'Sizin endirim kuponunuz:', copyBtn:'Kodu kopyala', copied:'Kopyalandı!', instructions:'Endirimi əldə etmək üçün bu kodu WhatsApp-da Şahsəddin İmanlıya göndərin və ya canlı seans zamanı telefonda göstərin.', close:'Bağla', connErr:'Bağlantı xətası', error:'Xəta' },
            ru: { alreadyClaimed:'Вы уже получили купон из этой акции.', discount:'СКИДКА', namePh:'Имя *', surnamePh:'Фамилия *', phonePh:'Телефон (+994...)', claimBtn:'Получить купон', cancel:'Отмена', fillAll:'Заполните все поля!', congrats:'Поздравляем!', yourCoupon:'Ваш купон на скидку:', copyBtn:'Скопировать код', copied:'Скопировано!', instructions:'Чтобы получить скидку, отправьте этот код Шахсаддину Иманлы в WhatsApp или покажите на очном сеансе.', close:'Закрыть', connErr:'Ошибка соединения', error:'Ошибка' },
            en: { alreadyClaimed:'You have already claimed a coupon from this campaign.', discount:'DISCOUNT', namePh:'Name *', surnamePh:'Surname *', phonePh:'Phone (+994...)', claimBtn:'Get coupon', cancel:'Cancel', fillAll:'Please fill in all fields!', congrats:'Congratulations!', yourCoupon:'Your discount coupon:', copyBtn:'Copy code', copied:'Copied!', instructions:'To get the discount, send this code to Shahsaddin Imanli on WhatsApp or show it during a live session.', close:'Close', connErr:'Connection error', error:'Error' },
            tr: { alreadyClaimed:'Bu kampanyadan zaten kupon aldınız.', discount:'İNDİRİM', namePh:'Ad *', surnamePh:'Soyad *', phonePh:'Telefon (+994...)', claimBtn:'Kuponu al', cancel:'İptal', fillAll:'Tüm alanları doldurun!', congrats:'Tebrikler!', yourCoupon:'İndirim kuponunuz:', copyBtn:'Kodu kopyala', copied:'Kopyalandı!', instructions:'İndirimi almak için bu kodu WhatsApp\'ta Şahseddin İmanlı\'ya gönderin veya canlı seansta gösterin.', close:'Kapat', connErr:'Bağlantı hatası', error:'Hata' }
        };
        var mt = MT['${lang}'] || MT.az;

        // Claim modal
        window.openCampClaimModal = function(campId, title, discount) {
            if (getCampCookie(campId)) { alert(mt.alreadyClaimed); return; }
            var overlay = document.createElement('div');
            overlay.className = 'camp-modal-overlay';
            overlay.innerHTML = '<div class="camp-modal">' +
                '<h3>' + title + '</h3>' +
                '<div class="camp-modal-discount">-' + discount + '% ' + mt.discount + '</div>' +
                '<input type="text" id="campClaimName" placeholder="' + mt.namePh + '">' +
                '<input type="text" id="campClaimSurname" placeholder="' + mt.surnamePh + '">' +
                '<input type="tel" id="campClaimPhone" placeholder="' + mt.phonePh + '">' +
                '<button class="camp-modal-submit" id="campClaimSubmit"><i class="fas fa-ticket-alt"></i> ' + mt.claimBtn + '</button>' +
                '<button class="camp-modal-cancel" onclick="this.closest(\\'.camp-modal-overlay\\').remove()">' + mt.cancel + '</button>' +
                '<p id="campClaimError" style="color:#e74c3c;font-size:0.82rem;text-align:center;margin-top:8px;"></p>' +
            '</div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
            document.getElementById('campClaimSubmit').addEventListener('click', async function() {
                var name = document.getElementById('campClaimName').value.trim();
                var surname = document.getElementById('campClaimSurname').value.trim();
                var phone = document.getElementById('campClaimPhone').value.trim();
                var errEl = document.getElementById('campClaimError');
                if (!name || !surname || !phone) { errEl.textContent = mt.fillAll; return; }
                this.disabled = true; this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                try {
                    var res = await fetch('/api/claim-coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: campId, name: name, surname: surname, phone: phone, fingerprint: browserFingerprint, lang: '${lang}' }) });
                    var data = await res.json();
                    if (data.success) {
                        setCampCookie(campId, data.couponCode);
                        overlay.innerHTML = '<div class="camp-modal"><h3 style="text-align:center;color:#27ae60;"><i class="fas fa-check-circle"></i> ' + mt.congrats + '</h3><p style="text-align:center;">' + mt.yourCoupon + '</p><div class="camp-success-code"><span>' + data.couponCode + '</span></div><button class="camp-copy-btn" onclick="navigator.clipboard.writeText(\\'' + data.couponCode + '\\');this.textContent=\\'' + mt.copied + '\\'"><i class="fas fa-copy"></i> ' + mt.copyBtn + '</button><p style="text-align:center;font-size:0.78rem;color:#999;margin-top:12px;">' + mt.instructions + '</p><button class="camp-modal-cancel" onclick="this.closest(\\'.camp-modal-overlay\\').remove()" style="margin-top:12px;">' + mt.close + '</button></div>';
                    } else { errEl.textContent = data.error || mt.error; this.disabled = false; this.innerHTML = '<i class="fas fa-ticket-alt"></i> ' + mt.claimBtn; }
                } catch(e) { errEl.textContent = mt.connErr; this.disabled = false; this.innerHTML = '<i class="fas fa-ticket-alt"></i> ' + mt.claimBtn; }
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
