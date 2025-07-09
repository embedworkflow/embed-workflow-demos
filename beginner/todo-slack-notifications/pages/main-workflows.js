import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MainWorkflows() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main user's workflows
    router.replace('/workflows/main');
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Redirecting to main user workflows...</p>
      </div>
    </div>
  );
}