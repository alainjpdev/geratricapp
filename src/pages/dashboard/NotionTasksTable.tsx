import React, { useEffect, useState } from "react";
import NotionTaskForm from "./NotionTaskForm";

interface NotionTask {
  id: string;
  properties: Record<string, any>;
}

const STATUS_OPTIONS = ["Not started", "In progress", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

function UpdateStatusPriorityModal({ task, onSave, onClose }: { task: NotionTask; onSave: (fields: { status: string; priority: string }) => void; onClose: () => void }) {
  const [status, setStatus] = useState(task.properties?.Status?.status?.name || "");
  const [priority, setPriority] = useState(task.properties?.Priority?.select?.name || "");
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md" onSubmit={e => { e.preventDefault(); onSave({ status, priority }); }}>
        <h2 className="text-xl font-bold mb-4">Actualizar Estado y Prioridad</h2>
        <label className="block mb-2">Estado</label>
        <select className="mb-4 w-full border px-2 py-1 rounded" value={status} onChange={e => setStatus(e.target.value)} required>
          <option value="">Selecciona estado</option>
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <label className="block mb-2">Prioridad</label>
        <select className="mb-4 w-full border px-2 py-1 rounded" value={priority} onChange={e => setPriority(e.target.value)} required>
          <option value="">Selecciona prioridad</option>
          {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Guardar</button>
          <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function NotionTasksTable() {
  const [tasks, setTasks] = useState<NotionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<NotionTask | null>(null);
  const [updateTask, setUpdateTask] = useState<NotionTask | null>(null);
  const [filters, setFilters] = useState<{ status: string; priority: string }>({ status: "", priority: "" });
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = () => {
    let url = "https://algorithmicsai-backend-waves-d55c2136336f.herokuapp.com/api/notion/tasks";
    const params = [];
    if (filters.status) params.push(`status=${filters.status}`);
    if (filters.priority) params.push(`priority=${filters.priority}`);
    if (params.length) url += "?" + params.join("&");
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data.results || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchTasks(); }, []); // Solo carga una vez

  // Filtrado frontend
  const filteredTasks = tasks.filter(task => {
    const status = task.properties?.Status?.status?.name || "";
    const priority = task.properties?.Priority?.select?.name || "";
    return (
      (!filters.status || status === filters.status) &&
      (!filters.priority || priority === filters.priority)
    );
  });

  const handleCreate = (data: any) => {
    const payload = {
      "Task name": data.name,
      "Description": data.description,
      "Status": data.status,
      "Priority": data.priority,
      "Due date": data.dueDate
    };
    fetch("https://algorithmicsai-backend-waves-d55c2136336f.herokuapp.com/api/notion/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(() => {
      setShowForm(false);
      fetchTasks();
    });
  };

  const handleEdit = (id: string, data: any) => {
    const payload = {
      "Task name": data.name,
      "Description": data.description,
      "Status": data.status,
      "Priority": data.priority,
      "Due date": data.dueDate
    };
    fetch(`https://algorithmicsai-backend-waves-d55c2136336f.herokuapp.com/api/notion/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setError("La tarea ya no existe en Notion.");
            fetchTasks();
          } else {
            setError("Error al editar la tarea.");
          }
        } else {
          setEditTask(null);
          setTimeout(fetchTasks, 1000); // Espera 1 segundo antes de refrescar
        }
      })
      .catch(() => setError("Error de red al editar la tarea."));
  };

  const handleUpdateStatusPriority = (id: string, fields: { status: string; priority: string }) => {
    const payload = {
      "Status": fields.status,
      "Priority": fields.priority
    };
    fetch(`https://algorithmicsai-backend-waves-d55c2136336f.herokuapp.com/api/notion/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setError("La tarea ya no existe en Notion.");
            fetchTasks();
          } else {
            setError("Error al actualizar la tarea.");
          }
        } else {
          setUpdateTask(null);
          setTimeout(fetchTasks, 1000);
        }
      })
      .catch(() => setError("Error de red al actualizar la tarea."));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("¿Eliminar tarea?")) return;
    fetch(`https://algorithmicsai-backend-waves-d55c2136336f.herokuapp.com/api/notion/tasks/${id}`, {
      method: "DELETE"
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setError("La tarea ya no existe en Notion.");
            fetchTasks();
          } else {
            setError("Error al eliminar la tarea.");
          }
        } else {
          fetchTasks();
        }
      })
      .catch(() => setError("Error de red al eliminar la tarea."));
  };

  if (loading) return <div>Cargando tareas...</div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <div className="flex gap-2 mb-4">
        <button className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-500 transition" onClick={() => setShowForm(true)}>Nueva tarea</button>
        <button className="bg-panel text-text px-4 py-2 rounded border border-border hover:bg-border transition" onClick={fetchTasks}>Refrescar</button>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border border-border bg-panel text-text px-2 py-1 rounded">
          <option value="">Todos los estados</option>
          <option value="Not started">Not started</option>
          <option value="In progress">In progress</option>
          <option value="Done">Done</option>
        </select>
        <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="border border-border bg-panel text-text px-2 py-1 rounded">
          <option value="">Todas las prioridades</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      <table className="w-full border border-border rounded-lg overflow-hidden bg-panel text-text">
        <thead>
          <tr className="bg-border border-b border-border">
            <th className="py-2 px-4 text-left text-text-secondary">Tarea</th>
            <th className="py-2 px-4 text-left text-text-secondary">Estado</th>
            <th className="py-2 px-4 text-left text-text-secondary">Prioridad</th>
            <th className="py-2 px-4 text-left text-text-secondary">Descripción</th>
            <th className="py-2 px-4 text-left text-text-secondary">Fecha límite</th>
            <th className="py-2 px-4 text-left text-text-secondary">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => (
            <tr key={task.id} className="border-b border-border hover:bg-hover transition">
              <td className="py-2 px-4 text-text">{task.properties?.["Task name"]?.title?.[0]?.plain_text || "Sin nombre"}</td>
              <td className="py-2 px-4">
                {(() => {
                  const status = task.properties?.Status?.status?.name || "Sin estado";
                  const color = status === "Done" ? "bg-green-700 text-green-100" : status === "In progress" ? "bg-yellow-700 text-yellow-100" : status === "Not started" ? "bg-gray-700 text-gray-200" : "bg-border text-text-secondary";
                  return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${color}`}>{status}</span>;
                })()}
              </td>
              <td className="py-2 px-4">
                {(() => {
                  const priority = task.properties?.Priority?.select?.name || "Sin prioridad";
                  const color = priority === "High" ? "bg-red-700 text-red-100" : priority === "Medium" ? "bg-orange-700 text-orange-100" : priority === "Low" ? "bg-green-700 text-green-100" : "bg-border text-text-secondary";
                  return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${color}`}>{priority}</span>;
                })()}
              </td>
              <td className="py-2 px-4 text-text-secondary">{task.properties?.Description?.rich_text?.[0]?.plain_text || "Sin descripción"}</td>
              <td className="py-2 px-4 text-text-secondary">{task.properties?.["Due date"]?.date?.start || "Sin fecha"}</td>
              <td className="py-2 px-4 flex gap-2">
                <button className="text-blue-400 hover:text-blue-200" onClick={() => setEditTask(task)}>Editar</button>
                <button className="text-yellow-400 hover:text-yellow-200" onClick={() => setUpdateTask(task)}>Estado/Prioridad</button>
                <button className="text-red-400 hover:text-red-200" onClick={() => handleDelete(task.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showForm && <NotionTaskForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
      {editTask && <NotionTaskForm onSave={data => handleEdit(editTask.id, data)} onClose={() => setEditTask(null)} initial={{
        name: editTask.properties?.["Task name"]?.title?.[0]?.plain_text || "",
        status: editTask.properties?.Status?.status?.name || "",
        priority: editTask.properties?.Priority?.select?.name || "",
        description: editTask.properties?.Description?.rich_text?.[0]?.plain_text || "",
        dueDate: editTask.properties?.["Due date"]?.date?.start || ""
      }} />}
      {updateTask && <UpdateStatusPriorityModal task={updateTask} onSave={fields => handleUpdateStatusPriority(updateTask.id, fields)} onClose={() => setUpdateTask(null)} />}
    </div>
  );
} 