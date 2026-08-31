import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  Building,
  Tree,
  Car,
  Bird,
  Road,
  Landscape,
  TimeOfDayController,
  SkyEffects,
  AICore,
  DataStreams,
  AuroraRibbons,
  ShootingStars,
  DustMotes,
  HorizonCity,
  CameraRig,
} from './components';
import { BUILDINGS } from './cityLayout';
import colors from './colors';

/**
 * AiBricks 3D Scene - the Living Data City.
 *
 * The city is finished and alive. Scroll drives a full day-to-night cycle
 * (sunrise -> day -> golden dusk -> deep night): the TimeOfDayController
 * samples the scroll offset into shared state that everything reads -
 * sky/fog colors, the sun/moon light, star field, staggered window light-up,
 * car headlights, and the glowing data streams that flow along the roads
 * between the homes and the central AI core. Every few seconds a bright
 * pulse surges from the core to a random building - a match being made -
 * and the event goes big: window flare, a light pillar to the sky, a
 * double-ring shockwave and a dissolving beam back to the core. The core
 * itself is a beacon (sky column, counter-rotating rings, orbiting glyphs)
 * that periodically emits a 360-degree holographic scan wave across the
 * city. Night adds aurora ribbons, shooting stars and real bloom (PostFX
 * composer mounted in index.jsx); dusk adds god rays and dust motes.
 *
 * Lights: ambient + directional (sun/moon) + hemisphere (controller) and
 * one point light on the AI core orb = 4 total.
 */
export default function AiBricksScene() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      {/* Scroll-driven day-night cycle + scan wave clock + scene lighting */}
      <TimeOfDayController reducedMotion={reducedMotion} />

      {/* Intro establishing sweep, then drone drift + mouse parallax */}
      <CameraRig reducedMotion={reducedMotion} />

      {/* Stars (+twinkle layer), sun/moon discs, dusk god rays, clouds */}
      <SkyEffects reducedMotion={reducedMotion} />

      {/* Night sky spectacle: aurora ribbons + pooled shooting stars */}
      <AuroraRibbons reducedMotion={reducedMotion} />
      <ShootingStars reducedMotion={reducedMotion} />

      {/* Golden-hour dust motes over the plaza */}
      <DustMotes reducedMotion={reducedMotion} />

      {/* Distant tower silhouettes ringing the horizon (1 draw call) */}
      <HorizonCity />

      {/* Main scene group */}
      <group position={[0, 0, 0]}>
        {/* The finished city */}
        {BUILDINGS.map((building, index) => (
          <Building
            key={`building-${index}`}
            position={building.pos}
            type={building.type}
            numFloors={building.floors}
            buildingIndex={index}
          />
        ))}

        {/* The AI core - hub of every data stream */}
        <AICore reducedMotion={reducedMotion} />

        {/* Data streams flowing between homes and the core, + match pulses */}
        <DataStreams reducedMotion={reducedMotion} />

        {/* Environment elements */}
        <Landscape />
        <Road />

        {/* Trees scattered around */}
        <Tree position={[-20, 0, 3]} scale={0.9} />
        <Tree position={[20, 0, 3]} scale={0.8} />
        <Tree position={[-12, 0, -15]} scale={1.0} />
        <Tree position={[15, 0, -16]} scale={1.3} />
        <Tree position={[-8, 0, 12]} scale={0.9} />
        <Tree position={[12, 0, 13]} scale={1.1} />
        <Tree position={[5, 0, 14]} scale={0.85} />
        <Tree position={[-18, 0, -5]} scale={1.15} />

        {/* Moving cars - headlights brighten after dusk */}
        <Car position={[0, 0.3, 9]} speed={0.8} color={colors.carRed} reducedMotion={reducedMotion} />
        <Car position={[0, 0.3, 7]} speed={0.6} color={colors.carBlue} reducedMotion={reducedMotion} />

        {/* Birds - daytime only, they fade away at night */}
        <Bird position={[5, 15, 5]} scale={0.8} reducedMotion={reducedMotion} />
        <Bird position={[-8, 18, -3]} scale={1.0} reducedMotion={reducedMotion} />
        <Bird position={[12, 20, 8]} scale={0.7} reducedMotion={reducedMotion} />
        <Bird position={[-15, 16, 10]} scale={0.9} reducedMotion={reducedMotion} />
        <Bird position={[0, 22, -8]} scale={1.1} reducedMotion={reducedMotion} />
      </group>

      {/* Ground plane - extends to horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color={colors.groundBase} roughness={0.95} fog={true} />
      </mesh>
    </>
  );
}
