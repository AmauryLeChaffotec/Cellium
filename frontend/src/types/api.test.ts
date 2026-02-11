import { describe, it, expect } from 'vitest';
import type { CommandRequest, CommandResponse, ClarificationResponse, ErrorResponse, GridMetadata } from './api';

describe('API types', () => {
  it('should create a valid GridMetadata', () => {
    const meta: GridMetadata = {
      headers: ['A', 'B', 'C'],
      columnTypes: { A: 'string', B: 'number', C: 'string' },
      rowCount: 100,
      sampleRows: [
        { A1: { id: 'A1', value: 'Hello' }, B1: { id: 'B1', value: 42 } },
      ],
    };
    expect(meta.headers).toHaveLength(3);
    expect(meta.rowCount).toBe(100);
  });

  it('should create a valid CommandRequest', () => {
    const req: CommandRequest = {
      command: 'Ajoute une colonne Total',
      gridContext: {
        headers: ['A'],
        columnTypes: { A: 'number' },
        rowCount: 10,
        sampleRows: [],
      },
    };
    expect(req.command).toBe('Ajoute une colonne Total');
  });

  it('should create a valid CommandResponse', () => {
    const res: CommandResponse = {
      operations: [{ type: 'SET_VALUE', cellId: 'A1', value: 42 }],
      description: 'Valeur définie',
    };
    expect(res.operations).toHaveLength(1);
  });

  it('should create a ClarificationResponse', () => {
    const res: ClarificationResponse = {
      operations: [],
      clarification: 'Pouvez-vous préciser la colonne ?',
    };
    expect(res.operations).toHaveLength(0);
    expect(res.clarification).toBeTruthy();
  });

  it('should create an ErrorResponse', () => {
    const res: ErrorResponse = {
      error: 'Service unavailable',
      code: 'LLM_TIMEOUT',
    };
    expect(res.code).toBe('LLM_TIMEOUT');
  });
});
