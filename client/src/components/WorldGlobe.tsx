import { useId, useMemo } from 'react';

import { createRng, hashSeed } from '../lib/generate';

function blobPath(cx: number, cy: number, radius: number, rng: () => number, points = 10): string {
  const coords = Array.from({ length: points }, (_, index) => {
    const angle = (index / points) * Math.PI * 2;
    const variance = radius * (0.62 + rng() * 0.62);
    return {
      x: cx + Math.cos(angle) * variance,
      y: cy + Math.sin(angle) * variance * 0.78
    };
  });

  return coords
    .map((point, index) => {
      const next = coords[(index + 1) % coords.length];
      if (!next) return '';
      const midX = (point.x + next.x) / 2;
      const midY = (point.y + next.y) / 2;
      return `${index === 0 ? `M${point.x.toFixed(2)},${point.y.toFixed(2)}` : ''} Q${point.x.toFixed(2)},${point.y.toFixed(2)} ${midX.toFixed(2)},${midY.toFixed(2)}`;
    })
    .join(' ')
    .concat(' Z');
}

export function WorldGlobe({
  seed,
  status = 'stable',
  className = ''
}: {
  seed: string;
  status?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const rngSeed = hashSeed(seed);

  const scene = useMemo(() => {
    const rng = createRng(rngSeed);
    const blobs = [
      blobPath(84 + rng() * 22, 92 + rng() * 18, 20 + rng() * 12, rng, 9),
      blobPath(106 + rng() * 24, 112 + rng() * 20, 14 + rng() * 14, rng, 8),
      blobPath(108 + rng() * 30, 76 + rng() * 18, 9 + rng() * 10, rng, 7)
    ];
    const stars = Array.from({ length: 34 }, () => ({
      x: 8 + rng() * 184,
      y: 8 + rng() * 184,
      r: 0.25 + rng() * 0.55,
      o: 0.2 + rng() * 0.6
    }));
    const markers = Array.from({ length: 4 }, () => {
      const angle = rng() * Math.PI * 2;
      const radius = 26 + rng() * 45;
      return {
        x: 100 + Math.cos(angle) * radius,
        y: 100 + Math.sin(angle) * radius * 0.9
      };
    });
    return { blobs, stars, markers };
  }, [rngSeed]);

  const landStroke = status === 'anomalous' ? '#fda4af' : status === 'evolving' ? '#fcd34d' : '#6ee7b7';
  const landFill = status === 'anomalous' ? '#7f1d3a' : status === 'evolving' ? '#713f12' : '#065f46';

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`Generated globe for ${seed}`}>
      <defs>
        <radialGradient id={`ocean-${uid}`} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="45%" stopColor="#083344" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgb(45 212 191 / 0.22)" />
          <stop offset="100%" stopColor="rgb(45 212 191 / 0)" />
        </radialGradient>
        <linearGradient id={`land-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={landFill} />
          <stop offset="100%" stopColor={status === 'stable' ? '#047857' : landFill} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <circle cx="100" cy="100" r="77" />
        </clipPath>
      </defs>

      {scene.stars.map((star, index) => (
        <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#e2e8f0" opacity={star.o} />
      ))}

      <circle cx="100" cy="100" r="96" fill={`url(#glow-${uid})`} />
      <circle cx="100" cy="100" r="77" fill={`url(#ocean-${uid})`} stroke="rgb(94 234 212 / 0.35)" strokeWidth="0.6" />

      <g clipPath={`url(#clip-${uid})`}>
        {[-58, -29, 0, 29, 58].map((lat) => {
          const y = 100 - (lat / 90) * 77;
          const half = Math.sqrt(Math.max(0, 77 * 77 - (y - 100) * (y - 100)));
          return (
            <line
              key={lat}
              x1={100 - half}
              x2={100 + half}
              y1={y}
              y2={y}
              stroke="#67e8f9"
              strokeOpacity="0.14"
              strokeWidth="0.4"
            />
          );
        })}
        {[15, 30, 45, 60, 75].map((lon) => (
          <ellipse
            key={lon}
            cx="100"
            cy="100"
            rx={Math.max(0.4, Math.abs(Math.cos((lon * Math.PI) / 180)) * 77)}
            ry="77"
            fill="none"
            stroke="#67e8f9"
            strokeOpacity="0.12"
            strokeWidth="0.4"
          />
        ))}

        {scene.blobs.map((path, index) => (
          <path
            key={index}
            d={path}
            fill={`url(#land-${uid})`}
            stroke={landStroke}
            strokeOpacity="0.5"
            strokeWidth="0.6"
          />
        ))}

        <ellipse cx="100" cy="22" rx="44" ry="10" fill="#e0f2fe" opacity="0.16" />
        <ellipse cx="100" cy="178" rx="52" ry="11" fill="#e0f2fe" opacity="0.12" />
      </g>

      {scene.markers.map((marker, index) => (
        <g key={index}>
          <circle cx={marker.x} cy={marker.y} r="1.5" fill="#fbbf24" />
          <circle
            cx={marker.x}
            cy={marker.y}
            r="4.5"
            fill="none"
            stroke="#fbbf24"
            strokeOpacity="0.5"
            strokeWidth="0.5"
            className="animate-pulse-ring"
            style={{ transformOrigin: `${marker.x}px ${marker.y}px`, animationDelay: `${index * 0.45}s` }}
          />
        </g>
      ))}

      <ellipse
        cx="100"
        cy="100"
        rx="92"
        ry="28"
        fill="none"
        stroke="rgb(94 234 212 / 0.18)"
        strokeWidth="0.6"
        transform="rotate(-18 100 100)"
      />
      <circle cx="177" cy="72" r="1.8" fill="#5eead4" opacity="0.8" />
    </svg>
  );
}
