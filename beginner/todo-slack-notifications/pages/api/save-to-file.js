import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, data } = req.body;
  
  if (!type || !data) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    const baseDir = path.join(process.cwd(), 'data');
    
    // Create the data directory if it doesn't exist
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    
    let filename;
    let content;
    
    if (type === 'emails') {
      filename = 'email-list.txt';
      content = data.join('\n');
    } else if (type === 'tasks') {
      filename = 'tasks.txt';
      content = data.map(task => {
        const status = task.completed ? '[✓]' : '[ ]';
        const date = new Date(task.createdAt).toLocaleDateString();
        return `${status} ${task.name} (${date})\n${task.description ? `    ${task.description}\n` : ''}`;
      }).join('\n');
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }
    
    const filePath = path.join(baseDir, filename);
    
    // Write to file
    fs.writeFileSync(filePath, content);
    
    return res.status(200).json({ 
      message: `${type} saved successfully to ${filename}`,
      path: filePath
    });
  } catch (error) {
    console.error(`Error saving ${type} to file:`, error);
    return res.status(500).json({ 
      message: `Failed to save ${type} to file`, 
      error: error.message 
    });
  }
}