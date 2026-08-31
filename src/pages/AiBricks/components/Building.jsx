import React from 'react';
import { SkyscraperBuilding } from './SkyscraperBuilding';
import { ApartmentBuilding } from './ApartmentBuilding';
import { HouseBuilding } from './HouseBuilding';

/**
 * Building Router Component
 * Routes to specific building type components. Buildings are fully built;
 * `buildingIndex` links each one to its cityState.matchGlow slot.
 */
export function Building({ position, type, numFloors, buildingIndex }) {
  const props = { position, numFloors, buildingIndex };

  switch (type) {
    case 'skyscraper':
      return <SkyscraperBuilding {...props} />;
    case 'apartment':
      return <ApartmentBuilding {...props} />;
    case 'house':
      return <HouseBuilding {...props} />;
    default:
      return <SkyscraperBuilding {...props} />;
  }
}
