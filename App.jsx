import { useState, useEffect } from 'react'
import { Calculator, Settings, History, FileText, Download, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import './App.css'
import FMJCalculator from './src/components/FMJCalculator'; 
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('calculator')
  const [formData, setFormData] = useState({
    partNumber: '',
    partName: '',
    materialGrade: '',
    drillSize: '',
    lengthToDrill: '',
    rpm: '',
    feedRate: '',
    numberOfFeatures: '1',
    toolWearConsideration: true,
    wallThicknessInspection: false,
    customSetupTime: '',
    customGrindingTime: '',
    grindingFrequency: '10',
    grindingIntervalOverride: '' // NEW: user can override grinding interval in inches
  })
  const [includeFMJPort, setIncludeFMJPort] = useState(false);
  
  const [results, setResults] = useState(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState([])
  // Add state for input errors
  const [inputErrors, setInputErrors] = useState({});

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('calculationHistory')
    if (stored) setHistory(JSON.parse(stored))
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('calculationHistory', JSON.stringify(history))
  }, [history])

  const materialGrades = [
    '13CR',
    '25CR',
    '41XX',
    'INC-718',
    'INC-925',
    'S13CR'
  ]

  const lowChromeMaterials = ['13CR', 'S13CR', '41XX'];
  const highChromeMaterials = ['25CR', 'INC-718', 'INC-925'];

  // Add mapping for drill size to RPM and Feed Rate for each material group
  const DRILL_TABLE = {
    'Low Chrome': {
      '0.299': { rpm: 2100, feed: 0.8 },
      '0.250': { rpm: 2100, feed: 0.8 },
      '0.187': { rpm: 2100, feed: 0.8 },
      '0.200': { rpm: 2100, feed: 0.8 },
      '0.375': { rpm: 2100, feed: 0.8 },
      '0.630': { rpm: 900, feed: 0.6 },
      '0.690': { rpm: 700, feed: 0.5 },
      '0.750': { rpm: 700, feed: 0.5 },
      '0.889': { rpm: 600, feed: 0.5 },
    },
    'High Chrome': {
      '0.299': { rpm: 1100, feed: 0.35 },
      '0.250': { rpm: 1100, feed: 0.35 },
      '0.187': { rpm: 1100, feed: 0.35 },
      '0.200': { rpm: 1100, feed: 0.35 },
      '0.375': { rpm: 1100, feed: 0.35 },
    },
  };

  const LOW_CHROME = ['13CR', 'S13CR', '41XX'];
  const HIGH_CHROME = ['25CR', 'INC-718', 'INC-925'];

  // Helper to get group
  function getMaterialGroup(grade) {
    if (LOW_CHROME.includes(grade)) return 'Low Chrome';
    if (HIGH_CHROME.includes(grade)) return 'High Chrome';
    return null;
  }

  // Helper to check if a value is a positive real number
  function isPositiveNumber(val) {
    return /^\d*\.?\d+$/.test(val) && parseFloat(val) > 0;
  }

  // Helper to check if all required fields are filled and valid
  function isFormValid() {
    // Required part details
    const requiredPartDetails = [formData.partNumber, formData.partName, formData.materialGrade, formData.numberOfFeatures];
    // Required drilling parameters
    const requiredDrillParams = [formData.drillSize, formData.lengthToDrill, formData.rpm, formData.feedRate];
    // Check for empty fields
    if (requiredPartDetails.some(f => !f) || requiredDrillParams.some(f => !f)) return false;
    // Check for errors
    if (Object.values(inputErrors).some(e => e)) return false;
    // Check for valid numbers in drilling parameters
    if (!isPositiveNumber(formData.drillSize) || !isPositiveNumber(formData.lengthToDrill) || !isPositiveNumber(formData.rpm) || !isPositiveNumber(formData.feedRate) || !isPositiveNumber(formData.numberOfFeatures)) return false;
    return true;
  }

  // Update handleInputChange to disallow non-numeric characters for numeric fields
  const handleInputChange = (field, value) => {
    // Validate negative values and non-numeric for numerical fields
    const numericFields = [
      'drillSize', 'lengthToDrill', 'rpm', 'feedRate', 'numberOfFeatures',
      'grindingFrequency', 'customSetupTime', 'customGrindingTime', 'grindingIntervalOverride'
    ];
    let error = '';
    if (numericFields.includes(field)) {
      // Disallow non-numeric input except dot
      if (!/^\d*\.?\d*$/.test(value) && value !== '') {
        error = 'Only positive numbers are allowed.';
      } else {
        const num = parseFloat(value);
        if (!isNaN(num) && num < 0) {
          error = 'Value cannot be negative.';
        }
      }
    }
    setInputErrors(prev => ({ ...prev, [field]: error }));

    setFormData(prev => {
      let updated = { ...prev, [field]: value };
      // If materialGrade or drillSize changes, auto-set RPM and Feed Rate
      if ((field === 'materialGrade' || field === 'drillSize')) {
        const grade = field === 'materialGrade' ? value : prev.materialGrade;
        const drill = field === 'drillSize' ? value : prev.drillSize;
        const group = getMaterialGroup(grade);
        if (group && DRILL_TABLE[group][drill]) {
          updated.rpm = DRILL_TABLE[group][drill].rpm.toString();
          updated.feedRate = DRILL_TABLE[group][drill].feed.toString();
        }
      }
      return updated;
    });
  }

  const calculateTime = () => {
    const inspectionTimePerFeature = 2.0;
    const totalInspectionTime = inspectionTimePerFeature * numberOfFeatures;
    setIsCalculating(true)
    setProgress(0)
    
    // Simulate calculation progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsCalculating(false)

          const drillSize = parseFloat(formData.drillSize) || 0.299
          const lengthToDrill = parseFloat(formData.lengthToDrill) || 5.0
          const feedRate = parseFloat(formData.feedRate) || 0.8
          const numberOfFeatures = parseInt(formData.numberOfFeatures) || 1

          // Determine material hardness
          const softMaterials = ['13CR', '41XX', 'Aluminum', 'Brass', 'Copper']
          const hardMaterials = ['25CR', 'Stainless Steel', 'Cast Iron', 'Titanium']
          const material = formData.materialGrade
          // High chrome materials
          const highChromeMaterials = ['25CR', 'INC-718', 'INC-925']
          // Default grinding interval logic
          let grindingInterval = 10 // default for low chrome/soft
          if (highChromeMaterials.includes(material) || ['Stainless Steel', 'Cast Iron', 'Titanium'].includes(material)) grindingInterval = 5
          // Use user override if provided and valid
          if (formData.grindingIntervalOverride && !isNaN(parseFloat(formData.grindingIntervalOverride)) && parseFloat(formData.grindingIntervalOverride) > 0) {
            grindingInterval = parseFloat(formData.grindingIntervalOverride)
          }

          // Calculate the number of operations per feature (ceil for partial intervals)
          const operationsPerFeature = Math.ceil(lengthToDrill / grindingInterval);
          const totalOperations = numberOfFeatures * operationsPerFeature;

          // Setup time (per operation)
          const setupTimePerOperation = 5.0;
          const totalSetupTime = setupTimePerOperation * totalOperations;

          // Grinding time (per operation)
          const grindingTimePerOperation = 7.0;
          const totalGrindingTime = grindingTimePerOperation * totalOperations;

          // Inspection time (per operation)
          const inspectionTimePerOperation = 2.0;
          const totalInspectionTime = inspectionTimePerOperation * totalOperations;

          // Cutting time (per feature, unchanged)
          const cuttingTime = lengthToDrill / feedRate;
          const totalCuttingTime = cuttingTime * numberOfFeatures;

          // FMJ Port Time logic (unchanged)
          let fmjPortTime = 0;
          if (includeFMJPort) {
            if (lowChromeMaterials.includes(material)) {
              fmjPortTime = 30;
            } else if (highChromeMaterials.includes(material)) {
              fmjPortTime = 45;
            }
          }

          const totalTime = totalCuttingTime + totalGrindingTime + totalSetupTime + totalInspectionTime + fmjPortTime;

          // Debug log for grinding time values
          console.log('DEBUG grinding:', {
            totalGrindingTime,
            numberOfFeatures
          });

          setResults({
            cuttingTimePerFeature: cuttingTime.toFixed(2),
            totalCuttingTime: totalCuttingTime.toFixed(2),
            setupTimePerFeature: setupTimePerOperation.toFixed(2),
            totalSetupTime: totalSetupTime.toFixed(2),
            grindingTimePerFeature: grindingTimePerOperation.toFixed(2),
            totalGrindingTime: totalGrindingTime.toFixed(2),
            inspectionTimePerFeature: inspectionTimePerOperation.toFixed(2),
            totalInspectionTime: totalInspectionTime.toFixed(2),
            toolWearAdditionalTime: "0.00",
            totalStandardTime: totalTime.toFixed(2),
            numberOfFeatures: numberOfFeatures,
            fmjPortTime: fmjPortTime > 0 ? fmjPortTime.toFixed(2) : undefined
          })

          setActiveTab('results')
          return 100
        }
        return prev + 25
      })
    }, 300)
  }

  const getMaterialFactor = (material) => {
    const factors = {
      'Aluminum': 0.8,
      'Steel': 1.0,
      'Stainless Steel': 1.3,
      'Cast Iron': 1.1,
      'Titanium': 1.6,
      'Brass': 0.9,
      'Copper': 0.85
    }
    return factors[material] || 1.0
  }

  const getSizeFactor = (size) => {
    if (size <= 5) return 1.1
    if (size <= 10) return 1.0
    if (size <= 20) return 1.05
    return 1.15
  }

  const resetForm = () => {
    setFormData({
      partNumber: '',
      partName: '',
      materialGrade: '',
      drillSize: '',
      lengthToDrill: '',
      rpm: '',
      feedRate: '',
      numberOfFeatures: '1',
      toolWearConsideration: true,
      wallThicknessInspection: false,
      customSetupTime: '',
      customGrindingTime: '',
      grindingFrequency: '10',
      grindingIntervalOverride: ''
    })
    setResults(null)
  }

  const saveToHistory = () => {
    if (!results) return
    const entry = {
      ...results,
      formData,
      timestamp: new Date().toISOString(),
    }
    setHistory(prev => [entry, ...prev])
  }

  const pieData = results ? [
    { name: 'Cutting Time', value: parseFloat(results.totalCuttingTime), color: '#3b82f6' },
    { name: 'Setup Time', value: parseFloat(results.totalSetupTime), color: '#10b981' },
    { name: 'Grinding Time', value: parseFloat(results.totalGrindingTime), color: '#f59e0b' },
    { name: 'Inspection Time', value: parseFloat(results.totalInspectionTime), color: '#ef4444' }
  ] : []

  const barData = results ? [
    { name: 'Cutting', time: parseFloat(results.totalCuttingTime) },
    { name: 'Setup', time: parseFloat(results.totalSetupTime) },
    { name: 'Grinding', time: parseFloat(results.totalGrindingTime) },
    { name: 'Inspection', time: parseFloat(results.totalInspectionTime) }
  ] : []

  return (
    <div className="min-h-screen bg-white">
      {/* Halliburton Header */}
      <div className="halliburton-header">
        HALLIBURTON
      </div>
      <div className="container mx-auto px-4 py-8 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Gun Drill Machine Standard Time Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Precision time estimation for gun drilling operations
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="calculator" className="flex items-center gap-2 button">
              <Calculator className="w-4 h-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2 button">
              <FileText className="w-4 h-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 button">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'calculator' && (
                <motion.div
                  key="calculator"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Calculator content here */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 section">
                    {/* Job Details */}
                    <div className="card field-group">
                      <CardHeader>
                        <CardTitle>Part Details</CardTitle>
                        <CardDescription>Enter part information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="partNumber">Part Number</Label>
                            <Input
                              id="partNumber"
                              placeholder="J-001"
                              value={formData.partNumber}
                              onChange={(e) => handleInputChange('partNumber', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="partName">Part Name</Label>
                            <Input
                              id="partName"
                              placeholder="Engine Block"
                              value={formData.partName}
                              onChange={(e) => handleInputChange('partName', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="materialGrade">Material Grade</Label>
                            <Select
                              id="materialGrade"
                              value={formData.materialGrade}
                              onChange={e => handleInputChange('materialGrade', e.target.value)}
                            >
                              <option value="" disabled>Select material</option>
                                {materialGrades.map((material) => (
                                <option key={material} value={material}>
                                    {material}
                                </option>
                                ))}
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="numberOfFeatures">Number of Features</Label>
                            <Input
                              id="numberOfFeatures"
                              type="number"
                              min="1"
                              max="100"
                              value={formData.numberOfFeatures}
                              onChange={(e) => handleInputChange('numberOfFeatures', e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    {/* Drilling Parameters */}
                    <div className="card field-group">
                      <CardHeader>
                        <CardTitle>Drilling Parameters</CardTitle>
                        <CardDescription>Enter drilling operation parameters</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="drillSize">Drill Size (in)</Label>
                            <Input
                              id="drillSize"
                              placeholder="e.g. 0.299"
                              value={formData.drillSize}
                              onChange={(e) => handleInputChange('drillSize', e.target.value)}
                            />
                            {inputErrors.drillSize && <div className="text-red-600 text-xs mt-1">{inputErrors.drillSize}</div>}
                          </div>
                          <div>
                            <Label htmlFor="lengthToDrill">Length to Drill (in)</Label>
                            <Input
                              id="lengthToDrill"
                              placeholder="e.g. 5.0"
                              value={formData.lengthToDrill}
                              onChange={(e) => handleInputChange('lengthToDrill', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="rpm">RPM</Label>
                            <Input
                              id="rpm"
                              placeholder="1800"
                              value={formData.rpm}
                              onChange={(e) => handleInputChange('rpm', e.target.value)}
                            />
                            {inputErrors.rpm && <div className="text-red-600 text-xs mt-1">{inputErrors.rpm}</div>}
                          </div>
                          <div>
                            <Label htmlFor="feedRate">Feed Rate (in/min)</Label>
                            <Input
                              id="feedRate"
                              placeholder="0.8"
                              value={formData.feedRate}
                              onChange={(e) => handleInputChange('feedRate', e.target.value)}
                            />
                            {inputErrors.feedRate && <div className="text-red-600 text-xs mt-1">{inputErrors.feedRate}</div>}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="card field-group section">
                    <CardHeader>
                      <CardTitle>Advanced Settings</CardTitle>
                      <CardDescription>Optional parameters and overrides</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="customSetupTime">Custom Setup Time (min)</Label>
                          <Input
                            id="customSetupTime"
                            placeholder="Auto calculated"
                            value={formData.customSetupTime}
                            onChange={(e) => handleInputChange('customSetupTime', e.target.value)}
                          />
                          {inputErrors.customSetupTime && <div className="text-red-600 text-xs mt-1">{inputErrors.customSetupTime}</div>}
                        </div>
                        <div>
                          <Label htmlFor="customGrindingTime">Custom Grinding Time (min)</Label>
                          <Input
                            id="customGrindingTime"
                            placeholder="Auto calculated"
                            value={formData.customGrindingTime}
                            onChange={(e) => handleInputChange('customGrindingTime', e.target.value)}
                          />
                          {inputErrors.customGrindingTime && <div className="text-red-600 text-xs mt-1">{inputErrors.customGrindingTime}</div>}
                        </div>
                        <div>
                          <Label htmlFor="grindingFrequency">Grinding Frequency</Label>
                          <Input
                            id="grindingFrequency"
                            type="number"
                            min="1"
                            max="100"
                            placeholder="10"
                            value={formData.grindingFrequency}
                            onChange={(e) => handleInputChange('grindingFrequency', e.target.value)}
                          />
                          {inputErrors.grindingFrequency && <div className="text-red-600 text-xs mt-1">{inputErrors.grindingFrequency}</div>}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.toolWearConsideration}
                            onChange={e => handleInputChange('toolWearConsideration', e.target.checked)}
                          />
                          <Label htmlFor="toolWear">Tool Wear Consideration</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.wallThicknessInspection}
                            onChange={e => handleInputChange('wallThicknessInspection', e.target.checked)}
                          />
                          <Label htmlFor="wallThickness">Wall Thickness Inspection</Label>
                        </div>
                        {/* FMJ Port Toggle */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={includeFMJPort}
                            onChange={e => setIncludeFMJPort(e.target.checked)}
                          />
                          <Label htmlFor="includeFMJPort">Include FMJ Port Operations</Label>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="grindingIntervalOverride">Grinding Interval Override (inches)</Label>
                        <Input
                          id="grindingIntervalOverride"
                          placeholder="Auto by material"
                          value={formData.grindingIntervalOverride}
                          onChange={(e) => handleInputChange('grindingIntervalOverride', e.target.value)}
                        />
                        {inputErrors.grindingIntervalOverride && <div className="text-red-600 text-xs mt-1">{inputErrors.grindingIntervalOverride}</div>}
                      </div>
                    </CardContent>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4 mt-8">
                    <Button className="btn-primary" onClick={calculateTime} disabled={!isFormValid() || isCalculating}>
                      {isCalculating ? <span className="spinner" /> : 'Calculate Time'}
                    </Button>
                    <Button variant="outline" onClick={resetForm} disabled={isCalculating}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Form
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Results content here */}
                  {results ? (
                    <>
                      {/* Summary Card */}
                      <Card className="results-card">
                        <CardHeader>
                          <CardTitle className="text-2xl">Calculation Results</CardTitle>
                          <CardDescription>
                            Total Standard Time for {results.numberOfFeatures} feature(s)
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold mb-2">
                            {results.totalStandardTime} minutes
                          </div>
                          <Badge variant="secondary">
                            {(parseFloat(results.totalStandardTime) / 60).toFixed(2)} hours
                          </Badge>
                        </CardContent>
                      </Card>

                      {/* Detailed Breakdown */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Time Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span>Cutting Time (per feature):</span>
                                <span className="font-semibold">{results.cuttingTimePerFeature} min</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Cutting Time:</span>
                                <span className="font-semibold">{results.totalCuttingTime} min</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Setup Time (per feature):</span>
                                <span className="font-semibold">{results.setupTimePerFeature} min</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Setup Time:</span>
                                <span className="font-semibold">{results.totalSetupTime} min</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Grinding Time (per feature):</span>
                                <span className="font-semibold">{results.grindingTimePerFeature} min</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Grinding Time:</span>
                                <span className="font-semibold">{results.totalGrindingTime} min</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Inspection Time (per feature):</span>
                                <span className="font-semibold">{results.inspectionTimePerFeature} min</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Inspection Time:</span>
                                <span className="font-semibold">{results.totalInspectionTime} min</span>
                              </div>
                              {parseFloat(results.toolWearAdditionalTime) > 0 && (
                                <div className="flex justify-between">
                                  <span>Tool Wear Additional Time:</span>
                                  <span className="font-semibold">{results.toolWearAdditionalTime} min</span>
                                </div>
                              )}
                              {results.fmjPortTime && (
                                <div className="flex justify-between">
                                  <span>FMJ Port Time:</span>
                                  <span className="font-semibold">{results.fmjPortTime} min</span>
                                </div>
                              )}
                              <Separator />
                              <div className="flex justify-between text-lg font-bold">
                                <span>Total Standard Time:</span>
                                <span>{results.totalStandardTime} min</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Visual Charts */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Time Distribution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => [`${value} min`, 'Time']} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Bar Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Time Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} min`, 'Time']} />
                                <Legend />
                                <Bar dataKey="time" fill="#3b82f6" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Action Buttons */}
                      <div className="flex justify-center gap-4">
                        <Button>
                          <Download className="w-4 h-4 mr-2" />
                          Export to Excel
                        </Button>
                        <Button variant="outline" onClick={saveToHistory}>
                          <Save className="w-4 h-4 mr-2" />
                          Save to History
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('calculator')}>
                          Modify Parameters
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                        <p className="text-gray-600 mb-4">
                          Complete the calculation form to see your results here.
                        </p>
                        <Button onClick={() => setActiveTab('calculator')}>
                          Go to Calculator
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <AnimatePresence mode="wait">
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* History content here */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Calculation History</CardTitle>
                      <CardDescription>View and manage previous calculations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {history.length === 0 ? (
                      <div className="text-center py-12">
                        <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold mb-2">No History Available</h3>
                        <p className="text-gray-600">
                          Your calculation history will appear here once you start using the calculator.
                        </p>
                      </div>
                      ) : (
                        <div className="space-y-6">
                          {history.map((entry, idx) => (
                            <Card key={entry.timestamp + idx} className="border border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">
                                  {entry.formData.partNumber || 'Part Number'} - {entry.formData.partName || 'Part'}
                                </CardTitle>
                                <CardDescription>
                                  {new Date(entry.timestamp).toLocaleString()} | Material: {entry.formData.materialGrade}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-8">
                                  <div>
                                    <div><b>Drill Size:</b> {entry.formData.drillSize} in</div>
                                    <div><b>Length:</b> {entry.formData.lengthToDrill} in</div>
                                    <div><b>RPM:</b> {entry.formData.rpm}</div>
                                    <div><b>Feed Rate:</b> {entry.formData.feedRate} in/min</div>
                                    <div><b>Features:</b> {entry.formData.numberOfFeatures}</div>
                                  </div>
                                  <div>
                                    <div><b>Total Time:</b> {entry.totalStandardTime} min</div>
                                    <div><b>Cutting:</b> {entry.totalCuttingTime} min</div>
                                    <div><b>Setup:</b> {entry.totalSetupTime} min</div>
                                    <div><b>Grinding:</b> {entry.totalGrindingTime} min</div>
                                    <div><b>Inspection:</b> {entry.totalInspectionTime} min</div>
                                  </div>
                                </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
      {/* Halliburton Footer */}
      <div className="halliburton-footer">
        &copy; {new Date().getFullYear()} Halliburton. All rights reserved.
      </div>
      {/* Remove FMJCalculator from here, as it's now integrated */}
    </div>
  )
}

export default App

