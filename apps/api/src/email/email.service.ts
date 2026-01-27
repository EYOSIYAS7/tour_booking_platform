// apps/api/src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private emailFrom: string;

  constructor(private configService: ConfigService) {
    this.emailFrom = this.configService.get<string>(
      'EMAIL_FROM',
      'Tour Booking <noreply@tourbooking.com>',
    );

    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT', 587);
    const secure = this.configService.get<boolean>('EMAIL_SECURE', false);
    const user = this.configService.get<string>('EMAIL_USER');
    const password = this.configService.get<string>('EMAIL_PASSWORD');

    if (!host || !user || !password) {
      this.logger.warn(
        '⚠️ Email configuration missing. Emails will not be sent.',
      );
      this.logger.warn(
        'Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env',
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass: password,
        },
      });

      this.logger.log('✅ Email service initialized successfully');
      this.logger.log(`Email host: ${host}:${port}`);
      this.logger.log(`Email from: ${this.emailFrom}`);

      // Verify connection
      this.verifyConnection();
    } catch (error) {
      this.logger.error('❌ Failed to initialize email service', error);
    }
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Email server connection verified');
    } catch (error) {
      this.logger.error('❌ Email server connection failed:', error.message);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not initialized. Skipping email send.',
      );
      return false;
    }

    try {
      this.logger.log(`Sending email to ${options.to}: ${options.subject}`);

      const info = await this.transporter.sendMail({
        from: this.emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      this.logger.log(`✅ Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send email to ${options.to}:`,
        error.message,
      );
      return false;
    }
  }

  // Helper to strip HTML for text version
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Booking confirmation email
  async sendBookingConfirmation(data: {
    to: string;
    userName: string;
    tourName: string;
    bookingId: string;
    numberOfParticipants: number;
    totalAmount: number;
    bookingDate: Date;
    tourStartDate: Date;
    tourEndDate: Date;
  }): Promise<boolean> {
    const html = this.getBookingConfirmationTemplate(data);

    return this.sendEmail({
      to: data.to,
      subject: `Booking Confirmation - ${data.tourName}`,
      html,
    });
  }

  // Payment success email
  async sendPaymentSuccess(data: {
    to: string;
    userName: string;
    tourName: string;
    bookingId: string;
    amount: number;
    paidAt: Date;
    transactionRef: string;
  }): Promise<boolean> {
    const html = this.getPaymentSuccessTemplate(data);

    return this.sendEmail({
      to: data.to,
      subject: `Payment Confirmed - ${data.tourName}`,
      html,
    });
  }

  // Booking cancellation email
  async sendBookingCancellation(data: {
    to: string;
    userName: string;
    tourName: string;
    bookingId: string;
    reason?: string;
    cancelledAt: Date;
  }): Promise<boolean> {
    const html = this.getBookingCancellationTemplate(data);

    return this.sendEmail({
      to: data.to,
      subject: `Booking Cancelled - ${data.tourName}`,
      html,
    });
  }

  // Email Templates

  private getBookingConfirmationTemplate(data: any): string {
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .total { font-size: 20px; font-weight: bold; color: #667eea; padding: 15px; background: #f0f4ff; border-radius: 8px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${data.userName},</p>
            
            <p>Great news! Your booking has been confirmed. We're excited to have you join us!</p>
            
            <div class="booking-details">
              <h2 style="margin-top: 0; color: #667eea;">📋 Booking Details</h2>
              
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Tour:</span>
                <span class="detail-value">${data.tourName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Participants:</span>
                <span class="detail-value">${data.numberOfParticipants}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Tour Dates:</span>
                <span class="detail-value">${new Date(data.tourStartDate).toLocaleDateString()} - ${new Date(data.tourEndDate).toLocaleDateString()}</span>
              </div>
              
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Booked On:</span>
                <span class="detail-value">${new Date(data.bookingDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div class="total">
              Total Amount: ${data.totalAmount} ETB
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This booking is pending payment. Please complete your payment to confirm your spot.
            </div>
            
            <center>
              <a href="${appUrl}/bookings/${data.bookingId}" class="button">Complete Payment →</a>
            </center>
            
            <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>Tour Booking Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Tour Booking Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPaymentSuccessTemplate(data: any): string {
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .success-badge { background: #d4edda; border: 2px solid #28a745; color: #155724; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold; }
          .payment-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${data.userName},</p>
            
            <div class="success-badge">
              🎉 Your payment has been confirmed!
            </div>
            
            <p>Thank you for your payment. Your booking is now fully confirmed and we're looking forward to seeing you!</p>
            
            <div class="payment-details">
              <h2 style="margin-top: 0; color: #28a745;">💳 Payment Details</h2>
              
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Tour:</span>
                <span class="detail-value">${data.tourName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value" style="color: #28a745; font-weight: bold;">${data.amount} ETB</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Transaction Ref:</span>
                <span class="detail-value">${data.transactionRef}</span>
              </div>
              
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">${new Date(data.paidAt).toLocaleString()}</span>
              </div>
            </div>
            
            <center>
              <a href="${appUrl}/bookings/${data.bookingId}" class="button">View Booking Details →</a>
            </center>
            
            <p style="margin-top: 30px;"><strong>What's next?</strong></p>
            <ul>
              <li>You will receive a reminder email 24 hours before your tour</li>
              <li>Please arrive 15 minutes before the scheduled start time</li>
              <li>Bring a valid ID for verification</li>
            </ul>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>Tour Booking Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Tour Booking Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getBookingCancellationTemplate(data: any): string {
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Cancelled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .cancellation-notice { background: #f8d7da; border: 2px solid #dc3545; color: #721c24; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Booking Cancelled</h1>
          </div>
          
          <div class="content">
            <p>Hi ${data.userName},</p>
            
            <div class="cancellation-notice">
              <h2 style="margin-top: 0;">Your booking has been cancelled</h2>
            </div>
            
            <p>This email confirms that your booking has been cancelled${data.reason ? ':' : '.'}</p>
            
            ${
              data.reason
                ? `
              <div class="details">
                <strong>Reason:</strong> ${data.reason}
              </div>
            `
                : ''
            }
            
            <div class="details">
              <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p><strong>Tour:</strong> ${data.tourName}</p>
              <p><strong>Cancelled On:</strong> ${new Date(data.cancelledAt).toLocaleString()}</p>
            </div>
            
            <p>If this was a paid booking, please allow 5-7 business days for the refund to process.</p>
            
            <center>
              <a href="${appUrl}/tours" class="button">Browse Other Tours →</a>
            </center>
            
            <p style="margin-top: 30px;">We're sorry to see you go. If you have any questions or concerns, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>Tour Booking Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Tour Booking Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
