"use client"

import { motion } from "framer-motion"
import styles from "../modules/components.module.css"

export interface TimelineItem {
  id: string | number
  title: string
  description: string
  date: string
  isActive?: boolean
  isCompleted?: boolean
  note?: string
}

interface TimelineProps {
  items: TimelineItem[]
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className={styles.timeline}>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          className={styles.timelineItem}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <div
            className={`${styles.timelineDot} ${
              item.isActive ? styles.timelineDotActive : item.isCompleted ? styles.timelineDotCompleted : ""
            }`}
          />
          <div className={`${styles.timelineContent} ${item.isActive ? styles.timelineContentActive : ""}`}>
            <h4 className={styles.timelineTitle}>{item.title}</h4>
            <p className={styles.timelineDescription}>{item.description}</p>
            {item.note && (
              <p className={styles.timelineNote}>"{item.note}"</p>
            )}
            <span className={styles.timelineDate}>{item.date}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
