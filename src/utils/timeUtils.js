// src/utils/timeUtils.js

/**
 * Time and Date Utilities for Lumos Hub
 * Handles formatting, calculations, session timing, and productivity tracking
 */

import { 
  format, 
  formatDistance, 
  formatDistanceToNow, 
  isToday, 
  isYesterday,
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek,
  startOfMonth, 
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays, 
  addWeeks, 
  addMonths,
  subDays, 
  subWeeks, 
  subMonths,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  parseISO,
  isValid,
  getDay,
  getHour,
  setHour,
  setMinute,
  addMinutes,
  addSeconds,
  intervalToDuration,
  Duration
} from 'date-fns'

// Constants
export const TIME_FORMATS = {
  FULL_DATE: 'EEEE, MMMM d, yyyy',
  SHORT_DATE: 'MMM d, yyyy',
  DATE_ONLY: 'yyyy-MM-dd',
  TIME_ONLY: 'HH:mm',
  TIME_WITH_SECONDS: 'HH:mm:ss',
  TIME_12H: 'h:mm a',
  DATETIME: 'MMM d, yyyy HH:mm',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
  RELATIVE: 'relative'
}

export const STUDY_MODES = {
  POMODORO: { workTime: 25, shortBreak: 5, longBreak: 15, cycleLength: 4 },
  DEEP_WORK: { workTime: 90, shortBreak: 15, longBreak: 30, cycleLength: 2 },
  ULTRADIAN: { workTime: 120, shortBreak: 20, longBreak: 30, cycleLength: 3 },
  CUSTOM: { workTime: 30, shortBreak: 10, longBreak: 20, cycleLength: 3 }
}

export const PRODUCTIVITY_HOURS = {
  EARLY_MORNING: [6, 9],   // 6 AM - 9 AM
  MORNING: [9, 12],        // 9 AM - 12 PM
  AFTERNOON: [13, 17],     // 1 PM - 5 PM
  EVENING: [18, 22],       // 6 PM - 10 PM
  NIGHT: [22, 24],         // 10 PM - 12 AM
  LATE_NIGHT: [0, 6]       // 12 AM - 6 AM
}

/**
 * Main TimeUtils class
 */
export class TimeUtils {
  static formatTime(date, formatStr = TIME_FORMATS.DATETIME, locale = 'en-US') {
    if (!date) return ''
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) return 'Invalid date'
    
    if (formatStr === TIME_FORMATS.RELATIVE) {
      return this.getRelativeTime(dateObj)
    }
    
    try {
      return format(dateObj, formatStr, { locale })
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Invalid format'
    }
  }

  static getRelativeTime(date) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, 'HH:mm')}`
    }
    
    if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, 'HH:mm')}`
    }
    
    const daysDiff = Math.abs(differenceInDays(new Date(), dateObj))
    
    if (daysDiff <= 7) {
      return formatDistanceToNow(dateObj, { addSuffix: true })
    }
    
    return format(dateObj, 'MMM d, yyyy')
  }

  static formatDuration(minutes, style = 'short') {
    if (minutes < 0) return '0m'
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    switch (style) {
      case 'short':
        if (hours > 0) {
          return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
        }
        return `${mins}m`
      
      case 'long':
        if (hours > 0) {
          const hourText = hours === 1 ? 'hour' : 'hours'
          const minText = mins === 1 ? 'minute' : 'minutes'
          return mins > 0 ? `${hours} ${hourText}, ${mins} ${minText}` : `${hours} ${hourText}`
        }
        const minText = mins === 1 ? 'minute' : 'minutes'
        return `${mins} ${minText}`
      
      case 'compact':
        return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `0:${mins.toString().padStart(2, '0')}`
      
      default:
        return `${minutes}m`
    }
  }

  static formatTimer(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  static parseTimeString(timeStr) {
    // Parse various time formats: "25m", "1h 30m", "90", "1:30"
    if (!timeStr) return 0
    
    const str = timeStr.toString().toLowerCase().trim()
    
    // Handle "1:30" format
    if (str.includes(':')) {
      const [hours, minutes] = str.split(':').map(Number)
      return (hours * 60) + minutes
    }
    
    // Handle "1h 30m" format
    const hourMatch = str.match(/(\d+)h/)
    const minMatch = str.match(/(\d+)m/)
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0
    const minutes = minMatch ? parseInt(minMatch[1]) : 0
    
    if (hours > 0 || minutes > 0) {
      return (hours * 60) + minutes
    }
    
    // Handle plain numbers (assume minutes)
    const num = parseInt(str)
    return isNaN(num) ? 0 : num
  }

  static addMinutesToTime(timeStr, minutesToAdd) {
    // Add minutes to a time string like "14:30"
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    
    const newDate = addMinutes(date, minutesToAdd)
    return format(newDate, 'HH:mm')
  }

  static getTimeOfDay(date = new Date()) {
    const hour = getHour(date)
    
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  static getProductivityPeriod(date = new Date()) {
    const hour = getHour(date)
    
    for (const [period, [start, end]] of Object.entries(PRODUCTIVITY_HOURS)) {
      if ((start <= end && hour >= start && hour < end) ||
          (start > end && (hour >= start || hour < end))) {
        return period.toLowerCase().replace('_', ' ')
      }
    }
    return 'unknown'
  }

  static isProductiveHour(date = new Date()) {
    const hour = getHour(date)
    // Most people are productive between 9 AM and 11 AM, and 2 PM and 4 PM
    return (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)
  }

  static getOptimalBreakTime(sessionLength) {
    // Calculate optimal break time based on session length
    if (sessionLength <= 30) return 5
    if (sessionLength <= 60) return 10
    if (sessionLength <= 90) return 15
    return 20
  }

  static calculateSessionEfficiency(planned, actual) {
    if (planned <= 0) return 0
    return Math.min((actual / planned) * 100, 100)
  }

  static getStreakDays(sessions) {
    if (!sessions || sessions.length === 0) return 0
    
    const sortedSessions = sessions
      .filter(s => s.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    
    let streak = 0
    let currentDate = new Date()
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].date)
      const daysDiff = differenceInDays(currentDate, sessionDate)
      
      if (i === 0 && daysDiff <= 1) {
        streak = 1
        currentDate = sessionDate
      } else if (daysDiff === 1) {
        streak++
        currentDate = sessionDate
      } else {
        break
      }
    }
    
    return streak
  }

  static generateSchedule(startTime, sessions, mode = 'POMODORO') {
    const schedule = []
    const modeConfig = STUDY_MODES[mode]
    let currentTime = typeof startTime === 'string' ? parseISO(startTime) : startTime
    
    for (let i = 0; i < sessions; i++) {
      const isLongBreak = (i + 1) % modeConfig.cycleLength === 0
      
      // Work session
      schedule.push({
        type: 'work',
        start: format(currentTime, 'HH:mm'),
        duration: modeConfig.workTime,
        end: format(addMinutes(currentTime, modeConfig.workTime), 'HH:mm')
      })
      
      currentTime = addMinutes(currentTime, modeConfig.workTime)
      
      // Break (except after last session)
      if (i < sessions - 1) {
        const breakDuration = isLongBreak ? modeConfig.longBreak : modeConfig.shortBreak
        
        schedule.push({
          type: isLongBreak ? 'long_break' : 'short_break',
          start: format(currentTime, 'HH:mm'),
          duration: breakDuration,
          end: format(addMinutes(currentTime, breakDuration), 'HH:mm')
        })
        
        currentTime = addMinutes(currentTime, breakDuration)
      }
    }
    
    return schedule
  }

  static getDateRanges(period, date = new Date()) {
    const ranges = {
      today: {
        start: startOfDay(date),
        end: endOfDay(date),
        label: 'Today'
      },
      yesterday: {
        start: startOfDay(subDays(date, 1)),
        end: endOfDay(subDays(date, 1)),
        label: 'Yesterday'
      },
      thisWeek: {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
        label: 'This Week'
      },
      lastWeek: {
        start: startOfWeek(subWeeks(date, 1), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(date, 1), { weekStartsOn: 1 }),
        label: 'Last Week'
      },
      thisMonth: {
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: 'This Month'
      },
      lastMonth: {
        start: startOfMonth(subMonths(date, 1)),
        end: endOfMonth(subMonths(date, 1)),
        label: 'Last Month'
      },
      thisYear: {
        start: startOfYear(date),
        end: endOfYear(date),
        label: 'This Year'
      },
      last30Days: {
        start: subDays(date, 30),
        end: date,
        label: 'Last 30 Days'
      },
      last7Days: {
        start: subDays(date, 7),
        end: date,
        label: 'Last 7 Days'
      }
    }
    
    return period ? ranges[period] : ranges
  }

  static groupSessionsByDate(sessions) {
    const grouped = {}
    
    sessions.forEach(session => {
      const dateKey = format(new Date(session.start_time || session.date), 'yyyy-MM-dd')
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      
      grouped[dateKey].push(session)
    })
    
    return grouped
  }

  static calculateDailyStats(sessions) {
    const daily = {}
    
    sessions.forEach(session => {
      const dateKey = format(new Date(session.start_time || session.date), 'yyyy-MM-dd')
      
      if (!daily[dateKey]) {
        daily[dateKey] = {
          date: dateKey,
          sessions: 0,
          totalTime: 0,
          completedSessions: 0,
          averageSession: 0
        }
      }
      
      daily[dateKey].sessions++
      if (session.completed) {
        daily[dateKey].completedSessions++
        daily[dateKey].totalTime += session.actual_duration || session.duration || 0
      }
    })
    
    // Calculate averages
    Object.values(daily).forEach(day => {
      day.averageSession = day.completedSessions > 0 
        ? Math.round(day.totalTime / day.completedSessions) 
        : 0
    })
    
    return daily
  }

  static calculateWeeklyPattern(sessions) {
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const pattern = weekDays.map(day => ({ day, sessions: 0, totalTime: 0 }))
    
    sessions.forEach(session => {
      const dayOfWeek = getDay(new Date(session.start_time || session.date))
      pattern[dayOfWeek].sessions++
      
      if (session.completed) {
        pattern[dayOfWeek].totalTime += session.actual_duration || session.duration || 0
      }
    })
    
    return pattern
  }

  static calculateHourlyPattern(sessions) {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sessions: 0,
      totalTime: 0
    }))
    
    sessions.forEach(session => {
      const hour = getHour(new Date(session.start_time || session.date))
      hourly[hour].sessions++
      
      if (session.completed) {
        hourly[hour].totalTime += session.actual_duration || session.duration || 0
      }
    })
    
    return hourly
  }

  static findOptimalStudyTimes(sessions) {
    const hourlyStats = this.calculateHourlyPattern(sessions)
    
    // Find hours with high productivity (high completion rate and long sessions)
    const productive = hourlyStats
      .map(stat => ({
        ...stat,
        averageSession: stat.sessions > 0 ? stat.totalTime / stat.sessions : 0,
        productivity: stat.sessions > 0 ? (stat.totalTime / stat.sessions) * stat.sessions : 0
      }))
      .filter(stat => stat.sessions >= 3) // Minimum sessions for meaningful data
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 3)
    
    return productive.map(stat => ({
      hour: stat.hour,
      timeRange: `${stat.hour}:00 - ${stat.hour + 1}:00`,
      productivity: Math.round(stat.productivity),
      averageSession: Math.round(stat.averageSession)
    }))
  }

  static getStudyGoalsProgress(sessions, goals) {
    const today = new Date()
    const dailySessions = sessions.filter(s => 
      isToday(new Date(s.start_time || s.date)) && s.completed
    )
    
    const weekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.start_time || s.date)
      return differenceInDays(today, sessionDate) <= 7 && s.completed
    })
    
    return {
      daily: {
        current: dailySessions.length,
        target: goals.dailySessions || 4,
        percentage: Math.min((dailySessions.length / (goals.dailySessions || 4)) * 100, 100)
      },
      weekly: {
        current: weekSessions.length,
        target: goals.weeklySessions || 20,
        percentage: Math.min((weekSessions.length / (goals.weeklySessions || 20)) * 100, 100)
      },
      weeklyTime: {
        current: weekSessions.reduce((acc, s) => acc + (s.actual_duration || s.duration || 0), 0),
        target: goals.weeklyMinutes || 600, // 10 hours
        percentage: Math.min((weekSessions.reduce((acc, s) => acc + (s.actual_duration || s.duration || 0), 0) / (goals.weeklyMinutes || 600)) * 100, 100)
      }
    }
  }

  static getNextBreakRecommendation(lastBreak, sessionLength) {
    if (!lastBreak) return 'Take a break soon!'
    
    const timeSinceBreak = differenceInMinutes(new Date(), new Date(lastBreak))
    const recommendedBreak = this.getOptimalBreakTime(sessionLength)
    
    if (timeSinceBreak >= 90) {
      return 'Long break recommended (15+ minutes)'
    } else if (timeSinceBreak >= 45) {
      return 'Short break recommended (5-10 minutes)'
    }
    
    return `Continue studying (${90 - timeSinceBreak} mins until break)`
  }

  static formatTimeAgo(date) {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  static isWithinWorkingHours(date = new Date(), startHour = 9, endHour = 17) {
    const hour = getHour(date)
    return hour >= startHour && hour < endHour
  }

  static getTimeZoneOffset() {
    return new Date().getTimezoneOffset()
  }

  static convertToUserTimezone(utcDate, timezone) {
    // This is a basic implementation - in production, use a library like date-fns-tz
    const date = new Date(utcDate)
    return date.toLocaleString('en-US', { timeZone: timezone })
  }
}

// Convenience functions
export const formatTime = TimeUtils.formatTime
export const formatDuration = TimeUtils.formatDuration
export const formatTimer = TimeUtils.formatTimer
export const parseTimeString = TimeUtils.parseTimeString
export const getRelativeTime = TimeUtils.getRelativeTime
export const getTimeOfDay = TimeUtils.getTimeOfDay
export const isProductiveHour = TimeUtils.isProductiveHour
export const calculateSessionEfficiency = TimeUtils.calculateSessionEfficiency
export const getStreakDays = TimeUtils.getStreakDays

// Session timing helper
export class SessionTimer {
  constructor() {
    this.startTime = null
    this.pausedTime = 0
    this.isPaused = false
  }

  start() {
    this.startTime = new Date()
    this.isPaused = false
    return this.startTime
  }

  pause() {
    if (!this.isPaused && this.startTime) {
      this.isPaused = true
      this.pausedTime += Date.now() - this.startTime.getTime()
    }
  }

  resume() {
    if (this.isPaused) {
      this.startTime = new Date()
      this.isPaused = false
    }
  }

  stop() {
    const endTime = new Date()
    const totalTime = this.isPaused 
      ? this.pausedTime 
      : (endTime.getTime() - this.startTime.getTime()) + this.pausedTime
    
    return {
      startTime: this.startTime,
      endTime,
      duration: Math.round(totalTime / 1000 / 60), // minutes
      actualDuration: Math.round(totalTime / 1000 / 60)
    }
  }

  getElapsed() {
    if (!this.startTime) return 0
    
    if (this.isPaused) {
      return Math.round(this.pausedTime / 1000)
    }
    
    const now = Date.now()
    const elapsed = (now - this.startTime.getTime()) + this.pausedTime
    return Math.round(elapsed / 1000)
  }

  reset() {
    this.startTime = null
    this.pausedTime = 0
    this.isPaused = false
  }
}

export default TimeUtils
