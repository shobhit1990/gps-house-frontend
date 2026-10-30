"use client"

import * as React from "react"
import { ChevronDownIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

interface DateTimePickerProps {
  label?: string
  date: Date | undefined
  time: string
  onDateChange: (date: Date | undefined) => void
  onTimeChange: (time: string) => void
  placeholder?: string
  id?: string
  disablePastDates?: boolean
}

const HHMM_24H = /^([01]\d|2[0-3]):[0-5]\d$/
const HHMMSS_24H = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
/** Shown when parent `time` is empty/invalid — never treat as a committed value. */
const TIME_PLACEHOLDER = "--:--:--"

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isValidTime(value: string): boolean {
  const v = String(value || "")
  return HHMM_24H.test(v) || HHMMSS_24H.test(v)
}

function parseTimeParts(time: string): { hh: number; mm: number; ss: number } {
  if (!isValidTime(time)) {
    return { hh: 0, mm: 0, ss: 0 }
  }
  const [hhRaw, mmRaw, ssRaw] = String(time || "").split(":")
  const hh = clampInt(parseInt(hhRaw ?? "0", 10) || 0, 0, 23)
  const mm = clampInt(parseInt(mmRaw ?? "0", 10) || 0, 0, 59)
  const ss = clampInt(parseInt(ssRaw ?? "0", 10) || 0, 0, 59)
  return { hh, mm, ss }
}

function formatTime(hh: number, mm: number, ss: number): string {
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`
}

function getCurrentTime(): string {
  const now = new Date()
  return formatTime(now.getHours(), now.getMinutes(), now.getSeconds())
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** True when date+time is strictly before "now" (second precision). */
function isDateTimeBeforeNow(date: Date, hh: number, mm: number, ss: number): boolean {
  const candidate = new Date(date)
  candidate.setHours(hh, mm, ss, 0)
  return Math.floor(candidate.getTime() / 1000) < Math.floor(Date.now() / 1000)
}

function ColumnPicker(args: {
  label: string
  range: number
  value: number
  onSelect: (v: number) => void
  isDisabled?: (v: number) => boolean
  closeOnSelect?: boolean
  containerRef?: React.RefObject<HTMLDivElement | null>
}) {
  const { label, range, value, onSelect, isDisabled, closeOnSelect, containerRef } = args
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const refToUse = containerRef ?? localRef

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="px-2 pb-1 text-[11px] font-semibold text-muted-foreground">{label}</div>
      <div
        ref={refToUse}
        className="h-48 overflow-y-auto overscroll-contain rounded-md border bg-background p-1"
        onWheelCapture={(e) => {
          e.stopPropagation()
        }}
      >
        {Array.from({ length: range }).map((_, i) => {
          const selected = i === value
          const disabled = isDisabled?.(i) ?? false
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              className={[
                "flex h-8 w-full items-center justify-center rounded-sm text-sm tabular-nums",
                disabled
                  ? "pointer-events-none cursor-not-allowed text-muted-foreground/40 opacity-40"
                  : selected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
              ].join(" ")}
              onClick={() => {
                if (disabled) return
                onSelect(i)
              }}
              data-close-on-select={closeOnSelect ? "true" : "false"}
            >
              {pad2(i)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DateTimePicker({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  placeholder = "Select date",
  id,
  disablePastDates = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [timeOpen, setTimeOpen] = React.useState(false)
  const [autoTime, setAutoTime] = React.useState(getCurrentTime)
  const [nowTick, setNowTick] = React.useState(() => new Date())

  const hasValidTime = isValidTime(time)

  React.useEffect(() => {
    if (hasValidTime) return
    setAutoTime(getCurrentTime())
  }, [hasValidTime, time])

  // Keep "now" fresh while either popover is open (date or time).
  React.useEffect(() => {
    if (!disablePastDates || (!open && !timeOpen)) return
    setNowTick(new Date())
    const timerId = window.setInterval(() => setNowTick(new Date()), 1000)
    return () => window.clearInterval(timerId)
  }, [open, timeOpen, disablePastDates])

  const resolvedTime = hasValidTime ? time : autoTime
  const displayTime = hasValidTime
    ? HHMM_24H.test(time)
      ? `${time}:00`
      : time
    : TIME_PLACEHOLDER
  const { hh, mm, ss } = React.useMemo(
    () => parseTimeParts(resolvedTime),
    [resolvedTime]
  )
  const hhRef = React.useRef<HTMLDivElement | null>(null)
  const mmRef = React.useRef<HTMLDivElement | null>(null)
  const ssRef = React.useRef<HTMLDivElement | null>(null)

  const todayStart = React.useMemo(() => startOfDay(nowTick), [nowTick])

  // Block past times for today. If date is not chosen yet, assume today
  // so users cannot pre-select a past time and then pick today's date.
  const constrainsToToday = Boolean(
    disablePastDates && (!date || isSameCalendarDay(date, nowTick))
  )
  const nowHh = nowTick.getHours()
  const nowMm = nowTick.getMinutes()
  const nowSs = nowTick.getSeconds()

  const clampTimeIfPast = React.useCallback(
    (nextHh: number, nextMm: number, nextSs: number, forDate?: Date) => {
      const formatted = formatTime(nextHh, nextMm, nextSs)
      if (!disablePastDates) return formatted

      const day = forDate ?? date ?? nowTick
      // Future calendar day → any time is fine.
      if (startOfDay(day).getTime() > startOfDay(new Date()).getTime()) {
        return formatted
      }
      // Past calendar day should not be selectable; still snap time forward.
      if (isDateTimeBeforeNow(day, nextHh, nextMm, nextSs)) {
        return getCurrentTime()
      }
      return formatted
    },
    [date, disablePastDates, nowTick]
  )

  const commitTime = React.useCallback(
    (nextHh: number, nextMm: number, nextSs: number) => {
      // If user picks a current/future hour but leftover mm/ss would be past, bump.
      const h = nextHh
      let m = nextMm
      let s = nextSs
      if (constrainsToToday) {
        if (h < nowHh) {
          const now = getCurrentTime()
          setAutoTime(now)
          onTimeChange(now)
          return
        }
        if (h === nowHh && m < nowMm) {
          m = nowMm
          s = nowSs
        } else if (h === nowHh && m === nowMm && s < nowSs) {
          s = nowSs
        }
      }
      const next = clampTimeIfPast(h, m, s)
      setAutoTime(next)
      onTimeChange(next)
    },
    [clampTimeIfPast, constrainsToToday, nowHh, nowMm, nowSs, onTimeChange]
  )

  const ensureTimeNotPast = React.useCallback(() => {
    if (!disablePastDates || !hasValidTime) return
    if (date && startOfDay(date).getTime() > startOfDay(new Date()).getTime()) return
    const parts = parseTimeParts(time)
    const day = date ?? new Date()
    if (isDateTimeBeforeNow(day, parts.hh, parts.mm, parts.ss)) {
      const now = getCurrentTime()
      setAutoTime(now)
      onTimeChange(now)
    }
  }, [date, disablePastDates, hasValidTime, onTimeChange, time])

  const commitTimeFallback = () => {
    if (hasValidTime) {
      ensureTimeNotPast()
      return
    }
    const now = getCurrentTime()
    setAutoTime(now)
    onTimeChange(now)
  }

  React.useEffect(() => {
    if (!timeOpen) return
    const itemHeight = 32
    const scrollTo = (el: HTMLDivElement | null, activeValue: number) => {
      if (!el) return
      const targetTop = Math.max(0, activeValue * itemHeight - el.clientHeight / 2 + itemHeight / 2)
      el.scrollTop = targetTop
    }
    scrollTo(hhRef.current, hh)
    scrollTo(mmRef.current, mm)
    scrollTo(ssRef.current, ss)
  }, [timeOpen, hh, mm, ss])

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3 flex-1">
        <Label htmlFor={id ? `${id}-date` : "date-picker"} className="px-1">
          {label || "Date"}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={id ? `${id}-date` : "date-picker"}
              className="w-full justify-between font-normal"
            >
              {date ? format(date, "PPP") : placeholder}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              disabled={disablePastDates ? (d) => d < todayStart : undefined}
              onSelect={(selectedDate) => {
                if (!selectedDate) {
                  onDateChange(undefined)
                  setOpen(false)
                  return
                }
                onDateChange(selectedDate)
                if (hasValidTime) {
                  const parts = parseTimeParts(time)
                  const clamped = clampTimeIfPast(
                    parts.hh,
                    parts.mm,
                    parts.ss,
                    selectedDate
                  )
                  if (clamped !== time) onTimeChange(clamped)
                }
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <Label htmlFor={id ? `${id}-time` : "time-picker"} className="px-1">
          Time
        </Label>
        <Popover
          open={timeOpen}
          onOpenChange={(nextOpen) => {
            if (nextOpen) {
              setNowTick(new Date())
              commitTimeFallback()
            }
            setTimeOpen(nextOpen)
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              id={id ? `${id}-time` : "time-picker"}
              className={[
                "w-full justify-between font-normal tabular-nums",
                !hasValidTime ? "text-muted-foreground" : "",
              ].join(" ")}
            >
              {displayTime}
              <Clock className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[360px] max-w-[90vw] p-3"
            align="start"
            onWheelCapture={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="grid grid-cols-3 gap-2">
              <ColumnPicker
                label="HH"
                range={24}
                value={hh}
                containerRef={hhRef}
                isDisabled={constrainsToToday ? (v) => v < nowHh : undefined}
                onSelect={(newHh) => {
                  commitTime(newHh, mm, ss)
                }}
              />
              <ColumnPicker
                label="MM"
                range={60}
                value={mm}
                containerRef={mmRef}
                isDisabled={
                  constrainsToToday && hh <= nowHh
                    ? (v) => (hh < nowHh ? true : v < nowMm)
                    : undefined
                }
                onSelect={(newMm) => {
                  commitTime(hh, newMm, ss)
                }}
              />
              <ColumnPicker
                label="SS"
                range={60}
                value={ss}
                containerRef={ssRef}
                closeOnSelect
                isDisabled={
                  constrainsToToday && hh <= nowHh && mm <= nowMm
                    ? (v) => (hh < nowHh || mm < nowMm ? true : v < nowSs)
                    : undefined
                }
                onSelect={(newSs) => {
                  commitTime(hh, mm, newSs)
                  setTimeOpen(false)
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground tabular-nums">
                Selected: {formatTime(hh, mm, ss)}
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const now = new Date()
                  commitTime(now.getHours(), now.getMinutes(), now.getSeconds())
                }}
              >
                Now
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
