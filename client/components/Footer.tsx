import Link from "next/link"
import styles from "../modules/components.module.css"

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandName}>
              Your<span>Voice</span>
            </div>
            <p className={styles.footerDescription}>
              Platform anonim untuk menyuarakan aspirasi, melaporkan masalah, dan membangun lingkungan yang lebih baik
              bersama-sama.
            </p>
          </div>

          <div className={styles.footerSection}>
            <h4>Navigasi</h4>
            <div className={styles.footerLinks}>
              <Link href="/">Beranda</Link>
              <Link href="/lapor">Buat Laporan</Link>
              <Link href="/cek-status">Cek Status</Link>
              <Link href="/prosedur">Prosedur</Link>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h4>Informasi</h4>
            <div className={styles.footerLinks}>
              <Link href="/prosedur">Cara Kerja</Link>
              <Link href="/prosedur#privasi">Kebijakan Privasi</Link>
              <Link href="/prosedur#faq">FAQ</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} YourVoice. Platform Integritas.</p>
        </div>
      </div>
    </footer>
  )
}
