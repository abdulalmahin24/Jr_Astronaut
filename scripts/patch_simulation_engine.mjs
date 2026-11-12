import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const file = path.resolve('src/utils/simulationEngine.ts');
let content = readFileSync(file, 'utf8');

// Engineer bonus
const engineerOld = `  // Equipment Wear & Maintenance:
  let equipDelta = -1.5;
  if (config.maintenanceEquipment === 'AUTOMATED_3D_FABRICATOR' && !isPowerBlackout) {
    equipDelta = +1.0;
  }
  if (shiftAction === 'ECLSS_MAINTENANCE') equipDelta += 5.0;`;

const engineerNew = `  // Equipment Wear & Maintenance (Engineer bonus: 25% slower equipment wear, 50% faster repair):
  let equipDelta = -1.5 * CREW_SPECIALTY_BONUSES.ENGINEER.equipmentWearMultiplier;
  if (config.maintenanceEquipment === 'AUTOMATED_3D_FABRICATOR' && !isPowerBlackout) {
    equipDelta += 1.0;
  }
  if (shiftAction === 'ECLSS_MAINTENANCE') {
    equipDelta += 5.0 * CREW_SPECIALTY_BONUSES.ENGINEER.repairSpeedMultiplier;
  }`;

// Doctor bonus
const doctorOld = `  // Crew Health:
  let healthDelta = 0;
  if (newOxygen < 25) healthDelta -= 12; // Severe hypoxia
  if (newWater < 20) healthDelta -= 10; // Severe dehydration
  if (newFood <= 1) healthDelta -= 8; // Malnutrition
  if (newRadiation > 45) healthDelta -= 6; // Radiation sickness
  if (newPower <= 0) healthDelta -= 16; // Catastrophic freezing quarters (-130°C)
  else if (newPower < 20) healthDelta -= 6;
  if (newPower >= 50 && newOxygen >= 70 && newWater >= 50 && newFood >= 8 && newRadiation < 35) {
    healthDelta += 2; // Well-fed, warm, thriving
  }
  const newHealth = Math.min(100, Math.max(0, currentRes.crewHealth + healthDelta));`;

const doctorNew = `  // Crew Health (Doctor bonus: 35% hypoxia/stress mitigation shield and +50% recovery):
  let healthDelta = 0;
  let stressDamage = 0;
  if (newOxygen < 25) stressDamage -= 12; // Severe hypoxia
  if (newWater < 20) stressDamage -= 10; // Severe dehydration
  if (newFood <= 1) stressDamage -= 8; // Malnutrition
  if (newRadiation > 45) stressDamage -= 6; // Radiation sickness
  if (newPower <= 0) stressDamage -= 16; // Catastrophic freezing quarters (-130°C)
  else if (newPower < 20) stressDamage -= 6;

  // Doctor Health Shield mitigates environmental damage
  if (stressDamage < 0) {
    healthDelta += Math.round(stressDamage * (1 - CREW_SPECIALTY_BONUSES.DOCTOR.hypoxiaDamageReduction));
  }

  if (newPower >= 50 && newOxygen >= 70 && newWater >= 50 && newFood >= 8 && newRadiation < 35) {
    // Doctor enhanced recovery
    healthDelta += Math.round(2 * CREW_SPECIALTY_BONUSES.DOCTOR.healthRecoveryBonus);
  }
  const newHealth = Math.min(100, Math.max(0, currentRes.crewHealth + healthDelta));`;

// Commander bonus
const commanderOld = `  // Crew Morale (Interdependent psychological state):
  let moraleDelta = 0;
  if (newFood <= 2) moraleDelta -= 10;
  if (newWater < 25) moraleDelta -= 12;
  if (newPower <= 0) moraleDelta -= 20; // Panic in cold darkness
  else if (newPower < 20) moraleDelta -= 10;
  if (newOxygen < 30) moraleDelta -= 12;
  if (newRadiation > 50) moraleDelta -= 10;
  if (newHealth < 40) moraleDelta -= 10;
  if (newShielding < 25) moraleDelta -= 6; // Fear of micrometeorites
  if (newPower >= 50 && newOxygen >= 70 && newWater >= 50 && newFood >= 8 && !isPowerBlackout) {
    moraleDelta += 3; // High spirits from nominal living conditions
  }
  const newMorale = Math.min(100, Math.max(0, currentMorale + moraleDelta));`;

const commanderNew = `  // Crew Morale (Commander bonus: +15% baseline buffer and 15% crisis resilience):
  let moraleDelta = 0;
  if (newFood <= 2) moraleDelta -= 10;
  if (newWater < 25) moraleDelta -= 12;
  if (newPower <= 0) moraleDelta -= 20; // Panic in cold darkness
  else if (newPower < 20) moraleDelta -= 10;
  if (newOxygen < 30) moraleDelta -= 12;
  if (newRadiation > 50) moraleDelta -= 10;
  if (newHealth < 40) moraleDelta -= 10;
  if (newShielding < 25) moraleDelta -= 6; // Fear of micrometeorites

  // Commander Morale Shield softens dips during crises
  if (moraleDelta < 0) {
    moraleDelta = Math.round(moraleDelta * CREW_SPECIALTY_BONUSES.COMMANDER.moraleLossMultiplier);
  }

  if (newPower >= 50 && newOxygen >= 70 && newWater >= 50 && newFood >= 8 && !isPowerBlackout) {
    moraleDelta += 3; // High spirits from nominal living conditions
  }
  const newMorale = Math.min(100, Math.max(0, currentMorale + moraleDelta));`;

// Normalize \r\n to \n for matching then write
const norm = str => str.replace(/\r\n/g, '\n');

content = norm(content);
if (!content.includes(norm(engineerOld))) console.error('engineerOld not found');
else content = content.replace(norm(engineerOld), norm(engineerNew));

if (!content.includes(norm(doctorOld))) console.error('doctorOld not found');
else content = content.replace(norm(doctorOld), norm(doctorNew));

if (!content.includes(norm(commanderOld))) console.error('commanderOld not found');
else content = content.replace(norm(commanderOld), norm(commanderNew));

writeFileSync(file, content, 'utf8');
console.log('Successfully patched simulationEngine.ts');

