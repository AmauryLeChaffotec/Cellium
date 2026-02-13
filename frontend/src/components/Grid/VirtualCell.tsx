import type { CSSProperties, ReactElement } from 'react';
import { coordsToCellId } from '../../utils/cellUtils';
import { Cell } from './Cell';

export function VirtualCell(props: {
  ariaAttributes: { 'aria-colindex': number; role: 'gridcell' };
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
}): ReactElement {
  const row = props.rowIndex + 1;
  const cellId = coordsToCellId(row, props.columnIndex);

  return (
    <div style={{ ...props.style, overflow: 'visible' }}>
      <Cell cellId={cellId} />
    </div>
  );
}
