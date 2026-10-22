import React, { useEffect, useState } from 'react';

interface FirstPersonHandsOverlayProps {
  isNearButton?: boolean;
  isPedActive?: boolean;
  heading?: { label: string; arrow: string; deg: number };
}

export const FirstPersonHandsOverlay: React.FC<FirstPersonHandsOverlayProps> = ({
  isNearButton = false,
  isPedActive = false,
  heading = { label: 'NORTH-EAST', arrow: '↗', deg: 45 },
}) => {
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [stepCycle, setStepCycle] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.code]: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.code]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isWalking = Boolean(keys['KeyW'] || keys['KeyS'] || keys['ArrowUp'] || keys['ArrowDown']);
  const isSprint = Boolean(keys['ShiftLeft'] || keys['ShiftRight']);
  const isSteeringLeft = Boolean(keys['KeyA'] || keys['KeyQ'] || keys['ArrowLeft']);
  const isSteeringRight = Boolean(keys['KeyD'] || keys['ArrowRight']);
  const isPushing = Boolean(isNearButton && (keys['KeyE'] || keys['Space']));

  // Walk bobbing loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isWalking) {
        setStepCycle((prev) => prev + dt * (isSprint ? 14 : 9));
      } else {
        setStepCycle((prev) => prev + dt * 2); // Subtle breathing
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isWalking, isSprint]);

  // Dynamic transforms based on steering & walk cycle
  const bobY = isWalking ? Math.sin(stepCycle * 2) * 8 : Math.sin(stepCycle) * 3;
  const leftBob = isWalking ? Math.sin(stepCycle) * 12 : 0;
  const rightBob = isWalking ? -Math.sin(stepCycle) * 12 : 0;

  // Steering bank angles
  let leftRotation = -12;
  let rightRotation = 12;
  let leftShiftX = 0;
  let rightShiftX = 0;

  if (isSteeringLeft) {
    leftRotation = -24; // Points left
    rightRotation = 2; // Banks left
    leftShiftX = -18;
    rightShiftX = -12;
  } else if (isSteeringRight) {
    leftRotation = -2; // Banks right
    rightRotation = 24; // Points right
    leftShiftX = 12;
    rightShiftX = 18;
  }

  // Button reaching transform
  const rightReachY = isPushing ? -38 : isNearButton ? -22 : 0;
  const rightReachX = isPushing ? -16 : isNearButton ? -10 : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden flex items-end justify-between px-4 sm:px-12 pb-0 select-none">
      {/* LEFT ARM & HAND (With Smartwatch & Compass) */}
      <div
        className="relative transition-transform duration-150 ease-out origin-bottom-left"
        style={{
          transform: `translate3d(${leftShiftX}px, ${bobY + leftBob}px, 0) rotate(${leftRotation}deg)`,
        }}
      >
        <svg
          width="210"
          height="190"
          viewBox="0 0 210 190"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl"
        >
          {/* Forearm Sleeve */}
          <path
            d="M 15 190 L 55 75 L 125 90 L 95 190 Z"
            fill="url(#leftSleeveGrad)"
            stroke="#0284c7"
            strokeWidth="2"
          />

          {/* High-Visibility Neon Reflective Stripe */}
          <path
            d="M 32 140 L 42 110 L 112 125 L 102 155 Z"
            fill="#38bdf8"
            opacity="0.85"
            stroke="#7dd3fc"
            strokeWidth="1.5"
          />

          {/* Cuff */}
          <path
            d="M 52 76 L 68 50 L 138 65 L 122 91 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Smartwatch Chassis */}
          <rect
            x="64"
            y="42"
            width="44"
            height="32"
            rx="8"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="2"
            transform="rotate(12 64 42)"
          />

          {/* Smartwatch Screen */}
          <rect
            x="67"
            y="45"
            width="38"
            height="26"
            rx="5"
            fill={isPedActive ? '#052e16' : '#0f172a'}
            stroke={isPedActive ? '#10b981' : '#38bdf8'}
            strokeWidth="1.5"
            transform="rotate(12 67 45)"
          />

          {/* Watch Display Content: Walking Man / Direction Compass */}
          <g transform="translate(85, 61) rotate(12)">
            {isPedActive ? (
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#34d399"
                fontSize="12"
                fontWeight="900"
                className="animate-pulse"
              >
                WALK 🚶
              </text>
            ) : (
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#38bdf8"
                fontSize="10"
                fontWeight="bold"
              >
                {heading.arrow} {heading.label.slice(0, 2)}
              </text>
            )}
          </g>

          {/* Left Palm */}
          <path
            d="M 72 52 L 105 18 L 155 35 L 130 70 Z"
            fill="url(#skinGrad)"
            stroke="#e0a982"
            strokeWidth="1.5"
          />

          {/* Left Thumb */}
          <path
            d="M 125 55 C 145 52 165 42 162 30 C 158 20 142 28 130 35 Z"
            fill="#e8b28f"
            stroke="#d4936a"
            strokeWidth="1"
          />

          {/* Left Fingers (Natural Curled Grip) */}
          <path
            d="M 103 20 C 108 8 128 10 126 22 L 122 30"
            fill="#f0c2a2"
            stroke="#d4936a"
            strokeWidth="1"
          />
          <path
            d="M 115 22 C 122 10 140 12 138 24 L 133 33"
            fill="#f0c2a2"
            stroke="#d4936a"
            strokeWidth="1"
          />
          <path
            d="M 125 25 C 132 14 148 16 146 27 L 141 36"
            fill="#e8b28f"
            stroke="#d4936a"
            strokeWidth="1"
          />

          {/* Shading Gradients */}
          <defs>
            <linearGradient id="leftSleeveGrad" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4936a" />
              <stop offset="60%" stopColor="#f3c5a5" />
              <stop offset="100%" stopColor="#fae0cf" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* RIGHT ARM & HAND (With Trajectory Pointer Finger & Button Pusher) */}
      <div
        className="relative transition-transform duration-150 ease-out origin-bottom-right"
        style={{
          transform: `translate3d(${rightShiftX + rightReachX}px, ${
            bobY + rightBob + rightReachY
          }px, 0) rotate(${rightRotation}deg)`,
        }}
      >
        <svg
          width="210"
          height="190"
          viewBox="0 0 210 190"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl"
        >
          {/* Forearm Sleeve */}
          <path
            d="M 195 190 L 155 75 L 85 90 L 115 190 Z"
            fill="url(#rightSleeveGrad)"
            stroke="#0284c7"
            strokeWidth="2"
          />

          {/* High-Visibility Neon Reflective Stripe */}
          <path
            d="M 178 140 L 168 110 L 98 125 L 108 155 Z"
            fill="#38bdf8"
            opacity="0.85"
            stroke="#7dd3fc"
            strokeWidth="1.5"
          />

          {/* Cuff */}
          <path
            d="M 158 76 L 142 50 L 72 65 L 88 91 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Right Palm */}
          <path
            d="M 138 52 L 105 18 L 55 35 L 80 70 Z"
            fill="url(#skinGradRight)"
            stroke="#e0a982"
            strokeWidth="1.5"
          />

          {/* Right Thumb */}
          <path
            d="M 85 55 C 65 52 45 42 48 30 C 52 20 68 28 80 35 Z"
            fill="#e8b28f"
            stroke="#d4936a"
            strokeWidth="1"
          />

          {/* Right Lower Fingers (Folded into hand) */}
          <path
            d="M 95 24 C 88 12 70 14 72 26 L 77 35"
            fill="#e8b28f"
            stroke="#d4936a"
            strokeWidth="1"
          />
          <path
            d="M 85 27 C 78 16 62 18 64 29 L 69 38"
            fill="#d4936a"
            stroke="#c0784d"
            strokeWidth="1"
          />

          {/* Right Pointer Index Finger (Points into trajectory / pushes button) */}
          <g
            className={`transition-transform duration-100 ${
              isPushing ? 'scale-110 -translate-y-2' : ''
            }`}
          >
            <path
              d="M 112 25 L 94 -8 C 91 -15 78 -12 80 -4 L 92 28 Z"
              fill={isPushing ? '#fed7aa' : '#fae0cf'}
              stroke="#d4936a"
              strokeWidth="1.5"
            />
            {/* Fingernail detail */}
            <path
              d="M 88 -5 C 87 -10 93 -11 94 -6 Z"
              fill="#fff"
              opacity="0.6"
            />
          </g>

          {/* Reaching Indicator Ripple when near button */}
          {isNearButton && (
            <circle
              cx="86"
              cy="-8"
              r={isPushing ? '18' : '10'}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              className="animate-ping"
              opacity="0.8"
            />
          )}

          <defs>
            <linearGradient id="rightSleeveGrad" x1="100%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="skinGradRight" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#d4936a" />
              <stop offset="60%" stopColor="#f3c5a5" />
              <stop offset="100%" stopColor="#fae0cf" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
