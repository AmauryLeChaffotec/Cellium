import { describe, it, expect } from 'vitest';
import { formatTimestamp } from './dateUtils';

describe('dateUtils', () => {
  describe('formatTimestamp', () => {
    it('should format ISO timestamp to French locale', () => {
      const isoTimestamp = '2026-02-12T14:30:00.000Z';
      const formatted = formatTimestamp(isoTimestamp);

      // Check for French month and proper format
      expect(formatted).toMatch(/12 février 2026 à \d{2}:\d{2}/);
    });

    it('should handle different months', () => {
      const isoTimestamp = '2026-07-25T09:15:00.000Z';
      const formatted = formatTimestamp(isoTimestamp);

      expect(formatted).toMatch(/25 juillet 2026 à \d{2}:\d{2}/);
    });

    it('should pad hours and minutes with leading zeros', () => {
      const isoTimestamp = '2026-01-05T03:05:00.000Z';
      const formatted = formatTimestamp(isoTimestamp);

      // Should have time format HH:MM
      expect(formatted).toMatch(/\d{2}:\d{2}$/);
    });
  });
});
