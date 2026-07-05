import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory array to store inquiries for reference
const inquiries = [];

app.post('/api/inquiry', async (req, res) => {
  const { name, phone, email, interest, message } = req.body;

  if (!name || !phone || !email || !interest || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const newInquiry = {
    id: Date.now(),
    name,
    phone,
    email,
    interest,
    message,
    timestamp: new Date().toISOString()
  };

  inquiries.push(newInquiry);
  console.log('New Inquiry Received:', newInquiry);

  // Check if SMTP is configured
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, INQUIRY_TO_EMAIL } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && INQUIRY_TO_EMAIL) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10),
        secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"${name}" <${email}>`,
        to: INQUIRY_TO_EMAIL,
        subject: `[미래코칭경영원] 새로운 교육 문의 - ${name} (${interest})`,
        text: `
[미래코칭경영원 새로운 문의 접수]
이름: ${name}
연락처: ${phone}
이메일: ${email}
관심분야: ${interest}

[문의내용]
${message}
        `,
        html: `
<h3>[미래코칭경영원 새로운 문의 접수]</h3>
<p><strong>이름:</strong> ${name}</p>
<p><strong>연락처:</strong> ${phone}</p>
<p><strong>이메일:</strong> ${email}</p>
<p><strong>관심분야:</strong> ${interest}</p>
<br/>
<p><strong>[문의내용]</strong></p>
<p>${message.replace(/\n/g, '<br/>')}</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully for inquiry:', name);
    } catch (error) {
      console.error('Failed to send SMTP email:', error);
      // We still return success: true because the inquiry was saved in-memory and logged,
      // preventing the front-end from getting a critical error due to misconfigured/unset SMTP.
    }
  } else {
    console.log('SMTP is not configured. Email notification skipped (Inquiry saved in-memory).');
  }

  return res.status(200).json({ success: true, message: 'Inquiry saved successfully.' });
});

// Serve static images and index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Serve image assets explicitly to prevent serving source files
const assets = ['baek-seonghui.jpg', 'choi-yonggyun.jpg', 'park-sehwan.jpg', 'shin-seungsik.jpg'];
assets.forEach(asset => {
  app.get(`/${asset}`, (req, res) => {
    res.sendFile(path.join(process.cwd(), asset));
  });
});

// Catch-all route to serve index.html for SPA-style behaviors (or redirect to home)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
