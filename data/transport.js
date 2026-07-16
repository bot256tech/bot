module.exports = {
  routes: [
    { id: 'A', name: 'Jinja North', farmers: 8, totalKg: 1200, crop: 'Maize', truckCost: 60000, costPerKg: 50, status: 'In Progress', collectionPoints: '3 of 5 completed' },
    { id: 'B', name: 'Iganga Central', farmers: 6, totalKg: 900, crop: 'Groundnuts', truckCost: 55000, costPerKg: 61, status: 'Scheduled', collectionPoints: 'Pickup at 2:00 PM' },
    { id: 'C', name: 'Kamuli East', farmers: 9, totalKg: 1500, crop: 'Mixed Crops', truckCost: 80000, costPerKg: 53, status: 'Completed', collectionPoints: 'All delivered to hub' },
  ],
  summary: {
    activeRoutes: 3,
    farmersOnRoutes: 23,
    avgCostPerKg: 75,
    transportAsPctOfValueAdded: 8.2,
  },
  workedExample: {
    farmers: 5,
    totalKg: 800,
    crop: 'Maize',
    truckCost: 60000,
    costPerKgPerFarmer: 75,
    perFarmerKg: 200,
    transportCost: 15000,
    dryingCost: 40000,
    totalFarmerCost: 55000,
    valueBeforeDrying: 160000,
    valueAfterDrying: 360000,
    farmerNetGain: 145000,
    returnRatio: '3.6:1',
  },
};