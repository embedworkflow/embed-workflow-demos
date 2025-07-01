import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 8;
  
  const router = useRouter();

  // Load tasks from localStorage when component mounts
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);
  
  // Save tasks to localStorage when they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Show notification for a few seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const addTask = async () => {
    if (taskName.trim()) {
      setIsLoading(true);
      
      try {
        const newTask = {
          id: Date.now(),
          name: taskName,
          description: taskDescription,
          completed: false,
          createdAt: new Date().toISOString(),
          assignedTo: assignedTo
        };
        
        // Add task to local state
        setTasks([...tasks, newTask]);
        
        // Always show the first page when a new task is added
        // since we're sorting by newest first, the new task will appear at the top
        setCurrentPage(1);
        
        // Only send notification if there's an assigned person with an email
        if (assignedTo && assignedTo.trim() !== '') {
          try {
            // First try the workflow
            const workflowResponse = await fetch('/api/trigger-workflow', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'todo_list_item_created', // Updated event name to match workflow trigger
                user_key: "main", // The user who owns this workflow
                data: {
                  task_id: newTask.id,
                  task_name: newTask.name,
                  task_description: newTask.description,
                  created_at: newTask.createdAt,
                  assigned_to: assignedTo,
                  email_to: assignedTo // Single email for the assigned person
                }
              })
            });
            
            // If workflow fails, use our custom email implementation as fallback
            if (!workflowResponse.ok) {
              console.log('Workflow trigger failed, using custom email fallback');
              
              // Send notification using our custom email API
              const emailResponse = await fetch('/api/custom-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  task: newTask,
                  email: assignedTo
                })
              });
              
              if (!emailResponse.ok) {
                throw new Error('Both workflow and custom email failed');
              }
            }
          } catch (error) {
            console.error('Notification error:', error);
            // Continue with task creation even if notification fails
          }
          
          // Removed orphaned response check
          
          setNotification({
            type: 'success',
            message: `Task created and assigned to ${assignedTo}`
          });
        } else {
          setNotification({
            type: 'success',
            message: 'Task created'
          });
        }
        
        // Reset form fields
        setTaskName('');
        setTaskDescription('');
        setAssignedTo('');
      } catch (error) {
        console.error('Error:', error);
        setNotification({
          type: 'error',
          message: 'Failed to create task: ' + error.message
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleTask = async (id) => {
    setIsLoading(true);
    
    try {
      // Find the task being toggled
      const taskToToggle = tasks.find(task => task.id === id);
      const newCompletedState = !taskToToggle.completed;
      
      // Update tasks in state
      const updatedTasks = tasks.map(task =>
        task.id === id ? { ...task, completed: newCompletedState } : task
      );
      
      setTasks(updatedTasks);
      
      // Send notification when the task is marked as completed to the assignee
      if (newCompletedState && taskToToggle.assignedTo) {
        try {
          // First try the workflow
          const workflowResponse = await fetch('/api/trigger-workflow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'todo_list_item_completed', // Updated event name to match workflow trigger
              user_key: "main", // The user who owns this workflow
              data: {
                task_id: taskToToggle.id,
                task_name: taskToToggle.name,
                task_description: taskToToggle.description,
                completed_at: new Date().toISOString(),
                assigned_to: taskToToggle.assignedTo,
                email_to: taskToToggle.assignedTo // Send to assignee only
              }
            })
          });
          
          // If workflow fails, use our custom email implementation as fallback
          if (!workflowResponse.ok) {
            console.log('Workflow trigger failed, using custom email fallback');
            
            // Send completion notification using our custom email API
            const completedTask = {
              ...taskToToggle,
              completedAt: new Date().toISOString()
            };
            
            // Send to assignee using the fallback system
            const emailResponse = await fetch('/api/custom-completion-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                task: completedTask,
                email: taskToToggle.assignedTo
              })
            });
            
            if (!emailResponse.ok) {
              throw new Error('Custom email notification failed');
            }
          }
          
        } catch (error) {
          console.error('Completion notification error:', error);
          // Continue with task completion even if notification fails
        }
        
        setNotification({
          type: 'success',
          message: `Task completed, ${taskToToggle.assignedTo} notified`
        });
      } else {
        setNotification({
          type: 'success',
          message: newCompletedState ? 'Task completed' : 'Task reopened'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update task: ' + error.message
      });
      
      // Revert the task state change
      setTasks([...tasks]);
    } finally {
      setIsLoading(false);
    }
  };

  
  const saveTasksToFile = async () => {
    if (tasks.length === 0) {
      setNotification({
        type: 'warning',
        message: 'No tasks to save'
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-to-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tasks',
          data: tasks
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save tasks');
      }
      
      const result = await response.json();
      
      setNotification({
        type: 'success',
        message: `Tasks saved to ${result.path}`
      });
    } catch (error) {
      console.error('Error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save tasks: ' + error.message
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to clear all completed tasks
  const clearCompletedTasks = () => {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
      setNotification({
        type: 'warning',
        message: 'No completed tasks to clear'
      });
      return;
    }
    
    // Filter out all completed tasks
    const remainingTasks = tasks.filter(task => !task.completed);
    setTasks(remainingTasks);
    
    // Reset to first page if removing tasks would leave current page empty
    const totalPages = Math.ceil(remainingTasks.length / tasksPerPage);
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    } else {
      // Stay on current page but make sure we're still seeing the newest tasks first
      setCurrentPage(currentPage);
    }
    
    setNotification({
      type: 'success',
      message: `Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}`
    });
  };
  
  // Test function removed

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F2' }}>
      <Head>
        <title>Todo App with Workflow Automation</title>
        <meta name="description" content="Todo list app with email notifications powered by Embed Workflow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md text-white ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="max-w-2xl mx-auto px-8 py-20">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-light text-gray-900 mb-1">
            Tasks
          </h1>
          <p className="text-gray-400 text-sm">
            Task management with email notifications
          </p>
        </div>

        {/* Tab Navigation */}
        <nav className="flex gap-2 mb-10">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-1.5 text-sm rounded-full transition-all ${
              activeTab === 'tasks'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => router.push('/workflows')}
            className="px-4 py-1.5 text-sm rounded-full transition-all text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50"
          >
            Workflows
          </button>
        </nav>

        {/* Tasks Content */}
        <>
          {/* Create Task */}
            <div className="bg-white rounded-lg p-8 mb-10 shadow-sm border border-gray-200">
              <div className="space-y-4">
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addTask()}
                  placeholder="Task name"
                  className="w-full px-0 py-2 bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-300 placeholder-gray-300 transition-colors"
                  disabled={isLoading}
                />
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Add description..."
                  rows="2"
                  className="w-full px-0 py-2 bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-300 placeholder-gray-300 resize-none transition-colors"
                  disabled={isLoading}
                />
                <input
                  type="email"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Assign to (email)"
                  className="w-full px-0 py-2 bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-300 placeholder-gray-300 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={addTask}
                  className="text-sm px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create'}
                  {!isLoading && <span style={{ color: '#FF6B6B' }}>→</span>}
                </button>
              </div>
            </div>


            {/* Tasks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-2 px-6 flex justify-between items-center border-b border-gray-100">
                <h3 className="text-sm font-medium">Your Tasks</h3>
                {tasks.length > 0 && (
                  <button
                    onClick={saveTasksToFile}
                    disabled={isSaving}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save to File'}
                  </button>
                )}
              </div>
              <div className="p-6 space-y-1">
                {tasks.length === 0 ? (
                  <div className="text-center py-16 text-gray-300">
                    <p className="text-sm">No tasks</p>
                  </div>
                ) : (
                  // Get current tasks for pagination, sorting by newest first
                  tasks
                    .slice() // Create a copy to avoid mutating the original array
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by newest first
                    .slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage)
                    .map((task, index, paginatedTasks) => (
                    <div
                      key={task.id}
                      onClick={() => !isLoading && toggleTask(task.id)}
                      className={`group flex items-start gap-3 py-3 px-3 rounded hover:bg-gray-50 transition-colors cursor-pointer ${
                        isLoading ? 'opacity-50' : ''
                      } ${
                        index !== paginatedTasks.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border mt-0.5 flex-shrink-0 flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-gray-900 border-gray-900'
                          : 'border-gray-200 group-hover:border-gray-300'
                      }`}>
                        {task.completed && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-gray-900 transition-all ${
                          task.completed ? 'line-through text-gray-300' : ''
                        }`}>
                          {task.name}
                        </h3>
                        {task.description && (
                          <p className={`text-sm text-gray-400 mt-0.5 ${
                            task.completed ? 'line-through' : ''
                          }`}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                          <span className="text-xs text-gray-300">
                            {new Date(task.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          {task.assignedTo && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full">
                              Assigned to: {task.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Pagination Controls */}
                {tasks.length > tasksPerPage && (
                  <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      &lt;
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.ceil(tasks.length / tasksPerPage) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                          currentPage === index + 1
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(tasks.length / tasksPerPage)))}
                      disabled={currentPage === Math.ceil(tasks.length / tasksPerPage)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                        currentPage === Math.ceil(tasks.length / tasksPerPage)
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Stats */}
            {tasks.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex gap-8 text-xs text-gray-300 uppercase tracking-wider">
                    <span>{tasks.filter(t => !t.completed).length} active</span>
                    <span>{tasks.filter(t => t.completed).length} done</span>
                  </div>
                  
                  {tasks.some(t => t.completed) && (
                    <button 
                      onClick={clearCompletedTasks}
                      className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Clear Completed
                    </button>
                  )}
                </div>
              </div>
            )}
        </>
      </div>
    </div>
  );
}