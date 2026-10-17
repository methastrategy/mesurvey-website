import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  DragonSurveyorLoader,
  DEFAULT_SURVEY_MESSAGES,
  FRAME_DESCRIPTIONS,
} from '../src/components/common/DragonSurveyorLoader';
import {
  DragonWalkingTracker,
  WALK_FRAME_DESCRIPTIONS,
} from '../src/components/common/DragonWalkingTracker';
import { GeomaticsLoadingFallback } from '../src/components/layout/GeomaticsLoadingFallback';

describe('Surveyor & Walking Dragon Mascot Animation Suite', () => {
  const mascotDir = path.resolve(process.cwd(), 'public/assets/mascot');

  describe('6-Frame Surveyor Action Mascot', () => {
    it('verifies all surveyor animation assets exist on disk', () => {
      const requiredFiles = [
        'sprite_dragon_surveyor_action_6frames.jpg',
        'sprite_dragon_surveyor_action_6frames.png',
        'dragon_surveyor_loading.webp',
        'dragon_surveyor_loading.gif',
      ];

      for (const file of requiredFiles) {
        const fullPath = path.join(mascotDir, file);
        expect(fs.existsSync(fullPath), `Missing required asset: ${file}`).toBe(true);
        const stat = fs.statSync(fullPath);
        expect(stat.size).toBeGreaterThan(1000);
      }
    });

    it('verifies all 6 extracted surveyor frames exist and are non-empty', () => {
      const framesDir = path.join(mascotDir, 'frames');
      expect(fs.existsSync(framesDir)).toBe(true);

      for (let i = 0; i < 6; i++) {
        const framePath = path.join(framesDir, `frame_${i}.png`);
        expect(fs.existsSync(framePath), `Missing frame ${i}`).toBe(true);
        const stat = fs.statSync(framePath);
        expect(stat.size).toBeGreaterThan(500);
      }
    });

    it('validates 6 survey engineering action descriptions', () => {
      expect(FRAME_DESCRIPTIONS).toHaveLength(6);
      expect(FRAME_DESCRIPTIONS[0]).toContain('เฟรม 1');
      expect(FRAME_DESCRIPTIONS[2]).toContain('ส่องเลนส์ตา');
      expect(FRAME_DESCRIPTIONS[5]).toContain('Thumbs Up');
    });

    it('validates survey calculation messages loop array', () => {
      expect(DEFAULT_SURVEY_MESSAGES).toHaveLength(6);
      expect(DEFAULT_SURVEY_MESSAGES[0]).toContain('Total Station');
      expect(DEFAULT_SURVEY_MESSAGES[1]).toContain('EDM Slope Distance');
      expect(DEFAULT_SURVEY_MESSAGES[3]).toContain('UTM Zone 47N');
    });

    it('confirms DragonSurveyorLoader and GeomaticsLoadingFallback component signatures', () => {
      expect(DragonSurveyorLoader).toBeDefined();
      expect(typeof DragonSurveyorLoader).toBe('function');
      expect(GeomaticsLoadingFallback).toBeDefined();
      expect(typeof GeomaticsLoadingFallback).toBe('function');
    });
  });

  describe('8-Frame Walking GPS Navigator Mascot', () => {
    it('verifies all walking animation assets exist on disk', () => {
      const requiredFiles = [
        'sprite_dragon_walk_8frames.jpg',
        'sprite_dragon_walk_8frames.png',
        'dragon_walk.webp',
        'dragon_walk.gif',
      ];

      for (const file of requiredFiles) {
        const fullPath = path.join(mascotDir, file);
        expect(fs.existsSync(fullPath), `Missing required asset: ${file}`).toBe(true);
        const stat = fs.statSync(fullPath);
        expect(stat.size).toBeGreaterThan(1000);
      }
    });

    it('verifies all 8 extracted walking frames exist and are non-empty', () => {
      const framesDir = path.join(mascotDir, 'frames_walk');
      expect(fs.existsSync(framesDir)).toBe(true);

      for (let i = 0; i < 8; i++) {
        const framePath = path.join(framesDir, `frame_${i}.png`);
        expect(fs.existsSync(framePath), `Missing walking frame ${i}`).toBe(true);
        const stat = fs.statSync(framePath);
        expect(stat.size).toBeGreaterThan(500);
      }
    });

    it('validates 8 walk cycle stride descriptions', () => {
      expect(WALK_FRAME_DESCRIPTIONS).toHaveLength(8);
      expect(WALK_FRAME_DESCRIPTIONS[0]).toContain('เฟรม 1');
      expect(WALK_FRAME_DESCRIPTIONS[6]).toContain('Mid-Stride');
      expect(WALK_FRAME_DESCRIPTIONS[7]).toContain('Walk Cycle');
    });

    it('confirms DragonWalkingTracker component signature', () => {
      expect(DragonWalkingTracker).toBeDefined();
      expect(typeof DragonWalkingTracker).toBe('function');
    });
  });
});
