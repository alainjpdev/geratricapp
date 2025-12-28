import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    useEffect(() => {
        if (offlineReady) {
            console.log('App is ready for offline work.');
        }
    }, [offlineReady]);

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-0 right-0 m-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg z-50 flex flex-col gap-2 max-w-sm">
            <div className="text-sm">
                {offlineReady ? (
                    <span>App lista para trabajar offline</span>
                ) : (
                    <span>Nueva versión disponible, recargar?</span>
                )}
            </div>
            <div className="flex gap-2">
                {needRefresh && (
                    <button
                        className="px-3 py-1 bg-blue-400 rounded hover:bg-blue-500 text-xs font-bold"
                        onClick={() => updateServiceWorker(true)}
                    >
                        Recargar
                    </button>
                )}
                <button
                    className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700 text-xs"
                    onClick={close}
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}

export default ReloadPrompt;
