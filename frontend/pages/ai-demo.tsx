import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CogIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

// AI Planning Demo Component
export default function AIPlanningDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [simulationData, setSimulationData] = useState<any>(null)
  const [predictions, setPredictions] = useState<any>(null)

  const demoSteps = [
    {
      title: 'Project Analysis',
      description: 'AI analyzes project requirements, team capabilities, and historical data',
      icon: BrainIcon,
      duration: 3000,
      data: {
        requirements: ['Assembly line design', 'Quality control system', 'Safety protocols'],
        teamCapabilities: ['Mechanical Design: 85%', 'Electrical Design: 78%', 'Simulation: 92%'],
        historicalData: 'Analyzing 150+ similar projects'
      }
    },
    {
      title: 'Resource Optimization',
      description: 'AI optimizes resource allocation based on skills, availability, and workload',
      icon: UserGroupIcon,
      duration: 2500,
      data: {
        assignments: [
          { role: 'Mechanical Designer', assigned: 'John Smith', efficiency: '92%' },
          { role: 'Electrical Designer', assigned: 'Sarah Johnson', efficiency: '88%' },
          { role: 'Simulation Engineer', assigned: 'Mike Chen', efficiency: '95%' }
        ],
        optimization: 'Resource utilization improved by 23%'
      }
    },
    {
      title: 'Risk Assessment',
      description: 'AI identifies potential risks and suggests mitigation strategies',
      icon: ExclamationTriangleIcon,
      duration: 2000,
      data: {
        risks: [
          { type: 'Technical Risk', probability: '15%', impact: 'High', mitigation: 'Early prototyping' },
          { type: 'Resource Risk', probability: '8%', impact: 'Medium', mitigation: 'Backup resources' },
          { type: 'Schedule Risk', probability: '12%', impact: 'Medium', mitigation: 'Buffer time' }
        ],
        overallRisk: 'Low (8.5%)'
      }
    },
    {
      title: 'Timeline Prediction',
      description: 'AI predicts project completion with confidence intervals',
      icon: ClockIcon,
      duration: 3500,
      data: {
        prediction: {
          optimistic: '45 days',
          mostLikely: '52 days',
          pessimistic: '61 days',
          confidence: '87%'
        },
        factors: ['Team experience', 'Project complexity', 'Resource availability', 'Historical performance']
      }
    },
    {
      title: 'Efficiency Optimization',
      description: 'AI suggests process improvements and workflow optimizations',
      icon: CogIcon,
      duration: 2800,
      data: {
        improvements: [
          { area: 'Design Process', improvement: 'Parallel design reviews', efficiency: '+18%' },
          { area: 'Communication', improvement: 'Automated status updates', efficiency: '+12%' },
          { area: 'Quality Control', improvement: 'Early validation checkpoints', efficiency: '+15%' }
        ],
        totalEfficiency: '+15.2%'
      }
    },
    {
      title: 'Continuous Learning',
      description: 'AI learns from project progress and adjusts predictions',
      icon: LightBulbIcon,
      duration: 3000,
      data: {
        learning: [
          'Task completion patterns identified',
          'Resource utilization optimized',
          'Risk factors updated',
          'Timeline predictions refined'
        ],
        accuracy: 'Prediction accuracy improved to 94%'
      }
    }
  ]

  const startSimulation = () => {
    setIsRunning(true)
    setCurrentStep(0)
    runSimulation()
  }

  const runSimulation = () => {
    if (currentStep < demoSteps.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        runSimulation()
      }, demoSteps[currentStep].duration)
    } else {
      setIsRunning(false)
      generateFinalPredictions()
    }
  }

  const generateFinalPredictions = () => {
    const finalPredictions = {
      projectSuccess: '94.2%',
      completionTime: '52 days',
      costSavings: '$45,000',
      efficiencyGain: '23.5%',
      riskReduction: '67%',
      recommendations: [
        'Implement parallel design reviews',
        'Add automated quality checkpoints',
        'Optimize resource allocation weekly',
        'Use predictive maintenance scheduling'
      ]
    }
    setPredictions(finalPredictions)
  }

  const resetDemo = () => {
    setCurrentStep(0)
    setIsRunning(false)
    setSimulationData(null)
    setPredictions(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Planning Demo</h1>
              <p className="text-gray-600">Experience the future of project management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={startSimulation}
                disabled={isRunning}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                {isRunning ? 'Running...' : 'Start Demo'}
              </button>
              <button
                onClick={resetDemo}
                className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 flex items-center"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">AI Planning Process</h2>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {demoSteps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Current Step Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-8 mb-8"
          >
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <demoSteps[currentStep].icon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {demoSteps[currentStep].title}
                </h3>
                <p className="text-gray-600 mb-6">{demoSteps[currentStep].description}</p>
                
                {/* Step-specific data display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentStep === 0 && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Requirements Analysis</h4>
                        <ul className="space-y-2">
                          {demoSteps[currentStep].data.requirements.map((req, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Team Capabilities</h4>
                        <div className="space-y-3">
                          {demoSteps[currentStep].data.teamCapabilities.map((cap, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{cap.split(':')[0]}</span>
                              <span className="text-sm font-medium text-blue-600">{cap.split(':')[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {currentStep === 1 && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Resource Assignments</h4>
                        <div className="space-y-3">
                          {demoSteps[currentStep].data.assignments.map((assignment, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium text-gray-900">{assignment.role}</div>
                                <div className="text-sm text-gray-600">{assignment.assigned}</div>
                              </div>
                              <span className="text-sm font-medium text-green-600">{assignment.efficiency}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">Optimization Result</h4>
                        <p className="text-green-700">{demoSteps[currentStep].data.optimization}</p>
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Risk Assessment</h4>
                        <div className="space-y-3">
                          {demoSteps[currentStep].data.risks.map((risk, index) => (
                            <div key={index} className="border-l-4 border-yellow-400 pl-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900">{risk.type}</div>
                                  <div className="text-sm text-gray-600">Mitigation: {risk.mitigation}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-yellow-600">{risk.probability}</div>
                                  <div className="text-xs text-gray-500">{risk.impact}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Overall Risk Level</h4>
                        <p className="text-blue-700 text-lg font-medium">{demoSteps[currentStep].data.overallRisk}</p>
                      </div>
                    </>
                  )}

                  {currentStep === 3 && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Timeline Prediction</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Optimistic</span>
                            <span className="text-sm font-medium text-green-600">{demoSteps[currentStep].data.prediction.optimistic}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Most Likely</span>
                            <span className="text-sm font-medium text-blue-600">{demoSteps[currentStep].data.prediction.mostLikely}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Pessimistic</span>
                            <span className="text-sm font-medium text-red-600">{demoSteps[currentStep].data.prediction.pessimistic}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-gray-600">Confidence</span>
                            <span className="text-sm font-medium text-purple-600">{demoSteps[currentStep].data.prediction.confidence}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Key Factors</h4>
                        <ul className="space-y-2">
                          {demoSteps[currentStep].data.factors.map((factor, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500 mr-2" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {currentStep === 4 && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Process Improvements</h4>
                        <div className="space-y-3">
                          {demoSteps[currentStep].data.improvements.map((improvement, index) => (
                            <div key={index} className="p-3 bg-green-50 rounded-lg">
                              <div className="font-medium text-gray-900">{improvement.area}</div>
                              <div className="text-sm text-gray-600">{improvement.improvement}</div>
                              <div className="text-sm font-medium text-green-600">{improvement.efficiency}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">Total Efficiency Gain</h4>
                        <p className="text-green-700 text-lg font-medium">{demoSteps[currentStep].data.totalEfficiency}</p>
                      </div>
                    </>
                  )}

                  {currentStep === 5 && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Learning Outcomes</h4>
                        <ul className="space-y-2">
                          {demoSteps[currentStep].data.learning.map((outcome, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <LightBulbIcon className="h-4 w-4 text-yellow-500 mr-2" />
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-2">Accuracy Improvement</h4>
                        <p className="text-purple-700 text-lg font-medium">{demoSteps[currentStep].data.accuracy}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Final Results */}
        {predictions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">AI Planning Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{predictions.projectSuccess}</div>
                <div className="text-sm text-green-700">Project Success Rate</div>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{predictions.completionTime}</div>
                <div className="text-sm text-blue-700">Predicted Completion</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{predictions.costSavings}</div>
                <div className="text-sm text-purple-700">Cost Savings</div>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{predictions.efficiencyGain}</div>
                <div className="text-sm text-yellow-700">Efficiency Gain</div>
              </div>
              <div className="bg-red-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{predictions.riskReduction}</div>
                <div className="text-sm text-red-700">Risk Reduction</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predictions.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Features Overview */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Planning Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <BrainIcon className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Intelligent Analysis</h3>
              <p className="text-gray-600">AI analyzes project requirements, team capabilities, and historical data to create optimal plans.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <ChartBarIcon className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Predictive Analytics</h3>
              <p className="text-gray-600">Advanced algorithms predict project outcomes with high accuracy and confidence intervals.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <CogIcon className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Continuous Optimization</h3>
              <p className="text-gray-600">AI continuously learns and optimizes plans based on real-time project progress and outcomes.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 