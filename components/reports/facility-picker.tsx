'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Check, ChevronDown, MapPin, Search } from 'lucide-react'
import styles from './facility-picker.module.css'

type Facility = { id: string; name: string; location: string | null }
type Props = {
  facilities: Facility[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

export default function FacilityPicker({ facilities, value, onChange, disabled = false }: Props) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const selected = facilities.find((item) => item.id === value)
  const words = query.toLocaleLowerCase('id-ID').trim().split(/\s+/).filter(Boolean)
  const results = facilities.filter((item) => {
    const text = `${item.name} ${item.location ?? ''}`.toLocaleLowerCase('id-ID')
    const tokens = text.split(/[^a-z0-9]+/)
    return words.every((word) => word.length === 1 ? tokens.includes(word) : text.includes(word))
  })
  const expanded = open && !disabled
  const active = expanded ? results[activeIndex] : undefined

  useEffect(() => {
    if (!expanded || activeIndex < 0) return
    const option = listRef.current?.children[activeIndex]
    if (option instanceof HTMLElement) option.scrollIntoView({ block: 'nearest' })
  }, [expanded, activeIndex, query])

  function showOptions() {
    setQuery('')
    setActiveIndex(-1)
    setOpen(true)
  }

  function choose(item: Facility) {
    onChange(item.id)
    setQuery('')
    setActiveIndex(-1)
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Escape') {
      if (expanded) event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!expanded) {
        showOptions()
        setActiveIndex(event.key === 'ArrowDown' ? 0 : facilities.length - 1)
      } else {
        setActiveIndex((index) => event.key === 'ArrowDown'
          ? Math.min(index + 1, results.length - 1)
          : Math.max(index < 0 ? results.length - 1 : index - 1, 0))
      }
    } else if (event.key === 'Enter' && expanded) {
      event.preventDefault()
      if (active) choose(active)
    }
  }

  return (
    <div className={styles.picker} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }}>
      <label htmlFor={id} className={styles.label}>Fasilitas yang dilaporkan</label>
      <div className={styles.anchor}>
        <div className={styles.control}>
          <Search size={18} strokeWidth={1.6} aria-hidden="true" />
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={`${id}-list`}
            aria-activedescendant={active ? `${id}-option-${active.id}` : undefined}
            aria-describedby={`${id}-help`}
            aria-required="true"
            autoComplete="off"
            spellCheck={false}
            placeholder={expanded ? 'Ketik nama atau lokasi...' : 'Cari dan pilih fasilitas'}
            value={expanded ? query : selected?.name ?? ''}
            disabled={disabled}
            onFocus={showOptions}
            onClick={() => { if (!expanded) showOptions() }}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(-1)
              setOpen(true)
              onChange('')
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className={styles.toggle}
            tabIndex={-1}
            aria-label={expanded ? 'Tutup pilihan fasilitas' : 'Buka pilihan fasilitas'}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (expanded) setOpen(false)
              else { inputRef.current?.focus(); showOptions() }
            }}
          >
            <ChevronDown size={18} aria-hidden="true" className={expanded ? styles.rotated : ''} />
          </button>
        </div>

        <div className={styles.popup} hidden={!expanded}>
          <p className={styles.resultCount} role="status">{results.length} fasilitas ditemukan</p>
          <div ref={listRef} className={styles.list} id={`${id}-list`} role="listbox" aria-label="Pilihan fasilitas">
            {results.map((item, index) => (
              <button
                key={item.id}
                id={`${id}-option-${item.id}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                tabIndex={-1}
                className={`${styles.option} ${activeIndex === index ? styles.active : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                <span className={styles.optionText}>
                  <span className={styles.name}>{item.name}</span>
                  <span className={styles.location}>{item.location || 'Lokasi belum dicantumkan'}</span>
                </span>
                {item.id === value && <Check size={18} className={styles.check} aria-hidden="true" />}
              </button>
            ))}
          </div>
          {results.length === 0 && <p className={styles.empty}>Tidak ada yang cocok. Coba nama atau lokasi lain.</p>}
        </div>
      </div>
      <p className={styles.help} id={`${id}-help`}>
        {selected ? <><MapPin size={14} aria-hidden="true" />{selected.location || 'Lokasi belum dicantumkan'}</>
          : 'Cari berdasarkan nama fasilitas, fakultas, atau gedung.'}
      </p>
    </div>
  )
}
