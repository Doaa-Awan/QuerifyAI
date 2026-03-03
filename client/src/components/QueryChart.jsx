import { useState } from 'react';

function detectChartColumns(columns, rows) {
  if (!rows?.length || !columns?.length) return null;

  const sample = rows[0];

  // Find a text/label column and a numeric column
  const labelCol = columns.find((c) => {
    const val = sample[c.name];
    return typeof val === 'string' || (val !== null && isNaN(Number(val)) === false && typeof val === 'string');
  }) ?? columns.find((c) => typeof sample[c.name] === 'string');

  const numericCol = columns.find((c) => {
    const val = sample[c.name];
    return c.name !== labelCol?.name && (typeof val === 'number' || (val !== null && !isNaN(Number(val))));
  });

  if (!labelCol || !numericCol) return null;

  // Detect if label column looks like a date/time series
  const isTimeSeries = rows.some((r) => {
    const v = String(r[labelCol.name] ?? '');
    return /\d{4}-\d{2}/.test(v) || /^\d{4}$/.test(v);
  });

  return { labelCol: labelCol.name, valueCol: numericCol.name, isTimeSeries };
}

const BAR_COLOR = '#d06a45';
const BAR_COLOR_HOVER = '#e07a55';
const CHART_HEIGHT = 200;
const CHART_PAD = { top: 12, right: 16, bottom: 48, left: 52 };
const MAX_BARS = 20;

const BarChart = ({ rows, labelCol, valueCol }) => {
  const [hovered, setHovered] = useState(null);

  const data = rows.slice(0, MAX_BARS).map((r) => ({
    label: String(r[labelCol] ?? ''),
    value: Number(r[valueCol]) || 0,
  }));

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const chartW = Math.max(data.length * 48, 300);
  const innerW = chartW - CHART_PAD.left - CHART_PAD.right;
  const innerH = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom;
  const barW = Math.max(Math.floor(innerW / data.length) - 4, 8);

  // Y-axis ticks
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (maxVal * i) / ticks);

  const fmtNum = (n) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(Math.round(n));

  return (
    <div className='chart-scroll'>
      <svg
        width={chartW}
        height={CHART_HEIGHT}
        style={{ display: 'block', overflow: 'visible' }}
        role='img'
        aria-label={`Bar chart of ${valueCol} by ${labelCol}`}
      >
        <g transform={`translate(${CHART_PAD.left},${CHART_PAD.top})`}>
          {/* Y-axis ticks and gridlines */}
          {yTicks.map((tick, i) => {
            const y = innerH - (tick / maxVal) * innerH;
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={innerW} y2={y} stroke='rgba(255,255,255,0.06)' />
                <text x={-6} y={y + 4} textAnchor='end' fontSize={9} fill='#b1a79c'>
                  {fmtNum(tick)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const x = (i / data.length) * innerW + (innerW / data.length - barW) / 2;
            const barH = (d.value / maxVal) * innerH;
            const y = innerH - barH;
            const isHov = hovered === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  fill={isHov ? BAR_COLOR_HOVER : BAR_COLOR}
                  rx={3}
                  style={{ transition: 'fill 0.1s' }}
                />
                {isHov && (
                  <text x={x + barW / 2} y={y - 5} textAnchor='middle' fontSize={9} fill='#f2efe9'>
                    {fmtNum(d.value)}
                  </text>
                )}
                <text
                  x={x + barW / 2}
                  y={innerH + 14}
                  textAnchor='middle'
                  fontSize={9}
                  fill='#b1a79c'
                  transform={`rotate(-35,${x + barW / 2},${innerH + 14})`}
                  style={{ maxWidth: '40px' }}
                >
                  {d.label.length > 12 ? d.label.slice(0, 11) + '…' : d.label}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={0} y1={0} x2={0} y2={innerH} stroke='rgba(255,255,255,0.15)' />
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke='rgba(255,255,255,0.15)' />
        </g>
      </svg>
    </div>
  );
};

const QueryChart = ({ columns, rows }) => {
  const chartInfo = detectChartColumns(columns, rows);

  if (!chartInfo) return null;

  return (
    <div className='query-chart-wrapper'>
      <div className='chart-meta'>
        <span className='chart-axis-label'>{chartInfo.valueCol}</span>
        <span className='chart-by'>by</span>
        <span className='chart-axis-label'>{chartInfo.labelCol}</span>
        {rows.length > MAX_BARS && (
          <span className='chart-truncated'>(first {MAX_BARS} rows)</span>
        )}
      </div>
      <BarChart rows={rows} labelCol={chartInfo.labelCol} valueCol={chartInfo.valueCol} />
    </div>
  );
};

export default QueryChart;
