"use client"

import { Check } from "lucide-react"
import styles from "../modules/components.module.css"

interface Step {
  id: number
  label: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => (
        <div key={step.id} className={styles.step}>
          <div
            className={`${styles.stepCircle} ${
              currentStep > step.id
                ? styles.stepCircleCompleted
                : currentStep === step.id
                  ? styles.stepCircleActive
                  : styles.stepCircleInactive
            }`}
          >
            {currentStep > step.id ? <Check size={16} /> : step.id}
          </div>
          <span className={`${styles.stepLabel} ${currentStep >= step.id ? styles.stepLabelActive : ""}`}>
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className={`${styles.stepConnector} ${currentStep > step.id ? styles.stepConnectorCompleted : ""}`} />
          )}
        </div>
      ))}
    </div>
  )
}
