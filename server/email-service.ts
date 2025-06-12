import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface ClientMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

class EmailMessagingService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure with Gmail/Outlook/SMTP settings
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMessageToClient(data: ClientMessage): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Remodra" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: data.subject,
        html: this.generateClientEmailTemplate(data),
        replyTo: process.env.BUSINESS_EMAIL || process.env.SMTP_USER,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  private generateClientEmailTemplate(data: ClientMessage): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .message { line-height: 1.6; margin-bottom: 20px; }
          .reply-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Remodra</h1>
            <p>Professional Remodeling Services</p>
          </div>
          <div class="content">
            <div class="message">
              ${data.html}
            </div>
            <div class="reply-info">
              <strong>To reply:</strong> Simply respond to this email and your message will be sent directly to your contractor.
            </div>
          </div>
          <div class="footer">
            <p>This message was sent through the Remodra client portal.</p>
            <p>© 2025 Remodra. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // For SMS integration (optional)
  async sendSMSNotification(phone: string, message: string): Promise<boolean> {
    // Would require Twilio integration
    console.log(`SMS to ${phone}: ${message}`);
    return true;
  }
}

export const emailService = new EmailMessagingService();