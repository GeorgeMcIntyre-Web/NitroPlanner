import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface ProfileProps {
  profile: any;
  onEdit: () => void;
}

const DigitalTwinProfile: React.FC<ProfileProps> = ({ profile, onEdit }) => {
  return (
    <Card className="p-8 bg-white shadow-lg border-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Professional Profile</h2>
        </div>
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      </div>
      {profile ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800">
              {profile.title || 'No title specified'}
            </h3>
            <p className="text-gray-600">
              {profile.yearsOfExperience || 0} years of experience
            </p>
          </div>
          {profile.specialization && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Specialization</h4>
              <p className="text-gray-600">{profile.specialization}</p>
            </div>
          )}
          {profile.bio && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Bio</h4>
              <p className="text-gray-600">{profile.bio}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">No professional profile created yet</p>
          <Button variant="secondary" onClick={onEdit}>
            Create Profile
          </Button>
        </div>
      )}
    </Card>
  );
};

export default React.memo(DigitalTwinProfile); 