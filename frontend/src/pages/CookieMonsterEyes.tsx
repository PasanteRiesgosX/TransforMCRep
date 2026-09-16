import { useEffect, useRef } from 'react';

interface EyeConfig {
    centerX: number;
    centerY: number;
    maxMove: number;
}

export default function CookieMonsterEyes() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const leftPupilRef = useRef<HTMLDivElement>(null);
    const rightPupilRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let targetX = 50;
        let targetY = 50;

        let currentX = 50;
        let currentY = 50;

        const eyes: EyeConfig[] = [
            {
                centerX: 39.09,
                centerY: 37.05,
                maxMove: 5
            },
            {
                centerX: 57,
                centerY: 41.14,
                maxMove: 5
            }
        ];

        const updateMousePosition = (event: MouseEvent) => {
            const scene = sceneRef.current;
            if (!scene) return;

            const rect = scene.getBoundingClientRect();

            targetX = ((event.clientX - rect.left) / rect.width) * 100;
            targetY = ((event.clientY - rect.top) / rect.height) * 100;
        };

        const animate = () => {
            currentX += (targetX - currentX) * 0.16;
            currentY += (targetY - currentY) * 0.16;

            [leftPupilRef.current, rightPupilRef.current].forEach((pupil, index) => {
                if (!pupil) return;

                const eye = eyes[index];

                let dx = currentX - eye.centerX;
                let dy = currentY - eye.centerY;

                const distance = Math.hypot(dx, dy);

                if (distance > eye.maxMove) {
                    const scale = eye.maxMove / distance;
                    dx *= scale;
                    dy *= scale;
                }

                pupil.style.left = `${eye.centerX + dx}%`;
                pupil.style.top = `${eye.centerY + dy}%`;
            });

            requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', updateMousePosition);

        document.addEventListener('mouseleave', () => {
            targetX = 50;
            targetY = 50;
        });

        animate();

        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
        };
    }, []);

    return (
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center p-4">
            <div 
                ref={sceneRef}
                className="relative w-full h-full max-w-[200px] max-h-[200px] aspect-square rounded-full flex items-center justify-center overflow-visible drop-shadow-[0_0_15px_rgba(255,210,0,0.3)] bg-[url('https://cdn-icons-png.flaticon.com/512/5770/5770638.png')] bg-contain bg-no-repeat bg-center mix-blend-screen opacity-90 transition-opacity hover:opacity-100"
            >
                {/* Left Pupil */}
                <div
                    ref={leftPupilRef}
                    className="absolute w-[18%] h-[18%] bg-black rounded-full shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.4)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
                />

                {/* Right Pupil */}
                <div
                    ref={rightPupilRef}
                    className="absolute w-[18%] h-[18%] bg-black rounded-full shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.4)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
                />
            </div>
        </div>
    );
}