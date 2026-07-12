import {
  PrismaClient,
  UserRole,
  UserStatus,
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rndInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rndFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function rndIp(): string {
  return `${rndInt(10, 192)}.${rndInt(0, 255)}.${rndInt(0, 255)}.${rndInt(1, 254)}`;
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/124.0',
];

// ─── Reference Data ───────────────────────────────────────────────────────────

const routes: { source: string; destination: string; distance: number }[] = [
  { source: 'Ahmedabad', destination: 'Surat', distance: 270 },
  { source: 'Ahmedabad', destination: 'Mumbai', distance: 530 },
  { source: 'Ahmedabad', destination: 'Rajkot', distance: 215 },
  { source: 'Ahmedabad', destination: 'Vadodara', distance: 110 },
  { source: 'Surat', destination: 'Mumbai', distance: 290 },
  { source: 'Surat', destination: 'Pune', distance: 340 },
  { source: 'Rajkot', destination: 'Ahmedabad', distance: 215 },
  { source: 'Rajkot', destination: 'Jamnagar', distance: 90 },
  { source: 'Vadodara', destination: 'Surat', distance: 160 },
  { source: 'Mumbai', destination: 'Pune', distance: 150 },
  { source: 'Mumbai', destination: 'Nashik', distance: 170 },
  { source: 'Pune', destination: 'Nagpur', distance: 700 },
  { source: 'Delhi', destination: 'Jaipur', distance: 280 },
  { source: 'Jaipur', destination: 'Jodhpur', distance: 340 },
  { source: 'Delhi', destination: 'Chandigarh', distance: 260 },
  { source: 'Ahmedabad', destination: 'Jaipur', distance: 680 },
  { source: 'Mumbai', destination: 'Nagpur', distance: 830 },
  { source: 'Surat', destination: 'Ahmedabad', distance: 270 },
  { source: 'Pune', destination: 'Mumbai', distance: 150 },
  { source: 'Nagpur', destination: 'Raipur', distance: 290 },
];

const vehicleData = [
  { manufacturer: 'Tata Motors', models: ['Prima 4028.S', 'Signa 3718.T', 'LPT 2518', 'Ultra T.7', 'Ace Gold'], type: 'Heavy Truck' },
  { manufacturer: 'Ashok Leyland', models: ['Captain 3718', 'Boss 1415', 'Dost+', 'U-Truck 2518', 'Ecomet 1215'], type: 'Heavy Truck' },
  { manufacturer: 'Volvo Trucks', models: ['FH 500', 'FM 380', 'FMX 460', 'FE 280', 'FL 250'], type: 'Heavy Truck' },
  { manufacturer: 'Eicher Motors', models: ['Pro 6031', 'Pro 2095', 'Pro 8031XP', 'Pro 1110', 'Pro 3015'], type: 'Medium Truck' },
  { manufacturer: 'BharatBenz', models: ['1217C', '2523R', '4923R', '1015R', '3723R'], type: 'Heavy Truck' },
  { manufacturer: 'Mahindra', models: ['Furio 14', 'Blazo X 35', 'Supro Profit Truck', 'Jeeto Plus', 'Bolero Pik-Up'], type: 'Light Truck' },
];

const vehicleRegions = ['Gujarat', 'Maharashtra', 'Rajasthan', 'Delhi NCR', 'Madhya Pradesh'];

const registrationPrefixes = ['GJ-01', 'GJ-05', 'GJ-18', 'MH-04', 'MH-12', 'RJ-14', 'RJ-19', 'DL-01', 'MP-09'];

const fuelStations = [
  'Indian Oil, NH-48 Ahmedabad', 'HPCL, Surat Bypass', 'BPCL, Vadodara Ring Road',
  'Indian Oil, Mumbai-Pune Expressway', 'HPCL, Rajkot National Highway',
  'Indian Oil, Delhi-Jaipur Highway', 'BPCL, Nagpur Outer Ring Road',
  'Reliance Fuel, Surat', 'Indian Oil, Pune Solapur Road',
  'HPCL, Ahmedabad-Rajkot Highway', 'Shell, Mumbai Eastern Express',
  'Indian Oil, Vadodara-Surat Highway', 'BPCL, Jaipur Bypass',
];

const maintenanceTypes = ['Tyre Replacement', 'Engine Overhaul', 'Oil Change', 'Brake Service', 'Battery Replacement', 'Suspension Repair', 'AC Service', 'Wheel Alignment'];
const workshops = [
  'Tata Authorised Workshop, Ahmedabad',
  'Ashok Leyland Service Centre, Surat',
  'Volvo Fleet Care, Mumbai',
  'BharatBenz Workshop, Vadodara',
  'Eicher Service Hub, Rajkot',
  'Mahindra Fleet Edge, Pune',
  'SpeedFix Auto Workshop, Jaipur',
  'National Fleet Service, Delhi',
  'Gujarat Truck Works, Anand',
  'Reliable Auto Care, Nashik',
];

const technicians = [
  'Ramesh Patel', 'Suresh Kumar', 'Mohan Singh', 'Prakash Verma',
  'Dilip Joshi', 'Ashwin Mehta', 'Vijay Sharma', 'Kamlesh Yadav',
  'Naresh Gupta', 'Bharat Solanki',
];

const expenseTypes = ['Fuel', 'Repair', 'Insurance', 'Toll', 'Driver Salary', 'Office', 'Miscellaneous'];

const driverFirstNames = [
  'Rajesh', 'Sunil', 'Mahesh', 'Pradeep', 'Vijay', 'Santosh', 'Dinesh', 'Ramesh',
  'Mukesh', 'Ganesh', 'Naresh', 'Rakesh', 'Harish', 'Ashok', 'Suresh', 'Bhuvan',
  'Ravi', 'Anil', 'Sanjay', 'Manish', 'Deepak', 'Vikas', 'Arvind', 'Amol',
  'Rohit', 'Nitin', 'Hemant', 'Jitendra', 'Bharat', 'Kiran',
  'Dilip', 'Prakash', 'Ramkumar', 'Suryakant', 'Devendra',
  'Narayan', 'Chandrakant', 'Baldev', 'Govind', 'Umesh',
  'Pravin', 'Shyam', 'Tulsiram', 'Dharmesh', 'Hitesh',
  'Jayesh', 'Kalpesh', 'Laxman', 'Mahendra', 'Nandlal',
];

const driverLastNames = [
  'Patel', 'Shah', 'Sharma', 'Verma', 'Singh', 'Kumar', 'Mehta', 'Joshi',
  'Yadav', 'Gupta', 'Solanki', 'Chauhan', 'Thakor', 'Parmar', 'Rathod',
  'Desai', 'Bhatt', 'Pandya', 'Trivedi', 'Nair',
];

const licenseCategories = ['HMV', 'HGMV', 'LMV', 'TRANS'];

const addresses = [
  '14, Satellite Road, Ahmedabad 380015',
  '7, Ring Road, Surat 395002',
  '23, Kalavad Road, Rajkot 360005',
  '5, Race Course, Vadodara 390007',
  'B-12, Andheri East, Mumbai 400069',
  '34, Kothrud, Pune 411038',
  '9, Malviya Nagar, Jaipur 302017',
  '17, Rohini Sector 3, Delhi 110085',
  '2, Paldi, Ahmedabad 380007',
  '45, Udhna, Surat 394210',
  '8, Mavdi, Rajkot 360004',
  '31, Gotri, Vadodara 390021',
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱 Seeding TransitOps database...');

  // ── Wipe all business data (preserve users via upsert) ──────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  console.log('  🗑️  Cleared existing business data');

  // ── Users ────────────────────────────────────────────────────────────────────
  const saltRounds = 12;
  const defaultPassword = await bcrypt.hash('TransitOps@2024!', saltRounds);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@transitops.com' },
    update: {},
    create: {
      employeeId: 'EMP-0001',
      email: 'admin@transitops.com',
      passwordHash: defaultPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      department: 'IT Administration',
      phone: '+91-98250-10001',
      passwordChangedAt: new Date(),
      lastLoginAt: daysAgo(1),
    },
  });

  const fleetManager = await prisma.user.upsert({
    where: { email: 'fleet.manager@transitops.com' },
    update: {},
    create: {
      employeeId: 'EMP-0002',
      email: 'fleet.manager@transitops.com',
      passwordHash: defaultPassword,
      firstName: 'Jayesh',
      lastName: 'Mehta',
      role: UserRole.FLEET_MANAGER,
      status: UserStatus.ACTIVE,
      department: 'Fleet Operations',
      phone: '+91-98250-10002',
      passwordChangedAt: new Date(),
      lastLoginAt: daysAgo(0),
    },
  });

  const safetyOfficer = await prisma.user.upsert({
    where: { email: 'safety.officer@transitops.com' },
    update: {},
    create: {
      employeeId: 'EMP-0003',
      email: 'safety.officer@transitops.com',
      passwordHash: defaultPassword,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: UserRole.SAFETY_OFFICER,
      status: UserStatus.ACTIVE,
      department: 'Safety & Compliance',
      phone: '+91-98250-10003',
      passwordChangedAt: new Date(),
      lastLoginAt: daysAgo(0),
    },
  });

  const financialAnalyst = await prisma.user.upsert({
    where: { email: 'finance@transitops.com' },
    update: {},
    create: {
      employeeId: 'EMP-0004',
      email: 'finance@transitops.com',
      passwordHash: defaultPassword,
      firstName: 'Ankur',
      lastName: 'Desai',
      role: UserRole.FINANCIAL_ANALYST,
      status: UserStatus.ACTIVE,
      department: 'Finance',
      phone: '+91-98250-10004',
      passwordChangedAt: new Date(),
      lastLoginAt: daysAgo(0),
    },
  });

  const allUsers = [superAdmin, fleetManager, safetyOfficer, financialAnalyst];
  console.log('  ✅ Users upserted (4)');

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  const vehicleStatuses: VehicleStatus[] = [
    'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE',
    'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE',
    'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE',
    'ON_TRIP', 'ON_TRIP', 'ON_TRIP', 'ON_TRIP', 'ON_TRIP', 'ON_TRIP',
    'ON_TRIP', 'ON_TRIP', 'ON_TRIP', 'ON_TRIP',
    'IN_SHOP', 'IN_SHOP', 'IN_SHOP', 'IN_SHOP', 'IN_SHOP', 'IN_SHOP',
    'RETIRED', 'RETIRED', 'RETIRED', 'RETIRED', 'RETIRED', 'RETIRED',
  ];

  const usedRegNums = new Set<string>();
  const vehicles = [];
  for (let i = 0; i < 40; i++) {
    const vInfo = vehicleData[i % vehicleData.length];
    const model = vInfo.models[i % vInfo.models.length];
    const prefix = registrationPrefixes[i % registrationPrefixes.length];
    let regNum: string;
    do {
      regNum = `${prefix}-${String(rndInt(1000, 9999))}`;
    } while (usedRegNums.has(regNum));
    usedRegNums.add(regNum);

    const purchaseYear = rndInt(2015, 2022);
    const purchaseDate = new Date(`${purchaseYear}-${String(rndInt(1, 12)).padStart(2, '0')}-${String(rndInt(1, 28)).padStart(2, '0')}`);
    const odometer = rndFloat(45000, 320000, 0);
    const capacity = rnd([5, 7.5, 10, 12, 15, 18, 20, 25]);
    const cost = rndFloat(1200000, 4800000, 2);

    const vehicle = await prisma.vehicle.create({
      data: {
        id: uuidv4(),
        registrationNumber: regNum,
        vehicleName: `${vInfo.manufacturer} ${model}`,
        vehicleModel: model,
        vehicleType: vInfo.type,
        manufacturer: vInfo.manufacturer,
        manufacturingYear: purchaseYear,
        maximumLoadCapacity: capacity,
        currentOdometer: odometer,
        acquisitionCost: cost,
        purchaseDate,
        insuranceExpiry: daysFromNow(rndInt(-30, 365)),
        registrationExpiry: daysFromNow(rndInt(60, 730)),
        status: vehicleStatuses[i],
        region: vehicleRegions[i % vehicleRegions.length],
        notes: i % 5 === 0 ? 'Flagged for next service in 5,000 km' : null,
      },
    });
    vehicles.push(vehicle);
  }
  console.log(`  ✅ Vehicles created (${vehicles.length})`);

  // ── Drivers ──────────────────────────────────────────────────────────────────
  const driverStatusDist: DriverStatus[] = [
    'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE',
    'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE',
    'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE',
    'ON_TRIP', 'ON_TRIP', 'ON_TRIP', 'ON_TRIP', 'ON_TRIP', 'ON_TRIP',
    'ON_TRIP', 'ON_TRIP', 'ON_TRIP', 'ON_TRIP',
    'OFF_DUTY', 'OFF_DUTY', 'OFF_DUTY', 'OFF_DUTY', 'OFF_DUTY', 'OFF_DUTY',
    'OFF_DUTY', 'OFF_DUTY', 'OFF_DUTY', 'OFF_DUTY', 'OFF_DUTY', 'OFF_DUTY',
    'SUSPENDED', 'SUSPENDED', 'SUSPENDED', 'SUSPENDED', 'SUSPENDED',
    'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE',
  ];

  const usedLicenses = new Set<string>();
  const drivers = [];
  for (let i = 0; i < 50; i++) {
    let licenseNumber: string;
    do {
      licenseNumber = `GJ${String(rndInt(10, 99))}${String(rndInt(100000000, 999999999))}`;
    } while (usedLicenses.has(licenseNumber));
    usedLicenses.add(licenseNumber);

    const firstName = driverFirstNames[i % driverFirstNames.length];
    const lastName = driverLastNames[i % driverLastNames.length];
    const yearsExp = rndInt(2, 18);
    const safetyScore = driverStatusDist[i] === 'SUSPENDED' ? rndInt(30, 55) : rndInt(72, 100);

    const driver = await prisma.driver.create({
      data: {
        id: uuidv4(),
        fullName: `${firstName} ${lastName}`,
        employeeId: `DRV-${String(i + 1).padStart(4, '0')}`,
        licenseNumber,
        licenseCategory: licenseCategories[i % licenseCategories.length],
        licenseExpiryDate: daysFromNow(driverStatusDist[i] === 'SUSPENDED' ? rndInt(-90, 0) : rndInt(90, 1460)),
        phoneNumber: `+91-${rndInt(70000, 99999)}-${rndInt(10000, 99999)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@transitops-drivers.com`,
        safetyScore,
        yearsOfExperience: yearsExp,
        address: addresses[i % addresses.length],
        emergencyContact: `+91-${rndInt(70000, 99999)}-${rndInt(10000, 99999)}`,
        status: driverStatusDist[i],
        notes: driverStatusDist[i] === 'SUSPENDED' ? 'Pending safety re-certification' : null,
      },
    });
    drivers.push(driver);
  }
  console.log(`  ✅ Drivers created (${drivers.length})`);

  // ── Trips ─────────────────────────────────────────────────────────────────────
  const tripStatusDist: TripStatus[] = [
    ...Array(60).fill('COMPLETED' as TripStatus),
    ...Array(20).fill('DISPATCHED' as TripStatus),
    ...Array(15).fill('CANCELLED' as TripStatus),
    ...Array(25).fill('DRAFT' as TripStatus),
  ];

  const trippableVehicles = vehicles.filter(v => v.status === 'AVAILABLE' || v.status === 'ON_TRIP');
  const trippableDrivers = drivers.filter(d => d.status === 'AVAILABLE' || d.status === 'ON_TRIP');

  const trips = [];
  const usedTripNumbers = new Set<string>();

  for (let i = 0; i < 120; i++) {
    const status = tripStatusDist[i];
    const route = routes[i % routes.length];
    const plannedDist = parseFloat((route.distance * rndFloat(0.9, 1.1)).toFixed(1));
    const estimatedMins = Math.round((plannedDist / 55) * 60);

    let tripNumber: string;
    do {
      tripNumber = `TRP-2024-${String(i + 1).padStart(4, '0')}`;
    } while (usedTripNumbers.has(tripNumber));
    usedTripNumbers.add(tripNumber);

    const vehicle = trippableVehicles[i % trippableVehicles.length];
    const driver = trippableDrivers[i % trippableDrivers.length];

    const daysOffset = rndInt(0, 180);
    const startTime = daysAgo(daysOffset);
    const endTime = new Date(startTime.getTime() + estimatedMins * 60 * 1000 * rndFloat(0.9, 1.2));

    const tripRevenue = parseFloat((plannedDist * rndFloat(45, 75)).toFixed(2));
    const cargoWeight = rndFloat(1.5, vehicle.maximumLoadCapacity * 0.9, 1);

    const startOdometer = vehicle.currentOdometer - rndFloat(1000, 50000, 0);
    const actualDist = status === 'COMPLETED' ? parseFloat((plannedDist * rndFloat(0.98, 1.05)).toFixed(1)) : null;

    const cancelReasons = ['Client cancelled order', 'Vehicle breakdown enroute', 'Route blocked due to flooding', 'Driver unavailable'];

    const trip = await prisma.trip.create({
      data: {
        id: uuidv4(),
        tripNumber,
        source: route.source,
        destination: route.destination,
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight,
        plannedDistance: plannedDist,
        actualDistance: actualDist,
        estimatedDuration: estimatedMins,
        tripStartTime: status !== 'DRAFT' ? startTime : null,
        tripEndTime: status === 'COMPLETED' ? endTime : null,
        startOdometer: status !== 'DRAFT' ? startOdometer : null,
        endOdometer: status === 'COMPLETED' ? parseFloat((startOdometer + (actualDist ?? plannedDist)).toFixed(0)) : null,
        tripRevenue,
        remarks: status === 'CANCELLED' ? cancelReasons[i % cancelReasons.length] : null,
        status,
        createdBy: allUsers[i % allUsers.length].id,
        createdAt: daysAgo(daysOffset + rndInt(1, 3)),
      },
    });
    trips.push(trip);
  }
  console.log(`  ✅ Trips created (${trips.length})`);

  // ── Maintenance ───────────────────────────────────────────────────────────────
  const maintenanceStatusDist: MaintenanceStatus[] = [
    ...Array(15).fill('COMPLETED' as MaintenanceStatus),
    ...Array(8).fill('PENDING' as MaintenanceStatus),
    ...Array(7).fill('IN_PROGRESS' as MaintenanceStatus),
    ...Array(5).fill('CANCELLED' as MaintenanceStatus),
  ];

  const maintenances = [];
  for (let i = 0; i < 35; i++) {
    const mStatus = maintenanceStatusDist[i];
    const mType = maintenanceTypes[i % maintenanceTypes.length];
    const vehicle = vehicles[i % vehicles.length];
    const daysOffset = rndInt(0, 150);
    const scheduled = mStatus === 'PENDING' ? daysFromNow(rndInt(1, 30)) : daysAgo(daysOffset);
    const estimatedCost = rndFloat(4500, 85000, 2);
    const actualCost = mStatus === 'COMPLETED' ? parseFloat((estimatedCost * rndFloat(0.85, 1.15)).toFixed(2)) : null;

    const statusNote: Record<string, string> = {
      COMPLETED: 'completed successfully',
      PENDING: 'scheduled as per service interval',
      IN_PROGRESS: 'work in progress at workshop',
      CANCELLED: 'cancelled due to vehicle redeployment',
    };

    const maintenance = await prisma.maintenance.create({
      data: {
        id: uuidv4(),
        maintenanceNumber: `MNT-2024-${String(i + 1).padStart(4, '0')}`,
        vehicleId: vehicle.id,
        maintenanceType: mType,
        description: `${mType} for ${vehicle.vehicleName} — ${statusNote[mStatus]}`,
        priority: ['Low', 'Medium', 'High', 'Critical'][i % 4],
        scheduledDate: scheduled,
        completedDate: mStatus === 'COMPLETED' ? new Date(scheduled.getTime() + rndInt(1, 3) * 86400000) : null,
        estimatedCost,
        actualCost,
        workshopName: workshops[i % workshops.length],
        technicianName: technicians[i % technicians.length],
        notes: mStatus === 'IN_PROGRESS' ? 'Spare parts ordered, ETA 2 days' : null,
        status: mStatus,
        createdBy: [superAdmin, fleetManager][i % 2].id,
        createdAt: daysAgo(daysOffset + 2),
      },
    });
    maintenances.push(maintenance);
  }
  console.log(`  ✅ Maintenance records created (${maintenances.length})`);

  // ── Fuel Logs ─────────────────────────────────────────────────────────────────
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');
  const activeVehicles = vehicles.filter(v => v.status !== 'RETIRED');

  const fuelLogs = [];
  for (let i = 0; i < 180; i++) {
    const vehicle = activeVehicles[i % activeVehicles.length];
    const trip = i % 3 === 0 && completedTrips.length > 0 ? completedTrips[i % completedTrips.length] : null;
    const liters = rndFloat(60, 280, 1);
    const pricePerLiter = rndFloat(95.5, 106.5, 2);
    const totalCost = parseFloat((liters * pricePerLiter).toFixed(2));

    const fuelLog = await prisma.fuelLog.create({
      data: {
        id: uuidv4(),
        vehicleId: vehicle.id,
        tripId: trip?.id ?? null,
        liters,
        pricePerLiter,
        totalCost,
        odometer: vehicle.currentOdometer - rndFloat(500, 40000, 0),
        fuelStation: fuelStations[i % fuelStations.length],
        date: daysAgo(rndInt(0, 180)),
      },
    });
    fuelLogs.push(fuelLog);
  }
  console.log(`  ✅ Fuel logs created (${fuelLogs.length})`);

  // ── Expenses ──────────────────────────────────────────────────────────────────
  const expenseDescriptions: Record<string, string[]> = {
    'Fuel': ['Diesel fill-up at highway station', 'Emergency fuel top-up enroute', 'Monthly fuel depot purchase'],
    'Repair': ['Engine belt replacement', 'Radiator coolant leak repair', 'Clutch plate replacement', 'Brake pad replacement'],
    'Insurance': ['Annual comprehensive insurance premium', 'Third-party liability renewal', 'Fleet insurance installment'],
    'Toll': ['NH-48 toll charges', 'Mumbai-Pune expressway toll', 'State highway toll payment', 'Delhi Expressway toll'],
    'Driver Salary': ['Monthly salary disbursement', 'Overtime allowance payment', 'Trip incentive bonus'],
    'Office': ['Office supplies purchase', 'Monthly internet bill', 'Software subscription', 'Printing & stationery'],
    'Miscellaneous': ['Parking charges', 'Driver meal allowance', 'Emergency towing charges', 'Vehicle cleaning service'],
  };

  const expenses = [];
  for (let i = 0; i < 90; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const expType = expenseTypes[i % expenseTypes.length];
    const trip = i % 4 === 0 && completedTrips.length > 0 ? completedTrips[i % completedTrips.length] : null;

    let amount: number;
    if (expType === 'Fuel') amount = rndFloat(8000, 28000, 2);
    else if (expType === 'Repair') amount = rndFloat(5000, 75000, 2);
    else if (expType === 'Insurance') amount = rndFloat(25000, 120000, 2);
    else if (expType === 'Toll') amount = rndFloat(350, 2800, 2);
    else if (expType === 'Driver Salary') amount = rndFloat(18000, 35000, 2);
    else if (expType === 'Office') amount = rndFloat(1500, 12000, 2);
    else amount = rndFloat(500, 8000, 2);

    const descArr = expenseDescriptions[expType] ?? ['General expense'];
    const expense = await prisma.expense.create({
      data: {
        id: uuidv4(),
        vehicleId: vehicle.id,
        tripId: trip?.id ?? null,
        expenseType: expType,
        amount,
        description: descArr[i % descArr.length],
        date: daysAgo(rndInt(0, 180)),
      },
    });
    expenses.push(expense);
  }
  console.log(`  ✅ Expenses created (${expenses.length})`);

  // ── Audit Logs ────────────────────────────────────────────────────────────────
  type AuditEntry = {
    userId: string;
    action: string;
    resource: string;
    resourceId: string | null;
    metadata: object;
    createdAt: Date;
  };

  const auditEntries: AuditEntry[] = [];

  // Vehicle created
  for (const v of vehicles) {
    auditEntries.push({
      userId: [superAdmin, fleetManager][auditEntries.length % 2].id,
      action: 'VEHICLE_CREATED',
      resource: 'Vehicle',
      resourceId: v.id,
      metadata: { registrationNumber: v.registrationNumber, manufacturer: v.manufacturer },
      createdAt: daysAgo(rndInt(120, 180)),
    });
  }

  // Vehicle updated
  for (let i = 0; i < 30; i++) {
    const v = vehicles[i % vehicles.length];
    auditEntries.push({
      userId: [superAdmin, fleetManager][i % 2].id,
      action: 'VEHICLE_UPDATED',
      resource: 'Vehicle',
      resourceId: v.id,
      metadata: { field: ['status', 'odometer', 'region', 'notes'][i % 4], vehicle: v.registrationNumber },
      createdAt: daysAgo(rndInt(1, 120)),
    });
  }

  // Driver created
  for (const d of drivers) {
    auditEntries.push({
      userId: [superAdmin, fleetManager][auditEntries.length % 2].id,
      action: 'DRIVER_CREATED',
      resource: 'Driver',
      resourceId: d.id,
      metadata: { fullName: d.fullName, employeeId: d.employeeId },
      createdAt: daysAgo(rndInt(100, 170)),
    });
  }

  // Trip dispatched
  for (let i = 0; i < 60; i++) {
    const t = trips[i];
    auditEntries.push({
      userId: allUsers[i % allUsers.length].id,
      action: 'TRIP_DISPATCHED',
      resource: 'Trip',
      resourceId: t.id,
      metadata: { tripNumber: t.tripNumber, source: t.source, destination: t.destination },
      createdAt: daysAgo(rndInt(1, 90)),
    });
  }

  // Trip completed
  for (const t of completedTrips.slice(0, 60)) {
    auditEntries.push({
      userId: [fleetManager, superAdmin][auditEntries.length % 2].id,
      action: 'TRIP_COMPLETED',
      resource: 'Trip',
      resourceId: t.id,
      metadata: { tripNumber: t.tripNumber, revenue: t.tripRevenue },
      createdAt: daysAgo(rndInt(0, 60)),
    });
  }

  // Trip cancelled
  for (const t of trips.filter(tr => tr.status === 'CANCELLED')) {
    auditEntries.push({
      userId: [fleetManager, superAdmin][auditEntries.length % 2].id,
      action: 'TRIP_CANCELLED',
      resource: 'Trip',
      resourceId: t.id,
      metadata: { tripNumber: t.tripNumber, reason: t.remarks },
      createdAt: daysAgo(rndInt(1, 90)),
    });
  }

  // Maintenance completed
  for (const m of maintenances.filter(mn => mn.status === 'COMPLETED')) {
    auditEntries.push({
      userId: [superAdmin, fleetManager][auditEntries.length % 2].id,
      action: 'MAINTENANCE_COMPLETED',
      resource: 'Maintenance',
      resourceId: m.id,
      metadata: { maintenanceNumber: m.maintenanceNumber, actualCost: m.actualCost },
      createdAt: daysAgo(rndInt(1, 60)),
    });
  }

  // Fuel added
  for (let i = 0; i < 50; i++) {
    const f = fuelLogs[i];
    auditEntries.push({
      userId: allUsers[i % allUsers.length].id,
      action: 'FUEL_ADDED',
      resource: 'FuelLog',
      resourceId: f.id,
      metadata: { liters: f.liters, totalCost: f.totalCost, station: f.fuelStation },
      createdAt: daysAgo(rndInt(0, 90)),
    });
  }

  // Expense created
  for (let i = 0; i < 40; i++) {
    const e = expenses[i];
    auditEntries.push({
      userId: [financialAnalyst, superAdmin][i % 2].id,
      action: 'EXPENSE_CREATED',
      resource: 'Expense',
      resourceId: e.id,
      metadata: { expenseType: e.expenseType, amount: e.amount },
      createdAt: daysAgo(rndInt(0, 90)),
    });
  }

  // User login
  for (let i = 0; i < 60; i++) {
    auditEntries.push({
      userId: allUsers[i % allUsers.length].id,
      action: 'USER_LOGIN',
      resource: 'Auth',
      resourceId: null,
      metadata: { browser: ['Chrome', 'Firefox', 'Edge', 'Safari'][i % 4], os: ['Windows', 'macOS', 'Linux'][i % 3] },
      createdAt: daysAgo(rndInt(0, 30)),
    });
  }

  // Settings updated
  for (let i = 0; i < 10; i++) {
    auditEntries.push({
      userId: superAdmin.id,
      action: 'SETTINGS_UPDATED',
      resource: 'Settings',
      resourceId: null,
      metadata: { section: ['Rate Limiting', 'Email Notifications', 'Fleet Thresholds', 'Report Schedule'][i % 4] },
      createdAt: daysAgo(rndInt(5, 120)),
    });
  }

  // Report generated
  for (let i = 0; i < 15; i++) {
    auditEntries.push({
      userId: [financialAnalyst, fleetManager][i % 2].id,
      action: 'REPORT_GENERATED',
      resource: 'Report',
      resourceId: null,
      metadata: { reportType: ['Monthly Revenue', 'Fleet Utilization', 'Fuel Cost Analysis', 'Driver Performance'][i % 4] },
      createdAt: daysAgo(rndInt(0, 45)),
    });
  }

  // Data exported
  for (let i = 0; i < 10; i++) {
    auditEntries.push({
      userId: allUsers[i % allUsers.length].id,
      action: 'DATA_EXPORTED',
      resource: ['Trip', 'Vehicle', 'Driver', 'Expense'][i % 4],
      resourceId: null,
      metadata: { format: ['CSV', 'PDF', 'Excel'][i % 3], recordCount: rndInt(10, 200) },
      createdAt: daysAgo(rndInt(0, 60)),
    });
  }

  // Insert audit logs
  let auditCount = 0;
  for (const log of auditEntries) {
    await prisma.auditLog.create({
      data: {
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        ipAddress: rndIp(),
        userAgent: userAgents[auditCount % userAgents.length],
        metadata: log.metadata,
        createdAt: log.createdAt,
      },
    });
    auditCount++;
  }
  console.log(`  ✅ Audit logs created (${auditCount})`);

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n✅ TransitOps Demo Seed Complete');
  console.log('━'.repeat(52));
  console.log(`  Users             : 4`);
  console.log(`  Vehicles          : ${vehicles.length}`);
  console.log(`  Drivers           : ${drivers.length}`);
  console.log(`  Trips             : ${trips.length}`);
  console.log(`    ↳ Completed     : ${trips.filter(t => t.status === 'COMPLETED').length}`);
  console.log(`    ↳ Dispatched    : ${trips.filter(t => t.status === 'DISPATCHED').length}`);
  console.log(`    ↳ Draft         : ${trips.filter(t => t.status === 'DRAFT').length}`);
  console.log(`    ↳ Cancelled     : ${trips.filter(t => t.status === 'CANCELLED').length}`);
  console.log(`  Maintenance       : ${maintenances.length}`);
  console.log(`  Fuel Logs         : ${fuelLogs.length}`);
  console.log(`  Expenses          : ${expenses.length}`);
  console.log(`  Audit Logs        : ${auditCount}`);
  console.log('━'.repeat(52));
  console.log(`  Login             : admin@transitops.com`);
  console.log(`  Password          : TransitOps@2024!`);
  console.log('━'.repeat(52));
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
