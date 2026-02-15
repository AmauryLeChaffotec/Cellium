export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface Chart {
  id: string;
  name: string;
  type: ChartType;
  dataRange: string;
  left: number;
  top: number;
  width: number;
  height: number;
}
