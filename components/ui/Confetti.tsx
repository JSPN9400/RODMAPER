/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { useEffect, useState } from 'react'

const COLORS = ['#C88A3D', '#5B8A72', '#C9A227', '#B6708C', '#6480A2', '#E8C084']

type Piece = { id: number; x: number; rotate: number; delay: number; color: string; drift: number }

// A small burst of confetti pieces exploding outward from the trigger
// point, then fading. Pure CSS animation — no canvas, no dependency.
// Render <Confetti fire={someBoolean} /> anchored (position: relative) at
// the spot the burst should originate from; toggling `fire` true replays it.
export function Confetti({ fire, count = 14 }: { fire: boolean; count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (!fire) return
    const next: Piece[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 140,
      rotate: Math.random() * 360,
      delay: Math.random() * 0.08,
      color: COLORS[i % COLORS.length],
      drift: (Math.random() - 0.5) * 60,
    }))
    setPieces(next)
    setKey((k) => k + 1)
    const t = setTimeout(() => setPieces([]), 900)
    return () => clearTimeout(t)
  }, [fire, count])

  if (pieces.length === 0) return null

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 20 }}>
      {pieces.map((p) => (
        <span
          key={`${key}-${p.id}`}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: '6px', height: '6px', borderRadius: '1px',
            background: p.color,
            transform: `translate(-50%, -50%)`,
            animation: `confetti-burst 0.75s ${p.delay}s ease-out forwards`,
            // custom properties consumed by the keyframe below
            ['--dx' as any]: `${p.x}px`,
            ['--dy' as any]: `${-40 - Math.random() * 50}px`,
            ['--drift' as any]: `${p.drift}px`,
            ['--rot' as any]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}
