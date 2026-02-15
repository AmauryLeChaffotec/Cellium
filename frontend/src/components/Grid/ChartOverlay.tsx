import { useRef, useCallback, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell as RechartsCell,
} from 'recharts';
import type { Chart } from '../../types/chart';
import { useGridStore } from '../../stores/gridStore';
import { evaluateFormula } from '../../utils/formulaEvaluator';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

interface ChartData {
  labels: string[];
  series: { name: string; data: number[] }[];
}

function parseRange(dataRange: string): { startCol: number; startRow: number; endCol: number; endRow: number } | null {
  const match = dataRange.match(/^([A-Z])(\d+):([A-Z])(\d+)$/i);
  if (!match) return null;
  return {
    startCol: match[1].toUpperCase().charCodeAt(0) - 65,
    startRow: parseInt(match[2], 10),
    endCol: match[3].toUpperCase().charCodeAt(0) - 65,
    endRow: parseInt(match[4], 10),
  };
}

function getChartData(dataRange: string): ChartData | null {
  const parsed = parseRange(dataRange);
  if (!parsed) return null;

  const { cells, headers } = useGridStore.getState();
  const { startCol, startRow, endCol, endRow } = parsed;

  const labels: string[] = [];
  const seriesCount = endCol - startCol; // columns after the first are series
  if (seriesCount < 1) return null;

  const seriesData: number[][] = Array.from({ length: seriesCount }, () => []);
  const seriesNames: string[] = [];

  for (let c = startCol + 1; c <= endCol; c++) {
    seriesNames.push(headers[c] ?? String.fromCharCode(65 + c));
  }

  for (let r = startRow; r <= endRow; r++) {
    // Label from first column
    const labelCol = String.fromCharCode(65 + startCol);
    const labelCellId = `${labelCol}${r}`;
    const labelCell = cells[labelCellId];
    if (labelCell?.formula) {
      const val = evaluateFormula(labelCell.formula, cells, headers);
      labels.push(String(val ?? ''));
    } else {
      labels.push(String(labelCell?.value ?? ''));
    }

    // Data from remaining columns
    for (let c = startCol + 1; c <= endCol; c++) {
      const colLetter = String.fromCharCode(65 + c);
      const cellId = `${colLetter}${r}`;
      const cell = cells[cellId];
      let val = 0;
      if (cell?.formula) {
        const result = evaluateFormula(cell.formula, cells, headers);
        val = typeof result === 'number' ? result : parseFloat(String(result)) || 0;
      } else if (cell?.value !== undefined && cell?.value !== null && cell?.value !== '') {
        val = typeof cell.value === 'number' ? cell.value : parseFloat(String(cell.value)) || 0;
      }
      seriesData[c - startCol - 1].push(val);
    }
  }

  return {
    labels,
    series: seriesNames.map((name, i) => ({ name, data: seriesData[i] })),
  };
}

interface ChartOverlayProps {
  chart: Chart;
  onEdit: (chart: Chart) => void;
}

export function ChartOverlay({ chart, onEdit }: ChartOverlayProps) {
  const updateChart = useGridStore((s) => s.updateChart);
  const deleteChart = useGridStore((s) => s.deleteChart);
  const cells = useGridStore((s) => s.cells);
  const headers = useGridStore((s) => s.headers);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Re-read data reactively (cells/headers in deps)
  void cells;
  void headers;
  const chartData = getChartData(chart.dataRange);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startLeft: chart.left, startTop: chart.top };
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      updateChart(chart.id, {
        left: Math.max(0, dragRef.current.startLeft + dx),
        top: Math.max(0, dragRef.current.startTop + dy),
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [chart.id, chart.left, chart.top, updateChart]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: chart.width, startH: chart.height };
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = moveEvent.clientX - resizeRef.current.startX;
      const dy = moveEvent.clientY - resizeRef.current.startY;
      updateChart(chart.id, {
        width: Math.max(200, resizeRef.current.startW + dx),
        height: Math.max(150, resizeRef.current.startH + dy),
      });
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  }, [chart.id, chart.width, chart.height, updateChart]);

  const handleDelete = useCallback(() => {
    deleteChart(chart.id);
  }, [chart.id, deleteChart]);

  // Build recharts data array
  const rechartsData = chartData
    ? chartData.labels.map((label, i) => {
        const entry: Record<string, string | number> = { name: label };
        chartData.series.forEach((s) => {
          entry[s.name] = s.data[i] ?? 0;
        });
        return entry;
      })
    : [];

  const renderChart = () => {
    if (!chartData || rechartsData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          Aucune donnée pour la plage {chart.dataRange}
        </div>
      );
    }

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {chartData.series.map((s, i) => (
                <Bar key={s.name} dataKey={s.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {chartData.series.map((s, i) => (
                <Line key={s.name} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie': {
        const pieData = chartData.labels.map((label, i) => ({
          name: label,
          value: chartData.series[0]?.data[i] ?? 0,
        }));
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label={{ fontSize: 10 }}>
                {pieData.map((_, i) => (
                  <RechartsCell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {chartData.series.map((s, i) => (
                <Area key={s.name} type="monotone" dataKey={s.name} fill={COLORS[i % COLORS.length]} fillOpacity={0.3} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col overflow-hidden"
      style={{
        left: chart.left,
        top: chart.top,
        width: chart.width,
        height: chart.height,
        zIndex: 30,
        cursor: isDragging ? 'grabbing' : undefined,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200 cursor-grab select-none shrink-0"
        onMouseDown={handleDragStart}
      >
        <span className="text-xs font-semibold text-gray-700 truncate">{chart.name}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(chart)}
            className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-gray-100"
            title="Modifier"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
            title="Supprimer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart content */}
      <div className="flex-1 p-2 min-h-0" style={{ pointerEvents: isDragging || isResizing ? 'none' : 'auto' }}>
        {renderChart()}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        onMouseDown={handleResizeStart}
      >
        <svg className="w-4 h-4 text-gray-300" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="8" cy="12" r="1.5" />
          <circle cx="12" cy="8" r="1.5" />
        </svg>
      </div>
    </div>
  );
}
