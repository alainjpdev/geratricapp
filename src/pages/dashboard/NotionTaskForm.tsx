import React, { useState } from "react";

interface NotionTaskFormProps {
  onSave: (form: {
    name: string;
    status: string;
    priority: string;
    description: string;
    dueDate: string;
  }) => void;
  onClose: () => void;
  initial?: {
    name: string;
    status: string;
    priority: string;
    description: string;
    dueDate: string;
  };
}

const STATUS_OPTIONS = ["Not started", "In progress", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

export default function NotionTaskForm({ onSave, onClose, initial }: NotionTaskFormProps) {
  const [form, setForm] = useState<{
    name: string;
    status: string;
    priority: string;
    description: string;
    dueDate: string;
  }>(
    initial || { name: "", status: "", priority: "", description: "", dueDate: "" }
  );
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4">{initial ? "Editar tarea" : "Nueva tarea"}</h2>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" className="mb-2 w-full border px-2 py-1 rounded" required />
        <label className="block mb-2">Estado</label>
        <select name="status" value={form.status} onChange={handleChange} className="mb-2 w-full border px-2 py-1 rounded" required>
          <option value="">Selecciona estado</option>
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <label className="block mb-2">Prioridad</label>
        <select name="priority" value={form.priority} onChange={handleChange} className="mb-2 w-full border px-2 py-1 rounded" required>
          <option value="">Selecciona prioridad</option>
          {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <input name="dueDate" value={form.dueDate} onChange={handleChange} placeholder="Fecha límite" type="date" className="mb-2 w-full border px-2 py-1 rounded" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Descripción" className="mb-2 w-full border px-2 py-1 rounded" />
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded">{initial ? "Guardar" : "Crear"}</button>
          <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
} 