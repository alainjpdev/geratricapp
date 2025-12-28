import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const [count, setCount] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    if (count === 0) {
      navigate('/');
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <h1 className="text-4xl font-bold text-error mb-4">Página no encontrada</h1>
      <p className="text-lg text-text-secondary mb-6">
        Serás redirigido a la página principal en{' '}
        <span className="text-3xl font-extrabold text-primary">{count}</span> segundos...
      </p>
      <button
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition"
        onClick={() => navigate('/')}
      >
        Ir a la página principal ahora
      </button>
    </div>
  );
};

export default NotFound; 