const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

const FIREBASE_DB_URL = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

function buildHtml(data) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr>
    <td style="background:linear-gradient(135deg,#1a3a2a,#2d5a3f);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#c5a637;font-size:24px;font-weight:800;letter-spacing:1.5px;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">&#127873; YEN&#304; KAMPAN&#304;YA!</h1>
      <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.5px;">&#350;ahs&#601;ddin &#304;manl&#305; &#8212; X&#252;susi Endirim</p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:32px 40px 16px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-size:48px;font-weight:800;padding:24px 48px;border-radius:16px;text-align:center;letter-spacing:2px;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
            -${data.discount}%
            <div style="font-size:14px;font-weight:700;letter-spacing:4px;margin-top:6px;opacity:0.95;">END&#304;R&#304;M</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 40px 8px;text-align:center;">
      <h2 style="margin:0;color:#1a3a2a;font-size:22px;font-weight:800;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.3px;">${data.title}</h2>
    </td>
  </tr>
  <tr>
    <td style="padding:4px 40px 24px;text-align:center;">
      <p style="margin:0;color:#555;font-size:15px;line-height:1.7;font-weight:400;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">${data.desc}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px;">
      <div style="height:2px;background:linear-gradient(90deg,transparent,#c5a637,transparent);"></div>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:28px 40px;">
      <a href="${data.url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#1a3a2a,#2d5a3f);color:#c5a637;font-size:16px;font-weight:700;text-decoration:none;padding:16px 52px;border-radius:12px;letter-spacing:0.8px;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
        &#10148; KAMPAN&#304;YANI G&#214;R
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f3;border-radius:12px;border-left:4px solid #c5a637;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;color:#1a3a2a;font-size:13px;line-height:1.7;font-weight:600;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
              &#128205; Kuponu &#601;ld&#601; edin v&#601; WhatsApp-da v&#601; ya canl&#305; seansda g&#246;st&#601;rin.<br>
              &#9200; Kuponlar m&#601;hduddur &#8212; t&#601;l&#601;sin!
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0 0 8px;color:#999;font-size:12px;font-weight:600;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">Bu mesaj kampaniya abun&#601;liyiniz vasit&#601;sil&#601; g&#246;nd&#601;rilib.</p>
      <p style="margin:0;color:#bbb;font-size:11px;font-weight:600;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">Parapsixoloq &#350;ahs&#601;ddin &#304;manl&#305;</p>
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

    const { title, desc, discount, url } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (!gmailUser || !gmailPass) {
        return res.status(500).json({ error: 'Gmail credentials not configured' });
    }

    try {
        // Get subscribers from Firebase
        const subsRes = await fetch(`${FIREBASE_DB_URL}/campaign_subscribers.json`);
        const subsData = await subsRes.json();

        if (!subsData) {
            return res.status(200).json({ sent: 0, failed: 0, message: 'No subscribers' });
        }

        const emails = Object.values(subsData).map(s => s.email).filter(Boolean);
        if (!emails.length) {
            return res.status(200).json({ sent: 0, failed: 0, message: 'No subscriber emails' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: gmailUser, pass: gmailPass }
        });

        const campaignUrl = url || 'https://hekim2026yenidizayn.vercel.app/kampaniyalar';
        const html = buildHtml({ title, desc: desc || '', discount: discount || '', url: campaignUrl });

        let sent = 0, failed = 0;
        const results = [];

        for (const email of emails) {
            try {
                await transporter.sendMail({
                    from: `"Şahsəddin İmanlı" <${gmailUser}>`,
                    to: email,
                    subject: `🎁 Yeni Kampaniya: ${title} — ${discount}% Endirim!`,
                    html: html
                });
                sent++;
                results.push({ email, status: 'sent' });
            } catch (err) {
                failed++;
                results.push({ email, status: 'failed', error: err.message });
            }
        }

        return res.status(200).json({ sent, failed, total: emails.length, results });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
