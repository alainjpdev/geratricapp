import React from 'react';
import NotionTasksTable from './NotionTasksTable';

const Notion: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text mb-6">Tareas de Notion</h1>
      <NotionTasksTable />
    </div>
  );
};

export default Notion; 