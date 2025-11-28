import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  asChild?: boolean
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}>({
  open: false,
  setOpen: () => {},
  triggerRef: React.createRef(),
})

export function DropdownMenu({ children, open, onOpenChange }: DropdownMenuProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  return (
    <DropdownMenuContext.Provider
      value={{
        open,
        setOpen: onOpenChange,
        triggerRef,
      }}
    >
      {children}
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({
  children,
  onClick,
  className,
}: DropdownMenuTriggerProps) {
  const { triggerRef } = React.useContext(DropdownMenuContext)

  return (
    <button ref={triggerRef} onClick={onClick} className={className}>
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  align = "start",
  className,
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const contentWidth = contentRef.current?.offsetWidth || 200

      let left = triggerRect.left
      if (align === "end") {
        left = triggerRect.right - contentWidth
      } else if (align === "center") {
        left = triggerRect.left + triggerRect.width / 2 - contentWidth / 2
      }

      setPosition({
        top: triggerRect.bottom + 8,
        left,
      })
    }
  }, [open, align, triggerRef])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, setOpen, triggerRef])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "fixed z-50 min-w-[180px] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    onClick?.()
    setOpen(false)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}
