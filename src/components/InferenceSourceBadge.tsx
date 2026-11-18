'use client';

import { Cloud, Cpu, FlaskConical } from 'lucide-react';
import type { InferenceSourceType } from '@/types/incident';

interface InferenceSourceBadgeProps {
  source: InferenceSourceType;
  latencyMs?: number;
}

const BADGE_CONFIG: Record<
  InferenceSourceType,
  {
    label: string;
    className: string;
    Icon: typeof Cpu;
  }
> = {
  ON_DEVICE: {
    label: 'ON_DEVICE',
    className: 'border-emerald-200 bg-[#F0FDF4] text-[#15803D]',
    Icon: Cpu,
  },
  IN_CLOUD: {
    label: 'IN_CLOUD',
    className: 'border-blue-200 bg-[#EFF6FF] text-[#1D4ED8]',
    Icon: Cloud,
  },
  SIMULATED: {
    label: 'SIMULATED',
    className: 'border-amber-200 bg-[#FFFBEB] text-[#B45309]',
    Icon: FlaskConical,
  },
};

export function InferenceSourceBadge({
  source,
  latencyMs,
}: InferenceSourceBadgeProps) {
  const { label, className, Icon } = BADGE_CONFIG[source];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
      {typeof latencyMs === 'number' && <span>({latencyMs}ms)</span>}
    </span>
  );
}
