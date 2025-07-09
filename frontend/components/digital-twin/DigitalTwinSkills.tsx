import React, { useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface SkillsProps {
  skills: any[];
  onEdit: () => void;
}

const DigitalTwinSkills: React.FC<SkillsProps> = ({ skills, onEdit }) => {
  // Memoized skills by category
  const skillsByCategory = useMemo(() => {
    const categories = ['technical', 'soft', 'tools', 'languages'];
    return categories.map(category => ({
      category,
      skills: skills.filter(skill => skill.category === category)
    })).filter(cat => cat.skills.length > 0);
  }, [skills]);

  return (
    <Card className="p-8 bg-white shadow-lg border-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Skills & Expertise</h2>
        </div>
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      </div>
      {skills && skills.length > 0 ? (
        <div className="space-y-4">
          {skillsByCategory.map(({ category, skills: categorySkills }) => (
            <div key={category}>
              <h4 className="font-medium text-gray-700 mb-2 capitalize">
                {category} Skills ({categorySkills.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categorySkills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <div>
                      <div className="font-semibold text-gray-800">{skill.name}</div>
                      <div className="text-sm text-gray-600">Level {skill.level}/10</div>
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-3 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm transition-all duration-300" 
                        style={{ width: `${(skill.level / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">No skills added yet</p>
          <Button variant="secondary" onClick={onEdit}>
            Add Skills
          </Button>
        </div>
      )}
    </Card>
  );
};

export default React.memo(DigitalTwinSkills); 