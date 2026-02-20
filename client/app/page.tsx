"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, Eye, MessageSquare, FileText, Lock, Users } from "lucide-react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import ValueCard from "../components/ValueCard"
import styles from "../modules/landing.module.css"
import componentStyles from "../modules/components.module.css"

const values = [
  {
    icon: Shield,
    title: "100% Anonim",
    description:
      "Identitas Anda tidak pernah disimpan atau dilacak. Sistem dirancang untuk melindungi privasi pelapor.",
  },
  {
    icon: Lock,
    title: "Keamanan Terjamin",
    description: "Data laporan dienkripsi dan hanya dapat diakses oleh pihak berwenang yang ditunjuk.",
  },
  {
    icon: Eye,
    title: "Transparan",
    description: "Pantau status laporan Anda secara real-time menggunakan kode akses unik yang diberikan.",
  },
  {
    icon: MessageSquare,
    title: "Respons Cepat",
    description: "Tim khusus akan menindaklanjuti setiap laporan dalam waktu 3x24 jam kerja.",
  },
  {
    icon: FileText,
    title: "Dokumentasi Lengkap",
    description: "Setiap proses dan tindakan tercatat dengan baik untuk akuntabilitas.",
  },
  {
    icon: Users,
    title: "Dukungan OSIS",
    description: "Dikelola oleh OSIS sebagai wadah aspirasi siswa yang independen dan terpercaya.",
  },
]

const steps = [
  {
    number: 1,
    title: "Buat Laporan",
    description: "Pilih kategori dan jelaskan situasi. Tidak perlu data pribadi apapun.",
  },
  {
    number: 2,
    title: "Dapatkan Kode Akses",
    description: "Sistem akan memberikan kode unik 12 karakter untuk melacak laporan.",
  },
  {
    number: 3,
    title: "Pantau Progress",
    description: "Gunakan kode akses untuk melihat status dan perkembangan laporan Anda.",
  },
]

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className={styles.hero}>
          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.heroBadge}>
              <Shield size={16} />
              Platform Resmi OSIS
            </div>
            <h1 className={styles.heroTitle}>
              Suaramu <span>Penting</span>.
              <br />
              Privasimu Kami Jaga.
            </h1>
            <p className={styles.heroDescription}>
              YourVoice adalah platform pelaporan anonim untuk menyuarakan aspirasi, melaporkan masalah, dan membangun
              lingkungan yang lebih baik bersama-sama.
            </p>
            <div className={styles.heroActions}>
              <Link
                href="/lapor"
                className={`${componentStyles.button} ${componentStyles.buttonPrimary} ${componentStyles.buttonLarge}`}
              >
                Buat Laporan Anonim
              </Link>
              <Link
                href="/cek-status"
                className={`${componentStyles.button} ${componentStyles.buttonSecondary} ${componentStyles.buttonLarge}`}
              >
                Cek Status Laporan
              </Link>
            </div>
          </motion.div>
        </section>

        {/* OSIS Pledge Banner */}
        <section className={styles.pledgeBanner}>
          <motion.div
            className={styles.pledgeContent}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.pledgeLabel}>Ikrar Independensi OSIS</span>
            <h2 className={styles.pledgeTitle}>Komitmen Kami untuk Integritas</h2>
            <p className={styles.pledgeText}>
              &quot;Sebagai pengurus OSIS, kami berkomitmen untuk menjalankan platform ini dengan penuh integritas,
              menjaga kerahasiaan setiap laporan, dan menindaklanjuti setiap aspirasi siswa secara adil dan
              transparan.&quot;
            </p>
          </motion.div>
        </section>

        {/* Values Section */}
        <section className={styles.values}>
          <div className={styles.valuesContent}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionLabel}>Mengapa YourVoice?</p>
              <h2 className={styles.sectionTitle}>Membangun Kepercayaan Bersama</h2>
              <p className={styles.sectionDescription}>
                Platform yang dirancang dengan prinsip keamanan dan privasi sebagai prioritas utama.
              </p>
            </div>
            <div className={styles.valuesGrid}>
              {values.map((value, index) => (
                <ValueCard
                  key={value.title}
                  icon={value.icon}
                  title={value.title}
                  description={value.description}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className={styles.howItWorks}>
          <div className={styles.howItWorksContent}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionLabel}>Cara Kerja</p>
              <h2 className={styles.sectionTitle}>Tiga Langkah Sederhana</h2>
              <p className={styles.sectionDescription}>
                Proses yang mudah dan cepat tanpa memerlukan data pribadi apapun.
              </p>
            </div>
            <div className={styles.stepsGrid}>
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  className={styles.stepCard}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <div className={styles.stepNumber}>{step.number}</div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <div className={styles.ctaContent}>
            <motion.div
              className={styles.ctaCard}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className={styles.ctaTitle}>Siap Menyuarakan Aspirasimu?</h2>
              <p className={styles.ctaDescription}>
                Setiap suara penting. Laporkan masalah atau sampaikan ide untuk sekolah yang lebih baik.
              </p>
              <div className={styles.ctaActions}>
                <Link
                  href="/lapor"
                  className={`${componentStyles.button} ${componentStyles.buttonLarge} ${styles.ctaButtonPrimary}`}
                >
                  Mulai Laporan
                </Link>
                <Link
                  href="/prosedur"
                  className={`${componentStyles.button} ${componentStyles.buttonLarge} ${styles.ctaButtonSecondary}`}
                >
                  Pelajari Prosedur
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
