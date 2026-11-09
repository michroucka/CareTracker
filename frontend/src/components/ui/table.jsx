"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const INTERACTIVE_ROW = "tr[data-interactive]"
const ROW_CONTROL = "button, a[href], input, select, [tabindex]:not(tr)"

/**
 * Rows that open a detail work as one Tab stop (roving tabindex): Tab enters the table on the last
 * active row and the next Tab leaves it. ↑ ↓ Home End move between rows, → moves to the row's
 * controls (the "⋯" menu), ← goes back to the row. Enter / Space open the row (see TableRow).
 */
function useRowNavigation(containerRef) {
  React.useEffect(() => {
    const container = containerRef.current
    // rows come and go with paging and filtering; keep exactly one row tabbable and their controls out of Tab
    const syncTabStops = () => {
      const rows = [...container.querySelectorAll(INTERACTIVE_ROW)]
      rows.forEach((row) => row.querySelectorAll(ROW_CONTROL).forEach((control) => { control.tabIndex = -1 }))
      if (rows.length && !rows.some((row) => row.tabIndex === 0)) rows[0].tabIndex = 0
    }
    syncTabStops()
    const observer = new MutationObserver(syncTabStops)
    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [containerRef])

  const makeActive = (row) => {
    containerRef.current.querySelectorAll(INTERACTIVE_ROW).forEach((other) => { other.tabIndex = other === row ? 0 : -1 })
  }

  const onFocus = (event) => {
    const row = event.target.closest(INTERACTIVE_ROW)
    if (row) makeActive(row)
  }

  const onKeyDown = (event) => {
    const row = event.target.closest(INTERACTIVE_ROW)
    if (!row) return
    const rows = [...containerRef.current.querySelectorAll(INTERACTIVE_ROW)]
    const index = rows.indexOf(row)
    const onRow = event.target === row

    let next = null
    if (onRow && event.key === "ArrowDown") next = rows[index + 1]
    else if (onRow && event.key === "ArrowUp") next = rows[index - 1]
    else if (onRow && event.key === "Home") next = rows[0]
    else if (onRow && event.key === "End") next = rows.at(-1)
    else if (onRow && event.key === "ArrowRight") next = row.querySelector(ROW_CONTROL)
    else if (!onRow && event.key === "ArrowLeft") next = row
    else return

    event.preventDefault()
    next?.focus()
  }

  return { onFocus, onKeyDown }
}

function Table({
  className,
  ...props
}) {
  const containerRef = React.useRef(null)
  const rowNavigation = useRowNavigation(containerRef)

  return (
    <div
      ref={containerRef}
      data-slot="table-container"
      className="@container/table relative w-full overflow-x-auto rounded-lg border bg-card shadow-xs"
      {...rowNavigation}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({
  className,
  ...props
}) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted [&_tr]:border-b [&_tr]:hover:bg-transparent", className)}
      {...props}
    />
  )
}

function TableBody({
  className,
  ...props
}) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({
  className,
  ...props
}) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted font-semibold tabular-nums [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

// A row with onClick (opens a detail) opens with Enter or Space; keys pressed on controls inside the row
// (the "⋯" menu) are left to them. Table moves the focus between such rows with the arrow keys.
function TableRow({
  className,
  onClick,
  ...props
}) {
  const keyboardProps = onClick && {
    "data-interactive": "",
    tabIndex: -1,
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return
      event.preventDefault()
      onClick(event)
    },
  }

  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border/70 transition-colors duration-base ease-out outline-none hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] has-aria-expanded:bg-accent/60 data-[state=selected]:bg-secondary/70 data-[state=selected]:shadow-[inset_3px_0_0_var(--primary)] data-[state=selected]:hover:bg-secondary",
        className
      )}
      onClick={onClick}
      {...keyboardProps}
      {...props}
    />
  )
}

function TableHead({
  className,
  ...props
}) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase first:pl-5 last:pr-5 @max-xl/table:px-2 @max-xl/table:first:pl-4 @max-xl/table:last:pr-3 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({
  className,
  ...props
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-2.5 align-middle whitespace-nowrap first:pl-5 last:pr-5 @max-xl/table:px-2 @max-xl/table:first:pl-4 @max-xl/table:last:pr-3 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
