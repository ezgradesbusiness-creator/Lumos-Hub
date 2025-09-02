// src/components/BreakMode/YouTubePlayer.jsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Repeat,
  Shuffle,
  Music,
  Clock,
  Headphones,
  List,
  Search,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react'
import Button from '@/components/UI/Button'
import Card from '@/components/UI/Card'

const YouTubePlayer = () => {
  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(70)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [customPlaylists, setCustomPlaylists] = useState([])
  const playerRef = useRef(null)

  // Predefined study playlists
  const studyPlaylists = [
    {
      id: 'lofi-hip-hop',
      name: 'Lo-Fi Hip Hop',
      description: 'Chill beats for focused work',
      thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg',
      category: 'Focus',
      duration: '∞ Live Stream',
      videos: [
        {
          id: 'jfKfPfyJRdk',
          title: 'lofi hip hop radio - beats to relax/study to',
          duration: 'Live',
          thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg'
        }
      ]
    },
    {
      id: 'classical-focus',
      name: 'Classical Focus',
      description: 'Timeless classical music for deep concentration',
      thumbnail: 'https://img.youtube.com/vi/mXMHg4_W6J8/maxresdefault.jpg',
      category: 'Classical',
      duration: '2 hours',
      videos: [
        {
          id: 'mXMHg4_W6J8',
          title: 'Classical Music for Studying & Brain Power',
          duration: '2:00:00',
          thumbnail: 'https://img.youtube.com/vi/mXMHg4_W6J8/hqdefault.jpg'
        },
        {
          id: '4Tr0otuiQuU',
          title: 'Mozart for Studying and Concentration',
          duration: '1:30:00',
          thumbnail: 'https://img.youtube.com/vi/4Tr0otuiQuU/hqdefault.jpg'
        }
      ]
    },
    {
      id: 'ambient-soundscapes',
      name: 'Ambient Soundscapes',
      description: 'Atmospheric sounds for productivity',
      thumbnail: 'https://img.youtube.com/vi/DWcJFNfaw9c',
      category: 'Ambient',
      duration: '1.5 hours',
      videos: [
        {
          id: 'DWcJFNfaw9c',
          title: 'Forest Sounds - Relaxing Nature Sounds',
          duration: '1:30:00',
          thumbnail: 'https://img.youtube.com/vi/DWcJFNfaw9c/hqdefault.jpg'
        },
        {
          id: 'eKFTSSKCzWA',
          title: 'Rain Sounds for Sleeping & Studying',
          duration: '2:00:00',
          thumbnail: 'https://img.youtube.com/vi/eKFTSSKCzWA/hqdefault.jpg'
        }
      ]
    },
    {
      id: 'piano-instrumental',
      name: 'Piano Instrumentals',
      description: 'Beautiful piano music for focus',
      thumbnail: 'https://img.youtube.com/vi/4oStw0r33so/maxresdefault.jpg',
      category: 'Piano',
      duration: '3 hours',
      videos: [
        {
          id: '4oStw0r33so',
          title: 'Peaceful Piano Music for Study and Focus',
          duration: '3:00:00',
          thumbnail: 'https://img.youtube.com/vi/4oStw0r33so/hqdefault.jpg'
        },
        {
          id: 'tf6ftTLWVYE',
          title: 'Relaxing Piano Music for Work and Study',
          duration: '2:30:00',
          thumbnail: 'https://img.youtube.com/vi/tf6ftTLWVYE/hqdefault.jpg'
        }
      ]
    },
    {
      id: 'cafe-ambience',
      name: 'Café Ambience',
      description: 'Coffee shop atmosphere for productivity',
      thumbnail: 'https://img.youtube.com/vi/h2zkV-l_TbY/maxresdefault.jpg',
      category: 'Ambience',
      duration: '2 hours',
      videos: [
        {
          id: 'h2zkV-l_TbY',
          title: 'Coffee Shop Background Noise',
          duration: '2:00:00',
          thumbnail: 'https://img.youtube.com/vi/h2zkV-l_TbY/hqdefault.jpg'
        }
      ]
    },
    {
      id: 'binaural-beats',
      name: 'Binaural Beats',
      description: 'Frequency-based focus enhancement',
      thumbnail: 'https://img.youtube.com/vi/eOKPmTnh_1Q/maxresdefault.jpg',
      category: 'Binaural',
      duration: '1 hour',
      videos: [
        {
          id: 'eOKPmTnh_1Q',
          title: 'Focus Music - Binaural Beats for Concentration',
          duration: '1:00:00',
          thumbnail: 'https://img.youtube.com/vi/eOKPmTnh_1Q/hqdefault.jpg'
        }
      ]
    }
  ]

  // Initialize YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }
  }, [])

  // Load custom playlists from storage
  useEffect(() => {
    const saved = localStorage.getItem('lumos-custom-playlists')
    if (saved) {
      setCustomPlaylists(JSON.parse(saved))
    }
  }, [])

  const saveCustomPlaylists = (playlists) => {
    localStorage.setItem('lumos-custom-playlists', JSON.stringify(playlists))
    setCustomPlaylists(playlists)
  }

  const selectPlaylist = (playlist) => {
    setCurrentPlaylist(playlist)
    setCurrentVideoIndex(0)
    setIsPlaying(false)
  }

  const playVideo = () => {
    setIsPlaying(true)
    // In a real implementation, this would control the YouTube player
  }

  const pauseVideo = () => {
    setIsPlaying(false)
    // In a real implementation, this would control the YouTube player
  }

  const togglePlay = () => {
    if (isPlaying) {
      pauseVideo()
    } else {
      playVideo()
    }
  }

  const previousVideo = () => {
    if (currentPlaylist && currentPlaylist.videos.length > 1) {
      const newIndex = currentVideoIndex > 0 
        ? currentVideoIndex - 1 
        : currentPlaylist.videos.length - 1
      setCurrentVideoIndex(newIndex)
    }
  }

  const nextVideo = () => {
    if (currentPlaylist && currentPlaylist.videos.length > 1) {
      if (isShuffle) {
        const randomIndex = Math.floor(Math.random() * currentPlaylist.videos.length)
        setCurrentVideoIndex(randomIndex)
      } else {
        const newIndex = currentVideoIndex < currentPlaylist.videos.length - 1 
          ? currentVideoIndex + 1 
          : (isRepeat ? 0 : currentVideoIndex)
        setCurrentVideoIndex(newIndex)
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const createCustomPlaylist = () => {
    const name = prompt('Playlist name:')
    if (name) {
      const newPlaylist = {
        id: `custom-${Date.now()}`,
        name,
        description: 'Custom playlist',
        category: 'Custom',
        videos: [],
        isCustom: true
      }
      saveCustomPlaylists([...customPlaylists, newPlaylist])
    }
  }

  const deleteCustomPlaylist = (playlistId) => {
    if (confirm('Delete this playlist?')) {
      const updated = customPlaylists.filter(p => p.id !== playlistId)
      saveCustomPlaylists(updated)
      if (currentPlaylist?.id === playlistId) {
        setCurrentPlaylist(null)
      }
    }
  }

  const getCurrentVideo = () => {
    if (!currentPlaylist || !currentPlaylist.videos.length) return null
    return currentPlaylist.videos[currentVideoIndex] || null
  }

  const allPlaylists = [...studyPlaylists, ...customPlaylists]
  const filteredPlaylists = allPlaylists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentVideo = getCurrentVideo()

  if (currentPlaylist && currentVideo) {
    return (
      <Card>
        <div className="p-6">
          {/* Player Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-text">{currentPlaylist.name}</h3>
              <p className="text-sm text-text-secondary">{currentVideo.title}</p>
            </div>
            <Button
              onClick={() => setCurrentPlaylist(null)}
              size="sm"
              variant="ghost"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Video Player Area */}
          <div className="relative mb-6 bg-black rounded-lg overflow-hidden aspect-video">
            <img
              src={currentVideo.thumbnail}
              alt={currentVideo.title}
              className="w-full h-full object-cover"
            />
            
            {/* Play Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <motion.button
                onClick={togglePlay}
                className="bg-white/90 hover:bg-white text-black rounded-full p-4"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </motion.button>
            </div>

            {/* Video Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white font-medium text-sm mb-1">{currentVideo.title}</p>
              <div className="flex items-center text-white/80 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {currentVideo.duration}
                {isPlaying && (
                  <span className="ml-2 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Player Controls */}
          <div className="space-y-4">
            {/* Main Controls */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => setIsShuffle(!isShuffle)}
                size="sm"
                variant={isShuffle ? 'default' : 'ghost'}
              >
                <Shuffle className="h-4 w-4" />
              </Button>

              <Button onClick={previousVideo} size="sm" variant="ghost">
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button onClick={togglePlay} className="h-12 w-12 rounded-full">
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-1" />
                )}
              </Button>

              <Button onClick={nextVideo} size="sm" variant="ghost">
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => setIsRepeat(!isRepeat)}
                size="sm"
                variant={isRepeat ? 'default' : 'ghost'}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3">
              <Button onClick={toggleMute} size="sm" variant="ghost">
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="flex-1 accent-primary"
              />
              
              <span className="text-sm text-text-secondary w-8 text-right">
                {isMuted ? 0 : volume}
              </span>
            </div>

            {/* Playlist Info */}
            {currentPlaylist.videos.length > 1 && (
              <div className="text-center text-sm text-text-secondary">
                Track {currentVideoIndex + 1} of {currentPlaylist.videos.length}
              </div>
            )}
          </div>

          {/* Playlist Queue */}
          {currentPlaylist.videos.length > 1 && (
            <div className="mt-6">
              <h4 className="font-medium text-text mb-3">Up Next</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {currentPlaylist.videos.map((video, index) => (
                  <motion.button
                    key={video.id}
                    onClick={() => setCurrentVideoIndex(index)}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                      index === currentVideoIndex
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-background'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-9 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-text truncate">
                        {video.title}
                      </p>
                      <p className="text-xs text-text-secondary">{video.duration}</p>
                    </div>
                    {index === currentVideoIndex && (
                      <div className="flex-shrink-0 text-primary">
                        <Headphones className="h-4 w-4" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Playlist selection interface
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-text mb-2 flex items-center justify-center">
          <Music className="mr-2 h-6 w-6" />
          Study Playlists
        </h3>
        <p className="text-text-secondary">Curated music and sounds to enhance your focus</p>
      </div>

      {/* Search and Create */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
        <Button onClick={createCustomPlaylist} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Create
        </Button>
      </div>

      {/* Featured Categories */}
      <div className="flex flex-wrap gap-2">
        {['All', 'Focus', 'Classical', 'Ambient', 'Piano', 'Custom'].map(category => (
          <button
            key={category}
            onClick={() => setSearchQuery(category === 'All' ? '' : category)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              (category === 'All' && !searchQuery) || searchQuery === category
                ? 'bg-primary text-white'
                : 'bg-background text-text-secondary hover:bg-card-border'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filteredPlaylists.map(playlist => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <div onClick={() => selectPlaylist(playlist)} className="p-4">
                  <div className="flex space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={playlist.thumbnail || `https://img.youtube.com/vi/${playlist.videos[0]?.id}/hqdefault.jpg`}
                        alt={playlist.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80x80/6b7280/ffffff?text=Music'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-text truncate">{playlist.name}</h4>
                        {playlist.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteCustomPlaylist(playlist.id)
                            }}
                            className="text-text-secondary hover:text-red-500 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                        {playlist.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {playlist.category}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {playlist.duration}
                          </span>
                          <span className="flex items-center">
                            <Music className="h-3 w-3 mr-1" />
                            {playlist.videos.length} tracks
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredPlaylists.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No playlists found matching your search.</p>
        </div>
      )}

      {/* Usage Tips */}
      <Card>
        <div className="p-4">
          <h4 className="font-medium text-text mb-2 flex items-center">
            <Headphones className="mr-2 h-4 w-4" />
            Study Music Tips
          </h4>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Instrumental music works best for concentration</li>
            <li>• Keep volume at 40-60% to avoid distraction</li>
            <li>• Try binaural beats for enhanced focus</li>
            <li>• Switch playlists if music becomes too familiar</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default YouTubePlayer
