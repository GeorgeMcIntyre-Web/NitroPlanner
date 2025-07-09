import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

function DigitalTwinSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    professionalProfile: {
      title: '',
      yearsOfExperience: 0,
      specialization: '',
      bio: '',
      linkedinUrl: '',
      portfolioUrl: ''
    },
    skills: [] as Array<{ name: string; level: number; category: string }>,
    availability: {
      currentStatus: 'available',
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      timezone: 'UTC',
      preferredContactMethod: 'email'
    },
    workloadCapacity: {
      maxConcurrentTasks: 5,
      preferredTaskTypes: [] as string[],
      stressLevel: 'medium',
      energyLevel: 'high',
      focusLevel: 'high'
    }
  });

  const updateFormData = (section: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], ...data }
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Create professional profile
      await fetch('/api/digital-twin/professional-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.professionalProfile)
      });

      // Create skills
      for (const skill of formData.skills) {
        await fetch('/api/digital-twin/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(skill)
        });
      }

      // Create availability
      await fetch('/api/digital-twin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.availability)
      });

      // Create workload capacity
      await fetch('/api/digital-twin/workload-capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.workloadCapacity)
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating digital twin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step Components
  const WelcomeStep: React.FC<any> = ({ onNext }) => (
    <div className="text-center py-8">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-4">
        Welcome to Your Digital Twin
      </h3>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
        Your Digital Twin is a comprehensive digital representation of your professional profile, 
        skills, availability, and capacity. This will help optimize work assignments and provide 
        insights into your performance and growth opportunities.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 mb-2">Smart Assignments</h4>
          <p className="text-sm text-gray-600">Get matched with work that fits your skills and capacity</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 mb-2">Performance Insights</h4>
          <p className="text-sm text-gray-600">Track your progress and identify growth opportunities</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 mb-2">Learning Path</h4>
          <p className="text-sm text-gray-600">Personalized recommendations for skill development</p>
        </div>
      </div>
      <Button onClick={onNext} className="px-8">
        Get Started
      </Button>
    </div>
  );

  const ProfessionalProfileStep: React.FC<any> = ({ formData, updateFormData, onNext, onPrevious }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Professional Title"
          placeholder="e.g., Senior Mechanical Engineer"
          value={formData.professionalProfile.title}
          onChange={(e) => updateFormData('professionalProfile', { title: e.target.value })}
        />
        <Input
          label="Years of Experience"
          type="number"
          placeholder="5"
          value={formData.professionalProfile.yearsOfExperience}
          onChange={(e) => updateFormData('professionalProfile', { yearsOfExperience: parseInt(e.target.value) || 0 })}
        />
      </div>
      <Input
        label="Specialization"
        placeholder="e.g., CAD Design, Finite Element Analysis, Manufacturing"
        value={formData.professionalProfile.specialization}
        onChange={(e) => updateFormData('professionalProfile', { specialization: e.target.value })}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Bio
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Tell us about your professional background, expertise, and career goals..."
          value={formData.professionalProfile.bio}
          onChange={(e) => updateFormData('professionalProfile', { bio: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="LinkedIn URL"
          placeholder="https://linkedin.com/in/yourprofile"
          value={formData.professionalProfile.linkedinUrl}
          onChange={(e) => updateFormData('professionalProfile', { linkedinUrl: e.target.value })}
        />
        <Input
          label="Portfolio URL"
          placeholder="https://yourportfolio.com"
          value={formData.professionalProfile.portfolioUrl}
          onChange={(e) => updateFormData('professionalProfile', { portfolioUrl: e.target.value })}
        />
      </div>
      <div className="flex justify-between pt-6">
        <Button variant="secondary" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );

  const SkillsStep: React.FC<any> = ({ formData, updateFormData, onNext, onPrevious }) => {
    const [newSkill, setNewSkill] = useState({ name: '', level: 5, category: 'technical' });
    
    const skillCategories = [
      { id: 'technical', name: 'Technical Skills' },
      { id: 'soft', name: 'Soft Skills' },
      { id: 'tools', name: 'Tools & Software' },
      { id: 'languages', name: 'Programming Languages' }
    ];

    const addSkill = () => {
      if (newSkill.name.trim()) {
        updateFormData('skills', [...formData.skills, { ...newSkill }]);
        setNewSkill({ name: '', level: 5, category: 'technical' });
      }
    };

    const removeSkill = (index: number) => {
      const updatedSkills = formData.skills.filter((_: any, i: number) => i !== index);
      updateFormData('skills', updatedSkills);
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Skill Name"
            placeholder="e.g., SolidWorks, Project Management"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
            >
              {skillCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proficiency Level (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600 mt-1">
              Level {newSkill.level}
            </div>
          </div>
        </div>
        <Button onClick={addSkill} variant="secondary" className="w-full">
          Add Skill
        </Button>

        {/* Display Skills */}
        <div className="space-y-4">
          {skillCategories.map(category => {
            const categorySkills = formData.skills.filter((skill: any) => skill.category === category.id);
            if (categorySkills.length === 0) return null;
            
            return (
              <div key={category.id}>
                <h4 className="font-semibold text-gray-800 mb-2">{category.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categorySkills.map((skill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{skill.name}</div>
                        <div className="text-sm text-gray-600">Level {skill.level}</div>
                      </div>
                      <button
                        onClick={() => removeSkill(formData.skills.indexOf(skill))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="secondary" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={onNext}>
            Next
          </Button>
        </div>
      </div>
    );
  };

  const AvailabilityStep: React.FC<any> = ({ formData, updateFormData, onNext, onPrevious }) => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Status
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.availability.currentStatus}
          onChange={(e) => updateFormData('availability', { currentStatus: e.target.value })}
        >
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="away">Away</option>
          <option value="offline">Offline</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="Start Time"
          type="time"
          value={formData.availability.workingHours.start}
          onChange={(e) => updateFormData('availability', { 
            workingHours: { ...formData.availability.workingHours, start: e.target.value }
          })}
        />
        <Input
          label="End Time"
          type="time"
          value={formData.availability.workingHours.end}
          onChange={(e) => updateFormData('availability', { 
            workingHours: { ...formData.availability.workingHours, end: e.target.value }
          })}
        />
        <Input
          label="Timezone"
          placeholder="UTC"
          value={formData.availability.timezone}
          onChange={(e) => updateFormData('availability', { timezone: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Contact Method
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.availability.preferredContactMethod}
          onChange={(e) => updateFormData('availability', { preferredContactMethod: e.target.value })}
        >
          <option value="email">Email</option>
          <option value="slack">Slack</option>
          <option value="teams">Microsoft Teams</option>
          <option value="phone">Phone</option>
        </select>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="secondary" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );

  const CapacityStep: React.FC<any> = ({ formData, updateFormData, onNext, onPrevious }) => {
    const taskTypes = [
      'Design Tasks',
      'Analysis Tasks', 
      'Documentation',
      'Meetings',
      'Code Review',
      'Testing',
      'Research',
      'Training'
    ];

    const toggleTaskType = (taskType: string) => {
      const current = formData.workloadCapacity.preferredTaskTypes;
      const updated = current.includes(taskType)
        ? current.filter((t: string) => t !== taskType)
        : [...current, taskType];
      updateFormData('workloadCapacity', { preferredTaskTypes: updated });
    };

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Concurrent Tasks
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.workloadCapacity.maxConcurrentTasks}
            onChange={(e) => updateFormData('workloadCapacity', { maxConcurrentTasks: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-center text-sm text-gray-600 mt-1">
            {formData.workloadCapacity.maxConcurrentTasks} tasks
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Task Types
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {taskTypes.map(taskType => (
              <label key={taskType} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workloadCapacity.preferredTaskTypes.includes(taskType)}
                  onChange={() => toggleTaskType(taskType)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{taskType}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stress Level
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.workloadCapacity.stressLevel}
              onChange={(e) => updateFormData('workloadCapacity', { stressLevel: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energy Level
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.workloadCapacity.energyLevel}
              onChange={(e) => updateFormData('workloadCapacity', { energyLevel: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focus Level
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.workloadCapacity.focusLevel}
              onChange={(e) => updateFormData('workloadCapacity', { focusLevel: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="secondary" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={onNext}>
            Next
          </Button>
        </div>
      </div>
    );
  };

  const ReviewStep: React.FC<any> = ({ formData, onComplete, onPrevious, isLoading }) => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Review Your Digital Twin Profile
        </h3>
        <p className="text-gray-600">
          Please review all the information before completing your setup
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Professional Profile */}
        <Card className="p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Professional Profile</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Title:</strong> {formData.professionalProfile.title || 'Not specified'}</div>
            <div><strong>Experience:</strong> {formData.professionalProfile.yearsOfExperience} years</div>
            <div><strong>Specialization:</strong> {formData.professionalProfile.specialization || 'Not specified'}</div>
          </div>
        </Card>
        {/* Skills */}
        <Card className="p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Skills ({formData.skills.length})</h4>
          <div className="space-y-1 text-sm">
            {formData.skills.slice(0, 3).map((skill: any, index: number) => (
              <div key={index}>{skill.name} (Level {skill.level})</div>
            ))}
            {formData.skills.length > 3 && (
              <div className="text-gray-500">+{formData.skills.length - 3} more skills</div>
            )}
          </div>
        </Card>
        {/* Availability */}
        <Card className="p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Availability</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Status:</strong> {formData.availability.currentStatus}</div>
            <div><strong>Hours:</strong> {formData.availability.workingHours.start} - {formData.availability.workingHours.end}</div>
            <div><strong>Timezone:</strong> {formData.availability.timezone}</div>
          </div>
        </Card>
        {/* Capacity */}
        <Card className="p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Workload Capacity</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Max Tasks:</strong> {formData.workloadCapacity.maxConcurrentTasks}</div>
            <div><strong>Stress Level:</strong> {formData.workloadCapacity.stressLevel}</div>
            <div><strong>Energy Level:</strong> {formData.workloadCapacity.energyLevel}</div>
          </div>
        </Card>
      </div>
      <div className="flex justify-between pt-6">
        <Button variant="secondary" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onComplete} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );

  // Define steps after all components are available
  const steps: SetupStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Digital Twin',
      description: 'Let\'s create your comprehensive digital profile',
      component: WelcomeStep
    },
    {
      id: 'professional',
      title: 'Professional Profile',
      description: 'Tell us about your professional background',
      component: ProfessionalProfileStep
    },
    {
      id: 'skills',
      title: 'Skills & Expertise',
      description: 'Add your technical and soft skills',
      component: SkillsStep
    },
    {
      id: 'availability',
      title: 'Availability & Preferences',
      description: 'Set your working hours and availability',
      component: AvailabilityStep
    },
    {
      id: 'capacity',
      title: 'Workload Capacity',
      description: 'Define your optimal workload and preferences',
      component: CapacityStep
    },
    {
      id: 'review',
      title: 'Review & Complete',
      description: 'Review your digital twin profile',
      component: ReviewStep
    }
  ];

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 mt-2">
                {steps[currentStep].description}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <Card className="p-8">
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onComplete={handleComplete}
              isLoading={isLoading}
              isLastStep={currentStep === steps.length - 1}
            />
          </Card>

        {/* Success Modal */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            router.push('/digital-twin');
          }}
          title="Digital Twin Created Successfully!"
        >
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Your Digital Twin is Ready!
            </h3>
            <p className="text-gray-600 mb-6">
              Your comprehensive digital profile has been created. You can now access advanced features like smart work assignments and capacity analytics.
            </p>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/digital-twin');
              }}
              className="w-full"
            >
              Go to Digital Twin Dashboard
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default DigitalTwinSetup;