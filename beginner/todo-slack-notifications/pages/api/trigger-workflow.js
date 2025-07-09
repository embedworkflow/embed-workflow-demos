// API endpoint to trigger Embed Workflow
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { event, data, user_key } = req.body;
  
  if (!event || !data) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    const secretKey = process.env.EMBED_WORKFLOW_SK;
    
    if (!secretKey) {
      return res.status(500).json({ 
        message: 'Server configuration error: Missing EMBED_WORKFLOW_SK environment variable' 
      });
    }
    
    console.log(`Triggering workflow: ${event}`);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Email To field:', data.email_to);
    
    // Map the event name if needed - enables using both existing event names and the new ones
    const mappedEvent = event === 'task_created' ? 'todo_list_item_created' : 
                        event === 'task_completed' ? 'todo_list_item_completed' : 
                        event;
    
    // Verify we have a valid email address for assigned_to and email_to
    if (!data.assigned_to || !data.email_to) {
      console.log("WARNING: Missing assigned_to or email_to value", {
        assigned_to: data.assigned_to,
        email_to: data.email_to
      });
    }
    
    // Call the Embed Workflow API
    const response = await fetch('https://embedworkflow.com/api/v1/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: mappedEvent,
        execution_data: data,
        user_key: user_key || "main"
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Workflow API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Log what would happen in a real implementation
    if (event === 'task_created') {
      console.log(`Email notification sent to ${data.email_list.length} recipients for new task: ${data.task_name}`);
    } else if (event === 'task_completed') {
      console.log(`Email notification sent to ${data.email_list.length} recipients for completed task: ${data.task_name}`);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return res.status(500).json({ 
      message: 'Failed to trigger workflow', 
      error: error.message 
    });
  }
}