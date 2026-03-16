import SchemaSidebar from './SchemaSidebar';

export default function SchemaVisualizer({ tables = [], onBack }) {
  return (
    <div className="db-explorer-shell">
      <nav className="db-explorer-nav" aria-label="Schema visualizer actions">
        <button className="btn ghost btn-nav btn-back" type="button" onClick={onBack}>
          Back
        </button>
      </nav>
      <SchemaSidebar tables={tables} />
    </div>
  );
}
