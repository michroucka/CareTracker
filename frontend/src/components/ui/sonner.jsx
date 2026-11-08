import {
  IconAlertTriangle,
  IconBell,
  IconCheck,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from "@tabler/icons-react"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import { Toaster as Sonner, toast as sonnerToast } from "sonner";

const ICON_STYLES = {
  success: { Icon: IconCheck, className: "bg-success-soft text-success-soft-foreground" },
  info: { Icon: IconInfoCircle, className: "bg-secondary text-secondary-foreground", iconSize: "size-5" },
  warning: { Icon: IconAlertTriangle, className: "bg-warning-soft text-warning-soft-foreground" },
  error: { Icon: IconX, className: "bg-danger-soft text-danger-soft-foreground" },
  default: { Icon: IconBell, className: "bg-secondary text-secondary-foreground" },
  loading: { Icon: IconLoader2, className: "bg-muted text-muted-foreground", spin: true },
}

function ToastIcon({ type }) {
  const { Icon, className, spin, iconSize = "size-4" } = ICON_STYLES[type]
  return (
    <span className={cn("grid size-8 place-items-center rounded-full", className)}>
      <Icon className={cn(iconSize, spin && "animate-spin")} stroke={2.5} />
    </span>
  )
}

/**
 * Sonner's toast with an icon on the default variant too (sonner has no global default icon).
 * Use it instead of importing `toast` from "sonner" directly.
 */
const toast = Object.assign(
  (message, data) => sonnerToast(message, { icon: <ToastIcon type="default" />, ...data }),
  sonnerToast
)

// sonner injects its own unlayered CSS, so overrides need `!` to beat it
const Toaster = ({
  ...props
}) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      icons={{
        success: <ToastIcon type="success" />,
        info: <ToastIcon type="info" />,
        warning: <ToastIcon type="warning" />,
        error: <ToastIcon type="error" />,
        loading: <ToastIcon type="loading" />,
      }}
      toastOptions={{
        classNames: {
          toast: "!gap-3 !rounded-lg !px-4 !py-3.5 !shadow-md !font-sans",
          icon: "!m-0 !size-8 [&_svg]:!m-0",
          title: "!text-sm !font-semibold",
          description: "!text-sm !text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-lg)",
          "--width": "400px",
        }
      }
      {...props}
    />
  );
}

export { Toaster, toast }
