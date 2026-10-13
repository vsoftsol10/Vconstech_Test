// import nodemailer from 'nodemailer';

// let transporter = null;
// let transporterKey = '';

// const getSmtpConfig = () => ({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secure: process.env.SMTP_SECURE === 'true',
//   user: process.env.SMTP_USER,
//   pass: process.env.SMTP_PASS,
//   fromName: process.env.SMTP_FROM_NAME,
//   fromEmail: process.env.SMTP_FROM_EMAIL,
// });

// const getTransporter = () => {
//   const config = getSmtpConfig();
//   if (!config.host || !config.port || !config.user || !config.pass || !config.fromName || !config.fromEmail) {
//     const error = new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, and SMTP_FROM_EMAIL are required to send email');
//     error.code = 'SMTP_CONFIG_MISSING';
//     throw error;
//   }

//   const nextKey = `${config.host}:${config.port}:${config.secure}:${config.user}`;
//   if (!transporter || transporterKey !== nextKey) {
//     transporter = nodemailer.createTransport({
//       host: config.host,
//       port: config.port,
//       secure: config.secure,
//       auth: {
//         user: config.user,
//         pass: config.pass,
//       },
//     });
//     transporterKey = nextKey;
//   }

//   return {
//     transporter,
//     from: `"${config.fromName}" <${config.fromEmail}>`,
//   };
// };

// export async function sendEmail({ to, subject, html }) {
//   try {
//     const mailer = getTransporter();
//     await mailer.transporter.sendMail({
//       from: mailer.from,
//       to,
//       subject,
//       html,
//     });

//     console.log(`[Email] Sent to ${to}`);
//     return { success: true, to, subject };
//   } catch (err) {
//     console.error(`[Email] Failed to ${to}:`, err.message);
//     return {
//       success: false,
//       to,
//       subject,
//       error: err.message,
//       code: err.code,
//     };
//   }
// }

// Brevo HTTP API version — sends over HTTPS (port 443) instead of SMTP.
// Use this if SMTP ports (587/465) are blocked on your hosting provider (e.g. Render).

const getBrevoConfig = () => ({
  apiKey: process.env.BREVO_API_KEY, // from Brevo dashboard > SMTP & API > API Keys (NOT the SMTP password)
  fromName: process.env.SMTP_FROM_NAME,
  fromEmail: process.env.SMTP_FROM_EMAIL,
});

export async function sendEmail({ to, subject, html }) {
  const config = getBrevoConfig();

  if (!config.apiKey || !config.fromName || !config.fromEmail) {
    const error = new Error('BREVO_API_KEY, SMTP_FROM_NAME, and SMTP_FROM_EMAIL are required to send email');
    error.code = 'BREVO_CONFIG_MISSING';
    console.error(`[Email] Failed to ${to}:`, error.message);
    return { success: false, to, subject, error: error.message, code: error.code };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': config.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: config.fromName, email: config.fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Brevo returns { code, message } on failure
      const err = new Error(data.message || `Brevo API responded with status ${response.status}`);
      err.code = data.code || `HTTP_${response.status}`;
      throw err;
    }

    console.log(`[Email] Sent to ${to}`, data.messageId ? `(messageId: ${data.messageId})` : '');
    return { success: true, to, subject, messageId: data.messageId };
  } catch (err) {
    console.error(`[Email] Failed to ${to}:`, err.message);
    return {
      success: false,
      to,
      subject,
      error: err.message,
      code: err.code,
    };
  }
}