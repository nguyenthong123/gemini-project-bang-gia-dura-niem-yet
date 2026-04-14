/**
 * Simple MCP Server Example for Google Apps Script Integration
 * 
 * This server provides endpoints for executing git commands
 * and file operations to help push code to GitHub.
 * 
 * HOW TO RUN:
 * 1. Install Node.js if not already installed
 * 2. Run: npm install express body-parser
 * 3. Run: node mcp_server_example.js
 * 4. The server will start on http://localhost:3000
 * 
 * Note: This is a basic example. In production, add authentication,
 * error handling, and security measures.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Basic authentication middleware (optional)
const API_KEY = process.env.MCP_API_KEY || 'your-secret-api-key-here';

function authenticate(req, res, next) {
  // Skip authentication for health check
  if (req.path === '/health' || req.path === '/') {
    return next();
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Missing Authorization header'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  if (token !== API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
}

// Apply middleware
app.use(bodyParser.json());
app.use(authenticate);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('MCP Server is running');
});

// Simple web interface for file management
app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>MCP Server - File Management</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; }
      .container { max-width: 800px; margin: 0 auto; }
      .card { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
      h1 { color: #333; }
      .endpoint { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; }
      .note { background: #fff3cd; padding: 10px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>MCP Server - File Management</h1>
      <div class="card">
        <h2>Available Endpoints</h2>
        <p><strong>GET /health</strong> - Health check</p>
        <p><strong>POST /execute</strong> - Execute commands</p>
        <p>Tools available: git_status, git_commit, git_push, write_file, read_file, write_file_local, list_directory</p>
      </div>
      <div class="card">
        <h2>API Key</h2>
        <p>Current API key: <code>${API_KEY}</code></p>
        <p class="note">Note: Set environment variable MCP_API_KEY to change the API key</p>
      </div>
      <div class="card">
        <h2>Usage Example</h2>
        <div class="endpoint">
          POST /execute<br>
          Content-Type: application/json<br>
          Authorization: Bearer ${API_KEY}<br>
          {<br>
            &nbsp;&nbsp;"tool": "list_directory",<br>
            &nbsp;&nbsp;"parameters": {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;"directory_path": "/path/to/directory"<br>
            &nbsp;&nbsp;}<br>
          }
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  res.send(html);
});

// Execute command endpoint
app.post('/execute', (req, res) => {
  const { tool, parameters } = req.body;
  
  console.log(`[${new Date().toISOString()}] Received request for tool: ${tool}`);
  
  // Log parameters but be careful with sensitive data
  const safeParams = { ...parameters };
  if (safeParams.content && typeof safeParams.content === 'string' && safeParams.content.length > 200) {
    safeParams.content = safeParams.content.substring(0, 200) + '... [truncated]';
  }
  console.log('Parameters:', safeParams);
  
  try {
    switch (tool) {
      case 'git_status':
        gitStatus(parameters, res);
        break;
      case 'git_commit':
        gitCommit(parameters, res);
        break;
      case 'git_push':
        gitPush(parameters, res);
        break;
      case 'write_file':
        writeFile(parameters, res);
        break;
      case 'read_file':
        readFile(parameters, res);
        break;
      case 'write_file_local':
        writeFileLocal(parameters, res);
        break;
      case 'list_directory':
        listDirectory(parameters, res);
        break;
      case 'create_project':
        createProject(parameters, res);
        break;
      case 'list_projects':
        listProjects(parameters, res);
        break;
      case 'get_audit_logs':
        getAuditLogs(parameters, res);
        break;
      case 'create_directory':
        createDirectory(parameters, res);
        break;
      case 'check_file_exists':
        checkFileExists(parameters, res);
        break;
      case 'clone_repository':
        cloneRepository(parameters, res);
        break;
      default:
        res.status(400).json({
          success: false,
          error: `Unknown tool: ${tool}`,
          availableTools: [
            'git_status', 'git_commit', 'git_push', 
            'write_file', 'read_file', 'write_file_local', 
            'list_directory', 'create_project', 'list_projects',
            'get_audit_logs', 'create_directory', 'check_file_exists',
            'clone_repository'
          ]
        });
    }
  } catch (error) {
    console.error(`Error processing tool ${tool}:`, error);
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`,
      tool: tool
    });
  }
});

// Git status command
function gitStatus(parameters, res) {
  const { repository_path } = parameters;
  
  if (!repository_path) {
    return res.status(400).json({
      success: false,
      error: 'repository_path is required'
    });
  }
  
  exec(`cd "${repository_path}" && git status`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        stderr: stderr
      });
    }
    
    res.json({
      success: true,
      output: stdout,
      status: 'success'
    });
  });
}

// Git commit command
function gitCommit(parameters, res) {
  const { repository_path, commit_message, file_pattern } = parameters;
  
  if (!repository_path || !commit_message) {
    return res.status(400).json({
      success: false,
      error: 'repository_path and commit_message are required'
    });
  }
  
  const pattern = file_pattern || '.';
  
  exec(`cd "${repository_path}" && git add "${pattern}" && git commit -m "${commit_message}"`, 
    (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
          stderr: stderr
        });
      }
      
      res.json({
        success: true,
        output: stdout,
        status: 'committed'
      });
    }
  );
}

// Git push command
function gitPush(parameters, res) {
  const { repository_path, remote, branch } = parameters;
  
  if (!repository_path) {
    return res.status(400).json({
      success: false,
      error: 'repository_path is required'
    });
  }
  
  const remoteName = remote || 'origin';
  const branchName = branch || 'main';
  
  exec(`cd "${repository_path}" && git push ${remoteName} ${branchName}`, 
    (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
          stderr: stderr
        });
      }
      
      res.json({
        success: true,
        output: stdout,
        status: 'pushed'
      });
    }
  );
}

// Write file command (for git repository)
function writeFile(parameters, res) {
  const { repository_path, file_path, content } = parameters;
  
  if (!repository_path || !file_path || content === undefined) {
    return res.status(400).json({
      success: false,
      error: 'repository_path, file_path, and content are required'
    });
  }
  
  const fullPath = path.join(repository_path, file_path);
  
  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(fullPath, content, 'utf8');
    res.json({
      success: true,
      message: `File written successfully: ${file_path}`,
      path: fullPath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Read file command (from local machine)
function readFile(parameters, res) {
  const { file_path } = parameters;
  
  if (!file_path) {
    return res.status(400).json({
      success: false,
      error: 'file_path is required'
    });
  }
  
  const fullPath = path.resolve(file_path);
  
  // Security check: ensure the file is within allowed directories
  // For simplicity, we'll just check if the file exists
  // In production, add more security checks
  
  try {
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: `File not found: ${fullPath}`
      });
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const stats = fs.statSync(fullPath);
    
    res.json({
      success: true,
      content: content,
      path: fullPath,
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// List directory contents
function listDirectory(parameters, res) {
  const { directory_path } = parameters;
  
  if (!directory_path) {
    return res.status(400).json({
      success: false,
      error: 'directory_path is required'
    });
  }
  
  const fullPath = path.resolve(directory_path);
  
  try {
    // Check if path exists and is a directory
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: `Directory not found: ${fullPath}`
      });
    }
    
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: `Path is not a directory: ${fullPath}`
      });
    }
    
    // Read directory contents
    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    const contents = items.map(item => {
      const itemPath = path.join(fullPath, item.name);
      const itemStats = fs.statSync(itemPath);
      
      return {
        name: item.name,
        path: itemPath,
        type: item.isDirectory() ? 'directory' : 'file',
        size: itemStats.size,
        modified: itemStats.mtime,
        created: itemStats.birthtime
      };
    });
    
    res.json({
      success: true,
      path: fullPath,
      contents: contents,
      count: contents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Write file to local machine (any location)
function writeFileLocal(parameters, res) {
  const { file_path, content } = parameters;
  
  if (!file_path || content === undefined) {
    return res.status(400).json({
      success: false,
      error: 'file_path and content are required'
    });
  }
  
  const fullPath = path.resolve(file_path);
  
  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(fullPath, content, 'utf8');
    res.json({
      success: true,
      message: `File written successfully: ${file_path}`,
      path: fullPath,
      size: content.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Create directory if not exists
function createDirectory(parameters, res) {
  const { dir_path } = parameters;
  
  if (!dir_path) {
    return res.status(400).json({
      success: false,
      error: 'dir_path is required'
    });
  }
  
  const fullPath = path.resolve(dir_path);
  
  try {
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      res.json({
        success: true,
        message: `Directory created: ${dir_path}`,
        path: fullPath
      });
    } else {
      res.json({
        success: true,
        message: `Directory already exists: ${dir_path}`,
        path: fullPath,
        existed: true
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Check if file exists on local machine
function checkFileExists(parameters, res) {
  const { file_path } = parameters;
  
  if (!file_path) {
    return res.status(400).json({
      success: false,
      error: 'file_path is required'
    });
  }
  
  const fullPath = path.resolve(file_path);
  
  try {
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      const stats = fs.statSync(fullPath);
      res.json({
        success: true,
        exists: true,
        path: fullPath,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      });
    } else {
      res.json({
        success: true,
        exists: false,
        path: fullPath,
        message: `File does not exist: ${file_path}`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Clone a GitHub repository to local machine
function cloneRepository(parameters, res) {
  const { repo_url, target_path, branch } = parameters;
  
  if (!repo_url || !target_path) {
    return res.status(400).json({
      success: false,
      error: 'repo_url and target_path are required'
    });
  }
  
  const fullTargetPath = path.resolve(target_path);
  
  // Check if target directory already exists
  if (fs.existsSync(fullTargetPath)) {
    // Check if it's a git repository
    const gitDir = path.join(fullTargetPath, '.git');
    if (fs.existsSync(gitDir)) {
      return res.status(409).json({
        success: false,
        error: `Directory already exists and contains a git repository: ${target_path}`,
        path: fullTargetPath,
        isGitRepo: true
      });
    } else {
      return res.status(409).json({
        success: false,
        error: `Directory already exists: ${target_path}`,
        path: fullTargetPath,
        isGitRepo: false
      });
    }
  }
  
  // Create parent directory if it doesn't exist
  const parentDir = path.dirname(fullTargetPath);
  if (!fs.existsSync(parentDir)) {
    try {
      fs.mkdirSync(parentDir, { recursive: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `Failed to create parent directory: ${error.message}`
      });
    }
  }
  
  // Build git clone command
  let cloneCommand = `git clone ${repo_url} "${fullTargetPath}"`;
  if (branch) {
    cloneCommand += ` --branch ${branch}`;
  }
  
  console.log(`Executing: ${cloneCommand}`);
  
  exec(cloneCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Git clone error: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      
      // Clean up target directory if it was partially created
      if (fs.existsSync(fullTargetPath)) {
        try {
          fs.rmSync(fullTargetPath, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error(`Failed to clean up directory: ${cleanupError.message}`);
        }
      }
      
      return res.status(500).json({
        success: false,
        error: `Git clone failed: ${error.message}`,
        stderr: stderr,
        stdout: stdout
      });
    }
    
    console.log(`Git clone successful: ${stdout}`);
    
    // Get repository info
    const repoInfo = {
      url: repo_url,
      path: fullTargetPath,
      branch: branch || 'default',
      clonedAt: new Date().toISOString()
    };
    
    // Try to get current branch
    exec(`cd "${fullTargetPath}" && git branch --show-current`, (branchError, branchStdout, branchStderr) => {
      if (!branchError && branchStdout) {
        repoInfo.currentBranch = branchStdout.trim();
      }
      
      // Get last commit
      exec(`cd "${fullTargetPath}" && git log -1 --oneline`, (commitError, commitStdout, commitStderr) => {
        if (!commitError && commitStdout) {
          repoInfo.lastCommit = commitStdout.trim();
        }
        
        res.json({
          success: true,
          message: `Repository cloned successfully to ${target_path}`,
          repository: repoInfo,
          stdout: stdout,
          stderr: stderr
        });
      });
    });
  });
}

// Audit log storage (in-memory for simplicity, in production use a database)
const auditLogs = [];
const projects = [];

// Helper to add audit log entry
function addAuditLog(action, tool, parameters, user, status) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    tool,
    parameters: { ...parameters },
    user: user || 'anonymous',
    status: status || 'success'
  };
  
  // Hide sensitive data in logs
  if (entry.parameters.content && typeof entry.parameters.content === 'string') {
    entry.parameters.content = '[REDACTED]';
  }
  if (entry.parameters.token) {
    entry.parameters.token = '[REDACTED]';
  }
  
  auditLogs.push(entry);
  console.log(`[AUDIT] ${entry.timestamp} ${entry.user} ${entry.action} ${entry.tool} ${entry.status}`);
  
  // Keep only last 1000 entries to prevent memory issues
  if (auditLogs.length > 1000) {
    auditLogs.shift();
  }
}

// Project management functions
function createProject(parameters, res) {
  const { name, description, path } = parameters;
  
  if (!name || !path) {
    return res.status(400).json({
      success: false,
      error: 'Project name and path are required'
    });
  }
  
  // Check if project already exists
  const existing = projects.find(p => p.name === name || p.path === path);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'Project with that name or path already exists'
    });
  }
  
  const project = {
    id: projects.length + 1,
    name,
    description: description || '',
    path,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    status: 'active'
  };
  
  projects.push(project);
  
  // Create directory if it doesn't exist
  try {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Failed to create project directory: ${error.message}`
    });
  }
  
  addAuditLog('create_project', 'project_control', parameters, 'system', 'success');
  
  res.json({
    success: true,
    project,
    message: `Project "${name}" created successfully`
  });
}

function listProjects(parameters, res) {
  const { status } = parameters || {};
  
  let filtered = projects;
  if (status) {
    filtered = projects.filter(p => p.status === status);
  }
  
  addAuditLog('list_projects', 'project_control', parameters, 'system', 'success');
  
  res.json({
    success: true,
    projects: filtered,
    count: filtered.length,
    total: projects.length
  });
}

function getAuditLogs(parameters, res) {
  const { limit = 50, user, action } = parameters || {};
  
  let filtered = [...auditLogs];
  
  if (user) {
    filtered = filtered.filter(log => log.user.includes(user));
  }
  
  if (action) {
    filtered = filtered.filter(log => log.action.includes(action));
  }
  
  // Sort by timestamp descending (newest first)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply limit
  const limited = filtered.slice(0, parseInt(limit));
  
  addAuditLog('get_audit_logs', 'audit_log', parameters, 'system', 'success');
  
  res.json({
    success: true,
    logs: limited,
    count: limited.length,
    total: auditLogs.length
  });
}

// Add audit logging to existing endpoints
function wrapWithAudit(originalFunction, actionName) {
  return function(parameters, res) {
    const user = parameters.user || 'anonymous';
    
    try {
      // Call original function
      originalFunction(parameters, res);
      
      // Capture response after it's sent (we need to wrap res.json)
      const originalJson = res.json;
      res.json = function(data) {
        const status = data.success ? 'success' : 'error';
        addAuditLog(actionName, actionName, parameters, user, status);
        return originalJson.call(this, data);
      };
    } catch (error) {
      addAuditLog(actionName, actionName, parameters, user, 'error');
      throw error;
    }
  };
}

// Wrap existing endpoints with audit logging
gitStatus = wrapWithAudit(gitStatus, 'git_status');
gitCommit = wrapWithAudit(gitCommit, 'git_commit');
gitPush = wrapWithAudit(gitPush, 'git_push');
writeFile = wrapWithAudit(writeFile, 'write_file');
readFile = wrapWithAudit(readFile, 'read_file');
writeFileLocal = wrapWithAudit(writeFileLocal, 'write_file_local');
listDirectory = wrapWithAudit(listDirectory, 'list_directory');

// Add new endpoints to the execute switch
const originalExecute = app.post.bind(app, '/execute');
// Already handled in the existing switch, we need to add cases
// We'll modify the switch directly below

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log(`  GET  /health - Health check`);
  console.log(`  POST /execute - Execute commands`);
  console.log('\nMake sure to update the repository_path in your Google Apps Script code');
  console.log('to match your local repository path.');
  console.log('\nNew features:');
  console.log('  • Audit logging for all operations');
  console.log('  • Project management (create_project, list_projects)');
  console.log('  • Audit log retrieval (get_audit_logs)');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down MCP server...');
  console.log(`Audit logs recorded: ${auditLogs.length}`);
  console.log(`Projects managed: ${projects.length}`);
  process.exit(0);
});
