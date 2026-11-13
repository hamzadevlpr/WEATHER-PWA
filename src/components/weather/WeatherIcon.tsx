import { memo } from 'react';
import type { WeatherCondition } from '@/types';

interface WeatherIconProps {
  condition: WeatherCondition;
  isDay: boolean;
  size?: number;
}

// Color palettes for day/night
interface IconPalette {
  sun: string;
  sunRay: string;
  cloud: string;
  cloudDark: string;
  rain: string;
  snow: string;
  lightning: string;
  fog: string;
}

const dayColors: IconPalette = {
  sun: '#FBBF24',
  sunRay: '#F59E0B',
  cloud: '#94A3B8',
  cloudDark: '#64748B',
  rain: '#60A5FA',
  snow: '#CBD5E1',
  lightning: '#FDE047',
  fog: '#94A3B8',
};

const nightColors: IconPalette = {
  sun: '#CBD5E1',     // moon
  sunRay: '#94A3B8',
  cloud: '#64748B',
  cloudDark: '#475569',
  rain: '#3B82F6',
  snow: '#94A3B8',
  lightning: '#FDE047',
  fog: '#64748B',
};

function SunIcon({ colors, size }: { colors: IconPalette; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.18;
  const rayLen = size * 0.12;
  const rayDist = size * 0.3;

  return (
    <g className="origin-center animate-[spin-slow_20s_linear_infinite] motion-reduce:animate-none">
      {/* Rays */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x1 = cx + Math.cos(angle) * (rayDist - rayLen);
        const y1 = cy + Math.sin(angle) * (rayDist - rayLen);
        const x2 = cx + Math.cos(angle) * rayDist;
        const y2 = cy + Math.sin(angle) * rayDist;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={colors.sunRay}
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      {/* Sun body */}
      <circle cx={cx} cy={cy} r={r} fill={colors.sun} />
    </g>
  );
}

function MoonIcon({ colors, size }: { colors: IconPalette; size: number }) {
  const cx = size * 0.42;
  const cy = size * 0.38;
  const r = size * 0.2;

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={colors.sun} />
      <circle cx={cx + r * 0.45} cy={cy - r * 0.4} r={r * 0.75} fill="currentColor" className="text-[var(--color-surface)]" />
      {/* Stars */}
      <circle cx={size * 0.75} cy={size * 0.2} r={1.5} fill={colors.sunRay} className="animate-[pulse-glow_3s_ease-in-out_infinite] motion-reduce:animate-none" />
      <circle cx={size * 0.85} cy={size * 0.4} r={1} fill={colors.sunRay} className="animate-[pulse-glow_3s_ease-in-out_infinite_0.5s] motion-reduce:animate-none" />
      <circle cx={size * 0.65} cy={size * 0.55} r={1.2} fill={colors.sunRay} className="animate-[pulse-glow_3s_ease-in-out_infinite_1s] motion-reduce:animate-none" />
    </g>
  );
}

function CloudShape({
  cx,
  cy,
  scale,
  fill,
}: {
  cx: number;
  cy: number;
  scale: number;
  fill: string;
}) {
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
      <ellipse cx={0} cy={0} rx={14} ry={10} fill={fill} />
      <ellipse cx={-10} cy={3} rx={10} ry={8} fill={fill} />
      <ellipse cx={10} cy={3} rx={10} ry={8} fill={fill} />
      <ellipse cx={-5} cy={-6} rx={8} ry={7} fill={fill} />
      <ellipse cx={6} cy={-5} rx={9} ry={8} fill={fill} />
    </g>
  );
}

function RainDrops({ size, colors, count }: { size: number; colors: IconPalette; count: number }) {
  const drops = Array.from({ length: count }, (_, i) => ({
    x: size * 0.3 + (i * size * 0.4) / (count - 1 || 1),
    delay: `${i * 0.3}s`,
  }));
  return (
    <g>
      {drops.map((drop, i) => (
        <line
          key={i}
          x1={drop.x}
          y1={size * 0.65}
          x2={drop.x - 1}
          y2={size * 0.73}
          stroke={colors.rain}
          strokeWidth={2}
          strokeLinecap="round"
          className="animate-[fall_1s_ease-in_infinite] motion-reduce:animate-none"
          style={{ animationDelay: drop.delay }}
        />
      ))}
    </g>
  );
}

function SnowFlakes({ size, colors }: { size: number; colors: IconPalette }) {
  const flakes = [
    { x: size * 0.3, delay: '0s' },
    { x: size * 0.5, delay: '0.4s' },
    { x: size * 0.7, delay: '0.8s' },
  ];
  return (
    <g>
      {flakes.map((f, i) => (
        <circle
          key={i}
          cx={f.x}
          cy={size * 0.7}
          r={2.5}
          fill={colors.snow}
          className="animate-[fall_1.5s_ease-in_infinite] motion-reduce:animate-none"
          style={{ animationDelay: f.delay }}
        />
      ))}
    </g>
  );
}

function LightningBolt({ size, colors }: { size: number; colors: IconPalette }) {
  return (
    <path
      d={`M${size * 0.48},${size * 0.55} L${size * 0.42},${size * 0.72} L${size * 0.5},${size * 0.72} L${size * 0.45},${size * 0.88} L${size * 0.58},${size * 0.65} L${size * 0.5},${size * 0.65} L${size * 0.55},${size * 0.55} Z`}
      fill={colors.lightning}
      className="animate-[flash_3s_ease-in-out_infinite] motion-reduce:animate-none"
    />
  );
}

function FogLines({ size, colors }: { size: number; colors: IconPalette }) {
  const lines = [0.35, 0.48, 0.61, 0.74];
  return (
    <g>
      {lines.map((yFrac, i) => (
        <line
          key={i}
          x1={size * 0.2}
          y1={size * yFrac}
          x2={size * (0.7 + (i % 2) * 0.1)}
          y2={size * yFrac}
          stroke={colors.fog}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.5 + i * 0.1}
          className="animate-[drift_4s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}
    </g>
  );
}

function getWeatherSvg(
  condition: WeatherCondition,
  isDay: boolean,
  size: number,
) {
  const colors = isDay ? dayColors : nightColors;
  const mid = size / 2;

  switch (condition) {
    case 'clear':
      return isDay ? (
        <SunIcon colors={colors} size={size} />
      ) : (
        <MoonIcon colors={colors} size={size} />
      );

    case 'partly-cloudy':
      return (
        <g>
          {isDay ? (
            <g transform={`translate(${-size * 0.08}, ${-size * 0.08})`}>
              <SunIcon colors={colors} size={size} />
            </g>
          ) : (
            <g transform={`translate(${-size * 0.05}, ${-size * 0.05})`}>
              <MoonIcon colors={colors} size={size} />
            </g>
          )}
          <g className="animate-[drift_6s_ease-in-out_infinite] motion-reduce:animate-none">
            <CloudShape cx={mid + size * 0.08} cy={mid + size * 0.1} scale={0.7} fill={colors.cloud} />
          </g>
        </g>
      );

    case 'cloudy':
      return (
        <g>
          <CloudShape cx={mid - 4} cy={mid - 4} scale={0.6} fill={colors.cloud} />
          <g className="animate-[drift_5s_ease-in-out_infinite] motion-reduce:animate-none">
            <CloudShape cx={mid + 4} cy={mid + 4} scale={0.75} fill={colors.cloudDark} />
          </g>
        </g>
      );

    case 'overcast':
      return (
        <g>
          <CloudShape cx={mid - 5} cy={mid - 5} scale={0.6} fill={colors.cloudDark} />
          <CloudShape cx={mid + 5} cy={mid} scale={0.8} fill={colors.cloud} />
          <CloudShape cx={mid - 2} cy={mid + 6} scale={0.65} fill={colors.cloudDark} />
        </g>
      );

    case 'drizzle':
      return (
        <g>
          <g className="animate-[drift_5s_ease-in-out_infinite] motion-reduce:animate-none">
            <CloudShape cx={mid} cy={mid - 4} scale={0.7} fill={colors.cloud} />
          </g>
          <RainDrops size={size} colors={colors} count={2} />
        </g>
      );

    case 'rain':
      return (
        <g>
          <CloudShape cx={mid} cy={mid - 4} scale={0.75} fill={colors.cloud} />
          <RainDrops size={size} colors={colors} count={3} />
        </g>
      );

    case 'heavy-rain':
      return (
        <g>
          <CloudShape cx={mid} cy={mid - 4} scale={0.8} fill={colors.cloudDark} />
          <RainDrops size={size} colors={colors} count={5} />
        </g>
      );

    case 'snow':
    case 'heavy-snow':
      return (
        <g>
          <CloudShape cx={mid} cy={mid - 4} scale={0.75} fill={colors.cloud} />
          <SnowFlakes size={size} colors={colors} />
        </g>
      );

    case 'sleet':
      return (
        <g>
          <CloudShape cx={mid} cy={mid - 4} scale={0.75} fill={colors.cloud} />
          <RainDrops size={size} colors={colors} count={2} />
          <SnowFlakes size={size} colors={colors} />
        </g>
      );

    case 'thunderstorm':
      return (
        <g>
          <CloudShape cx={mid} cy={mid - 6} scale={0.8} fill={colors.cloudDark} />
          <LightningBolt size={size} colors={colors} />
          <RainDrops size={size} colors={colors} count={3} />
        </g>
      );

    case 'fog':
      return <FogLines size={size} colors={colors} />;

    case 'unknown':
    default:
      return (
        <g>
          <CloudShape cx={mid} cy={mid} scale={0.75} fill={colors.cloud} />
          <text
            x={mid}
            y={mid + 4}
            textAnchor="middle"
            fontSize={size * 0.28}
            fill={colors.cloudDark}
            fontWeight="bold"
          >
            ?
          </text>
        </g>
      );
  }
}

export const WeatherIcon = memo(function WeatherIcon({
  condition,
  isDay,
  size = 48,
}: WeatherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
      role="img"
      className="shrink-0"
    >
      {getWeatherSvg(condition, isDay, size)}
    </svg>
  );
});
