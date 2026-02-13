import { useGridStore } from '../../stores/gridStore';

export function GridHeader() {
  const headers = useGridStore((s) => s.headers);

  return (
    <div className="flex">
      {headers.map((name, i) => (
        <div
          key={i}
          data-col-header={i}
          className="w-[100px] shrink-0 h-8 bg-gray-100 font-medium text-center text-sm border border-gray-200 leading-8"
        >
          {name}
        </div>
      ))}
    </div>
  );
}
