"use client"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import styles from "../modules/components.module.css"

interface ValueCardProps {
  icon: LucideIcon
  title: string
  description: string
  delay?: number
}

export default function ValueCard({ icon: Icon, title, description, delay = 0 }: ValueCardProps) {
  return (
    <motion.div
      className={styles.valueCard}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className={styles.valueCardIcon}>
        <Icon size={24} />
      </div>
      <h3 className={styles.valueCardTitle}>{title}</h3>
      <p className={styles.valueCardDescription}>{description}</p>
    </motion.div>
  )
}
