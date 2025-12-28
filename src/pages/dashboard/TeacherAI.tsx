import React, { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const TeacherAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: 'user', content: input }]);
    setLoading(true);
    setError(null);
    if (!apiKey) {
      setError('No se encontró la clave de OpenAI. Configura VITE_OPENAI_API_KEY en Vercel.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ],
          max_tokens: 512,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (data.choices && data.choices[0]?.message?.content) {
        setMessages((msgs) => [...msgs, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        setError('No se pudo obtener respuesta.');
      }
    } catch (err) {
      setError('Error de red o API.');
    }
    setInput('');
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-[70vh] flex flex-col bg-panel rounded-lg shadow-lg border border-border p-4">
      <h1 className="text-2xl font-bold mb-4 text-text">AlgoTeacher-AI</h1>
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && <div className="text-text-secondary">¡Hazle una pregunta a AlgoTeacher-AI!</div>}
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/20 text-primary text-right ml-16' : 'bg-border text-text mr-16'}`}>{msg.content}</div>
        ))}
        {loading && <div className="text-text-secondary">AlgoTeacher-AI está escribiendo...</div>}
        {error && <div className="text-error">{error}</div>}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Escribe tu pregunta..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-500 transition"
          disabled={loading || !input.trim()}
        >Enviar</button>
      </form>
    </div>
  );
};

export default TeacherAI; 