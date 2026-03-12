import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface Member {
  name: string;
  email: string;
  phone: string;
}

interface TeamEmailData {
  teamId: string;
  teamName: string;
  teamLeader: Member;
  members: Member[];
  teamSize: number;
  amountPaid: number;
}

export async function sendConfirmationEmail(team: TeamEmailData) {
  // Generate QR code as base64 data URL
  const qrDataUrl = await QRCode.toDataURL(
    team.teamId,
    { width: 200, margin: 2 }
  );

  const allMembers = [team.teamLeader, ...team.members];
  const memberListHtml = allMembers
    .map((m, i) => `<li style="margin:4px 0;">${i + 1}. ${m.name} (${m.email})</li>`)
    .join('');
  const memberListPlain = allMembers
    .map((m, i) => `${i + 1}. ${m.name}`)
    .join('\n');

  const whatsappLink = process.env.WHATSAPP_LINK || '#';
  const eventDate = process.env.EVENT_DATE || 'TBA';
  const eventTime = process.env.EVENT_TIME || 'TBA';
  const eventVenue = process.env.EVENT_VENUE || 'TBA';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0a0a0a; color: #f0e6d3; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border: 1px solid #8B0000; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #8B0000 0%, #4a0000 100%); padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; color: #FFD700; letter-spacing: 3px; }
    .header p { margin: 8px 0 0; color: #f0c9c9; font-size: 14px; letter-spacing: 1px; }
    .content { padding: 32px 30px; }
    .badge { background: linear-gradient(135deg, #8B0000, #cc0000); border-radius: 8px; padding: 16px 24px; text-align: center; margin-bottom: 24px; }
    .badge .team-id { font-size: 28px; font-weight: bold; color: #FFD700; letter-spacing: 4px; }
    .badge .team-name { color: #f0c9c9; margin-top: 4px; font-size: 14px; }
    .section { margin: 20px 0; }
    .section h3 { color: #FFD700; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 6px; }
    .section ul { list-style: none; padding: 0; margin: 0; }
    .section ul li { padding: 6px 0; color: #f0e6d3; font-size: 14px; }
    .amount { font-size: 24px; font-weight: bold; color: #22c55e; }
    .qr-section { text-align: center; margin: 24px 0; }
    .qr-section img { width: 160px; height: 160px; border: 3px solid #8B0000; border-radius: 8px; }
    .qr-section p { color: #888; font-size: 12px; margin-top: 8px; }
    .cta { display: block; background: linear-gradient(135deg, #25D366, #128C7E); color: white; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 24px 0; }
    .event-details { background: #111; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .event-details p { margin: 4px 0; font-size: 14px; }
    .footer { background: #111; padding: 20px 30px; text-align: center; border-top: 1px solid #333; }
    .footer p { color: #555; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 HOUSIE OF FAME</h1>
      <p>Where every number tells a story</p>
    </div>
    <div class="content">
      <p>Hello <strong>${team.teamLeader.name}</strong>,</p>
      <p>Your team has been successfully registered for <strong>Housie of Fame</strong>! Welcome to the Red Carpet. 🎬</p>

      <div class="badge">
        <div class="team-id">${team.teamId}</div>
        <div class="team-name">${team.teamName}</div>
      </div>

      <div class="section">
        <h3>Your Squad</h3>
        <ul>${memberListHtml}</ul>
      </div>

      <div class="section">
        <h3>Amount Paid</h3>
        <p class="amount">₹${team.amountPaid}</p>
      </div>

      <div class="qr-section">
        <img src="cid:team-qr-code" alt="Team QR Code" />
        <p>Show this QR at the entry desk for quick verification</p>
      </div>

      <div class="event-details">
        <p>📅 <strong>Date:</strong> ${eventDate}</p>
        <p>⏰ <strong>Time:</strong> ${eventTime}</p>
        <p>👗 <strong>Dress Code:</strong> Red Carpet Attire</p>
        <p>📍 <strong>Venue:</strong> ${eventVenue}</p>
      </div>

      <a href="${whatsappLink}" class="cta">📱 Join Our WhatsApp Group</a>

      <p style="color:#888; font-size:13px;">Keep this email and your Team ID <strong>${team.teamId}</strong> handy on event day. Bring your printed/digital ticket.</p>
    </div>
    <div class="footer">
      <p>Organized by SQAC • Housie of Fame 2026</p>
      <p>© 2026 Housie of Fame — All rights reserved for superstars</p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `
Hello ${team.teamLeader.name},

Your team has been successfully registered for Housie of Fame!

Team ID: ${team.teamId}
Team Name: ${team.teamName}

Members:
${memberListPlain}

Amount Paid: ₹${team.amountPaid}

Event Details:
Date: ${eventDate}
Time: ${eventTime}
Dress Code: Red Carpet Attire

Join WhatsApp Group: ${whatsappLink}

Keep your Team ID ${team.teamId} handy on event day.

Organized by SQAC
Housie of Fame 2026
  `;

  // Send to all members
  const allEmails = allMembers.map((m) => m.email);

  await transporter.sendMail({
    from: `"Housie of Fame | SQAC" <${process.env.SMTP_USER}>`,
    to: allEmails.join(', '),
    subject: `Housie of Fame Registration Confirmed 🎉 — Team ${team.teamId}`,
    text: textBody,
    html: htmlBody,
    attachments: [
      {
        filename: 'qr-code.png',
        content: qrDataUrl.split('base64,')[1],
        encoding: 'base64',
        cid: 'team-qr-code',
      },
    ],
  });
}
