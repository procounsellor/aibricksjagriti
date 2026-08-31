/**
 * Static city layout - shared by the scene (which renders the buildings)
 * and the data-stream system (which needs building positions/heights to
 * aim match pulses). Buildings are FINISHED from frame one; there is no
 * construction timeline any more.
 */

export const BUILDINGS = [
  // Row 1 (Front) - Left side of road
  { type: 'house', pos: [-12, 0, 3], floors: 3 },
  { type: 'apartment', pos: [-18, 0, 3], floors: 10 },
  { type: 'house', pos: [-24, 0, 3], floors: 2 },

  // Row 1 (Front) - Right side of road
  { type: 'house', pos: [12, 0, 3], floors: 3 },
  { type: 'apartment', pos: [18, 0, 3], floors: 11 },
  { type: 'house', pos: [24, 0, 3], floors: 2 },

  // Row 2 (Mid-front) - Left side
  { type: 'apartment', pos: [-12, 0, -3], floors: 14 },
  { type: 'apartment', pos: [-18, 0, -3], floors: 16 },
  { type: 'apartment', pos: [-24, 0, -3], floors: 12 },

  // Row 2 (Mid-front) - Right side
  { type: 'apartment', pos: [12, 0, -3], floors: 13 },
  { type: 'apartment', pos: [18, 0, -3], floors: 15 },
  { type: 'apartment', pos: [24, 0, -3], floors: 9 },

  // Row 3 (Center) - Main skyscrapers
  { type: 'skyscraper', pos: [-6, 0, -10], floors: 28 },
  { type: 'skyscraper', pos: [0, 0, -10], floors: 30 },
  { type: 'skyscraper', pos: [6, 0, -10], floors: 25 },

  // Row 4 (Back) - Mixed apartments
  { type: 'apartment', pos: [-18, 0, -17], floors: 18 },
  { type: 'apartment', pos: [-12, 0, -17], floors: 14 },
  { type: 'apartment', pos: [12, 0, -17], floors: 17 },
  { type: 'apartment', pos: [18, 0, -17], floors: 12 },

  // Row 5 (Far back) - Tallest skyscraper
  { type: 'skyscraper', pos: [0, 0, -24], floors: 32 },
];

// The AI core landmark sits in the open plaza between the front rows and
// the skyscraper row - the hub every data stream connects to.
export const CORE_POSITION = [0, 0, -3];
export const CORE_ORB_Y = 9.2;

/**
 * Final rendered height of a building (must match the dimension math in
 * SkyscraperBuilding / ApartmentBuilding / HouseBuilding).
 */
export function buildingHeight(b) {
  if (b.type === 'skyscraper') return b.floors * 0.5; // capped floors, stretched height
  if (b.type === 'apartment') return Math.min(b.floors, 8) * 0.6;
  return 2 * 1.2; // house: 2 floors x 1.2
}
