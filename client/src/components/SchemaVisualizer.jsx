import SchemaSidebar from './SchemaSidebar';
import ReactFlow, { Background, BackgroundVariant, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@chakra-ui/react';

export default function SchemaVisualizer({ tables = [], onBack }) {
  return (
    <div style={{ height: '90vh', width: '100vw', background: '#1C1C1C' }}>
      <SchemaSidebar tables={tables} />
      <button
        className='btn ghost btn-nav btn-back'
        type='button'
        onClick={onBack}
      >
        Back
      </button>
      <ReactFlow>
        <Background
          color='#444'
          variant={BackgroundVariant.Lines}
          overflowHidden={true}
        />
      </ReactFlow>
    </div>
  );
}
