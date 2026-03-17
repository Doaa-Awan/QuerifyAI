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

// ── Constants ─────────────────────────────────────────────────────────────────

const HEADER_H = 40;  // px — must match nodeStyles.header height
const ROW_H    = 28;  // px — must match nodeStyles.colRow height

// ── TableNode ─────────────────────────────────────────────────────────────────
// Defined at module level so ReactFlow never re-creates the component reference.

function TableNode({ data }) {
  const { table, referencedCols, onColHover, onColLeave, highlighted, highlightedCols } = data;
  const [hoveredCol, setHoveredCol] = useState(null);

  const cardStyle = {
    ...nodeStyles.card,
    ...(highlighted === 'self'
      ? { border: '1.5px solid #d06a45',
          boxShadow: '0 0 0 2px rgba(208,106,69,0.25), 0 4px 16px rgba(0,0,0,0.4)' }
      : highlighted === 'connected'
      ? { border: '1.5px solid rgba(208,106,69,0.5)',
          boxShadow: '0 0 0 1px rgba(208,106,69,0.12), 0 4px 16px rgba(0,0,0,0.4)' }
      : {}),
  };

  return (
    <div style={cardStyle}>
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
                ...(isHovered || highlightedCols?.has(col.name) ? { background: 'rgba(208,106,69,0.13)' } : {}),
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

  const COL_WIDTH = 300;
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

  const estHeight = (name) => {
    const t = tableMap[name];
    if (!t) return 200;
    return HEADER_H + (t.columns?.length ?? 0) * ROW_H;
  };

  // Sort: level ASC → degree DESC → name (parents first, then high-connectivity, then alpha)
  const sorted = [...tables].sort((a, b) => {
    const la = levels.get(a.name) ?? 0, lb = levels.get(b.name) ?? 0;
    if (la !== lb) return la - lb;
    const da = degree(a.name), db = degree(b.name);
    if (da !== db) return db - da;
    return a.name.localeCompare(b.name);
  });

  const N_COLS  = Math.min(5, Math.max(3, Math.ceil(Math.sqrt(sorted.length))));
  const COL_GAP = 20;
  const ROW_GAP = 20;

  // Variable row heights: each grid row = tallest node in that row
  const rowCount = Math.ceil(sorted.length / N_COLS);
  const rowHeights = Array.from({ length: rowCount }, (_, row) => {
    let maxH = 0;
    for (let col = 0; col < N_COLS; col++) {
      const idx = row * N_COLS + col;
      if (idx < sorted.length) maxH = Math.max(maxH, estHeight(sorted[idx].name));
    }
    return maxH;
  });

  const posMap = new Map();
  sorted.forEach((t, i) => {
    const col = i % N_COLS;
    const row = Math.floor(i / N_COLS);
    const x   = PADDING + col * (COL_WIDTH + COL_GAP);
    const y   = PADDING + rowHeights.slice(0, row).reduce((s, h) => s + h + ROW_GAP, 0);
    posMap.set(t.name, { x, y });
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
        hidden:       false,
        type:         'smoothstep',
        style:        { stroke: '#555', strokeWidth: 1.5, strokeOpacity: 0.7 },
        markerEnd:    { type: MarkerType.ArrowClosed, color: '#555', width: 12, height: 12 },
      });
    });
  });

  return edges;
}

// ── SchemaVisualizerInner ─────────────────────────────────────────────────────
// Must be inside ReactFlowProvider to use useReactFlow.

const NODE_TYPES = { tableNode: TableNode };

function SchemaVisualizerInner({ tables, onBack }) {
  const { setEdges, setNodes, getEdges } = useReactFlow();
  const [colInfo, setColInfo] = useState(null);

  const showEdgesFor = useCallback((nodeId, colName) => {
    const connectedNodeCols = new Map();
    const connections = [];
    getEdges()
      .filter(e =>
        (e.source === nodeId && e.sourceHandle === colName) ||
        (e.target === nodeId && e.targetHandle === colName)
      )
      .forEach(e => {
        const otherId  = e.source === nodeId ? e.target       : e.source;
        const otherCol = e.source === nodeId ? e.targetHandle : e.sourceHandle;
        if (!connectedNodeCols.has(otherId)) connectedNodeCols.set(otherId, new Set());
        if (otherCol) connectedNodeCols.get(otherId).add(otherCol);
        connections.push({
          tableName: otherId,
          colName:   otherCol,
          direction: e.source === nodeId ? 'out' : 'in',
        });
      });

    const colDef = tables.find(t => t.name === nodeId)?.columns?.find(c => c.name === colName);
    setColInfo({
      tableName: nodeId,
      colName,
      isPrimary: colDef?.isPrimary ?? false,
      isForeign: colDef?.isForeign ?? false,
      connections,
    });

    setEdges(eds => eds.map(e => {
      const active =
        (e.source === nodeId && e.sourceHandle === colName) ||
        (e.target === nodeId && e.targetHandle === colName);
      return {
        ...e,
        style:     active ? { stroke: '#d06a45', strokeWidth: 1.5, strokeOpacity: 0.9 }
                          : { stroke: '#555',    strokeWidth: 1.5, strokeOpacity: 0.3 },
        markerEnd: { type: MarkerType.ArrowClosed,
                     color: active ? '#d06a45' : '#555', width: 12, height: 12 },
      };
    }));

    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        highlighted:     n.id === nodeId              ? 'self'
                       : connectedNodeCols.has(n.id)  ? 'connected'
                       : 'none',
        highlightedCols: connectedNodeCols.get(n.id) ?? new Set(),
      },
    })));
  }, [setEdges, setNodes, getEdges, tables]);

  const hideAllEdges = useCallback(() => {
    setColInfo(null);
    setEdges(eds => eds.map(e => ({
      ...e,
      style:     { stroke: '#555', strokeWidth: 1.5, strokeOpacity: 0.7 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#555', width: 12, height: 12 },
    })));
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, highlighted: 'none', highlightedCols: new Set() },
    })));
  }, [setEdges, setNodes]);

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
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
      >
        <Background color='#333' variant={BackgroundVariant.Lines} />
        <Controls />
      </ReactFlow>

      {colInfo && (
        <div style={{
          position: 'absolute', bottom: 20, right: 20, zIndex: 10,
          background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.18)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: 8, padding: '12px 14px', minWidth: 220, maxWidth: 300,
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)', fontSize: 12,
          color: 'var(--ink)', fontFamily: 'inherit',
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8,
                        borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
            <span style={{ color: 'var(--muted)' }}>{colInfo.tableName}.</span>
            {colInfo.colName}
            {colInfo.isPrimary && (
              <span style={{ marginLeft: 6, background: '#2a4a2a', color: '#7ecb7e',
                             borderRadius: 3, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>PK</span>
            )}
            {colInfo.isForeign && (
              <span style={{ marginLeft: 4, background: '#2a2a4a', color: '#8888e8',
                             borderRadius: 3, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>FK</span>
            )}
          </div>
          {colInfo.connections.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>No relationships</div>
          ) : (
            colInfo.connections.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#d06a45', fontWeight: 700, fontSize: 13 }}>
                  {c.direction === 'out' ? '→' : '←'}
                </span>
                <span>
                  <span style={{ color: 'var(--muted)' }}>{c.tableName}.</span>
                  <strong>{c.colName}</strong>
                </span>
              </div>
            ))
          )}
        </div>
      )}
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
