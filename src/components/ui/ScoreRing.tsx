import { cn, getScoreColor } from '@/lib/utils'

interface ScoreRingProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
  className?: string
}

const sizes = {
  sm: { ring: 36, stroke: 3, fontSize: 'text-[10px]' },
  md: { ring: 52, stroke: 4, fontSize: 'text-xs' },
  lg: { ring: 72, stroke: 5, fontSize: 'text-sm' },
}

export function ScoreRing({ value, size = 'md', label, showValue = true, className }: ScoreRingProps) {
  const { ring, stroke, fontSize } = sizes[size]
  const radius = (ring - stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value, 0), 100)
  const dashOffset = circumference - (progress / 100) * circumference
  const color = getScoreColor(value)

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg width={ring} height={ring} viewBox={`0 0 ${ring} ${ring}`}>
          {/* Track */}
          <circle
            cx={ring / 2} cy={ring / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={ring / 2} cy={ring / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {showValue && (
          <span
            className={cn('absolute inset-0 flex items-center justify-center font-data font-semibold', fontSize)}
            style={{ color }}
          >
            {value}
          </span>
        )}
      </div>
      {label && (
        <span className="text-[10px] text-alqia-muted font-sans leading-none text-center">{label}</span>
      )}
    </div>
  )
}
