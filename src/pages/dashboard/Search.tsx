import React from 'react';

const Search: React.FC = () => {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Código de acceso</h1>
        <div className="inline-block px-6 py-3 text-lg font-mono tracking-wider rounded-lg border bg-white dark:bg-black dark:border-white/20 text-gray-900 dark:text-white">
          RKGROUPROCKS
        </div>
        <div className="mt-4">
          <a
            href="https://web-jet-eta-68.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Abrir Search en nueva pestaña
          </a>
        </div>
      </div>
    </div>
  );
};

export default Search;


