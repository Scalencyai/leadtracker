'use client';

import { useState } from 'react';
import type { FunnelStep } from '@/lib/types';

interface FunnelBuilderProps {
  onSave: (name: string, description: string, steps: FunnelStep[]) => void;
  onCancel: () => void;
}

export default function FunnelBuilder({ onSave, onCancel }: FunnelBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<FunnelStep[]>([
    { name: 'Step 1', event_type: 'pageview', event_name: '/', match_rule: 'exact' }
  ]);

  const addStep = () => {
    setSteps([
      ...steps,
      { 
        name: `Step ${steps.length + 1}`, 
        event_type: 'pageview', 
        event_name: '', 
        match_rule: 'exact' 
      }
    ]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof FunnelStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSave = () => {
    if (!name.trim() || steps.length === 0) {
      alert('Please provide a funnel name and at least one step');
      return;
    }

    const hasEmptySteps = steps.some(s => !s.event_name.trim());
    if (hasEmptySteps) {
      alert('All steps must have an event name');
      return;
    }

    onSave(name, description, steps);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Conversion Funnel
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Define the steps users take to convert
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Funnel Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Funnel Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sign-up Funnel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Funnel Steps
              </h3>
              <button
                onClick={addStep}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                + Add Step
              </button>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Step {index + 1}
                  </h4>
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Step Name
                    </label>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => updateStep(index, 'name', e.target.value)}
                      placeholder="e.g., Landing Page"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Event Type
                    </label>
                    <select
                      value={step.event_type}
                      onChange={(e) => updateStep(index, 'event_type', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="pageview">Page View</option>
                      <option value="click">Click</option>
                      <option value="form_submit">Form Submit</option>
                      <option value="custom">Custom Event</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      value={step.event_name}
                      onChange={(e) => updateStep(index, 'event_name', e.target.value)}
                      placeholder={
                        step.event_type === 'pageview' 
                          ? '/landing' 
                          : step.event_type === 'click'
                          ? 'button#signup'
                          : 'event_name'
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Match Rule
                    </label>
                    <select
                      value={step.match_rule || 'exact'}
                      onChange={(e) => updateStep(index, 'match_rule', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="exact">Exact Match</option>
                      <option value="contains">Contains</option>
                      <option value="regex">Regex</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Create Funnel
          </button>
        </div>
      </div>
    </div>
  );
}
