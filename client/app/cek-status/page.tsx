import { Suspense } from "react"
import CekStatusContent from "./cek-status-content"

export default function CekStatusPage() {
  return (
    <Suspense fallback={null}>
      <CekStatusContent />
    </Suspense>
  )
}
