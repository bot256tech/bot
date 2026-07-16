const VillageAgent = require('../models/VillageAgent');
const FarmGarden = require('../models/FarmGarden');
const CropLifecycle = require('../models/CropLifecycle');
const Farmer = require('../models/Farmer');
const { logAudit, AUDIT_ACTIONS } = require('../api/middleware/auditLog');

class VillageAgentService {
  static async registerAgent(user_id, agentData) {
    return await VillageAgent.create({ user_id, ...agentData });
  }

  static async registerFarmer(agent_id, farmerData) {
    const agent = await VillageAgent.findById(agent_id);
    if (!agent) throw new Error('Agent not found');
    const user = await require('../models/User').create({ name: farmerData.name, phone: farmerData.phone, password: farmerData.password || 'default123', role: 'FARMER' });
    const farmer = await Farmer.create({ user_id: user.id, district: farmerData.district, village: farmerData.village, crops: farmerData.crops || [], farm_size: farmerData.farm_size, national_id: farmerData.national_id });
    await VillageAgent.incrementFarmersRegistered(agent_id);
    return { user, farmer, agent };
  }

  static async mapGarden(agent_id, farmer_id, gardenData) {
    const garden = await FarmGarden.create({ farmer_id, agent_id, ...gardenData });
    return garden;
  }

  static async registerCrop(agent_id, farmer_id, garden_id, cropData) {
    const lifecycle = await CropLifecycle.create({ farmer_id, garden_id, ...cropData });
    return lifecycle;
  }

  static async recordVisit(agent_id, farmer_id, visitData) {
    const activity = await CropLifecycle.recordActivity({ farmer_id, agent_id, ...visitData });
    return activity;
  }

  static async getAgentDashboard(agent_id) {
    const agent = await VillageAgent.findById(agent_id);
    const stats = await VillageAgent.getAgentStats(agent_id);
    const gardens = await FarmGarden.findByAgentId(agent_id);
    return { agent, stats, gardens, total_farmers: agent ? agent.farmers_registered : 0 };
  }

  static async getNearbyAgents(filters) {
    return await VillageAgent.getActiveAgents(filters);
  }

  static async getGardenCalculations(garden_id, crop) {
    return await FarmGarden.getGardenCalculations(garden_id, crop);
  }
}

module.exports = VillageAgentService;
