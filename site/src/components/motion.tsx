import { useEffect, useRef, useState } from 'react'
import { useInView, animate } from 'motion/react'

export const EASE = [0.16, 1, 0.3, 1] as const

/** Animated number that counts up when scrolled into view. */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 2.2,
  className,
}: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, value, { duration, ease: EASE, onUpdate: setDisplay })
    return () => c.stop()
  }, [inView, value, duration])
  const formatted = display.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
