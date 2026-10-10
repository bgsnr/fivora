'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { matchesFacilityLocation } from '@/lib/facility-search';
import styles from './filter-dropdown.module.css';

type Option = { value: string; label: string };

type Props = {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
};

export default function FilterDropdown({
  id, label, value, options, onChange, onSearch,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchable = Boolean(onSearch);
  const results = searchable
    ? options.filter((option) => !option.value || matchesFacilityLocation(option.label, value))
    : options;
  const selected = options.find((option) => option.value === value);
  const active = open ? results[activeIndex] : undefined;
  const listId = `${id}-options`;

  useEffect(() => {
    if (open && searchable) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open, searchable]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const option = listRef.current?.children[activeIndex];
    if (option instanceof HTMLElement) option.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, value]);

  function close() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function choose(option: Option) {
    onChange(option.value);
    close();
    buttonRef.current?.focus({ preventScroll: true });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        close();
        buttonRef.current?.focus({ preventScroll: true });
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(event.key === 'ArrowDown' ? 0 : results.length - 1);
      } else {
        setActiveIndex((index) => event.key === 'ArrowDown'
          ? Math.min(index + 1, results.length - 1)
          : Math.max(index < 0 ? results.length - 1 : index - 1, 0));
      }
    } else if ((event.key === 'Home' || event.key === 'End') && open && !searchable) {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : results.length - 1);
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (active) choose(active);
      else {
        close();
        buttonRef.current?.focus({ preventScroll: true });
      }
    } else if (event.key === ' ' && open && !searchable && active) {
      event.preventDefault();
      choose(active);
    }
  }

  return (
    <div className={styles.group} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) close();
    }}>
      <label id={`${id}-label`} htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.anchor}>
        <button
          ref={buttonRef}
          id={id}
          type="button"
          role={searchable ? undefined : 'combobox'}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={!searchable && active ? `${id}-option-${activeIndex}` : undefined}
          className={styles.control}
          onClick={() => { setOpen(!open); setActiveIndex(-1); }}
          onKeyDown={handleKeyDown}
        >
          <span id={`${id}-value`} className={styles.value}>{selected?.label ?? value}</span>
          <ChevronDown size={16} aria-hidden="true" className={open ? styles.rotated : ''} />
        </button>

        <div className={styles.popup} hidden={!open}>
          {searchable && (
            <div className={styles.search}>
              <Search size={16} aria-hidden="true" />
              <input
                ref={inputRef}
                id={`${id}-search`}
                type="text"
                role="combobox"
                aria-label={`Cari ${label.toLocaleLowerCase('id-ID')}`}
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={active ? `${id}-option-${activeIndex}` : undefined}
                value={value}
                placeholder="Ketik untuk mencari lokasi..."
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => { onSearch?.(event.target.value); setActiveIndex(-1); }}
                onKeyDown={handleKeyDown}
              />
              {value && (
                <button type="button" aria-label="Hapus pencarian lokasi" className={styles.clear}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { onSearch?.(''); setActiveIndex(-1); inputRef.current?.focus(); }}>
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          <div ref={listRef} id={listId} role="listbox" aria-label={`Pilihan ${label.toLocaleLowerCase('id-ID')}`} className={styles.list}>
            {results.map((option, index) => (
              <button
                key={option.value}
                id={`${id}-option-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                tabIndex={-1}
                className={`${styles.option} ${activeIndex === index ? styles.active : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.value === value && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
          </div>
          {searchable && results.length === 1 && value.trim() && (
            <p className={styles.empty} role="status">Tidak ada lokasi yang cocok.</p>
          )}
        </div>
      </div>
    </div>
  );
}
