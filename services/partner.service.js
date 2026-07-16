const Partner = require('../models/Partner');
const Booking = require('../models/Booking');

class PartnerService {
  static async createPartner(user_id, partnerData) {
    return await Partner.create({
      user_id,
      ...partnerData
    });
  }

  static async getPartnerById(id) {
    return await Partner.findById(id);
  }

  static async getPartnerByUserId(user_id) {
    return await Partner.findByUserId(user_id);
  }

  static async listApprovedPartners(partner_type, location) {
    return await Partner.findByTypeAndLocation(partner_type, location);
  }

  static async approvePartner(id) {
    return await Partner.approve(id);
  }

  static async createBooking(farmer_id, partner_id, service_type, scheduled_date, amount, notes) {
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
      notes
    });
  }

  static async getPartnerBookings(partner_id) {
    return await Booking.findByPartnerId(partner_id);
  }

  static async getFarmerBookings(farmer_id) {
    return await Booking.findByFarmerId(farmer_id);
  }

  static async getBookingById(booking_id) {
    return await Booking.findById(booking_id);
  }

  static async updateBookingStatus(booking_id, status) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    return await Booking.updateStatus(booking_id, status);
  }
}

module.exports = PartnerService;
