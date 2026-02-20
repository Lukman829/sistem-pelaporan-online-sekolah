import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: {
      bg: "bg-yellow-50 dark:bg-yellow-950",
      text: "text-yellow-700 dark:text-yellow-300",
      label: "Menunggu",
    },
    in_progress: {
      bg: "bg-blue-50 dark:bg-blue-950",
      text: "text-blue-700 dark:text-blue-300",
      label: "Diproses",
    },
    resolved: {
      bg: "bg-green-50 dark:bg-green-950",
      text: "text-green-700 dark:text-green-300",
      label: "Selesai",
    },
    closed: {
      bg: "bg-slate-50 dark:bg-slate-950",
      text: "text-slate-700 dark:text-slate-300",
      label: "Ditutup",
    },
  };

  const config = statusConfig[status] || { 
    bg: "bg-gray-50 dark:bg-gray-950", 
    text: "text-gray-700 dark:text-gray-300", 
    label: status 
  };

  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-1 text-xs font-medium",
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}
