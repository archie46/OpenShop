import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface MobileMenuTriggerProps {
  children: React.ReactNode
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}

interface MobileMenuContentProps {
  children: React.ReactNode
  className?: string
}

interface MobileMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const MobileMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

export function MobileMenu({ children, open, onOpenChange }: MobileMenuProps) {
  return (
    <MobileMenuContext.Provider
      value={{
        open,
        setOpen: onOpenChange,
      }}
    >
      {children}
    </MobileMenuContext.Provider>
  )
}

export function MobileMenuTrigger({
  children,
  onClick,
  className,
}: MobileMenuTriggerProps) {
  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  )
}

export function MobileMenuContent({
  children,
  className,
}: MobileMenuContentProps) {
  const { open, setOpen } = React.useContext(MobileMenuContext)

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "fixed left-0 top-[64px] z-50 w-full border-b border-border bg-background p-4 shadow-lg animate-in slide-in-from-top-2",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

export function MobileMenuItem({
  children,
  onClick,
  className,
}: MobileMenuItemProps) {
  const { setOpen } = React.useContext(MobileMenuContext)

  const handleClick = () => {
    onClick?.()
    setOpen(false)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-center rounded-sm px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}
