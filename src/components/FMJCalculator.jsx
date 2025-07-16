import React, { useState } from 'react';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card } from './ui/card';

const MATERIALS = [
  { label: '13CR', group: 'Low Chrome' },
  { label: 'S13CR', group: 'Low Chrome' },
  { label: '41XX', group: 'Low Chrome' },
  { label: '25CR', group: 'High Chrome' },
  { label: 'INC-718', group: 'High Chrome' },
  { label: 'INC-925', group: 'High Chrome' },
];

const DRILL_SIZES = [
  '0.375"',
  '0.21"',
  '0.299"',
];

// Constants (example values, adjust as needed)
const GRINDING_TIME = 2; // min
const SETUP_TIME = 3; // min
const INSPECTION_TIME = 1; // min

const OPERATION_PARAMS = {
  'Low Chrome': {
    drill: [
      { size: '0.375"', length: 0.73, rpm: 1800, feed: 0.8, time: 3 },
      { size: '0.21"', length: 1.3, rpm: 1800, feed: 0.8, time: 3 },
    ],
    roughFMJ: { length: 1.4, rpm: 100, feed: 0.2, time: 8 },
    finishFMJ: { length: 1.402, rpm: 100, feed: 0.15, time: 10 },
    threadMill: { length: 0.65, rpm: 2100, feed: 0.6, time: 6 },
    fmjTotal: 30,
  },
  'High Chrome': {
    drill: [
      { size: '0.375"', length: 0.73, rpm: 1100, feed: 0.35, time: 5 },
      { size: '0.21"', length: 1.3, rpm: 1100, feed: 0.35, time: 5 },
    ],
    roughFMJ: { length: 1.4, rpm: 100, feed: 0.15, time: 10 },
    finishFMJ: { length: 1.402, rpm: 100, feed: 0.12, time: 15 },
    threadMill: { length: 0.65, rpm: 1100, feed: 0.35, time: 10 },
    fmjTotal: 45,
  },
};

function getMaterialGroup(material) {
  const found = MATERIALS.find(m => m.label === material);
  return found ? found.group : null;
}

export default function FMJCalculator() {
  const [material, setMaterial] = useState(MATERIALS[0].label);
  const [drillSize, setDrillSize] = useState(DRILL_SIZES[0]);
  const [length, setLength] = useState('');
  const [includeFMJ, setIncludeFMJ] = useState(true);
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const group = getMaterialGroup(material);
    if (!group) return;
    const params = OPERATION_PARAMS[group];
    // Find drill op by size
    const drillOp = params.drill.find(d => d.size === drillSize);
    // Calculate drill time (proportional to length)
    const drillTime = drillOp ? (Number(length) / drillOp.feed) : 0;
    // Add constants
    let total = drillTime + GRINDING_TIME + SETUP_TIME + INSPECTION_TIME;
    // Add FMJ port time if included
    if (includeFMJ) {
      total += params.fmjTotal;
    }
    setResult(total.toFixed(2));
  };

  return (
    <Card className="max-w-md mx-auto mt-8 p-6">
      <h2 className="text-xl font-bold mb-4">FMJ Port Time Calculator</h2>
      <div className="mb-4">
        <label className="block mb-1">Material Grade</label>
        <Select value={material} onChange={e => setMaterial(e.target.value)}>
          {MATERIALS.map(m => (
            <option key={m.label} value={m.label}>{m.label}</option>
          ))}
        </Select>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Drill Size</label>
        <Select value={drillSize} onChange={e => setDrillSize(e.target.value)}>
          {DRILL_SIZES.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </Select>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Length to Drill (inches)</label>
        <Input type="number" value={length} onChange={e => setLength(e.target.value)} min="0" step="any" />
      </div>
      <div className="mb-4 flex items-center">
        <Checkbox checked={includeFMJ} onChange={e => setIncludeFMJ(e.target.checked)} />
        <span className="ml-2">Include FMJ Port Operations?</span>
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleCalculate}>
        Calculate Total Time
      </button>
      {result && (
        <div className="mt-6 text-lg font-semibold">
          Total Estimated Time: <span className="text-blue-700">{result} minutes</span>
        </div>
      )}
    </Card>
  );
} 