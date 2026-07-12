import { useState } from 'react'

type Side = 'top' | 'bottom' | 'left' | 'right'

interface Props {
  label: string
  children: React.ReactNode
  side?: Side
  className?: string
}

const SIDE_POS: Record<Side, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left:   'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right:  'left-full top-1/2 -translate-y-1/2 ml-1.5',
}

export default function Tooltip({ label, children, side = 'top', className }: Props) {
  const [show, setShow] = useState(false)
  return (
    <span
      className={`relative inline-flex ${className ?? ''}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className={`absolute z-[60] px-2 py-1 bg-gray-950/95 border border-gray-700 text-gray-100 text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap pointer-events-none ${SIDE_POS[side]}`}
        >
          {label}
        </span>
      )}
    </span>
  )
}
