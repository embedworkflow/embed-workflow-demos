// Custom completion email notification API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { task, email } = req.body;
  
  if (!task || !email) {
    return res.status(400).json({ message: 'Missing task or email' });
  }
  
  try {
    console.log(`Sending custom completion email for task "${task.name}" to ${email}`);
    
    // Format the date
    const completedDate = new Date(task.completedAt || new Date()).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create email content
    const emailContent = {
      to: email,
      subject: `Task Completed: ${task.name}`,
      text: `
Hi there,

A task assigned to you has been marked as completed:

Task: ${task.name}
Description: ${task.description || 'No description provided'}
Completed: ${completedDate}
Task ID: ${task.id}

Thank you for completing this task!

Best regards,
Todo App Team
      `.trim()
    };
    
    // NOTE: In a real implementation, you would use an email service API here
    // For demonstration, we're just logging the email that would be sent
    console.log('COMPLETION EMAIL CONTENT:', JSON.stringify(emailContent, null, 2));
    
    // In a production environment, use an email service
    
    // For now, simulate email sending success
    return res.status(200).json({ 
      message: 'Completion email notification would be sent in production',
      emailContent
    });
  } catch (error) {
    console.error('Error sending custom completion email:', error);
    return res.status(500).json({ 
      message: 'Failed to send completion email notification', 
      error: error.message 
    });
  }
}