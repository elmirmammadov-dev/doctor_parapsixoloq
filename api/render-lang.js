const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.sahseddinimanli.com';

const LANG_META = {
    ru: {
        title: 'Шахсаддин Иманлы | Парапсихолог и Преподаватель Тантра-Йоги',
        description: 'Шахсаддин Иманлы — парапсихолог, психолог и специалист по тантра-йоге. 35+ лет опыта, 15000+ успешных сеансов. Панические атаки, стресс, семейные проблемы. Онлайн и очный приём. Баку и Нахчыван.',
        keywords: 'парапсихолог, Шахсаддин Иманлы, тантра йога, дыхательная терапия, психолог Баку, панические атаки, депрессия, чакры, развод, лечение, обследование, психолог',
        h1: 'Шахсаддин Иманлы — Парапсихолог & Психолог & Йог',
        htmlLang: 'ru',
        ogLocale: 'ru_RU'
    },
    en: {
        title: 'Shahsaddin Imanli | Parapsychologist & Tantra Yoga Instructor',
        description: 'Shahsaddin Imanli — parapsychologist, psychologist and tantra yoga specialist. 35+ years of experience, 15000+ successful sessions. Panic attacks, stress, family problems. Online and in-person appointments. Baku & Nakhchivan.',
        keywords: 'parapsychologist, Shahsaddin Imanli, tantra yoga, breath therapy, psychologist Baku, panic attacks, depression, chakras, treatment, examination, psychologist',
        h1: 'Shahsaddin Imanli — Parapsychologist & Psychologist & Yogi',
        htmlLang: 'en',
        ogLocale: 'en_US'
    },
    tr: {
        title: 'Şahseddin İmanlı | Parapsikolojist & Tantra Yoga Eğitmeni',
        description: 'Şahseddin İmanlı — parapsikolojist, psikolog ve tantra yoga uzmanı. 35+ yıllık deneyim, 15000+ başarılı seans. Panik atak, stres, aile sorunları. Online ve yüz yüze kabul. Bakü & Nahçıvan.',
        keywords: 'parapsikolojist, Şahseddin İmanlı, tantra yoga, nefes terapisi, psikolog Bakü, panik atak, depresyon, çakra, boşanma, tedavi, muayene, psikolog',
        h1: 'Şahseddin İmanlı — Parapsikolojist & Psikolog & Yogi',
        htmlLang: 'tr',
        ogLocale: 'tr_TR'
    }
};

module.exports = async (req, res) => {
    const lang = req.query.lang || 'ru';
    const meta = LANG_META[lang];

    if (!meta) {
        res.writeHead(302, { Location: '/' });
        res.end();
        return;
    }

    try {
        // Read index.html
        const htmlPath = path.join(process.cwd(), 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');

        // Read translations
        const transPath = path.join(process.cwd(), 'translations.json');
        const allTranslations = JSON.parse(fs.readFileSync(transPath, 'utf-8'));
        const t = allTranslations[lang] || {};

        // 1. Change html lang
        html = html.replace('<html lang="az">', `<html lang="${meta.htmlLang}">`);

        // 2. Change title
        html = html.replace(
            /<title>.*?<\/title>/,
            `<title>${escapeHtml(meta.title)}</title>`
        );

        // 3. Change meta description
        html = html.replace(
            /<meta name="description" content="[^"]*">/,
            `<meta name="description" content="${escapeHtml(meta.description)}">`
        );

        // 4. Change meta keywords
        html = html.replace(
            /<meta name="keywords" content="[^"]*">/,
            `<meta name="keywords" content="${escapeHtml(meta.keywords)}">`
        );

        // 5. Change canonical
        html = html.replace(
            /<link rel="canonical" href="[^"]*">/,
            `<link rel="canonical" href="${SITE_URL}/${lang}">`
        );

        // 6. Change OG tags
        html = html.replace(
            /<meta property="og:title" content="[^"]*">/,
            `<meta property="og:title" content="${escapeHtml(meta.title)}">`
        );
        html = html.replace(
            /<meta property="og:description" content="[^"]*">/,
            `<meta property="og:description" content="${escapeHtml(meta.description)}">`
        );
        html = html.replace(
            /<meta property="og:url" content="[^"]*">/,
            `<meta property="og:url" content="${SITE_URL}/${lang}">`
        );
        html = html.replace(
            /<meta property="og:locale" content="[^"]*">/,
            `<meta property="og:locale" content="${meta.ogLocale}">`
        );
        // Update og:locale:alternate - remove current lang, add az
        html = html.replace(
            `<meta property="og:locale:alternate" content="${meta.ogLocale}">`,
            `<meta property="og:locale:alternate" content="az_AZ">`
        );

        // 7. Change Twitter tags
        html = html.replace(
            /<meta name="twitter:title" content="[^"]*">/,
            `<meta name="twitter:title" content="${escapeHtml(meta.title)}">`
        );
        html = html.replace(
            /<meta name="twitter:description" content="[^"]*">/,
            `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`
        );

        // 8. Change H1
        html = html.replace(
            /<h1 class="hero-banner-h1">.*?<\/h1>/,
            `<h1 class="hero-banner-h1">${escapeHtml(meta.h1)}</h1>`
        );

        // 9. Replace all data-i18n text content
        for (const [key, value] of Object.entries(t)) {
            if (typeof value !== 'string') continue;
            // data-i18n="key">...text...</tag>
            const regex = new RegExp(
                `(data-i18n="${escapeRegex(key)}"[^>]*>)[^<]*(</)`,
                'g'
            );
            html = html.replace(regex, `$1${value}$2`);
        }

        // 10. Replace data-i18n-html content
        for (const [key, value] of Object.entries(t)) {
            if (typeof value !== 'string') continue;
            const regex = new RegExp(
                `(data-i18n-html="${escapeRegex(key)}"[^>]*>)[\\s\\S]*?(</(p|span|h1|h2|h3|h4|h5|h6|div|button|li|a))`,
                'g'
            );
            html = html.replace(regex, `$1${value}$2`);
        }

        // 11. Inject script to set language on client side
        html = html.replace(
            '</body>',
            `<script>localStorage.setItem('lang','${lang}');</script>\n</body>`
        );

        // Set cache headers
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);

    } catch (err) {
        console.error('Language render error:', err);
        res.writeHead(302, { Location: '/' });
        res.end();
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

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
