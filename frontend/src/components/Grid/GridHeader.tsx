import { columnIndexToLetter } from '../../utils/cellUtils';

interface GridHeaderProps {
  colCount: number;
}

export function GridHeader({ colCount }: GridHeaderProps) {
  return (
    <div className="flex">
      {Array.from({ length: colCount }, (_, i) => (
        <div
          key={i}
          data-col-header={i}
          className="w-[100px] shrink-0 h-8 bg-gray-100 font-medium text-center text-sm border border-gray-200 leading-8"
        >
          {columnIndexToLetter(i)}
        </div>
      ))}
    </div>
  );
}
