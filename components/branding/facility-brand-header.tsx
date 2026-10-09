import Link from 'next/link'
import FivoraLogo from './fivora-logo'
import styles from './facility-brand-header.module.css'

export default function FacilityBrandHeader() {
  return (
    <div className={styles.header}>
      <Link href="/" className={styles.link}>
        <FivoraLogo />
      </Link>
    </div>
  )
}
