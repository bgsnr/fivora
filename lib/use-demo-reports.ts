'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { reports as initialReports } from '@/app/laporan/data'

export type Report = (typeof initialReports)[number]

const storageKey = 'fivora-demo-reports-v1'
const changeEvent = 'fivora-demo-reports-changed'
const validStatuses = ['baru', 'diproses', 'selesai', 'ditolak']

function getSnapshot() {
  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

function getServerSnapshot() {
  return null
}

function subscribe(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) {
      callback()
    }
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(changeEvent, callback)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(changeEvent, callback)
  }
}

function readReports(snapshot: string | null): Report[] {
  if (!snapshot) return initialReports

  try {
    const stored: unknown = JSON.parse(snapshot)

    if (!Array.isArray(stored)) return initialReports

    return initialReports.map((report) => {
      const saved = stored.find(
        (item) =>
          item !== null &&
          typeof item === 'object' &&
          item.id === report.id
      )

      if (
        !saved ||
        typeof saved.status !== 'string' ||
        !validStatuses.includes(saved.status) ||
        typeof saved.officerNote !== 'string'
      ) {
        return report
      }

      return {
        ...report,
        status: saved.status,
        officerNote: saved.officerNote,
      }
    })
  } catch {
    return initialReports
  }
}

export function useDemoReports() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  return useMemo(() => readReports(snapshot), [snapshot])
}

export function updateDemoReport(
  id: number,
  status: string,
  officerNote: string
) {
  const reports = readReports(window.localStorage.getItem(storageKey))
  const report = reports.find((item) => item.id === id)

  if (!report) {
    throw new Error('Laporan tidak ditemukan.')
  }

  const allowedStatuses =
    report.status === 'baru'
      ? ['diproses', 'ditolak']
      : report.status === 'diproses'
        ? ['selesai', 'ditolak']
        : []

  if (!allowedStatuses.includes(status)) {
    throw new Error('Status laporan sudah berubah atau laporan sudah ditutup.')
  }

  const cleanNote = officerNote.trim()

  if ((status === 'selesai' || status === 'ditolak') && !cleanNote) {
    throw new Error('Catatan wajib diisi untuk menyelesaikan atau menolak laporan.')
  }

  const updatedReports = reports.map((item) =>
    item.id === id
      ? { ...item, status, officerNote: cleanNote }
      : item
  )

  window.localStorage.setItem(storageKey, JSON.stringify(updatedReports))
  window.dispatchEvent(new Event(changeEvent))
}