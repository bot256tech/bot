/**
 * AGRICHAIN 360™ — Payment Gateway Integration
 * 
 * Supports:
 * - MTN Mobile Money (MoMo API)
 * - Airtel Money (Airtel Africa API)
 * 
 * In sandbox mode, payments are simulated.
 * In production, real API calls are made.
 */

const crypto = require('crypto');
const logger = require('../config/logger');

class PaymentGateway {
  // ─────────────────────────────────────────────────
  // MTN MOBILE MONEY
  // ─────────────────────────────────────────────────

  /**
   * Request payment via MTN MoMo
   * @param {string} phone - Customer phone number
   * @param {number} amount - Amount in UGX
   * @param {string} externalId - Our internal reference
   * @param {string} description - Payment description
   * @returns {object} - { success, transactionId, status }
   */
  static async requestMTNPayment(phone, amount, externalId, description) {
    const apiKey = process.env.MTN_MOMO_API_KEY;
    const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
    const callbackUrl = process.env.MTN_CALLBACK_URL;
    const isSandbox = process.env.NODE_ENV !== 'production';

    // Normalize phone for MTN (remove + prefix)
    const mtnPhone = phone.replace(/^\+/, '');

    if (!apiKey || apiKey === '[YOUR_API_KEY]') {
      // Sandbox mode: simulate successful payment
      logger.info('MTN MoMo payment simulated (sandbox)', { phone, amount, externalId });
      return {
        success: true,
        transactionId: `MTN-SIM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        status: 'SUCCESSFUL',
        simulated: true
      };
    }

    try {
      const axios = require('axios');

      // Step 1: Get access token
      const tokenResponse = await axios.post(
        'https://sandbox.momodeveloper.mtn.com/collection/token/',
        {},
        {
          auth: {
            username: process.env.MTN_MOMO_API_USER,
            password: apiKey
          },
          headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Step 2: Request payment
      const referenceId = crypto.randomUUID();

      const paymentResponse = await axios.post(
        'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
        {
          amount: amount.toString(),
          currency: 'UGX',
          externalId: externalId,
          payer: {
            partyIdType: 'MSISDN',
            partyId: mtnPhone
          },
          payerMessage: description || 'AGRICHAIN 360 Payment',
          payeeNote: 'AGRICHAIN 360'
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': isSandbox ? 'sandbox' : 'production',
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-Type': 'application/json',
            ...(callbackUrl ? { 'X-Callback-Url': callbackUrl } : {})
          }
        }
      );

      logger.info('MTN MoMo payment requested', {
        phone,
        amount,
        externalId,
        referenceId,
        status: paymentResponse.status
      });

      return {
        success: paymentResponse.status === 202,
        transactionId: referenceId,
        status: 'PENDING',
        simulated: false
      };
    } catch (error) {
      logger.error('MTN MoMo payment request failed', {
        phone,
        amount,
        externalId,
        error: error.message
      });

      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        error: error.message
      };
    }
  }

  // ─────────────────────────────────────────────────
  // AIRTEL MONEY
  // ─────────────────────────────────────────────────

  /**
   * Request payment via Airtel Money
   */
  static async requestAirtelPayment(phone, amount, externalId, description) {
    const clientId = process.env.AIRTEL_CLIENT_ID;
    const clientSecret = process.env.AIRTEL_CLIENT_SECRET;

    const airtelPhone = phone.replace(/^\+/, '');

    if (!clientId || clientId === '[YOUR_CLIENT_ID]') {
      logger.info('Airtel Money payment simulated (sandbox)', { phone, amount, externalId });
      return {
        success: true,
        transactionId: `AIR-SIM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        status: 'SUCCESSFUL',
        simulated: true
      };
    }

    try {
      const axios = require('axios');

      // Step 1: Get auth token
      const authResponse = await axios.post(
        'https://openapiuat.airtel.africa/auth/oauth2/token',
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials'
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const accessToken = authResponse.data.access_token;

      // Step 2: Request collection
      const paymentResponse = await axios.post(
        'https://openapiuat.airtel.africa/merchant/v1/payments/',
        {
          reference: externalId,
          subscriber: {
            country: 'UG',
            currency: 'UGX',
            msisdn: airtelPhone
          },
          transaction: {
            amount: amount,
            country: 'UG',
            currency: 'UGX',
            id: externalId
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': 'UG',
            'X-Currency': 'UGX'
          }
        }
      );

      logger.info('Airtel Money payment requested', {
        phone,
        amount,
        externalId,
        status: paymentResponse.data ? paymentResponse.data.status : 'unknown'
      });

      return {
        success: true,
        transactionId: paymentResponse.data ? paymentResponse.data.data.transaction_id : externalId,
        status: 'PENDING',
        simulated: false
      };
    } catch (error) {
      logger.error('Airtel Money payment request failed', {
        phone,
        amount,
        externalId,
        error: error.message
      });

      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        error: error.message
      };
    }
  }

  // ─────────────────────────────────────────────────
  // UNIFIED PAYMENT METHOD
  // ─────────────────────────────────────────────────

  /**
   * Initiate payment via the appropriate gateway
   * @param {string} method - MOBILE_MONEY (MTN), AIRTEL_MONEY, BANK_TRANSFER, CASH
   * @param {string} phone - Customer phone
   * @param {number} amount - Amount in UGX
   * @param {string} externalId - Our payment record ID
   * @param {string} description - Payment description
   */
  static async requestPayment(method, phone, amount, externalId, description) {
    switch (method) {
      case 'MOBILE_MONEY':
        return await this.requestMTNPayment(phone, amount, externalId, description);
      case 'AIRTEL_MONEY':
        return await this.requestAirtelPayment(phone, amount, externalId, description);
      case 'BANK_TRANSFER':
      case 'CASH':
        // Manual payment — return pending, admin confirms later
        return {
          success: true,
          transactionId: `MANUAL-${externalId}`,
          status: 'PENDING',
          simulated: false,
          manual: true
        };
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  /**
   * Check payment status from provider
   */
  static async checkMTNPaymentStatus(referenceId) {
    const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
    const apiKey = process.env.MTN_MOMO_API_KEY;

    if (!apiKey || apiKey === '[YOUR_API_KEY]') {
      return { status: 'SUCCESSFUL', simulated: true };
    }

    try {
      const axios = require('axios');

      const tokenResponse = await axios.post(
        'https://sandbox.momodeveloper.mtn.com/collection/token/',
        {},
        {
          auth: {
            username: process.env.MTN_MOMO_API_USER,
            password: apiKey
          },
          headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey }
        }
      );

      const statusResponse = await axios.get(
        `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.data.access_token}`,
            'X-Target-Environment': 'sandbox',
            'Ocp-Apim-Subscription-Key': subscriptionKey
          }
        }
      );

      return {
        status: statusResponse.data.status,
        amount: statusResponse.data.amount,
        payerMessage: statusResponse.data.payerMessage
      };
    } catch (error) {
      logger.error('MTN status check failed', { referenceId, error: error.message });
      return { status: 'UNKNOWN', error: error.message };
    }
  }
}

module.exports = PaymentGateway;
