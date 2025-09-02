// src/hooks/useOfflineSync.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@/context/UserContext'
import { supabase } from '@/services/supabaseClient'

const useOfflineSync = () => {
  const { user, updateSettings, updateStats } = useUser()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, error, success
  const [pendingOperations, setPendingOperations] = useState([])
  const [syncProgress, setSyncProgress] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [conflicts, setConflicts] = useState([])

  const syncQueueRef = useRef([])
  const syncTimeoutRef = useRef(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Storage keys
  const STORAGE_KEYS = {
    PENDING_OPERATIONS: 'lumos-pending-operations',
    LAST_SYNC: 'lumos-last-sync',
    OFFLINE_DATA: 'lumos-offline-data',
    CONFLICTS: 'lumos-conflicts'
  }

  // Initialize offline sync
  useEffect(() => {
    loadPendingOperations()
    loadLastSyncTime()
    
    // Set up online/offline listeners
    const handleOnline = () => {
      setIsOnline(true)
      if (user) {
        setTimeout(() => syncPendingOperations(), 1000) // Delay to ensure connection is stable
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('idle')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set up periodic sync when online
    const syncInterval = setInterval(() => {
      if (isOnline && user && pendingOperations.length > 0) {
        syncPendingOperations()
      }
    }, 30000) // Sync every 30 seconds if there are pending operations

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(syncInterval)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [user, isOnline, pendingOperations.length])

  // Load pending operations from localStorage
  const loadPendingOperations = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS)
      if (stored) {
        const operations = JSON.parse(stored)
        setPendingOperations(operations)
        syncQueueRef.current = operations
      }
    } catch (error) {
      console.error('Error loading pending operations:', error)
    }
  }, [])

  // Load last sync time
  const loadLastSyncTime = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
      if (stored) {
        setLastSyncTime(new Date(stored))
      }
    } catch (error) {
      console.error('Error loading last sync time:', error)
    }
  }, [])

  // Save pending operations to localStorage
  const savePendingOperations = useCallback((operations) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_OPERATIONS, JSON.stringify(operations))
      syncQueueRef.current = operations
    } catch (error) {
      console.error('Error saving pending operations:', error)
    }
  }, [])

  // Add operation to sync queue
  const queueOperation = useCallback((operation) => {
    const operationWithId = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...operation
    }

    const newOperations = [...pendingOperations, operationWithId]
    setPendingOperations(newOperations)
    savePendingOperations(newOperations)

    // If online, try to sync immediately
    if (isOnline && user) {
      syncTimeoutRef.current = setTimeout(syncPendingOperations, 2000)
    }

    return operationWithId.id
  }, [pendingOperations, isOnline, user])

  // Sync pending operations to server
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || !user || syncQueueRef.current.length === 0 || syncStatus === 'syncing') {
      return
    }

    setSyncStatus('syncing')
    setSyncProgress(0)
    retryCountRef.current = 0

    try {
      const operations = [...syncQueueRef.current]
      const totalOperations = operations.length
      const completedOperations = []
      const failedOperations = []

      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i]
        setSyncProgress(((i + 1) / totalOperations) * 100)

        try {
          const result = await processOperation(operation)
          if (result.success) {
            completedOperations.push(operation.id)
          } else if (result.conflict) {
            setConflicts(prev => [...prev, { operation, serverData: result.serverData }])
            failedOperations.push(operation)
          } else {
            failedOperations.push(operation)
          }
        } catch (error) {
          console.error('Error processing operation:', error)
          failedOperations.push(operation)
        }

        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Remove completed operations
      const remainingOperations = operations.filter(op => !completedOperations.includes(op.id))
      setPendingOperations(remainingOperations)
      savePendingOperations(remainingOperations)

      if (failedOperations.length === 0) {
        setSyncStatus('success')
        setLastSyncTime(new Date())
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
      } else {
        setSyncStatus('error')
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++
          setTimeout(syncPendingOperations, 5000 * retryCountRef.current) // Exponential backoff
        }
      }

    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('error')
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        setTimeout(syncPendingOperations, 5000 * retryCountRef.current)
      }
    }
  }, [isOnline, user, syncStatus])

  // Process individual operation
  const processOperation = useCallback(async (operation) => {
    const { type, data, table, method } = operation

    try {
      switch (type) {
        case 'session':
          return await syncSession(data, method)
        case 'settings':
          return await syncSettings(data)
        case 'stats':
          return await syncStats(data)
        case 'task':
          return await syncTask(data, method)
        case 'note':
          return await syncNote(data, method)
        default:
          throw new Error(`Unknown operation type: ${type}`)
      }
    } catch (error) {
      console.error(`Error processing ${type} operation:`, error)
      return { success: false, error: error.message }
    }
  }, [])

  // Sync session data
  const syncSession = useCallback(async (sessionData, method = 'upsert') => {
    const { data, error } = await supabase
      .from('sessions')
      .upsert({
        ...sessionData,
        user_id: user.id,
        synced_at: new Date().toISOString()
      })

    if (error) {
      // Check for conflicts
      if (error.code === '23505') { // Unique violation
        const { data: existing } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionData.id)
          .single()

        return { success: false, conflict: true, serverData: existing }
      }
      throw error
    }

    return { success: true, data }
  }, [user])

  // Sync settings
  const syncSettings = useCallback(async (settingsData) => {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        settings: settingsData,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    return { success: true, data }
  }, [user])

  // Sync stats
  const syncStats = useCallback(async (statsData) => {
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        ...statsData,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    return { success: true, data }
  }, [user])

  // Sync task data
  const syncTask = useCallback(async (taskData, method = 'upsert') => {
    let query

    switch (method) {
      case 'insert':
        query = supabase.from('tasks').insert({ ...taskData, user_id: user.id })
        break
      case 'update':
        query = supabase.from('tasks').update(taskData).eq('id', taskData.id)
        break
      case 'delete':
        query = supabase.from('tasks').delete().eq('id', taskData.id)
        break
      default:
        query = supabase.from('tasks').upsert({ ...taskData, user_id: user.id })
    }

    const { data, error } = await query

    if (error) throw error
    return { success: true, data }
  }, [user])

  // Sync note data
  const syncNote = useCallback(async (noteData, method = 'upsert') => {
    let query

    switch (method) {
      case 'insert':
        query = supabase.from('notes').insert({ ...noteData, user_id: user.id })
        break
      case 'update':
        query = supabase.from('notes').update(noteData).eq('id', noteData.id)
        break
      case 'delete':
        query = supabase.from('notes').delete().eq('id', noteData.id)
        break
      default:
        query = supabase.from('notes').upsert({ ...noteData, user_id: user.id })
    }

    const { data, error } = await query

    if (error) throw error
    return { success: true, data }
  }, [user])

  // Resolve conflict by choosing local or server version
  const resolveConflict = useCallback((conflictId, resolution) => {
    setConflicts(prev => prev.filter(c => c.operation.id !== conflictId))
    
    if (resolution === 'server') {
      // Remove local operation
      const newOperations = pendingOperations.filter(op => op.id !== conflictId)
      setPendingOperations(newOperations)
      savePendingOperations(newOperations)
    }
    // If resolution is 'local', keep the operation in queue for retry
  }, [pendingOperations])

  // Force sync all pending operations
  const forcSync = useCallback(() => {
    if (isOnline && user) {
      syncPendingOperations()
    }
  }, [isOnline, user, syncPendingOperations])

  // Clear all pending operations (use with caution)
  const clearPendingOperations = useCallback(() => {
    setPendingOperations([])
    savePendingOperations([])
    setConflicts([])
    setSyncStatus('idle')
  }, [])

  // Get offline data storage usage
  const getStorageUsage = useCallback(() => {
    try {
      const pendingSize = JSON.stringify(pendingOperations).length
      const offlineDataSize = (localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA) || '').length
      const conflictsSize = JSON.stringify(conflicts).length
      
      return {
        pendingOperations: Math.round(pendingSize / 1024), // KB
        offlineData: Math.round(offlineDataSize / 1024), // KB
        conflicts: Math.round(conflictsSize / 1024), // KB
        total: Math.round((pendingSize + offlineDataSize + conflictsSize) / 1024) // KB
      }
    } catch (error) {
      return { pendingOperations: 0, offlineData: 0, conflicts: 0, total: 0 }
    }
  }, [pendingOperations, conflicts])

  return {
    // Connection status
    isOnline,
    syncStatus,
    syncProgress,
    lastSyncTime,
    
    // Operations
    pendingOperations,
    conflicts,
    
    // Actions
    queueOperation,
    syncPendingOperations,
    resolveConflict,
    forcSync,
    clearPendingOperations,
    
    // Utilities
    getStorageUsage,
    
    // Computed values
    hasPendingOperations: pendingOperations.length > 0,
    hasConflicts: conflicts.length > 0,
    canSync: isOnline && user && pendingOperations.length > 0
  }
}

export default useOfflineSync
