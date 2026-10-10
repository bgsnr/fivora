'use client'

import { useEffect, useId, useRef, useState } from 'react'
import styles from './account-info.module.css'

export function AccountInfo({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U'

  useEffect(() => {
    if (!open) return

    function dismiss(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setPinned(false)
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setPinned(false)
      }
    }

    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!pinned && !rootRef.current?.contains(document.activeElement)) {
          setOpen(false)
        }
      }}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false)
          setPinned(false)
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          setPinned(false)
        }
      }}
    >
      <button
        type="button"
        className={styles.avatar}
        aria-label={`Informasi akun ${name}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-describedby={open ? panelId : undefined}
        onClick={() => {
          setPinned(!pinned)
          setOpen(!pinned)
        }}
      >
        <span aria-hidden="true">{initials}</span>
      </button>

      <div id={panelId} role="tooltip" className={styles.panel} hidden={!open}>
        <div className={styles.content}>
          <p className={styles.label}>Akun yang digunakan</p>
          <p className={styles.name}>{name}</p>
          <p className={styles.email}>{email}</p>
        </div>
      </div>
    </div>
  )
}
