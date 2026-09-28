import { describe, it, expect } from 'vitest';
import { KNOWLEDGE_TOPICS } from '../src/data/knowledge-topics';
import { KnowledgeTopic } from '../src/types/survey';

describe('Knowledge Topic Provenance & Verification Badge System', () => {
  it('should contain exactly 9 authoritative survey engineering topics', () => {
    expect(KNOWLEDGE_TOPICS).toBeDefined();
    expect(Array.isArray(KNOWLEDGE_TOPICS)).toBe(true);
    expect(KNOWLEDGE_TOPICS.length).toBe(9);

    const expectedTopicIds = [
      'differential-leveling-survey',
      'theodolite-station-setup',
      'closed-loop-traverse',
      'link-open-traverse',
      'gnss-rtk-static-survey',
      'uav-drone-photogrammetry',
      'terrestrial-lidar-slam',
      'hydrographic-bathymetric-survey',
      'tbm-tunnel-guidance-survey'
    ];

    const actualTopicIds = KNOWLEDGE_TOPICS.map(t => t.id);
    expect(actualTopicIds).toEqual(expectedTopicIds);
  });

  it('should ensure all 9 topics are marked with verificationStatus === "draft" pending academic/field peer review', () => {
    KNOWLEDGE_TOPICS.forEach(topic => {
      expect(topic.verificationStatus).toBe('draft');
      expect(topic.verificationStatus).not.toBe('verified');
    });
  });

  it('should verify that all 9 topics have substantive verificationProof citation references', () => {
    const recognizedAuthorities = [
      'RTSD',
      'กรมแผนที่ทหาร',
      'FGCC',
      'KU Geomatics',
      'มหาวิทยาลัยเกษตรศาสตร์',
      'กรมที่ดิน',
      'CAAT',
      'ASPRS',
      'EIT',
      'วสท.',
      'กรมทางหลวง',
      'การรถไฟ',
      'IHO',
      'BTS',
      'ICE',
      'รฟม.'
    ];

    KNOWLEDGE_TOPICS.forEach(topic => {
      expect(topic.verificationProof).toBeDefined();
      expect(typeof topic.verificationProof).toBe('string');
      expect(topic.verificationProof!.trim().length).toBeGreaterThan(20);

      // Verify that citations reference recognized standards or official academic authorities
      const hasRecognizedCitation = recognizedAuthorities.some(authority =>
        topic.verificationProof!.includes(authority)
      );
      expect(
        hasRecognizedCitation,
        `Topic "${topic.id}" verificationProof must reference a recognized survey authority: "${topic.verificationProof}"`
      ).toBe(true);
    });
  });

  it('should allow valid transition from "draft" to "verified" adhering to KnowledgeTopic schema', () => {
    const originalTopic = KNOWLEDGE_TOPICS[0];

    // Simulate transition to 'verified' with authoritative peer-reviewed proof
    const verifiedTopic: KnowledgeTopic = {
      ...originalTopic,
      verificationStatus: 'verified',
      verificationProof: 'กรมแผนที่ทหาร (RTSD) มาตรฐานการทำระดับชั้น 1 พ.ศ. 2562 และการรับรองผลการทดสอบภาคสนามโดยคณะวิศวกรรมศาสตร์ มก.'
    };

    expect(verifiedTopic.verificationStatus).toBe('verified');
    expect(verifiedTopic.verificationProof).toBeDefined();
    expect(verifiedTopic.id).toBe(originalTopic.id);

    // Schema type test: only 'draft' | 'verified' are valid values
    const validStatuses: ('draft' | 'verified')[] = ['draft', 'verified'];
    expect(validStatuses.includes(verifiedTopic.verificationStatus)).toBe(true);
  });

  it('should verify that all topics possess valid downstreamWorkflow contracts for tool navigation', () => {
    const validToolTabs = ['coord', 'converter', 'traverse', 'leveling', 'map'];

    KNOWLEDGE_TOPICS.forEach(topic => {
      expect(topic.downstreamWorkflow).toBeDefined();
      const workflow = topic.downstreamWorkflow!;

      expect(typeof workflow.outputDataFormat).toBe('string');
      expect(workflow.outputDataFormat.trim().length).toBeGreaterThan(0);

      expect(typeof workflow.outputDescription).toBe('string');
      expect(workflow.outputDescription.trim().length).toBeGreaterThan(0);

      expect(typeof workflow.nextStepTitle).toBe('string');
      expect(workflow.nextStepTitle.trim().length).toBeGreaterThan(0);

      expect(typeof workflow.nextStepProcedure).toBe('string');
      expect(workflow.nextStepProcedure.trim().length).toBeGreaterThan(0);

      if (workflow.recommendedToolTab) {
        expect(validToolTabs.includes(workflow.recommendedToolTab)).toBe(true);
      }

      if (workflow.toolActionLabel) {
        expect(typeof workflow.toolActionLabel).toBe('string');
        expect(workflow.toolActionLabel.trim().length).toBeGreaterThan(0);
      }
    });
  });
});
