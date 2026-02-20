"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Lightbulb, Shield, Eye, Lock, Server, ChevronDown } from "lucide-react"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import styles from "../../modules/prosedur.module.css"

const processSteps = [
  {
    number: 1,
    title: "Buat Laporan Anonim",
    description:
      "Pilih kategori laporan dan jelaskan situasi secara detail. Anda tidak perlu memasukkan data pribadi apapun. Sistem dirancang untuk melindungi anonimitas Anda.",
  },
  {
    number: 2,
    title: "Terima Kode Akses",
    description:
      "Setelah mengirim laporan, Anda akan menerima kode akses unik 12 karakter. Simpan kode ini dengan aman karena ini adalah satu-satunya cara untuk melacak laporan Anda.",
  },
  {
    number: 3,
    title: "Tim Verifikasi Memeriksa",
    description:
      "Tim verifikasi OSIS akan memeriksa laporan dalam waktu 24 jam. Laporan yang valid akan diteruskan ke pihak berwenang yang tepat.",
  },
  {
    number: 4,
    title: "Proses Penanganan",
    description:
      "Pihak terkait akan menindaklanjuti laporan sesuai prosedur. Anda dapat memantau progress melalui kode akses yang diberikan.",
  },
  {
    number: 5,
    title: "Penyelesaian & Feedback",
    description:
      "Setelah masalah ditangani, status laporan akan diperbarui. Anda dapat memberikan feedback tentang penanganan yang dilakukan.",
  },
]

const categories = [
  {
    icon: AlertTriangle,
    title: "Bullying",
    description:
      "Laporkan tindakan perundungan baik fisik, verbal, maupun cyber bullying. Setiap laporan akan ditangani dengan serius dan rahasia.",
  },
  {
    icon: Lightbulb,
    title: "Ide & Saran",
    description:
      "Sampaikan ide dan saran untuk perbaikan sekolah. Aspirasi positif Anda sangat berarti untuk kemajuan bersama.",
  },
]

const privacyFeatures = [
  {
    icon: Shield,
    title: "Tanpa Data Pribadi",
    description: "Kami tidak meminta nama, NIS, atau informasi identitas lainnya.",
  },
  {
    icon: Eye,
    title: "Tanpa Pelacakan",
    description: "Aktivitas Anda tidak dilacak atau dicatat dalam sistem.",
  },
  {
    icon: Lock,
    title: "Enkripsi End-to-End",
    description: "Semua data laporan dienkripsi untuk keamanan maksimal.",
  },
]

const faqs = [
  {
    question: "Apakah identitas saya benar-benar aman?",
    answer:
      "Ya, sistem YourVoice dirancang dengan prinsip privasi sebagai prioritas utama. Kami tidak menyimpan data pribadi atau informasi apapun yang dapat mengidentifikasi pelapor. Kode akses adalah satu-satunya penghubung Anda dengan laporan.",
  },
  {
    question: "Bagaimana jika saya kehilangan kode akses?",
    answer:
      "Sayangnya, kami tidak dapat memulihkan kode akses yang hilang karena sistem tidak menyimpan informasi identitas pelapor. Ini adalah bagian dari komitmen kami terhadap anonimitas. Pastikan untuk menyimpan kode akses di tempat yang aman.",
  },
  {
    question: "Berapa lama laporan saya akan diproses?",
    answer:
      "Tim verifikasi akan memeriksa laporan dalam 24 jam. Setelah diverifikasi, laporan akan diteruskan ke pihak terkait. Total waktu penyelesaian bervariasi tergantung jenis dan kompleksitas masalah, namun kami berkomitmen untuk menangani setiap laporan secepat mungkin.",
  },
  {
    question: "Apakah ada konsekuensi untuk laporan palsu?",
    answer:
      "Meskipun anonim, laporan palsu dapat dikenakan sanksi jika terbukti merugikan pihak lain. Kami mendorong penggunaan platform ini secara bertanggung jawab untuk membangun lingkungan sekolah yang lebih baik.",
  },
  {
    question: "Bisakah saya menambahkan informasi setelah mengirim laporan?",
    answer:
      "Saat ini, fitur untuk menambahkan informasi setelah pengiriman belum tersedia. Pastikan untuk menyertakan semua informasi relevan saat membuat laporan. Fitur update laporan akan dikembangkan di masa mendatang.",
  },
  {
    question: "Siapa yang dapat melihat laporan saya?",
    answer:
      "Laporan hanya dapat diakses oleh tim verifikasi OSIS dan pihak berwenang yang ditunjuk sesuai kategori laporan. Akses dibatasi dengan ketat dan semua pihak yang terlibat telah menandatangani perjanjian kerahasiaan.",
  },
]

export default function ProsedurPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className={styles.prosedurPage}>
      <Header />
      <main className={styles.prosedurMain}>
        {/* Hero */}
        <section className={styles.pageHero}>
          <div className={styles.pageHeroContent}>
            <motion.h1
              className={styles.pageTitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Prosedur Pelaporan
            </motion.h1>
            <motion.p
              className={styles.pageDescription}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Pelajari cara kerja sistem pelaporan YourVoice dan bagaimana kami melindungi privasi Anda
            </motion.p>
          </div>
        </section>

        {/* Process Steps */}
        <section className={styles.contentSection}>
          <div className={styles.contentContainer}>
            <h2 className={styles.sectionTitle}>Alur Pelaporan</h2>
            <div className={styles.processSteps}>
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  className={styles.processStep}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className={styles.processStepNumber}>{step.number}</div>
                  <div className={styles.processStepContent}>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <h2 className={styles.sectionTitle}>Kategori Laporan</h2>
            <div className={styles.categoryInfo}>
              {categories.map((cat, index) => (
                <motion.div
                  key={cat.title}
                  className={styles.categoryCard}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className={styles.categoryCardIcon}>
                    <cat.icon size={24} />
                  </div>
                  <h3>{cat.title}</h3>
                  <p>{cat.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section id="privasi" className={styles.privacySection}>
          <div className={styles.contentContainer}>
            <h2 className={styles.sectionTitle}>Komitmen Privasi</h2>
            <div className={styles.privacyGrid}>
              {privacyFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={styles.privacyCard}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className={styles.privacyCardIcon}>
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className={styles.faqSection}>
          <div className={styles.contentContainer}>
            <h2 className={styles.sectionTitle}>Pertanyaan Umum (FAQ)</h2>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  className={styles.faqItem}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <button className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    {faq.question}
                    <ChevronDown
                      size={20}
                      className={`${styles.faqIcon} ${openFaq === index ? styles.faqIconOpen : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className={styles.faqAnswer}>{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
