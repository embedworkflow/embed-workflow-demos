import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  DocumentTextIcon, 
  UserGroupIcon, 
  CalendarDaysIcon, 
  ExclamationTriangleIcon,
  CogIcon,
  RectangleStackIcon,
  PencilSquareIcon,
  SparklesIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const contentTypes = [
  {
    id: 'blog_post',
    name: 'Blog Post',
    description: 'Long-form, SEO-optimized content',
    icon: DocumentTextIcon,
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  {
    id: 'team_update',
    name: 'Team Update',
    description: 'Concise, friendly team communication',
    icon: UserGroupIcon,
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  {
    id: 'manager_summary',
    name: 'Manager',
    description: 'Day summary to manager including tasks and progress',
    icon: CalendarDaysIcon,
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  },
  {
    id: 'alert',
    name: 'Alert',
    description: 'Urgent, action-oriented notification',
    icon: ExclamationTriangleIcon,
    color: 'bg-red-50 border-red-200 text-red-700'
  }
];

export default function ContentRouter() {
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    topic: '',
    keyPoints: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType || !formData.topic.trim()) {
      setNotification({
        type: 'error',
        message: 'Please select a content type and enter a topic'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'content_generation_requested',
          user_key: 'main',
          data: {
            content_type: selectedType,
            topic: formData.topic,
            key_points: formData.keyPoints
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      setNotification({
        type: 'success',
        message: 'Content generated and distributed successfully!'
      });

      setSelectedType('');
      setFormData({
        topic: '',
        keyPoints: ''
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to generate content: ' + error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTypeData = contentTypes.find(type => type.id === selectedType);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Content Router - Smart Content Generation</title>
        <meta name="description" content="Generate and distribute smart content to the right channels" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Content Router
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Generate smart content and distribute it to the right channels automatically
          </p>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/workflows')}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <CogIcon className="w-5 h-5" />
              Manage Workflows
            </button>
          </div>
        </div>

        {/* Content Type Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Choose Content Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-6 rounded-lg border-2 text-left transition-all ${
                  selectedType === type.id
                    ? `${type.color} border-current`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <type.icon className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Form */}
        {selectedType && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <selectedTypeData.icon className="w-8 h-8 text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedType === 'manager_summary' ? 'Generate Day Summary' : `Generate ${selectedTypeData.name}`}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="Enter the main topic or subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="keyPoints" className="block text-sm font-medium text-gray-700 mb-2">
                  Key Points
                </label>
                <textarea
                  id="keyPoints"
                  name="keyPoints"
                  value={formData.keyPoints}
                  onChange={handleInputChange}
                  placeholder="List the main points to cover (one per line)"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>



              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedType('')}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate & Distribute'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RectangleStackIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Select Type</h3>
              <p className="text-sm text-gray-600">Choose from Blog Post, Team Update, Manager, or Alert</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PencilSquareIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Enter Details</h3>
              <p className="text-sm text-gray-600">Provide topic, key points, and audience information</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Generate</h3>
              <p className="text-sm text-gray-600">Content is created using type-specific prompts</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PaperAirplaneIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Auto-Route</h3>
              <p className="text-sm text-gray-600">Content is distributed to appropriate channels</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}