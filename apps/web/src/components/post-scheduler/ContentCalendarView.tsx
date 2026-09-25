"use client"

import React, { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Video,
  Vote,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

export interface CalendarEventItem {
  id: string
  title: string
  accountName: string
  date: string // YYYY-MM-DD
  time: string // HH:mm or "16:00"
  format?: "Text" | "Image" | "Video" | "Reel" | "Story" | "Poll"
  status: "Scheduled" | "Processing" | "Posted" | "Failed"
  tone?: string
  description?: string
  mediaUrl?: string
}

interface ContentCalendarViewProps {
  events: CalendarEventItem[]
  onRescheduleEvent: (id: string, newDate: string, newTime?: string) => void
  onDeleteEvent: (id: string) => void
  onDateClick?: (dateStr: string) => void
  connectedAccounts: string[]
}

export function ContentCalendarView({
  events,
  onRescheduleEvent,
  onDeleteEvent,
  onDateClick,
  connectedAccounts,
}: ContentCalendarViewProps) {
  // Current view date
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [calendarView, setCalendarView] = useState<"Monthly" | "Weekly" | "Daily">("Monthly")
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("ALL")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-indexed

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  // Compute days for current month grid
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()

  // Day of week for first day (0=Sunday, 1=Monday, ..., 6=Saturday)
  // Let's align Monday = 0
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7

  // Format YYYY-MM-DD
  const formatDateStr = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0")
    const dd = String(d).padStart(2, "0")
    return `${y}-${mm}-${dd}`
  }

  // Today's date string
  const todayStr = formatDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  // Days array for the month grid
  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = []

  // Preceding days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const prevMonthDate = new Date(year, month - 1, d)
    calendarCells.push({
      dateStr: formatDateStr(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), d),
      dayNum: d,
      isCurrentMonth: false,
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      dateStr: formatDateStr(year, month, d),
      dayNum: d,
      isCurrentMonth: true,
    })
  }

  // Remaining trailing days to complete full grid (multiple of 7)
  const remainingCells = 7 - (calendarCells.length % 7)
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonthDate = new Date(year, month + 1, d)
      calendarCells.push({
        dateStr: formatDateStr(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), d),
        dayNum: d,
        isCurrentMonth: false,
      })
    }
  }

  // Filter events
  const filteredEvents = events.filter((evt) => {
    return selectedAccountFilter === "ALL" || evt.accountName === selectedAccountFilter
  })

  // Format Icon
  const getFormatBadge = (fmt?: string) => {
    switch (fmt) {
      case "Video":
        return <span className="bg-rose-500/10 text-rose-500 font-bold px-1 rounded text-[9px]">Video</span>
      case "Reel":
        return <span className="bg-purple-500/10 text-purple-500 font-bold px-1 rounded text-[9px]">Reel</span>
      case "Story":
        return <span className="bg-amber-500/10 text-amber-500 font-bold px-1 rounded text-[9px]">Story</span>
      case "Poll":
        return <span className="bg-emerald-500/10 text-emerald-500 font-bold px-1 rounded text-[9px]">Poll</span>
      default:
        return <span className="bg-blue-500/10 text-blue-500 font-bold px-1 rounded text-[9px]">Post</span>
    }
  }

  // Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Posted":
        return <span className="text-emerald-500 font-bold text-[9px]">Posted</span>
      case "Processing":
        return <span className="text-amber-500 font-bold text-[9px]">Queue</span>
      case "Failed":
        return <span className="text-rose-500 font-bold text-[9px]">Failed</span>
      default:
        return <span className="text-blue-500 font-bold text-[9px]">Scheduled</span>
    }
  }

  return (
    <div className="border bg-card p-5 rounded-2xl space-y-5 shadow-sm">
      {/* Calendar Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        {/* Navigation & Month Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold border rounded-lg hover:bg-muted transition"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-extrabold text-lg text-foreground flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <span>
              {monthNames[month]} {year}
            </span>
          </h2>
        </div>

        {/* Filters & View Modes */}
        <div className="flex items-center space-x-2.5 flex-wrap">
          {/* Account Filter */}
          <select
            value={selectedAccountFilter}
            onChange={(e) => setSelectedAccountFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-lg bg-card text-xs font-semibold focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Accounts & Pages</option>
            {connectedAccounts.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>

          {/* View Mode Selector */}
          <div className="flex items-center space-x-1 bg-muted p-1 rounded-xl text-xs font-bold">
            {(["Monthly", "Weekly", "Daily"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1 rounded-lg transition ${
                  calendarView === view ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MONTHLY VIEW */}
      {calendarView === "Monthly" && (
        <div className="space-y-2">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground uppercase py-1">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 min-h-[460px]">
            {calendarCells.map((cell) => {
              const isToday = cell.dateStr === todayStr
              const dayEvents = filteredEvents.filter((e) => e.date === cell.dateStr)

              return (
                <div
                  key={cell.dateStr}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const evtId = e.dataTransfer.getData("eventId")
                    if (evtId) {
                      onRescheduleEvent(evtId, cell.dateStr)
                    }
                  }}
                  onClick={() => onDateClick && onDateClick(cell.dateStr)}
                  className={`border rounded-xl p-2 min-h-[105px] flex flex-col justify-between transition group relative ${
                    cell.isCurrentMonth ? "bg-card" : "bg-muted/10 opacity-50"
                  } ${isToday ? "border-blue-500 ring-1 ring-blue-500/20 bg-blue-500/[0.03]" : "hover:border-border/90"}`}
                >
                  {/* Top Bar inside cell: Day number + Today indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-extrabold rounded-md px-1.5 py-0.5 ${
                        isToday
                          ? "bg-blue-600 text-white"
                          : cell.isCurrentMonth
                          ? "text-foreground group-hover:text-blue-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {dayEvents.length} post{dayEvents.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Events list inside cell */}
                  <div className="space-y-1 my-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation()
                          e.dataTransfer.setData("eventId", evt.id)
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(evt)
                        }}
                        className="p-1 border rounded-lg bg-muted/40 hover:bg-muted text-left cursor-grab active:cursor-grabbing hover:border-blue-500 transition space-y-0.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold text-muted-foreground flex items-center space-x-0.5">
                            <Clock className="w-2.5 h-2.5 inline" />
                            <span>{evt.time}</span>
                          </span>
                          {getFormatBadge(evt.format)}
                        </div>

                        <span className="font-bold text-[10px] block truncate text-foreground">
                          {evt.title}
                        </span>
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <div className="text-[9px] font-bold text-blue-500 text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* WEEKLY VIEW */}
      {calendarView === "Weekly" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">
            Weekly Agenda view for current 7 days. Drag events between days to quickly reschedule.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 min-h-[350px]">
            {calendarCells.slice(0, 7).map((cell) => {
              const isToday = cell.dateStr === todayStr
              const dayEvents = filteredEvents.filter((e) => e.date === cell.dateStr)

              return (
                <div
                  key={cell.dateStr}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const evtId = e.dataTransfer.getData("eventId")
                    if (evtId) onRescheduleEvent(evtId, cell.dateStr)
                  }}
                  className={`border rounded-xl p-3 bg-card space-y-2.5 flex flex-col justify-between ${
                    isToday ? "border-blue-500 ring-1 ring-blue-500" : ""
                  }`}
                >
                  <div className="border-b pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Day {cell.dayNum}
                      </span>
                      <span className="font-extrabold text-xs text-foreground">{cell.dateStr}</span>
                    </div>
                    {isToday && (
                      <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayEvents.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-[10px]">
                        No scheduled posts
                      </div>
                    ) : (
                      dayEvents.map((evt) => (
                        <div
                          key={evt.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("eventId", evt.id)}
                          onClick={() => setSelectedEvent(evt)}
                          className="p-2 border rounded-lg bg-muted/30 hover:bg-muted cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground">{evt.time}</span>
                            {getFormatBadge(evt.format)}
                          </div>
                          <p className="font-extrabold text-[11px] truncate">{evt.title}</p>
                          <span className="text-[9px] text-muted-foreground block truncate">
                            Account: {evt.accountName}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DAILY VIEW */}
      {calendarView === "Daily" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border">
            <div>
              <span className="text-xs text-muted-foreground font-bold">Selected Date:</span>{" "}
              <span className="font-extrabold text-sm text-foreground">{todayStr} (Today)</span>
            </div>
            <span className="text-xs font-bold text-blue-500">
              {filteredEvents.filter((e) => e.date === todayStr).length} Scheduled for Today
            </span>
          </div>

          <div className="space-y-2">
            {filteredEvents.filter((e) => e.date === todayStr).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs space-y-1 border rounded-xl">
                <CalendarIcon className="w-8 h-8 mx-auto opacity-40 mb-2" />
                <p className="font-bold">No posts scheduled for today</p>
                <p className="text-[11px]">Use the Master Scheduler tab to schedule your posts.</p>
              </div>
            ) : (
              filteredEvents
                .filter((e) => e.date === todayStr)
                .map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="p-3 border rounded-xl bg-card hover:border-blue-500 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs text-foreground">{evt.title}</span>
                          {getFormatBadge(evt.format)}
                          {getStatusBadge(evt.status)}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Account: {evt.accountName} • Time: {evt.time}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteEvent(evt.id)
                      }}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
                  <CalendarIcon className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Scheduled Event Details</h3>
                  <p className="text-[11px] text-muted-foreground">Post format, timing, and destination</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-muted-foreground hover:text-foreground font-bold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[10px] uppercase text-muted-foreground">Post Title</label>
                <p className="font-extrabold text-sm text-foreground">{selectedEvent.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-xl border">
                <div>
                  <span className="font-bold text-[10px] uppercase text-muted-foreground block">Target Account</span>
                  <span className="font-extrabold text-foreground">{selectedEvent.accountName}</span>
                </div>
                <div>
                  <span className="font-bold text-[10px] uppercase text-muted-foreground block">Format</span>
                  <div className="mt-0.5">{getFormatBadge(selectedEvent.format)}</div>
                </div>
                <div>
                  <span className="font-bold text-[10px] uppercase text-muted-foreground block">Scheduled Date</span>
                  <span className="font-bold text-foreground">{selectedEvent.date}</span>
                </div>
                <div>
                  <span className="font-bold text-[10px] uppercase text-muted-foreground block">Time</span>
                  <span className="font-bold text-foreground">{selectedEvent.time}</span>
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <label className="font-bold text-[10px] uppercase text-muted-foreground">Caption / Copy</label>
                  <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-lg border max-h-24 overflow-y-auto">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Reschedule Date Input */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-muted-foreground">Reschedule to new date</label>
                <input
                  type="date"
                  defaultValue={selectedEvent.date}
                  onChange={(e) => {
                    if (e.target.value) {
                      onRescheduleEvent(selectedEvent.id, e.target.value)
                      setSelectedEvent({ ...selectedEvent, date: e.target.value })
                    }
                  }}
                  className="w-full p-2 border rounded-lg bg-background text-xs font-bold"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t pt-3">
              <button
                type="button"
                onClick={() => {
                  onDeleteEvent(selectedEvent.id)
                  setSelectedEvent(null)
                }}
                className="text-rose-500 hover:text-rose-600 font-bold text-xs flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="bg-primary text-primary-foreground font-bold px-4 py-1.5 rounded-lg text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
