'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { PATTERN_CATEGORIES, DIFFICULTY_LEVELS } from '@/lib/patterns'

interface BingoPattern {
  code: string
  name: string
  altNames: string[]
  category: 'line' | 'letter' | 'shape' | 'special' | 'holiday' | 'block' | 'crazy'
  requiredCells: number[]
  difficulty: 1 | 2 | 3 | 4 | 5
  canRotate?: boolean
  description: string
  isActive?: boolean
  animationDelay?: number | null
  excludedRanges?: string[]
}
import PatternVisualizer from '@/components/patterns/PatternVisualizer'
import { Plus, Edit, Trash2, Search, Eye, Download, Upload, Power } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface PatternFormData {
  code: string
  name: string
  altNames: string[]
  category: BingoPattern['category']
  requiredCells: number[]
  difficulty: 1 | 2 | 3 | 4 | 5
  canRotate: boolean
  canMirror: boolean
  description: string
  isActive: boolean
  animationDelay: number
  excludedRanges: string[]
}

export default function PatternsManagement() {
  const { toast } = useToast()
  const [patterns, setPatterns] = useState<BingoPattern[]>([])
  const [filteredPatterns, setFilteredPatterns] = useState<BingoPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [deletePatternCode, setDeletePatternCode] = useState<string | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<BingoPattern | null>(null)

  // Form state
  const [formData, setFormData] = useState<PatternFormData>({
    code: '',
    name: '',
    altNames: [],
    category: 'line',
    requiredCells: [],
    difficulty: 1,
    canRotate: false,
    canMirror: false,
    description: '',
    isActive: true,
    animationDelay: 1500,
    excludedRanges: []
  })

  // Grid selection state for pattern creation
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadPatterns()
  }, [])

  useEffect(() => {
    filterPatterns()
  }, [patterns, searchQuery, categoryFilter, difficultyFilter, statusFilter])

  const loadPatterns = async () => {
    try {
      const response = await fetch('/api/patterns')
      if (response.ok) {
        const data = await response.json()
        setPatterns(data)
      } else {
        console.error('Failed to load patterns from API')
        setPatterns([])
      }
    } catch (error) {
      console.error('Failed to load patterns:', error)
      setPatterns([])
    } finally {
      setLoading(false)
    }
  }

  const filterPatterns = () => {
    let filtered = [...patterns]

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(pattern => pattern.isActive !== false)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(pattern => pattern.isActive === false)
    }
    // 'all' shows everything

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(pattern =>
        pattern.name.toLowerCase().includes(query) ||
        pattern.altNames.some(alt => alt.toLowerCase().includes(query)) ||
        pattern.description.toLowerCase().includes(query) ||
        pattern.code.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(pattern => pattern.category === categoryFilter)
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(pattern => pattern.difficulty === parseInt(difficultyFilter))
    }

    setFilteredPatterns(filtered)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      altNames: [],
      category: 'line',
      requiredCells: [],
      difficulty: 1,
      canRotate: false,
      canMirror: false,
      description: '',
      isActive: true,
      animationDelay: 1500,
      excludedRanges: []
    })
    setSelectedCells(new Set())
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (pattern: BingoPattern) => {
    setFormData({
      code: pattern.code,
      name: pattern.name,
      altNames: [...pattern.altNames],
      category: pattern.category,
      requiredCells: [...pattern.requiredCells],
      difficulty: pattern.difficulty,
      canRotate: pattern.canRotate || false,
      canMirror: pattern.canMirror || false,
      description: pattern.description,
      isActive: pattern.isActive !== false,
      animationDelay: pattern.animationDelay || 1500,
      excludedRanges: pattern.excludedRanges ? [...pattern.excludedRanges] : []
    })
    setSelectedCells(new Set(pattern.requiredCells))
    setSelectedPattern(pattern)
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (pattern: BingoPattern) => {
    setSelectedPattern(pattern)
    setIsViewDialogOpen(true)
  }

  const handleCellClick = (cellIndex: number) => {
    const newSelectedCells = new Set(selectedCells)

    if (selectedCells.has(cellIndex)) {
      newSelectedCells.delete(cellIndex)
    } else {
      newSelectedCells.add(cellIndex)
    }

    setSelectedCells(newSelectedCells)
    setFormData(prev => ({
      ...prev,
      requiredCells: Array.from(newSelectedCells).sort((a, b) => a - b)
    }))
  }

  const createPattern = async () => {
    if (!formData.code || !formData.name || formData.requiredCells.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one cell",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newPattern = await response.json()
        setPatterns(prev => [...prev, newPattern])
        setIsCreateDialogOpen(false)
        resetForm()
        toast({
          title: "Pattern Created",
          description: `${formData.name} has been created successfully`,
          variant: "default"
        })
      } else {
        const error = await response.text()
        toast({
          title: "Creation Failed",
          description: error || "Failed to create pattern",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to create pattern:', error)
      toast({
        title: "Error",
        description: "Failed to create pattern. Please check your connection.",
        variant: "destructive"
      })
    }
  }

  const updatePattern = async () => {
    if (!selectedPattern || !formData.name || formData.requiredCells.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one cell",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/patterns/${selectedPattern.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedPattern = await response.json()
        setPatterns(prev => prev.map(p => p.code === selectedPattern.code ? updatedPattern : p))
        setIsEditDialogOpen(false)
        resetForm()
        setSelectedPattern(null)
        toast({
          title: "Pattern Updated",
          description: `${formData.name} has been updated successfully`,
          variant: "default"
        })
      } else {
        const error = await response.text()
        toast({
          title: "Update Failed",
          description: error || "Failed to update pattern",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to update pattern:', error)
      toast({
        title: "Error",
        description: "Failed to update pattern. Please check your connection.",
        variant: "destructive"
      })
    }
  }

  const togglePatternStatus = async (pattern: BingoPattern) => {
    const newStatus = !pattern.isActive

    try {
      const response = await fetch(`/api/patterns/${pattern.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })

      if (response.ok) {
        const updatedPattern = await response.json()
        setPatterns(prev => prev.map(p => p.code === pattern.code ? updatedPattern : p))
        toast({
          title: `Pattern ${newStatus ? 'Activated' : 'Deactivated'}`,
          description: `${pattern.name} is now ${newStatus ? 'active' : 'inactive'}`,
          variant: "default"
        })
      } else {
        const error = await response.text()
        toast({
          title: "Update Failed",
          description: error || "Failed to update pattern status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to toggle pattern status:', error)
      toast({
        title: "Error",
        description: "Failed to update pattern status. Please check your connection.",
        variant: "destructive"
      })
    }
  }

  const deletePattern = async () => {
    if (!deletePatternCode) return

    try {
      const response = await fetch(`/api/patterns/${deletePatternCode}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPatterns(prev => prev.filter(p => p.code !== deletePatternCode))
        toast({
          title: "Pattern Deleted",
          description: "Pattern has been successfully deleted",
          variant: "default"
        })
      } else {
        const error = await response.text()
        toast({
          title: "Delete Failed",
          description: error || "Failed to delete pattern",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to delete pattern:', error)
      toast({
        title: "Error",
        description: "Failed to delete pattern. Please check your connection.",
        variant: "destructive"
      })
    } finally {
      setDeletePatternCode(null)
    }
  }

  const PatternGrid = ({
    selectedCells,
    onCellClick,
    readonly = false
  }: {
    selectedCells: Set<number>,
    onCellClick?: (index: number) => void,
    readonly?: boolean
  }) => (
    <div className="grid grid-cols-5 gap-1 w-64 h-64">
      {Array.from({ length: 25 }, (_, i) => {
        const isSelected = selectedCells.has(i)
        const isFreeSpace = i === 12

        return (
          <div
            key={i}
            className={`
              aspect-square border-2 rounded flex items-center justify-center text-xs font-bold transition-colors
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}
              ${isSelected && isFreeSpace
                ? 'bg-green-500 text-white border-green-600'
                : isSelected
                ? 'bg-blue-500 text-white border-blue-600'
                : isFreeSpace
                ? 'bg-green-200 text-black border-green-400'
                : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
              }
            `}
            onClick={() => !readonly && onCellClick?.(i)}
          >
            {isFreeSpace ? 'FREE' : ''}
          </div>
        )
      })}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">Loading patterns...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Pattern Management</h1>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Pattern
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search Patterns</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, code, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="all">All Patterns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {PATTERN_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level} value={level.toString()}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredPatterns.length} of {patterns.length} patterns
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patterns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatterns.map((pattern) => (
          <Card key={pattern.code} className={`hover:shadow-md transition-shadow ${pattern.isActive === false ? 'opacity-70 border-gray-300' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {pattern.name}
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={pattern.isActive !== false}
                        onCheckedChange={() => togglePatternStatus(pattern)}
                        size="sm"
                      />
                      <span className="text-xs text-gray-500">
                        {pattern.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{pattern.category}</Badge>
                    <Badge variant="secondary">Difficulty {pattern.difficulty}</Badge>
                    {pattern.canRotate && <Badge variant="outline">Rotatable</Badge>}
                    {pattern.canMirror && <Badge variant="outline">Mirrorable</Badge>}
                    {pattern.isActive === false && <Badge variant="destructive">Inactive</Badge>}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-center">
                <PatternVisualizer
                  pattern={pattern}
                  size="small"
                  animate={(pattern.canRotate || pattern.canMirror) && pattern.animationDelay ? true : false}
                />
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{pattern.description}</p>
              <div className="flex justify-between items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openViewDialog(pattern)}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(pattern)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeletePatternCode(pattern.code)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatterns.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No patterns found</div>
          <div className="text-gray-400 text-sm mt-1">
            {searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Create your first pattern to get started!'
            }
          </div>
        </div>
      )}

      {/* Create/Edit Pattern Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          resetForm()
          setSelectedPattern(null)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'Edit Pattern' : 'Create New Pattern'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Pattern Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Pattern Code*</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="unique_pattern_code"
                  disabled={isEditDialogOpen}
                />
              </div>

              <div>
                <Label htmlFor="name">Pattern Name*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Pattern Name"
                />
              </div>

              <div>
                <Label htmlFor="altNames">Alternative Names (comma-separated)</Label>
                <Input
                  id="altNames"
                  value={formData.altNames.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    altNames: e.target.value.split(',').map(name => name.trim()).filter(name => name)
                  }))}
                  placeholder="Alt Name 1, Alt Name 2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value: BingoPattern['category']) =>
                    setFormData(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PATTERN_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty.toString()} onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, difficulty: parseInt(value) as 1 | 2 | 3 | 4 | 5 }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map(level => (
                        <SelectItem key={level} value={level.toString()}>
                          Level {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="canRotate"
                    checked={formData.canRotate}
                    onChange={(e) => setFormData(prev => ({ ...prev, canRotate: e.target.checked }))}
                  />
                  <Label htmlFor="canRotate">Pattern can be rotated</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="canMirror"
                    checked={formData.canMirror}
                    onChange={(e) => setFormData(prev => ({ ...prev, canMirror: e.target.checked }))}
                  />
                  <Label htmlFor="canMirror">Pattern can be mirrored (left-right)</Label>
                </div>

                {(formData.canRotate || formData.canMirror) && (
                  <div>
                    <Label htmlFor="animationDelay">Animation Delay (milliseconds)</Label>
                    <Input
                      id="animationDelay"
                      type="number"
                      value={formData.animationDelay}
                      onChange={(e) => setFormData(prev => ({ ...prev, animationDelay: parseInt(e.target.value) || 1500 }))}
                      min="500"
                      max="10000"
                      step="500"
                      placeholder="1500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Time between rotations when pattern is displayed (500-10000ms)
                    </p>
                  </div>
                )}

                <div>
                  <Label>Excluded Number Ranges (optional)</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {['B', 'I', 'N', 'G', 'O'].map(letter => (
                      <div key={letter} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`exclude-${letter}`}
                          checked={formData.excludedRanges.includes(letter)}
                          onChange={(e) => {
                            const newExcluded = e.target.checked
                              ? [...formData.excludedRanges, letter]
                              : formData.excludedRanges.filter(l => l !== letter)
                            setFormData(prev => ({ ...prev, excludedRanges: newExcluded }))
                          }}
                        />
                        <Label htmlFor={`exclude-${letter}`} className="text-sm">
                          {letter} ({letter === 'B' ? '1-15' : letter === 'I' ? '16-30' : letter === 'N' ? '31-45' : letter === 'G' ? '46-60' : '61-75'})
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select which BINGO columns to exclude from games using this pattern. Excluded columns won't have their numbers called during the game.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <Label htmlFor="isActive">Pattern is active (available for games)</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description*</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe how to complete this pattern"
                  rows={4}
                />
              </div>
            </div>

            {/* Pattern Grid */}
            <div className="space-y-4">
              <div>
                <Label>Pattern Grid</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Click cells to select/deselect them for the pattern. You can include the FREE space if needed (it will appear as a green circle when selected).
                </p>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <PatternGrid
                      selectedCells={selectedCells}
                      onCellClick={handleCellClick}
                    />
                  </div>

                  {(formData.canRotate || formData.canMirror) && formData.requiredCells.length > 0 && (
                    <div className="flex justify-center">
                      <div className="text-center">
                        <p className="text-sm font-medium mb-2">Preview with Animation:</p>
                        <PatternVisualizer
                          pattern={{
                            ...formData,
                            code: formData.code || 'preview',
                            name: formData.name || 'Preview'
                          }}
                          size="small"
                          animate={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Selected cells: {formData.requiredCells.length}
                {formData.requiredCells.length > 0 && (
                  <span className="ml-2">
                    [{formData.requiredCells.join(', ')}]
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
              resetForm()
              setSelectedPattern(null)
            }}>
              Cancel
            </Button>
            <Button onClick={isEditDialogOpen ? updatePattern : createPattern}>
              {isEditDialogOpen ? 'Update Pattern' : 'Create Pattern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Pattern Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPattern?.name}</DialogTitle>
          </DialogHeader>

          {selectedPattern && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Pattern Code</Label>
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedPattern.code}</div>
                  </div>

                  <div>
                    <Label>Category & Difficulty</Label>
                    <div className="flex gap-2">
                      <Badge>{selectedPattern.category}</Badge>
                      <Badge variant="secondary">Difficulty {selectedPattern.difficulty}</Badge>
                      {selectedPattern.canRotate && <Badge variant="outline">Rotatable</Badge>}
                      {selectedPattern.canMirror && <Badge variant="outline">Mirrorable</Badge>}
                    </div>
                  </div>

                  {selectedPattern.altNames.length > 0 && (
                    <div>
                      <Label>Alternative Names</Label>
                      <div className="text-sm text-gray-600">
                        {selectedPattern.altNames.join(', ')}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Description</Label>
                    <div className="text-sm text-gray-600">{selectedPattern.description}</div>
                  </div>

                  <div>
                    <Label>Required Cells</Label>
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                      [{selectedPattern.requiredCells.join(', ')}]
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <PatternVisualizer
                    pattern={selectedPattern}
                    size="large"
                    animate={(selectedPattern.canRotate || selectedPattern.canMirror) && selectedPattern.animationDelay ? true : false}
                    showLabels={true}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletePatternCode !== null} onOpenChange={(open) => !open && setDeletePatternCode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pattern</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pattern? This action cannot be undone and will remove the pattern from all future sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deletePattern} className="bg-red-600 hover:bg-red-700">
              Delete Pattern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}