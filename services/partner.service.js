const Partner = require('../models/Partner');
const Booking = require('../models/Booking');

class PartnerService {
  /**
   * Register a new service partner (Dryer, Lab, Transporter, Warehouse)
   */
  static async createPartner(user_id, partnerData) {
    return await Partner.create({
      user_id,
      ...partnerData
    });
  }

  /**
   * Search approved partners by type and/or location
   */
  static async getPartnersByTypeAndLocation(partner_type, location) {
    return await Partner.findByTypeAndLocation(partner_type, location);
  }

  /**
   * Get a single partner by ID
   */
  static async getPartnerById(id) {
    return await Partner.findById(id);
  }

  /**
   * Get partner profile by user ID
   */
  static async getPartnerByUserId(user_id) {
    return await Partner.findByUserId(user_id);
  }

  /**
   * Create a service booking (farmer books a partner)
   */
  static async createBooking(farmer_id, partner_id, service_type, scheduled_date, amount, notes) {
    // Verify partner exists and is approved
    const partner = await Partner.findById(partner_id);
    if (!partner) {
      throw new Error('Service provider not found.');
    }
    if (!partner.approved) {
      throw new Error('This service provider is not yet approved.');
    }

    return await Booking.create({
      farmer_id,
      partner_id,
      service_type,
      scheduled_date,
      amount,
      notes,
      status: 'PENDING'
    });
  }

  /**
   * Update booking status (confirm, complete, cancel)
   */
  static async updateBookingStatus(booking_id, status) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    return await Booking.updateStatus(booking_id, status);
  }

  /**
   * Get all bookings for a specific partner
   */
  static async getPartnerBookings(partner_id) {
    return await Booking.findByPartnerId(partner_id);
  }

  /**
   * Get all bookings for a farmer
   */
  static async getFarmerBookings(farmer_id) {
    return await Booking.findByFarmerId(farmer_id);
  }

  /**
   * Approve a partner (admin action)
   */
  static async approvePartner(id) {
    return await Partner.approve(id);
  }

  /**
   * Get a single booking by ID
   */
  static async getBookingById(booking_id) {
    return await Booking.findById(booking_id);
  }
}

module.exports = PartnerService;
