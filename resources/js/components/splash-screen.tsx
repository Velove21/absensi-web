import { useEffect, useState } from 'react';

export default function SplashScreen() {
    const [visible, setVisible] = useState(true);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const staticSplash = document.getElementById('initial-splash');

        if (staticSplash) {
            staticSplash.remove();
        }

        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => setHidden(true), 600);
        }, 1800);

        return () => clearTimeout(timer);
    }, []);

    if (hidden) {
        return null;
    }

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-600 ${
                visible ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={{ backgroundColor: '#013ffb' }}
        >
            <img
                src="/images/P.png"
                alt="KlikHadir"
                className="max-h-[60%] w-auto max-w-[80%] object-contain p-6"
            />
        </div>
    );
}
