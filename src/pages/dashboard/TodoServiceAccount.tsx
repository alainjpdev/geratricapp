/*
// TodoServiceAccount - Comentado temporalmente para evitar problemas de build
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CheckSquare, Square, Plus, Edit, Trash2, Calendar, Clock, Filter, Search, RefreshCw, AlertCircle, CheckCircle, Download, Save, Settings } from 'lucide-react';
import { googleSheetsService, TodoItem } from '../../services/googleSheetsService';

export const TodoServiceAccount: React.FC = () => {
  // ... todo el código del componente ...
};
*/

// Placeholder temporal
import React from 'react';
import { Card } from '../../components/ui/Card';

export const TodoServiceAccount: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-4">Lista de Tareas (Service Account)</h2>
      <Card className="p-6 bg-panel border border-border shadow-sm">
        <p className="text-text-secondary">
          Google Sheets integration temporarily disabled.
        </p>
        <p className="text-text-secondary mt-2">
          Esta funcionalidad será restaurada una vez que se resuelvan los problemas de build.
        </p>
      </Card>
    </div>
  );
};