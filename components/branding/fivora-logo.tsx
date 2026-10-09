import Image from 'next/image'
import styles from './fivora-logo.module.css'

export default function FivoraLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`${styles.frame} ${compact ? styles.compact : ''}`}>
      <Image
        src="/fivora-logo-current.png"
        alt="Fivora, Facility & Venue Reservation"
        width={1040}
        height={1040}
        sizes={
          compact
            ? '(max-width: 540px) 148px, 190px'
            : '(max-width: 540px) 180px, 208px'
        }
        className={styles.image}
      />
    </span>
  )
}
