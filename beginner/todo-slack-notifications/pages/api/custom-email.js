// Custom email notification API using a different service
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { task, email } = req.body;
  
  if (!task || !email) {
    return res.status(400).json({ message: 'Missing task or email' });
  }
  
  try {
    console.log(`Sending custom email notification for task "${task.name}" to ${email}`);
    
    // Format the date
    const createdDate = new Date(task.createdAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create email content
    const emailContent = {
      to: email,
      subject: `New Task Assigned: ${task.name}`,
      text: `
Hi there,

A new task has been assigned to you:

Task: ${task.name}
Description: ${task.description || 'No description provided'}
Created: ${createdDate}
Task ID: ${task.id}

Best regards,
Todo App Team
      `.trim()
    };
    
    // NOTE: In a real implementation, you would use an email service API here
    // For demonstration, we're just logging the email that would be sent
    console.log('EMAIL CONTENT:', JSON.stringify(emailContent, null, 2));
    
    // In a production environment, use an email service like SendGrid, Mailgun, etc.
    // Example using fetch to call Mailgun API:
    /*
    const response = await fetch('https://api.mailgun.net/v3/your-domain.com/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('api:YOUR_API_KEY').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        from: 'Todo App <noreply@your-domain.com>',
        to: email,
        subject: emailContent.subject,
        text: emailContent.text
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email via Mailgun');
    }
    */
    
    // For now, simulate email sending success
    return res.status(200).json({ 
      message: 'Email notification would be sent in production',
      emailContent
    });
  } catch (error) {
    console.error('Error sending custom email:', error);
    return res.status(500).json({ 
      message: 'Failed to send email notification', 
      error: error.message 
    });
  }
}