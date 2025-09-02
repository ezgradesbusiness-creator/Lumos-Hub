// src/components/Dashboard/Notes.jsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  Calendar,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import { notesService } from '@/services/notesService'
import { inputSanitizer } from '@/utils/inputSanitizer'
import { formatDistanceToNow } from 'date-fns'

const Notes = ({ title = "Quick Notes" }) => {
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    tags: []
  })
  
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const textareaRef = useRef(null)

  // Load notes on component mount
  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const loadedNotes = await notesService.getAll()
      setNotes(loadedNotes)
    } catch (err) {
      setError('Failed to load notes')
      console.error('Error loading notes:', err)
    } finally {
      setLoading(false)
    }
  }

  const createNote = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) return

    try {
      const newNote = {
        id: Date.now().toString(),
        title: inputSanitizer.sanitize(editForm.title.trim()),
        content: inputSanitizer.sanitize(editForm.content.trim()),
        tags: editForm.tags.filter(tag => tag.trim()),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        wordCount: editForm.content.trim().split(/\s+/).length
      }

      setNotes(prev => [newNote, ...prev])
      await notesService.create(newNote)
      
      resetForm()
      setIsCreating(false)
    } catch (err) {
      setError('Failed to create note')
      console.error('Error creating note:', err)
    }
  }

  const updateNote = async () => {
    if (!selectedNote || !editForm.title.trim() || !editForm.content.trim()) return

    try {
      const updatedNote = {
        ...selectedNote,
        title: inputSanitizer.sanitize(editForm.title.trim()),
        content: inputSanitizer.sanitize(editForm.content.trim()),
        tags: editForm.tags.filter(tag => tag.trim()),
        updated: new Date().toISOString(),
        wordCount: editForm.content.trim().split(/\s+/).length
      }

      setNotes(prev => 
        prev.map(note => 
          note.id === selectedNote.id ? updatedNote : note
        )
      )
      
      await notesService.update(selectedNote.id, updatedNote)
      setSelectedNote(updatedNote)
      setIsEditing(false)
    } catch (err) {
      setError('Failed to update note')
      console.error('Error updating note:', err)
    }
  }

  const deleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return

    try {
      setNotes(prev => prev.filter(note => note.id !== noteId))
      await notesService.delete(noteId)
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
        setIsEditing(false)
      }
    } catch (err) {
      setError('Failed to delete note')
      console.error('Error deleting note:', err)
    }
  }

  const resetForm = () => {
    setEditForm({
      title: '',
      content: '',
      tags: []
    })
  }

  const startEditing = (note) => {
    setSelectedNote(note)
    setEditForm({
      title: note.title,
      content: note.content,
      tags: note.tags || []
    })
    setIsEditing(true)
    setIsPreviewMode(false)
  }

  const startCreating = () => {
    resetForm()
    setIsCreating(true)
    setIsEditing(true)
    setSelectedNote(null)
    setIsPreviewMode(false)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setIsCreating(false)
    resetForm()
    if (!selectedNote) {
      setSelectedNote(null)
    }
  }

  const handleTagInput = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setEditForm(prev => ({ ...prev, tags }))
  }

  // Filter notes based on search and tags
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchTerm || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = !filterTag || 
      note.tags?.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()))
    
    return matchesSearch && matchesFilter
  })

  // Get all unique tags for filtering
  const allTags = [...new Set(notes.flatMap(note => note.tags || []))]

  const exportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lumos-notes-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importNotes = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedNotes = JSON.parse(e.target.result)
        if (Array.isArray(importedNotes)) {
          setNotes(prev => [...importedNotes, ...prev])
        }
      } catch (err) {
        setError('Failed to import notes - invalid file format')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            {title}
          </h3>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={exportNotes}
              size="sm"
              variant="ghost"
              className="flex items-center"
              title="Export Notes"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={importNotes}
                className="hidden"
              />
              <Button
                as="span"
                size="sm"
                variant="ghost"
                className="flex items-center"
                title="Import Notes"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </label>
            
            <Button
              onClick={startCreating}
              size="sm"
              className="flex items-center"
            >
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          
          {allTags.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="pl-10 pr-8 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-background"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Notes List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{notes.length === 0 ? 'No notes yet. Create your first note!' : 'No notes match your search.'}</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotes.map(note => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                    selectedNote?.id === note.id
                      ? 'border-primary bg-primary/5'
                      : 'border-card-border bg-background hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text truncate">
                        {note.title}
                      </h4>
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                        {note.content.substring(0, 100)}...
                      </p>
                      
                      {/* Tags */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="px-2 py-1 bg-card-border text-text-secondary text-xs rounded-full">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(note.updated), { addSuffix: true })}
                        </span>
                        <span>{note.wordCount || 0} words</span>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(note)
                        }}
                        className="p-1 text-text-secondary hover:text-text transition-colors"
                        title="Edit Note"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNote(note.id)
                        }}
                        className="p-1 text-text-secondary hover:text-red-500 transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Selected Note Preview */}
        {selectedNote && !isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 border border-card-border rounded-lg bg-background"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-text">{selectedNote.title}</h4>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => startEditing(selectedNote)}
                  size="sm"
                  variant="ghost"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setSelectedNote(null)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal 
        isOpen={isEditing} 
        onClose={cancelEditing}
        title={isCreating ? 'Create New Note' : 'Edit Note'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Title
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter note title..."
              className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={editForm.tags.join(', ')}
              onChange={(e) => handleTagInput(e.target.value)}
              placeholder="work, personal, ideas..."
              className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Content Area with Preview Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text">
                Content
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    isPreviewMode
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary border border-card-border'
                  }`}
                >
                  {isPreviewMode ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>

            {isPreviewMode ? (
              <div className="min-h-[200px] p-3 border border-card-border rounded-md bg-background prose prose-sm max-w-none">
                <ReactMarkdown>{editForm.content || '*No content to preview*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your note in Markdown format..."
                className="w-full h-48 px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-mono text-sm"
              />
            )}
            
            <p className="text-xs text-text-secondary mt-1">
              Supports Markdown formatting (# headers, **bold**, *italic*, `code`, etc.)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              onClick={cancelEditing}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={isCreating ? createNote : updateNote}
              disabled={!editForm.title.trim() || !editForm.content.trim()}
              className="flex items-center"
            >
              <Save className="mr-2 h-4 w-4" />
              {isCreating ? 'Create Note' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

export default Notes
