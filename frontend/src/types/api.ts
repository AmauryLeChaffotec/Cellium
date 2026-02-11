import type { Cell } from './cell';
import type { Operation } from './operations';

export interface GridMetadata {
  headers: string[];
  columnTypes: Record<string, string>;
  rowCount: number;
  sampleRows: Record<string, Cell>[];
}

export interface CommandRequest {
  command: string;
  gridContext: GridMetadata;
}

export interface CommandResponse {
  operations: Operation[];
  description: string;
}

export interface ClarificationResponse {
  operations: [];
  clarification: string;
}

export interface ErrorResponse {
  error: string;
  code: 'INVALID_COMMAND' | 'MISSING_CONTEXT' | 'LLM_TIMEOUT' | 'LLM_ERROR';
}
