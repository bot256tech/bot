/**
 * AGRICHAIN 360 — Subscription Gating Service
 *
 * Manages the free 3-day pilot trial, tier checks, and feature gating
 * for buyer accounts. Farmers and partners are never gated.
 */

const db = require('../database/connection');

const TIERS = {
  trial: {
    label: 'Pilot Trial',
    weekly: 0, monthly: 0,
    features: ['marketplace_full', 'farmer_contacts', 'basic_quality_metrics',
               'download_certificates', 'batch_provenance', 'direct_ordering'],
    trial: true
  },
  basic: {
    label: 'Basic Access',
    weekly: 45000, monthly: 150000,
    features: ['marketplace_full', 'farmer_contacts', 'basic_quality_metrics']
  },
  premium: {
    label: 'Premium Access',
    weekly: 100000, monthly: 350000,
    features: ['marketplace_full', 'farmer_contacts', 'basic_quality_metrics',
               'download_certificates', 'batch_provenance', 'direct_ordering']
  },
  investor: {
    label: 'Investor / NGO Tier',
    weekly: null, monthly: 500000,
    features: ['marketplace_full', 'farmer_contacts', 'basic_quality_metrics',
               'download_certificates', 'batch_provenance', 'direct_ordering', 'regional_analytics']
  }
};

class SubscriptionGatingService {

  /**
   * Grant a 3-day pilot trial to a new buyer.
   * Called automatically on BUYER registration.
   */
  static async grantTrial(user_id) {
    try {
      await db.query(
        `INSERT INTO buyer_profiles (user_id, trial_expires_at, subscription_tier, created_at)
         VALUES ($1, NOW() + INTERVAL '3 days', 'trial', NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           trial_expires_at = NOW() + INTERVAL '3 days',
           subscription_tier = 'trial';`,
        [user_id]
      );
      return { trial_days: 3 };
    } catch (e) {
      // Non-fatal — buyer_profiles might not exist for all buyers
      return null;
    }
  }

  /**
   * Get the buyer's current access level.
   * Returns { tier, trial_active, trial_days_remaining, can(feature), subscription_active }
   */
  static async getAccess(user_id) {
    const { rows } = await db.query(
      `SELECT trial_expires_at, subscription_tier, subscription_billing, subscription_expires_at
       FROM buyer_profiles WHERE user_id = $1;`,
      [user_id]
    );
    const profile = rows[0];
    if (!profile) return this._defaultAccess();

    const now = new Date();
    const trialExpiry = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null;
    const subExpiry = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;

    // Active paid subscription?
    if (subExpiry && subExpiry > now && TIERS[profile.subscription_tier]) {
      const tier = TIERS[profile.subscription_tier];
      return {
        tier: profile.subscription_tier,
        label: tier.label,
        trial_active: false,
        trial_days_remaining: 0,
        subscription_active: true,
        subscription_expires: subExpiry,
        billing: profile.subscription_billing,
        can: (feature) => tier.features.includes(feature)
      };
    }

    // Active trial?
    if (trialExpiry && trialExpiry > now) {
      const daysRemaining = Math.ceil((trialExpiry - now) / (1000 * 60 * 60 * 24));
      const tier = TIERS.trial;
      return {
        tier: 'trial',
        label: tier.label,
        trial_active: true,
        trial_days_remaining: daysRemaining,
        subscription_active: false,
        can: (feature) => tier.features.includes(feature)
      };
    }

    // Expired — no access to premium features
    return {
      tier: 'expired',
      label: 'Trial Ended',
      trial_active: false,
      trial_days_remaining: 0,
      subscription_active: false,
      can: (feature) => feature === 'marketplace_full' || feature === 'basic_quality_metrics'
    };
  }

  /**
   * Mask farmer data for unauthenticated or expired users.
   * Returns a safe listing object.
   */
  static maskForPublic(listing) {
    return {
      ...listing,
      farmer_name: 'Verified Smallholder',
      farmer_phone: undefined,
      village: listing.village || listing.district,
      // Keep crop, quantity, price, quality_status, quality_grade visible
    };
  }

  static _defaultAccess() {
    return {
      tier: 'none', label: 'No Subscription',
      trial_active: false, trial_days_remaining: 0, subscription_active: false,
      can: () => false
    };
  }

  static get TIERS() { return TIERS; }
}

module.exports = SubscriptionGatingService;
