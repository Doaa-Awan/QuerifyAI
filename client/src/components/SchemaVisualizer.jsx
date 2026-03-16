import SchemaSidebar from './SchemaSidebar';

export default function SchemaVisualizer({ tables = [] }) {
  return <SchemaSidebar tables={tables} />;
}
