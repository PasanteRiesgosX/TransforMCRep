import { useEffect, useRef } from 'react';
import './CookieMonsterEyes.css';

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
        <div className="cookie-widget">
            <div className="cookie-scene" ref={sceneRef}>
                <div
                    ref={leftPupilRef}
                    className="pupil pupil-left"
                />

                <div
                    ref={rightPupilRef}
                    className="pupil pupil-right"
                />
            </div>
        </div>
    );
}