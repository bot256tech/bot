/**
 * AGRICHAIN 360™ — SMS Notification Service
 * 
 * Uses Africa's Talking API for SMS delivery.
 * Falls back to logging in development if API key is not set.
 */

const logger = require('../config/logger');

let atClient = null;

function getClient() {
  if (atClient) return atClient;

  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;

  if (!apiKey || apiKey === '[YOUR_API_KEY]' || apiKey === 'your_api_key') {
    logger.warn('Africa\'s Talking API key not configured. SMS will be logged only.');
    return null;
  }

  try {
    const AfricasTalking = require('africastalking');
    atClient = AfricasTalking({ apiKey, username });
    return atClient;
  } catch (err) {
    logger.error('Failed to initialize Africa\'s Talking client', { error: err.message });
    return null;
  }
}

class NotificationService {
  /**
   * Send SMS to a single recipient
   */
  static async sendSMS(phone, message) {
    if (!phone || !message) {
      throw new Error('Phone number and message are required');
    }

    // Normalize phone number to international format
    const normalizedPhone = NotificationService.normalizePhone(phone);

    const client = getClient();

    if (!client) {
      // Development mode: log the SMS instead of sending
      logger.info('SMS (dev mode)', { phone: normalizedPhone, message });
      return { success: true, dev_mode: true, phone: normalizedPhone, message };
    }

    try {
      const result = await client.SMS.send({
        to: [normalizedPhone],
        message: message,
        from: process.env.SMS_SENDER_ID || 'AGRICHAIN'
      });

      logger.info('SMS sent successfully', {
        phone: normalizedPhone,
        messageId: result.SMSMessageData ? result.SMSMessageData.MessageId : null,
        cost: result.SMSMessageData ? result.SMSMessageData.TotalCost : null
      });

      return { success: true, data: result };
    } catch (error) {
      logger.error('SMS send failed', {
        phone: normalizedPhone,
        error: error.message
      });
      throw new Error(`SMS delivery failed: ${error.message}`);
    }
  }

  /**
   * Normalize Ugandan phone numbers to +256 format
   */
  static normalizePhone(phone) {
    let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');

    if (cleaned.startsWith('+256')) return cleaned;
    if (cleaned.startsWith('256')) return '+' + cleaned;
    if (cleaned.startsWith('0')) return '+256' + cleaned.substring(1);
    if (cleaned.startsWith('7') || cleaned.startsWith('3')) return '+256' + cleaned;

    return cleaned;
  }

  // ─────────────────────────────────────────────────────
  // PRE-BUILT NOTIFICATION TEMPLATES
  // ─────────────────────────────────────────────────────

  static async notifyBookingCreated(booking, farmerPhone) {
    const message = `AGRICHAIN 360: Your booking #${booking.id} for ${booking.service_type} has been submitted. You will be notified when the partner confirms. Ref: ${booking.id}`;
    return await this.sendSMS(farmerPhone, message);
  }

  static async notifyBookingConfirmed(booking, farmerPhone) {
    const date = booking.scheduled_date
      ? new Date(booking.scheduled_date).toLocaleDateString('en-UG')
      : 'TBD';
    const message = `AGRICHAIN 360: Your ${booking.service_type} booking #${booking.id} is CONFIRMED for ${date}. Contact your service partner for details.`;
    return await this.sendSMS(farmerPhone, message);
  }

  static async notifyBookingCompleted(booking, farmerPhone) {
    const message = `AGRICHAIN 360: Your booking #${booking.id} has been completed. Thank you for using AGRICHAIN 360.`;
    return await this.sendSMS(farmerPhone, message);
  }

  static async notifyPaymentSuccess(payment, userPhone) {
    const message = `AGRICHAIN 360: Payment of UGX ${payment.amount.toLocaleString()} received successfully. Transaction: ${payment.transaction_id || payment.id}. Thank you!`;
    return await this.sendSMS(userPhone, message);
  }

  static async notifyPaymentFailed(payment, userPhone) {
    const message = `AGRICHAIN 360: Your payment of UGX ${payment.amount.toLocaleString()} failed. Please try again or contact support.`;
    return await this.sendSMS(userPhone, message);
  }

  static async notifyPassportIssued(passport, farmerPhone) {
    const grade = passport.quality_grade ? `Grade: ${passport.quality_grade}` : 'Pending verification';
    const message = `AGRICHAIN 360: Quality Passport issued for batch ${passport.batch_number}. ${grade}. Verify: agrichain360.com/passport/${passport.batch_number}`;
    return await this.sendSMS(farmerPhone, message);
  }

  static async notifyPassportVerified(passport, farmerPhone) {
    const message = `AGRICHAIN 360: Your batch ${passport.batch_number} has been verified. Grade: ${passport.quality_grade}. Moisture: ${passport.moisture_level}%. Certificate available online.`;
    return await this.sendSMS(farmerPhone, message);
  }

  static async notifySubscriptionActivated(subscription, plan, userPhone) {
    const message = `AGRICHAIN 360: Your ${plan.display_name} subscription is now active until ${new Date(subscription.end_date).toLocaleDateString('en-UG')}. Enjoy full access!`;
    return await this.sendSMS(userPhone, message);
  }

  static async notifyWelcome(userPhone, userName) {
    const message = `Welcome to AGRICHAIN 360, ${userName}! Your account is ready. Dial *284# or visit agrichain360.com to get started.`;
    return await this.sendSMS(userPhone, message);
  }
}

module.exports = NotificationService;
