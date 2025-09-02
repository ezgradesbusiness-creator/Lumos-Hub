// src/components/BreakMode/MiniGames.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GameController2, 
  Trophy, 
  RotateCcw, 
  Home, 
  Clock,
  Star,
  Zap,
  Target
} from 'lucide-react'
import Button from '@/components/UI/Button'
import Card from '@/components/UI/Card'

const MiniGames = () => {
  const [selectedGame, setSelectedGame] = useState(null)
  const [gameScore, setGameScore] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [isGameActive, setIsGameActive] = useState(false)

  // Chess Game State
  const [chessBoard, setChessBoard] = useState(initChessBoard())
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState('white')

  // Sudoku Game State
  const [sudokuGrid, setSudokuGrid] = useState(generateSudoku())
  const [sudokuDifficulty, setSudokuDifficulty] = useState('easy')
  const [sudokuMistakes, setSudokuMistakes] = useState(0)

  // Word Search Game State
  const [wordSearchGrid, setWordSearchGrid] = useState(generateWordSearch())
  const [foundWords, setFoundWords] = useState([])
  const [wordsToFind] = useState(['FOCUS', 'STUDY', 'LEARN', 'THINK', 'BRAIN'])

  function initChessBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null))
    
    // Initialize pieces (simplified setup)
    const pieces = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    }

    // Set up pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { piece: pieces.black.pawn, color: 'black' }
      board[6][i] = { piece: pieces.white.pawn, color: 'white' }
    }

    // Set up back rows
    const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    backRow.forEach((piece, i) => {
      board[0][i] = { piece: pieces.black[piece], color: 'black' }
      board[7][i] = { piece: pieces.white[piece], color: 'white' }
    })

    return board
  }

  function generateSudoku() {
    // Simple sudoku generator (incomplete puzzle)
    const grid = Array(9).fill(null).map(() => Array(9).fill(0))
    
    // Add some pre-filled numbers for demo
    const predefined = [
      [0, 0, 5], [0, 2, 8], [1, 1, 2], [1, 4, 7],
      [2, 3, 4], [2, 6, 1], [3, 2, 1], [3, 5, 8],
      [4, 4, 3], [5, 3, 2], [5, 6, 9], [6, 2, 6],
      [6, 5, 1], [7, 4, 8], [7, 7, 4], [8, 6, 7], [8, 8, 2]
    ]

    predefined.forEach(([row, col, val]) => {
      if (row < 9 && col < 9) grid[row][col] = val
    })

    return grid
  }

  function generateWordSearch() {
    const size = 12
    const grid = Array(size).fill(null).map(() => 
      Array(size).fill(null).map(() => 
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      )
    )

    // Place words in grid (simplified)
    const words = ['FOCUS', 'STUDY', 'LEARN', 'THINK', 'BRAIN']
    words.forEach((word, index) => {
      const row = Math.floor(Math.random() * (size - word.length))
      const col = Math.floor(Math.random() * (size - word.length))
      
      for (let i = 0; i < word.length; i++) {
        grid[row][col + i] = word[i]
      }
    })

    return grid
  }

  // Game timer
  useEffect(() => {
    let interval
    if (isGameActive) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isGameActive])

  const games = [
    {
      id: 'chess',
      name: 'Quick Chess',
      description: 'Strategic thinking game',
      icon: '♟️',
      difficulty: 'Medium',
      estimatedTime: '5-10 min',
      component: ChessGame
    },
    {
      id: 'sudoku',
      name: 'Sudoku Puzzle',
      description: 'Number logic challenge',
      icon: '🔢',
      difficulty: 'Easy-Hard',
      estimatedTime: '3-15 min',
      component: SudokuGame
    },
    {
      id: 'wordsearch',
      name: 'Word Search',
      description: 'Find hidden words',
      icon: '🔍',
      difficulty: 'Easy',
      estimatedTime: '2-5 min',
      component: WordSearchGame
    },
    {
      id: 'memory',
      name: 'Memory Match',
      description: 'Card matching game',
      icon: '🧠',
      difficulty: 'Medium',
      estimatedTime: '3-7 min',
      component: MemoryGame
    }
  ]

  const startGame = (game) => {
    setSelectedGame(game)
    setGameScore(0)
    setGameTime(0)
    setIsGameActive(true)
    
    // Reset game states
    if (game.id === 'chess') setChessBoard(initChessBoard())
    if (game.id === 'sudoku') setSudokuGrid(generateSudoku())
    if (game.id === 'wordsearch') {
      setWordSearchGrid(generateWordSearch())
      setFoundWords([])
    }
  }

  const endGame = () => {
    setIsGameActive(false)
    setSelectedGame(null)
    setGameTime(0)
    setGameScore(0)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Chess Game Component
  function ChessGame() {
    const handleSquareClick = (row, col) => {
      if (selectedPiece) {
        // Move piece
        const newBoard = [...chessBoard]
        newBoard[row][col] = chessBoard[selectedPiece.row][selectedPiece.col]
        newBoard[selectedPiece.row][selectedPiece.col] = null
        setChessBoard(newBoard)
        setSelectedPiece(null)
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white')
      } else if (chessBoard[row][col] && chessBoard[row][col].color === currentPlayer) {
        setSelectedPiece({ row, col })
      }
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-text-secondary">Current Player: 
            <span className={`ml-1 font-semibold ${currentPlayer === 'white' ? 'text-white' : 'text-gray-800'}`}>
              {currentPlayer === 'white' ? 'White' : 'Black'}
            </span>
          </p>
        </div>
        
        <div className="grid grid-cols-8 gap-0 mx-auto w-80 h-80 border-2 border-card-border">
          {chessBoard.map((row, rowIndex) =>
            row.map((square, colIndex) => (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                className={`aspect-square flex items-center justify-center text-2xl transition-colors ${
                  (rowIndex + colIndex) % 2 === 0 
                    ? 'bg-amber-100 hover:bg-amber-200' 
                    : 'bg-amber-800 hover:bg-amber-700'
                } ${
                  selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {square?.piece}
              </motion.button>
            ))
          )}
        </div>
      </div>
    )
  }

  // Sudoku Game Component
  function SudokuGame() {
    const handleNumberInput = (row, col, value) => {
      if (value < 1 || value > 9) return
      
      const newGrid = [...sudokuGrid]
      newGrid[row][col] = value
      setSudokuGrid(newGrid)
      
      // Simple validation (check if number already exists in row/column)
      const rowHasDuplicate = newGrid[row].filter(n => n === value).length > 1
      const colHasDuplicate = newGrid.map(r => r[col]).filter(n => n === value).length > 1
      
      if (rowHasDuplicate || colHasDuplicate) {
        setSudokuMistakes(prev => prev + 1)
      } else {
        setGameScore(prev => prev + 10)
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Mistakes: {sudokuMistakes}/3</span>
          <span>Score: {gameScore}</span>
        </div>
        
        <div className="grid grid-cols-9 gap-1 mx-auto w-72 h-72 p-2 bg-card-border rounded-lg">
          {sudokuGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <input
                key={`${rowIndex}-${colIndex}`}
                type="number"
                min="1"
                max="9"
                value={cell || ''}
                onChange={(e) => handleNumberInput(rowIndex, colIndex, parseInt(e.target.value))}
                className={`w-full h-full text-center text-sm border-none rounded ${
                  cell ? 'bg-primary/10 font-semibold' : 'bg-background'
                } focus:ring-1 focus:ring-primary`}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  // Word Search Game Component
  function WordSearchGame() {
    const [selectedCells, setSelectedCells] = useState([])

    const handleCellClick = (row, col) => {
      const cellKey = `${row}-${col}`
      setSelectedCells(prev => 
        prev.includes(cellKey) 
          ? prev.filter(c => c !== cellKey)
          : [...prev, cellKey]
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium">Find these words:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {wordsToFind.map(word => (
                <span
                  key={word}
                  className={`px-2 py-1 text-xs rounded ${
                    foundWords.includes(word)
                      ? 'bg-green-100 text-green-800 line-through'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Found: {foundWords.length}/{wordsToFind.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1 mx-auto max-w-96">
          {wordSearchGrid.map((row, rowIndex) =>
            row.map((letter, colIndex) => {
              const cellKey = `${rowIndex}-${colIndex}`
              return (
                <motion.button
                  key={cellKey}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`aspect-square text-xs font-mono border transition-colors ${
                    selectedCells.includes(cellKey)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background border-card-border hover:bg-primary/10'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {letter}
                </motion.button>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // Memory Game Component (placeholder)
  function MemoryGame() {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">Memory game coming soon!</p>
      </div>
    )
  }

  if (selectedGame) {
    const GameComponent = selectedGame.component

    return (
      <Card>
        <div className="p-6">
          {/* Game Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{selectedGame.icon}</span>
              <div>
                <h3 className="font-semibold text-text">{selectedGame.name}</h3>
                <p className="text-sm text-text-secondary">Time: {formatTime(gameTime)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  if (selectedGame.id === 'chess') setChessBoard(initChessBoard())
                  if (selectedGame.id === 'sudoku') setSudokuGrid(generateSudoku())
                  if (selectedGame.id === 'wordsearch') setWordSearchGrid(generateWordSearch())
                  setGameScore(0)
                  setGameTime(0)
                }}
                size="sm"
                variant="ghost"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button onClick={endGame} size="sm" variant="ghost">
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Game Content */}
          <GameComponent />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-text mb-2 flex items-center justify-center">
          <GameController2 className="mr-2 h-6 w-6" />
          Mini Games
        </h3>
        <p className="text-text-secondary">Quick brain exercises for your break time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map(game => (
          <motion.div
            key={game.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="p-4" onClick={() => startGame(game)}>
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{game.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-text mb-1">{game.name}</h4>
                    <p className="text-sm text-text-secondary mb-3">{game.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center text-orange-600">
                        <Target className="h-3 w-3 mr-1" />
                        {game.difficulty}
                      </span>
                      <span className="flex items-center text-blue-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {game.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <div className="p-4">
          <h4 className="font-medium text-text mb-3 flex items-center">
            <Trophy className="mr-2 h-4 w-4" />
            Your Stats
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-xs text-text-secondary">Games Played</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">8</p>
              <p className="text-xs text-text-secondary">Best Streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">245</p>
              <p className="text-xs text-text-secondary">Total Points</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default MiniGames
