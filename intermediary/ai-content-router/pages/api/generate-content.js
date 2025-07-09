export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event, user_key, data } = req.body;

  if (!event || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!process.env.EMBED_WORKFLOW_SK) {
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    const workflowResponse = await fetch('https://embedworkflow.com/api/v1/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EMBED_WORKFLOW_SK}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: event,
        execution_data: data,
        user_key: user_key || 'main'
      })
    });


    if (!workflowResponse.ok) {
      const errorText = await workflowResponse.text();
      throw new Error(`Failed to trigger workflow: ${workflowResponse.status} - ${errorText}`);
    }

    const result = await workflowResponse.json();
    
    res.status(200).json({ 
      success: true, 
      message: 'Content generation workflow triggered successfully',
      workflowResult: result
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to trigger content generation workflow',
      details: error.message,
      stack: error.stack
    });
  }
}