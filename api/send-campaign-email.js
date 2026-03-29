const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

const TEXTS = {
    az: {
        header: '&#127873; YEN&#304; KAMPAN&#304;YA!',
        subtitle: '&#350;ahs&#601;ddin &#304;manl&#305; &#8212; X&#252;susi Endirim',
        discount: 'END&#304;R&#304;M',
        button: '&#10148; KAMPAN&#304;YANI G&#214;R',
        info1: '&#128205; Kuponu &#601;ld&#601; edin v&#601; WhatsApp-da v&#601; ya canl&#305; seansda g&#246;st&#601;rin.',
        info2: '&#9200; Kuponlar m&#601;hduddur &#8212; t&#601;l&#601;sin!',
        footer: 'Bu mesaj kampaniya abun&#601;liyiniz vasit&#601;sil&#601; g&#246;nd&#601;rilib.',
        author: 'Parapsixoloq &#350;ahs&#601;ddin &#304;manl&#305;',
        subject: 'Yeni Kampaniya'
    },
    ru: {
        header: '&#127873; НОВАЯ АКЦИЯ!',
        subtitle: 'Шахсаддин Иманлы — Специальная Скидка',
        discount: 'СКИДКА',
        button: '&#10148; ПОСМОТРЕТЬ АКЦИЮ',
        info1: '&#128205; Получите купон и покажите его в WhatsApp или на очном сеансе.',
        info2: '&#9200; Количество купонов ограничено — торопитесь!',
        footer: 'Это сообщение отправлено в рамках вашей подписки на акции.',
        author: 'Парапсихолог Шахсаддин Иманлы',
        subject: 'Новая Акция'
    },
    en: {
        header: '&#127873; NEW CAMPAIGN!',
        subtitle: 'Shahsaddin Imanli — Special Discount',
        discount: 'DISCOUNT',
        button: '&#10148; VIEW CAMPAIGN',
        info1: '&#128205; Get your coupon and show it on WhatsApp or during a live session.',
        info2: '&#9200; Coupons are limited — hurry up!',
        footer: 'This message was sent as part of your campaign subscription.',
        author: 'Parapsychologist Shahsaddin Imanli',
        subject: 'New Campaign'
    },
    tr: {
        header: '&#127873; YEN&#304; KAMPANYA!',
        subtitle: '&#350;ahseddin &#304;manl&#305; — &#214;zel &#304;ndirim',
        discount: '&#304;ND&#304;R&#304;M',
        button: '&#10148; KAMPANYAYI G&#214;R',
        info1: '&#128205; Kuponu al&#305;n ve WhatsApp\'ta veya canl&#305; seansta g&#246;sterin.',
        info2: '&#9200; Kuponlar s&#305;n&#305;rl&#305;d&#305;r — acele edin!',
        footer: 'Bu mesaj kampanya aboneli&#287;iniz arac&#305;l&#305;&#287;&#305;yla g&#246;nderilmi&#351;tir.',
        author: 'Parapsikoloji Uzman&#305; &#350;ahseddin &#304;manl&#305;',
        subject: 'Yeni Kampanya'
    }
};

function buildHtml(data, lang) {
    const t = TEXTS[lang] || TEXTS.az;
    const font = "'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif";
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:${font};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr>
    <td style="background:linear-gradient(135deg,#1a3a2a,#2d5a3f);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#c5a637;font-size:24px;font-weight:800;letter-spacing:1.5px;font-family:${font};">${t.header}</h1>
      <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;font-family:${font};letter-spacing:0.5px;">${t.subtitle}</p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:32px 40px 16px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-size:48px;font-weight:800;padding:24px 48px;border-radius:16px;text-align:center;letter-spacing:2px;font-family:${font};">
            -${data.discount}%
            <div style="font-size:14px;font-weight:700;letter-spacing:4px;margin-top:6px;opacity:0.95;">${t.discount}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 40px 8px;text-align:center;">
      <h2 style="margin:0;color:#1a3a2a;font-size:22px;font-weight:800;font-family:${font};letter-spacing:0.3px;">${data.title}</h2>
    </td>
  </tr>
  <tr>
    <td style="padding:4px 40px 24px;text-align:center;">
      <p style="margin:0;color:#555;font-size:15px;line-height:1.7;font-weight:400;font-family:${font};">${data.desc}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px;">
      <div style="height:2px;background:linear-gradient(90deg,transparent,#c5a637,transparent);"></div>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:28px 40px;">
      <a href="${data.url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#1a3a2a,#2d5a3f);color:#c5a637;font-size:16px;font-weight:700;text-decoration:none;padding:16px 52px;border-radius:12px;letter-spacing:0.8px;font-family:${font};">
        ${t.button}
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f3;border-radius:12px;border-left:4px solid #c5a637;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;color:#1a3a2a;font-size:13px;line-height:1.7;font-weight:600;font-family:${font};">
              ${t.info1}<br>
              ${t.info2}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0 0 8px;color:#999;font-size:12px;font-weight:600;font-family:${font};">${t.footer}</p>
      <p style="margin:0;color:#bbb;font-size:11px;font-weight:600;font-family:${font};">${t.author}</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body;
    if (!body.title_az && !body.title_ru && !body.title_en && !body.title_tr) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (!gmailUser || !gmailPass) {
        return res.status(500).json({ error: 'Gmail credentials not configured' });
    }

    try {
        const subsRes = await fetch(`${FIREBASE_DB_URL}/campaign_subscribers.json`);
        const subsData = await subsRes.json();

        if (!subsData) {
            return res.status(200).json({ sent: 0, failed: 0, message: 'No subscribers' });
        }

        const subscribers = Object.values(subsData).filter(s => s.email);
        if (!subscribers.length) {
            return res.status(200).json({ sent: 0, failed: 0, message: 'No subscriber emails' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: gmailUser, pass: gmailPass }
        });

        const campaignUrl = body.url || 'https://hekim2026yenidizayn.vercel.app/kampaniyalar';
        let sent = 0, failed = 0;
        const results = [];

        for (const sub of subscribers) {
            const lang = sub.lang || 'az';
            const t = TEXTS[lang] || TEXTS.az;
            const title = body['title_' + lang] || body.title_az || '';
            const desc = body['desc_' + lang] || body.desc_az || '';

            const html = buildHtml({ title, desc, discount: body.discount || '', url: campaignUrl }, lang);

            try {
                await transporter.sendMail({
                    from: `"Şahsəddin İmanlı" <${gmailUser}>`,
                    to: sub.email,
                    subject: `🎁 ${t.subject}: ${title} — ${body.discount}%!`,
                    html: html
                });
                sent++;
                results.push({ email: sub.email, status: 'sent' });
            } catch (err) {
                failed++;
                results.push({ email: sub.email, status: 'failed', error: err.message });
            }
        }

        return res.status(200).json({ sent, failed, total: subscribers.length, results });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
