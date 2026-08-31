import axios from 'axios';

export interface EmailOptions {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export const sendBrevoEmail = async (options: EmailOptions): Promise<boolean> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@banshidharpoultry.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'BANSHIDHAR POULTRY';

  if (!apiKey) {
    console.log('\n================ [EMAIL SIMULATION (BREVO_API_KEY NOT SET)] ================');
    console.log(`To: ${options.toName} <${options.toEmail}>`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Content:\n${options.htmlContent}`);
    console.log('=============================================================================\n');
    return true;
  }

  try {
    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: options.toEmail, name: options.toName }],
      subject: options.subject,
      htmlContent: options.htmlContent
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json'
      }
    });

    return response.status === 201 || response.status === 200;
  } catch (error: any) {
    console.error('[EmailService] Brevo sending failed:', error?.response?.data || error.message);
    return false;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetUrl: string
): Promise<boolean> => {
  const safeName = name.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character] as string);
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e40af, #2563eb); color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">BANSHIDHAR POULTRY</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Password Reset Request / पासवर्ड रीसेट अनुरोध</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        <p style="font-size: 16px;">Hello <strong>${safeName}</strong>,</p>
        <p>We received a request to reset your password for your Banshidhar Poultry account. Click the button below to set a new password:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Reset Password / पासवर्ड बदलें
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">This link is valid for 15 minutes only. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Banshidhar Poultry &middot; Complete Poultry Management Solutions</p>
      </div>
    </div>
  `;

  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Password Reset Request - Banshidhar Poultry',
    htmlContent
  });
};
