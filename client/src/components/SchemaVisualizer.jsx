import { Fragment, useMemo, useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const HEADER_H = 40;  // px — must match nodeStyles.header height
const ROW_H    = 28;  // px — must match nodeStyles.colRow height

// ── TableNode ─────────────────────────────────────────────────────────────────
// Defined at module level so ReactFlow never re-creates the component reference.

function TableNode({ data }) {
  const { table, referencedCols, onColHover, onColLeave } = data;
  const [hoveredCol, setHoveredCol] = useState(null);

  return (
    <div style={nodeStyles.card}>
      <div style={nodeStyles.header}>{table.name}</div>

      {table.columns?.map((col, i) => {
        const midY        = HEADER_H + i * ROW_H + ROW_H / 2;
        const needsTarget = col.isPrimary || referencedCols?.has(col.name);
        const isRelated   = col.isForeign || needsTarget;
        const isHovered   = hoveredCol === col.name;

        return (
          <Fragment key={col.name}>
            <div
              style={{
                ...nodeStyles.colRow,
                ...(isHovered ? { background: 'rgba(208,106,69,0.13)' } : {}),
                cursor: isRelated ? 'crosshair' : 'default',
              }}
              onMouseEnter={isRelated ? () => {
                setHoveredCol(col.name);
                onColHover?.(table.name, col.name);
              } : undefined}
              onMouseLeave={isRelated ? () => {
                setHoveredCol(null);
                onColLeave?.();
              } : undefined}
            >
              <span style={nodeStyles.colName}>{col.name}</span>
              <span style={nodeStyles.colType}>{col.dataType}</span>
              {col.isPrimary && <span style={nodeStyles.pkBadge}>PK</span>}
              {col.isForeign && (
                <span style={nodeStyles.fkBadge}>FK → {col.foreignTable}</span>
              )}
            </div>

            {/* Incoming FK edges land here (left side, per referenced/PK column) */}
            {needsTarget && (
              <Handle
                type="target"
                position={Position.Left}
                id={col.name}
                style={{ ...handleStyle, top: midY }}
              />
            )}

            {/* Outgoing FK edges leave from here (right side, per FK column) */}
            {col.isForeign && (
              <Handle
                type="source"
                position={Position.Right}
                id={col.name}
                style={{ ...handleStyle, top: midY }}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

const handleStyle = {
  background: 'var(--accent)',
  width: 8,
  height: 8,
  border: '2px solid var(--surface-strong)',
};

const nodeStyles = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 8,
    width: 260,
    fontFamily: 'inherit',
    fontSize: 12,
    color: 'var(--ink)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  header: {
    background: 'var(--surface-strong)',
    padding: '8px 12px',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.02em',
    borderBottom: '1px solid var(--line)',
    color: 'var(--ink)',
    height: HEADER_H,
    boxSizing: 'border-box',
  },
  colRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 12px',
    height: ROW_H,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    gap: 6,
    boxSizing: 'border-box',
  },
  colName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  colType: {
    color: 'var(--muted)',
    fontSize: 10,
    flexShrink: 0,
    maxWidth: 70,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pkBadge: {
    background: '#2a4a2a',
    color: '#7ecb7e',
    borderRadius: 3,
    padding: '1px 5px',
    fontSize: 9,
    fontWeight: 700,
    flexShrink: 0,
    letterSpacing: '0.05em',
  },
  fkBadge: {
    background: '#2a2a4a',
    color: '#8888e8',
    borderRadius: 3,
    padding: '1px 5px',
    fontSize: 9,
    fontWeight: 700,
    flexShrink: 0,
    letterSpacing: '0.05em',
    maxWidth: 110,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

// ── buildNodes ────────────────────────────────────────────────────────────────
// Layered layout: level 0 = pure parent/reference tables (no outgoing FKs),
// higher levels = tables with deeper FK chains. Level maps to x-column.

function buildNodes(tables, onColHover, onColLeave) {
  if (!tables?.length) return [];

  const COL_WIDTH = 320;
  const ROW_GAP  = 40;
  const PADDING  = 60;

  const tableNames = new Set(tables.map(t => t.name));
  const tableMap   = Object.fromEntries(tables.map(t => [t.name, t]));

  // Pre-compute which columns in each table are referenced by other tables' FKs
  const referencedColsMap = new Map(tables.map(t => [t.name, new Set()]));
  tables.forEach(t => {
    t.columns?.forEach(col => {
      if (col.isForeign && col.foreignTable && col.foreignColumn &&
          referencedColsMap.has(col.foreignTable)) {
        referencedColsMap.get(col.foreignTable).add(col.foreignColumn);
      }
    });
  });

  // Build outgoing + incoming FK maps (edges within this table set only)
  const outgoing = new Map(tables.map(t => [t.name, new Set()]));
  const incoming = new Map(tables.map(t => [t.name, new Set()]));
  tables.forEach(t => {
    t.columns?.forEach(col => {
      if (col.isForeign && col.foreignTable &&
          tableNames.has(col.foreignTable) && col.foreignTable !== t.name) {
        outgoing.get(t.name).add(col.foreignTable);
        incoming.get(col.foreignTable).add(t.name);
      }
    });
  });

  // Assign levels via DFS with cycle detection
  const levels  = new Map();
  const inStack = new Set();
  const getLevel = (name) => {
    if (levels.has(name)) return levels.get(name);
    if (inStack.has(name)) { levels.set(name, 0); return 0; }
    inStack.add(name);
    const outs  = outgoing.get(name) ?? new Set();
    const level = outs.size === 0 ? 0 : 1 + Math.max(...[...outs].map(getLevel));
    levels.set(name, level);
    inStack.delete(name);
    return level;
  };
  tables.forEach(t => getLevel(t.name));

  // degree = distinct tables connected via any FK edge (in or out)
  const degree = (name) =>
    (outgoing.get(name)?.size ?? 0) + (incoming.get(name)?.size ?? 0);

  // Group tables by level; within each level sort by degree descending (most connected first)
  const byLevel = new Map();
  tables.forEach(t => {
    const l = levels.get(t.name) ?? 0;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l).push(t.name);
  });
  byLevel.forEach(names => {
    names.sort((a, b) => degree(b) - degree(a));
  });

  const estHeight = (name) => {
    const t = tableMap[name];
    if (!t) return 200;
    return HEADER_H + (t.columns?.length ?? 0) * ROW_H;
  };

  // Vertical layout: level 0 = top row (parents), deeper levels below (children)
  // Within each row: most-connected table leftmost, spread horizontally
  const sortedLevels = [...byLevel.keys()].sort((a, b) => a - b);

  // Row height per level = tallest node in that level
  const levelH = new Map(
    sortedLevels.map(l => [l, Math.max(...byLevel.get(l).map(estHeight))])
  );

  // Cumulative y offsets per level
  const levelY = new Map();
  let cumY = PADDING;
  sortedLevels.forEach(l => {
    levelY.set(l, cumY);
    cumY += levelH.get(l) + ROW_GAP;
  });

  // Center each row relative to the widest row (funnel/diamond shape)
  const maxRowCount = Math.max(...sortedLevels.map(l => byLevel.get(l).length));
  const maxRowPx    = maxRowCount * COL_WIDTH;

  const posMap = new Map();
  sortedLevels.forEach(level => {
    const names  = byLevel.get(level);
    const y      = levelY.get(level);
    const rowPx  = names.length * COL_WIDTH;
    const startX = PADDING + (maxRowPx - rowPx) / 2;
    names.forEach((name, i) => {
      posMap.set(name, { x: startX + i * COL_WIDTH, y });
    });
  });

  return tables.map(t => ({
    id:       t.name,
    type:     'tableNode',
    position: posMap.get(t.name) ?? { x: PADDING, y: PADDING },
    data:     {
      table:         t,
      referencedCols: referencedColsMap.get(t.name),
      onColHover,
      onColLeave,
    },
  }));
}

// ── buildEdges ────────────────────────────────────────────────────────────────
// All edges start hidden; they are revealed on column hover via setEdges.

function buildEdges(tables) {
  if (!tables?.length) return [];

  const tableNames = new Set(tables.map(t => t.name));
  const edges = [];

  tables.forEach(table => {
    table.columns?.forEach(col => {
      if (!col.isForeign || !col.foreignTable) return;
      if (!tableNames.has(col.foreignTable)) return;
      if (table.name === col.foreignTable) return;

      edges.push({
        id:           `${table.name}-${col.name}`,
        source:       table.name,
        sourceHandle: col.name,
        target:       col.foreignTable,
        targetHandle: col.foreignColumn ?? undefined,
        hidden:       true,                            // hidden until hover
        type:         'smoothstep',
        style:        { stroke: '#d06a45', strokeWidth: 1.5, strokeOpacity: 0.9 },
        markerEnd:    { type: MarkerType.ArrowClosed, color: '#d06a45', width: 12, height: 12 },
      });
    });
  });

  return edges;
}

// ── SchemaVisualizerInner ─────────────────────────────────────────────────────
// Must be inside ReactFlowProvider to use useReactFlow.

const NODE_TYPES = { tableNode: TableNode };

function SchemaVisualizerInner({ tables, onBack }) {
  const { setEdges } = useReactFlow();

  const showEdgesFor = useCallback((nodeId, colName) => {
    setEdges(eds => eds.map(e => ({
      ...e,
      hidden: !(
        (e.source === nodeId && e.sourceHandle === colName) ||
        (e.target === nodeId && e.targetHandle === colName)
      ),
    })));
  }, [setEdges]);

  const hideAllEdges = useCallback(() => {
    setEdges(eds => eds.map(e => ({ ...e, hidden: true })));
  }, [setEdges]);

  const nodes = useMemo(
    () => buildNodes(tables, showEdgesFor, hideAllEdges),
    [tables, showEdgesFor, hideAllEdges],
  );
  const edges = useMemo(() => buildEdges(tables), [tables]);

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'radial-gradient(circle at 80% 10%, rgba(208, 106, 69, 0.35), transparent 45%), radial-gradient(circle at 10% 90%, rgba(110, 88, 70, 0.25), transparent 50%), linear-gradient(140deg, var(--bg), var(--bg-strong))' }}>
      <button
        className='btn ghost btn-nav btn-back'
        type='button'
        onClick={onBack}
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}
      >
        Back
      </button>
      <ReactFlow
        defaultNodes={nodes}
        defaultEdges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
      >
        <Background color='#333' variant={BackgroundVariant.Lines} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

// ── SchemaVisualizer ──────────────────────────────────────────────────────────

export default function SchemaVisualizer({ tables = [], onBack }) {
  return (
    <ReactFlowProvider>
      <SchemaVisualizerInner tables={tables} onBack={onBack} />
    </ReactFlowProvider>
  );
}
