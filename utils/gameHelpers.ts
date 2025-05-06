import { Building, Villager, Colony } from './types';
import { v4 as uuidv4 } from 'uuid';

// Convert axial coordinates to pixel coordinates
export function hexToPixel(q: number, r: number, size: number): { x: number, y: number } {
  const x = size * (3/2 * q);
  const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return { x, y };
}

// Convert pixel coordinates to axial coordinates
export function pixelToHex(x: number, y: number, size: number): { q: number, r: number } {
  const q = (2/3 * x) / size;
  const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
  return roundHex(q, r);
}

// Round to nearest hex
function roundHex(q: number, r: number): { q: number, r: number } {
  let s = -q - r;
  
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }
  
  return { q: rq, r: rr };
}

// Check if a building can be placed at the given coordinates
export function canPlaceBuilding(q: number, r: number, buildings: { [key: string]: Building }): boolean {
  return !Object.values(buildings).some(building => 
    building.gridX === q && building.gridY === r
  );
}

// Calculate path between two hex coordinates using A* algorithm
export function findPath(
  startQ: number,
  startR: number,
  endQ: number,
  endR: number,
  buildings: { [key: string]: Building }
): { q: number, r: number }[] {
  // A* implementation would go here
  // For simplicity, returning direct line path
  // In a real implementation, this would avoid buildings
  return [
    { q: startQ, r: startR },
    { q: endQ, r: endR }
  ];
}

// Calculate colony average EQ
export function calculateAverageEq(villagers: { [key: string]: Villager }): number {
  const villagerArray = Object.values(villagers);
  if (villagerArray.length === 0) return 50; // Default EQ
  
  const totalEq = villagerArray.reduce((sum, villager) => sum + villager.eq, 0);
  return Math.round(totalEq / villagerArray.length);
}

// Generate a new unique ID
export function generateId(): string {
  return uuidv4();
}

// Update colony credits in real time
export function updateCredits(colony: Colony, elapsedTime: number): number {
  let creditChange = 0;
  
  // Calculate credit generation/consumption from buildings
  Object.values(colony.buildings).forEach(building => {
    // Assuming buildings have an hourly rate, convert to per-second
    const hourlyRate = building.cost > 0 ? building.cost * -0.01 : Math.abs(building.cost) * 0.05;
    const secondRate = hourlyRate / 3600;
    creditChange += secondRate * elapsedTime / 1000; // elapsedTime is in ms
  });
  
  return colony.credits + creditChange;
}

// Get buildings that affect EQ
export function getEqBuildings(buildings: { [key: string]: Building }): Building[] {
  return Object.values(buildings).filter(building => building.eqImpact !== 0);
}

// Calculate EQ effect on a villager based on nearby buildings
export function calculateEqEffect(
  villager: Villager,
  buildings: { [key: string]: Building },
  hexSize: number
): number {
  let eqEffect = 0;
  const villagerHex = pixelToHex(villager.x, villager.y, hexSize);
  
  Object.values(buildings).forEach(building => {
    // Calculate distance
    const dx = villagerHex.q - building.gridX;
    const dy = villagerHex.r - building.gridY;
    const distance = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
    
    // Buildings affect EQ in a 3-hex radius
    if (distance <= 3) {
      // Effect diminishes with distance
      const factor = 1 - (distance / 4);
      eqEffect += building.eqImpact * factor;
    }
  });
  
  return eqEffect;
} 