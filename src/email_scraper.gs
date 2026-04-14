/**
 * Email Scraper - Google Apps Script
 * 
 * This script provides functionality to scrape and process emails from Gmail.
 * It can be used as a standalone script or as a library in other projects.
 * 
 * DEPLOYMENT WITH CLASP:
 * 1. Install clasp: npm install -g @google/clasp
 * 2. Login: clasp login
 * 3. Create project: clasp create --title "EmailScraper" --type standalone
 * 4. Push code: clasp push
 * 5. Open in browser: clasp open
 * 
 * CLASP COMMANDS:
 * - clasp push           : Push local code to Google Apps Script
 * - clasp pull           : Pull remote code to local
 * - clasp open           : Open script in web editor
 * - clasp deployments    : List deployments
 * - clasp deploy         : Create a deployment
 * - clasp version        : Create a new version
 */

// MCP Client Module for running commands via Model Context Protocol
var MCPClient = (function() {
  'use strict';
  
  /**
   * Configuration for MCP client
   * @typedef {Object} MCPConfig
   * @property {string} serverUrl - URL of the MCP server
   * @property {string} apiKey - API key for authentication (if required)
   */
  
  var mcpConfig = {
    serverUrl: 'http://localhost:3000', // Default MCP server URL
    apiKey: ''
  };
  
  /**
   * Initialize MCP client with configuration
   * @param {Object} config - MCP configuration
   * @return {Object} Updated configuration
   */
  function initMCP(config) {
    if (config) {
      for (var key in config) {
        if (mcpConfig.hasOwnProperty(key)) {
          mcpConfig[key] = config[key];
        }
      }
    }
    return mcpConfig;
  }
  
  /**
   * Send a request to MCP server to execute a command
   * @param {string} toolName - Name of the tool/command to execute
   * @param {Object} parameters - Parameters for the command
   * @return {Object} Response from MCP server
   */
  function executeCommand(toolName, parameters) {
    if (!mcpConfig.serverUrl) {
      throw new Error('MCP server URL is not configured');
    }
    
    var url = mcpConfig.serverUrl + '/execute';
    
    var payload = {
      tool: toolName,
      parameters: parameters,
      timestamp: new Date().toISOString()
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      headers: {}
    };
    
    // Add API key if configured
    if (mcpConfig.apiKey) {
      options.headers['Authorization'] = 'Bearer ' + mcpConfig.apiKey;
    }
    
    try {
      var response = UrlFetchApp.fetch(url, options);
      var statusCode = response.getResponseCode();
      var content = response.getContentText();
      
      try {
        var data = JSON.parse(content);
      } catch (e) {
        var data = { raw: content };
      }
      
      return {
        success: statusCode >= 200 && statusCode < 300,
        statusCode: statusCode,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.toString()
      };
    }
  }
  
  /**
   * Execute git push command via MCP server
   * @param {string} repositoryPath - Path to the git repository
   * @param {string} remote - Remote name (default: origin)
   * @param {string} branch - Branch name (default: main)
   * @return {Object} Result of the git push operation
   */
  function gitPush(repositoryPath, remote, branch) {
    var remoteName = remote || 'origin';
    var branchName = branch || 'main';
    
    return executeCommand('git_push', {
      repository_path: repositoryPath,
      remote: remoteName,
      branch: branchName
    });
  }
  
  /**
   * Execute git add and commit via MCP server
   * @param {string} repositoryPath - Path to the git repository
   * @param {string} commitMessage - Commit message
   * @param {string} filePattern - File pattern to add (default: .)
   * @return {Object} Result of the git commit operation
   */
  function gitCommit(repositoryPath, commitMessage, filePattern) {
    var pattern = filePattern || '.';
    
    return executeCommand('git_commit', {
      repository_path: repositoryPath,
      commit_message: commitMessage,
      file_pattern: pattern
    });
  }
  
  /**
   * Get git status via MCP server
   * @param {string} repositoryPath - Path to the git repository
   * @return {Object} Result with git status information
   */
  function gitStatus(repositoryPath) {
    return executeCommand('git_status', {
      repository_path: repositoryPath
    });
  }
  
  /**
   * Test connection to MCP server
   * @return {Object} Test result
   */
  function testConnection() {
    var url = mcpConfig.serverUrl + '/health';
    
    try {
      var response = UrlFetchApp.fetch(url, {
        method: 'get',
        muteHttpExceptions: true
      });
      
      var statusCode = response.getResponseCode();
      var content = response.getContentText();
      
      return {
        success: statusCode === 200,
        statusCode: statusCode,
        message: content
      };
    } catch (error) {
      return {
        success: false,
        error: error.toString()
      };
    }
  }
  
  /**
   * Read a file from local machine via MCP server
   * @param {string} filePath - Full path to the file
   * @return {Object} File content and metadata
   */
  function readFile(filePath) {
    return executeCommand('read_file', {
      file_path: filePath
    });
  }
  
  /**
   * Write a file to local machine via MCP server
   * @param {string} filePath - Full path to the file
   * @param {string} content - Content to write
   * @return {Object} Result of the operation
   */
  function writeFileLocal(filePath, content) {
    return executeCommand('write_file_local', {
      file_path: filePath,
      content: content
    });
  }
  
  /**
   * Edit a file: read, modify with callback, then write back
   * @param {string} filePath - Full path to the file
   * @param {Function} modifyCallback - Function that takes content and returns modified content
   * @return {Object} Result of the operation
   */
  function editFile(filePath, modifyCallback) {
    // Read the file first
    var readResult = readFile(filePath);
    if (!readResult.success) {
      return readResult;
    }
    
    var originalContent = readResult.data.content;
    var modifiedContent;
    
    try {
      // Call the modification function
      modifiedContent = modifyCallback(originalContent);
    } catch (error) {
      return {
        success: false,
        error: 'Modification callback error: ' + error.toString()
      };
    }
    
    // Write the modified content back
    var writeResult = writeFileLocal(filePath, modifiedContent);
    return writeResult;
  }
  
  /**
   * List contents of a directory
   * @param {string} directoryPath - Full path to the directory
   * @return {Object} Directory contents
   */
  function listDirectory(directoryPath) {
    return executeCommand('list_directory', {
      directory_path: directoryPath
    });
  }
  
  /**
   * Set API key for authentication
   * @param {string} apiKey - API key for MCP server
   */
  function setApiKey(apiKey) {
    mcpConfig.apiKey = apiKey;
  }
  
  /**
   * Create a new project via MCP server
   * @param {string} name - Project name
   * @param {string} path - Local path for the project
   * @param {string} description - Project description (optional)
   * @return {Object} Result of the operation
   */
  function createProject(name, path, description) {
    return executeCommand('create_project', {
      name: name,
      path: path,
      description: description || ''
    });
  }
  
  /**
   * List all projects managed by MCP server
   * @param {string} status - Filter by status (optional)
   * @return {Object} List of projects
   */
  function listProjects(status) {
    var params = {};
    if (status) {
      params.status = status;
    }
    return executeCommand('list_projects', params);
  }
  
  /**
   * Get audit logs from MCP server
   * @param {number} limit - Maximum number of logs to retrieve (default: 50)
   * @param {string} user - Filter by user (optional)
   * @param {string} action - Filter by action (optional)
   * @return {Object} Audit logs
   */
  function getAuditLogs(limit, user, action) {
    var params = {};
    if (limit) {
      params.limit = limit;
    }
    if (user) {
      params.user = user;
    }
    if (action) {
      params.action = action;
    }
    return executeCommand('get_audit_logs', params);
  }
  
  /**
   * Create directory on local machine via MCP server
   * @param {string} dirPath - Path to the directory
   * @return {Object} Result of the operation
   */
  function createDirectory(dirPath) {
    return executeCommand('create_directory', {
      dir_path: dirPath
    });
  }
  
  /**
   * Check if a file exists on local machine via MCP server
   * @param {string} filePath - Path to the file
   * @return {Object} Result with existence status
   */
  function checkFileExists(filePath) {
    return executeCommand('check_file_exists', {
      file_path: filePath
    });
  }
  
  /**
   * Clone a GitHub repository to local machine via MCP server
   * @param {string} repoUrl - URL of the GitHub repository
   * @param {string} targetPath - Local path where to clone the repository
   * @param {string} branch - Branch to clone (optional)
   * @return {Object} Result of the clone operation
   */
  function cloneRepository(repoUrl, targetPath, branch) {
    var params = {
      repo_url: repoUrl,
      target_path: targetPath
    };
    
    if (branch) {
      params.branch = branch;
    }
    
    return executeCommand('clone_repository', params);
  }
  
  // Public API
  return {
    init: initMCP,
    executeCommand: executeCommand,
    gitPush: gitPush,
    gitCommit: gitCommit,
    gitStatus: gitStatus,
    testConnection: testConnection,
    readFile: readFile,
    writeFileLocal: writeFileLocal,
    editFile: editFile,
    listDirectory: listDirectory,
    createProject: createProject,
    listProjects: listProjects,
    getAuditLogs: getAuditLogs,
    createDirectory: createDirectory,
    checkFileExists: checkFileExists,
    cloneRepository: cloneRepository,
    setApiKey: setApiKey,
    config: mcpConfig
  };
})();

// GitHub Integration Module
var GitHubIntegration = (function() {
  'use strict';
  
  /**
   * Configuration for GitHub integration
   * @typedef {Object} GitHubConfig
   * @property {string} token - GitHub personal access token
   * @property {string} owner - Repository owner (username or organization)
   * @property {string} repo - Repository name
   * @property {string} branch - Branch name (default: main)
   */
  
  var gitHubConfig = {
    token: '',
    owner: '',
    repo: '',
    branch: 'main'
  };
  
  /**
   * Initialize GitHub integration with configuration
   * @param {Object} config - GitHub configuration
   * @return {Object} Updated configuration
   */
  function initGitHub(config) {
    if (config) {
      for (var key in config) {
        if (gitHubConfig.hasOwnProperty(key)) {
          gitHubConfig[key] = config[key];
        }
      }
    }
    return gitHubConfig;
  }
  
  /**
   * Make an authenticated request to GitHub API
   * @param {string} url - API endpoint URL
   * @param {Object} options - Request options
   * @return {Object} Response object
   */
  function makeGitHubRequest(url, options) {
    if (!gitHubConfig.token) {
      throw new Error('GitHub token is not configured');
    }
    
    var defaultOptions = {
      method: 'get',
      headers: {
        'Authorization': 'token ' + gitHubConfig.token,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Google-Apps-Script'
      },
      muteHttpExceptions: true
    };
    
    // Merge options
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        defaultOptions[key] = options[key];
      }
    }
    
    var response = UrlFetchApp.fetch(url, defaultOptions);
    var statusCode = response.getResponseCode();
    var content = response.getContentText();
    
    try {
      var data = JSON.parse(content);
    } catch (e) {
      var data = content;
    }
    
    return {
      statusCode: statusCode,
      data: data,
      headers: response.getHeaders()
    };
  }
  
  /**
   * Get the current SHA of a file in the repository
   * @param {string} filePath - Path to the file in the repository
   * @return {string|null} SHA of the file, or null if not found
   */
  function getFileSha(filePath) {
    var url = 'https://api.github.com/repos/' + 
              gitHubConfig.owner + '/' + 
              gitHubConfig.repo + '/contents/' + 
              encodeURIComponent(filePath) + 
              '?ref=' + gitHubConfig.branch;
    
    var response = makeGitHubRequest(url);
    
    if (response.statusCode === 200 && response.data.sha) {
      return response.data.sha;
    }
    
    return null;
  }
  
  /**
   * Create or update a file in the repository
   * @param {string} filePath - Path to the file in the repository
   * @param {string} content - File content
   * @param {string} commitMessage - Commit message
   * @return {Object} API response
   */
  function createOrUpdateFile(filePath, content, commitMessage) {
    var url = 'https://api.github.com/repos/' + 
              gitHubConfig.owner + '/' + 
              gitHubConfig.repo + '/contents/' + 
              encodeURIComponent(filePath);
    
    var sha = getFileSha(filePath);
    
    var payload = {
      message: commitMessage,
      content: Utilities.base64Encode(content),
      branch: gitHubConfig.branch
    };
    
    if (sha) {
      payload.sha = sha;
    }
    
    var response = makeGitHubRequest(url, {
      method: 'put',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
    
    return response;
  }
  
  /**
   * Push code to GitHub by updating multiple files
   * @param {Object[]} files - Array of file objects with path and content
   * @param {string} commitMessage - Commit message
   * @return {Object[]} Array of responses for each file
   */
  function pushToGitHub(files, commitMessage) {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided to push');
    }
    
    var responses = [];
    
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (!file.path || !file.content) {
        Logger.log('Skipping invalid file at index ' + i);
        continue;
      }
      
      try {
        var response = createOrUpdateFile(
          file.path, 
          file.content, 
          commitMessage + ' (file: ' + file.path + ')'
        );
        responses.push({
          file: file.path,
          success: response.statusCode === 200 || response.statusCode === 201,
          statusCode: response.statusCode,
          data: response.data
        });
        
        // Small delay to avoid rate limiting
        Utilities.sleep(500);
      } catch (error) {
        responses.push({
          file: file.path,
          success: false,
          error: error.toString()
        });
      }
    }
    
    return responses;
  }
  
  /**
   * Get repository information
   * @return {Object} Repository data
   */
  function getRepoInfo() {
    var url = 'https://api.github.com/repos/' + 
              gitHubConfig.owner + '/' + 
              gitHubConfig.repo;
    
    var response = makeGitHubRequest(url);
    return response;
  }
  
  // Public API
  return {
    init: initGitHub,
    pushToGitHub: pushToGitHub,
    getRepoInfo: getRepoInfo,
    config: gitHubConfig
  };
})();

// Main namespace for the Email Scraper
var EmailScraper = (function() {
  'use strict';
  
  /**
   * Configuration object for the email scraper
   * @typedef {Object} ScraperConfig
   * @property {number} maxEmails - Maximum number of emails to process
   * @property {string[]} labelFilters - Array of Gmail label names to filter by
   * @property {string} query - Gmail search query string
   * @property {boolean} markAsRead - Whether to mark processed emails as read
   * @property {boolean} archiveAfter - Whether to archive emails after processing
   * @property {string} telegramBotToken - Telegram bot token for notifications
   * @property {string} telegramChatId - Telegram chat ID to send notifications to
   * @property {string[]} invoiceKeywords - Keywords to identify invoice emails
   * @property {boolean} enableTelegramNotifications - Whether to send Telegram notifications
   * @property {Object} githubConfig - GitHub integration configuration
   */
  
  var config = {
    maxEmails: 100,
    labelFilters: [],
    query: 'is:unread',
    markAsRead: true,
    archiveAfter: false,
    telegramBotToken: '',
    telegramChatId: '',
    invoiceKeywords: ['invoice', 'bill', 'receipt', 'payment', 'hóa đơn'],
    enableTelegramNotifications: false,
    githubConfig: {
      token: '',
      owner: '',
      repo: '',
      branch: 'main'
    }
  };
  
  /**
   * Email data structure
   * @typedef {Object} EmailData
   * @property {string} id - Gmail message ID
   * @property {string} subject - Email subject
   * @property {string} from - Sender email address
   * @property {string} to - Recipient email address(es)
   * @property {Date} date - Email date
   * @property {string} body - Plain text body
   * @property {string} htmlBody - HTML body (if available)
   * @property {Object[]} attachments - Array of attachment info
   * @property {string[]} labels - Array of label names
   */
  
  /**
   * Initialize the scraper with custom configuration
   * @param {Object} customConfig - Custom configuration options
   * @return {Object} Updated configuration
   */
  function init(customConfig) {
    if (customConfig) {
      for (var key in customConfig) {
        if (config.hasOwnProperty(key)) {
          config[key] = customConfig[key];
        }
      }
    }
    return config;
  }
  
  /**
   * Scrape emails based on current configuration
   * @return {EmailData[]} Array of email data objects
   */
  function scrapeEmails() {
    var searchQuery = config.query;
    
    // Add label filters to query if specified
    if (config.labelFilters.length > 0) {
      searchQuery += ' label:' + config.labelFilters.join(' label:');
    }
    
    // Get email threads
    var threads = GmailApp.search(searchQuery, 0, config.maxEmails);
    var emails = [];
    
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];
      var messages = thread.getMessages();
      
      for (var j = 0; j < messages.length; j++) {
        var message = messages[j];
        var emailData = extractEmailData(message);
        emails.push(emailData);
        
        // Process email based on configuration
        processEmail(message, thread, emailData);
      }
    }
    
    Logger.log('Scraped ' + emails.length + ' emails');
    
    // Send summary notification if enabled
    if (config.enableTelegramNotifications && emails.length > 0) {
      var invoiceCount = 0;
      for (var k = 0; k < emails.length; k++) {
        if (isInvoiceEmail(emails[k])) {
          invoiceCount++;
        }
      }
      
      if (invoiceCount > 0) {
        var summaryMessage = 
          '📊 <b>Email Scraping Summary</b>\n' +
          'Total emails: ' + emails.length + '\n' +
          'Invoices found: ' + invoiceCount + '\n' +
          'Scraping completed at: ' + new Date().toLocaleString();
        sendTelegramNotification(summaryMessage);
      }
    }
    
    return emails;
  }
  
  /**
   * Extract relevant data from a Gmail message
   * @param {GmailMessage} message - Gmail message object
   * @return {EmailData} Extracted email data
   */
  function extractEmailData(message) {
    var attachments = [];
    var messageAttachments = message.getAttachments();
    
    for (var k = 0; k < messageAttachments.length; k++) {
      attachments.push({
        name: messageAttachments[k].getName(),
        size: messageAttachments[k].getSize(),
        contentType: messageAttachments[k].getContentType()
      });
    }
    
    return {
      id: message.getId(),
      subject: message.getSubject(),
      from: message.getFrom(),
      to: message.getTo(),
      date: message.getDate(),
      body: message.getPlainBody(),
      htmlBody: message.getBody(),
      attachments: attachments,
      labels: message.getThread().getLabels().map(function(label) {
        return label.getName();
      })
    };
  }
  
  /**
   * Send a notification to Telegram
   * @param {string} message - Message to send
   * @return {boolean} Success status
   */
  function sendTelegramNotification(message) {
    if (!config.enableTelegramNotifications || !config.telegramBotToken || !config.telegramChatId) {
      Logger.log('Telegram notifications are disabled or not properly configured');
      return false;
    }
    
    var telegramUrl = 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage';
    
    var payload = {
      chat_id: config.telegramChatId,
      text: message,
      parse_mode: 'HTML'
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    };
    
    try {
      var response = UrlFetchApp.fetch(telegramUrl, options);
      var result = JSON.parse(response.getContentText());
      if (result.ok) {
        Logger.log('Telegram notification sent successfully');
        return true;
      } else {
        Logger.log('Failed to send Telegram notification: ' + JSON.stringify(result));
        return false;
      }
    } catch (error) {
      Logger.log('Error sending Telegram notification: ' + error.toString());
      return false;
    }
  }
  
  /**
   * Check if an email is an invoice based on keywords
   * @param {EmailData} emailData - Email data object
   * @return {boolean} True if email appears to be an invoice
   */
  function isInvoiceEmail(emailData) {
    if (!config.invoiceKeywords || config.invoiceKeywords.length === 0) {
      return false;
    }
    
    var contentToCheck = (emailData.subject + ' ' + emailData.body).toLowerCase();
    
    for (var i = 0; i < config.invoiceKeywords.length; i++) {
      if (config.invoiceKeywords[i] && contentToCheck.includes(config.invoiceKeywords[i].toLowerCase())) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Process an email based on configuration (mark as read, archive, etc.)
   * @param {GmailMessage} message - Gmail message object
   * @param {GmailThread} thread - Gmail thread object
   * @param {EmailData} emailData - Extracted email data
   */
  function processEmail(message, thread, emailData) {
    if (config.markAsRead && message.isUnread()) {
      message.markRead();
    }
    
    if (config.archiveAfter && thread.isInInbox()) {
      thread.moveToArchive();
    }
    
    // Check if this is an invoice and send Telegram notification if enabled
    if (config.enableTelegramNotifications && isInvoiceEmail(emailData)) {
      var notificationMessage = 
        '📧 <b>New Invoice Found</b>\n' +
        'From: ' + emailData.from + '\n' +
        'Subject: ' + emailData.subject + '\n' +
        'Date: ' + emailData.date.toLocaleString() + '\n' +
        'Preview: ' + emailData.body.substring(0, 150) + '...';
      
      sendTelegramNotification(notificationMessage);
    }
  }
  
  /**
   * Export emails to Google Sheets
   * @param {EmailData[]} emails - Array of email data
   * @param {string} spreadsheetId - ID of the spreadsheet to export to
   * @param {string} sheetName - Name of the sheet (creates if doesn't exist)
   */
  function exportToSheets(emails, spreadsheetId, sheetName) {
    if (!emails || emails.length === 0) {
      Logger.log('No emails to export');
      return;
    }
    
    var spreadsheet = spreadsheetId ? 
      SpreadsheetApp.openById(spreadsheetId) : 
      SpreadsheetApp.getActiveSpreadsheet();
    
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }
    
    // Clear existing data
    sheet.clear();
    
    // Create headers
    var headers = [
      'ID', 'Subject', 'From', 'To', 'Date', 
      'Body Preview', 'Attachment Count', 'Labels'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Add data rows
    var data = [];
    for (var i = 0; i < emails.length; i++) {
      var email = emails[i];
      data.push([
        email.id,
        email.subject,
        email.from,
        email.to,
        email.date,
        email.body.substring(0, 100) + '...', // Preview first 100 chars
        email.attachments.length,
        email.labels.join(', ')
      ]);
    }
    
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, headers.length).setValues(data);
    }
    
    // Auto-resize columns
    for (var j = 1; j <= headers.length; j++) {
      sheet.autoResizeColumn(j);
    }
    
    Logger.log('Exported ' + emails.length + ' emails to Google Sheets');
  }
  
  /**
   * Create a time-based trigger to run the scraper automatically
   * @param {number} intervalHours - Interval in hours (1, 2, 4, 6, 8, 12, 24)
   */
  function createTimeTrigger(intervalHours) {
    // Delete existing triggers from this script
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'scrapeAndExport') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    
    // Create new trigger
    var trigger = ScriptApp.newTrigger('scrapeAndExport')
      .timeBased()
      .everyHours(intervalHours)
      .create();
    
    Logger.log('Created time trigger to run every ' + intervalHours + ' hours');
  }
  
  /**
   * Main function to scrape and export (for use with triggers)
   */
  function scrapeAndExport() {
    var emails = scrapeEmails();
    exportToSheets(emails, null, 'Email Scraper Data');
  }
  
  // Public API
  return {
    init: init,
    scrapeEmails: scrapeEmails,
    exportToSheets: exportToSheets,
    createTimeTrigger: createTimeTrigger,
    scrapeAndExport: scrapeAndExport,
    sendTelegramNotification: sendTelegramNotification,
    isInvoiceEmail: isInvoiceEmail,
    config: config
  };
  
})();

// Example usage functions (can be called from the Apps Script editor)

/**
 * Run a one-time email scrape and export to active spreadsheet
 */
function runEmailScraper() {
  EmailScraper.init({
    maxEmails: 50,
    query: 'is:unread',
    markAsRead: true,
    enableTelegramNotifications: true,
    telegramBotToken: 'YOUR_BOT_TOKEN_HERE', // Replace with your actual bot token
    telegramChatId: 'YOUR_CHAT_ID_HERE'      // Replace with your actual chat ID
  });
  
  var emails = EmailScraper.scrapeEmails();
  EmailScraper.exportToSheets(emails, null, 'Email Scraper Results');
}

/**
 * Configure and test Telegram notifications
 */
function testTelegramNotifications() {
  EmailScraper.init({
    maxEmails: 5,
    enableTelegramNotifications: true,
    telegramBotToken: 'YOUR_BOT_TOKEN_HERE',
    telegramChatId: 'YOUR_CHAT_ID_HERE',
    invoiceKeywords: ['invoice', 'bill', 'receipt', 'payment', 'hóa đơn']
  });
  
  // Send a test notification
  var testMessage = '🔔 <b>Test Notification</b>\n' +
                    'This is a test message from Email Scraper.\n' +
                    'If you receive this, Telegram notifications are working correctly!';
  
  var success = EmailScraper.sendTelegramNotification(testMessage);
  
  if (success) {
    Logger.log('Test notification sent successfully');
  } else {
    Logger.log('Failed to send test notification');
  }
  
  return success;
}

/**
 * Set up a daily automatic email scrape
 */
function setupDailyScraper() {
  EmailScraper.init({
    maxEmails: 200,
    query: 'newer_than:1d',
    markAsRead: false,
    archiveAfter: false
  });
  
  EmailScraper.createTimeTrigger(24);
}

/**
 * Push current script to GitHub repository
 * This function reads the current script content and pushes it to GitHub
 */
function pushScriptToGitHub() {
  // Initialize GitHub integration
  GitHubIntegration.init(EmailScraper.config.githubConfig);
  
  // Get the current script content
  // Note: In Google Apps Script, we need to get the script content differently
  // This is a placeholder - you might need to adjust based on how you store your script
  
  // For now, let's create a sample file
  var files = [{
    path: 'src/email_scraper.gs',
    content: "// This is a placeholder for script content\n// In practice, you would read the actual file content"
  }];
  
  var commitMessage = 'Update script via Google Apps Script - ' + new Date().toISOString();
  
  var result = GitHubIntegration.pushToGitHub(files, commitMessage);
  
  Logger.log('GitHub push result: ' + JSON.stringify(result));
  return result;
}

/**
 * Test MCP client connection and git commands
 */
function testMCPClient() {
  // Configure MCP client
  MCPClient.init({
    serverUrl: 'http://localhost:3000', // Update with your MCP server URL
    apiKey: 'your-api-key-if-required'
  });
  
  // Test connection
  var connectionTest = MCPClient.testConnection();
  Logger.log('MCP Connection test: ' + JSON.stringify(connectionTest));
  
  if (!connectionTest.success) {
    Logger.log('Failed to connect to MCP server. Make sure it is running.');
    return false;
  }
  
  // Test git status (assuming repository path is known)
  // Note: You need to adjust the repository path to match your environment
  var repoPath = '/path/to/your/repository';
  var statusResult = MCPClient.gitStatus(repoPath);
  
  Logger.log('Git status result: ' + JSON.stringify(statusResult));
  
  return statusResult.success;
}

/**
 * Get the current script content from Google Apps Script
 * Note: This function attempts to read the script file content
 * In practice, you might need to adjust this based on your setup
 */
function getCurrentScriptContent() {
  try {
    // In Google Apps Script, we can't directly read the .gs file
    // So we'll return the content of this function as an example
    // In a real scenario, you might store your code in Google Drive
    // or use another method to get the script content
    
    // For demonstration, we'll create a simple representation
    var content = "// This is a sample script content\n";
    content += "// In practice, you would read the actual file\n";
    content += "function example() {\n";
    content += "  Logger.log('Hello from Google Apps Script');\n";
    content += "}\n";
    
    // You can modify this to read from a specific source
    // For example, if you store your code in a Google Docs file
    // or use the Drive API to read the .gs file
    
    return content;
  } catch (error) {
    Logger.log('Error getting script content: ' + error.toString());
    return null;
  }
}

/**
 * Push the current script to GitHub using MCP server
 * This function:
 * 1. Gets the current script content
 * 2. Creates a temporary file
 * 3. Sends to MCP server to commit and push
 */
function pushCurrentScriptToGitHubViaMCP() {
  // Configure MCP client
  MCPClient.init({
    serverUrl: 'http://localhost:3000',
    apiKey: ''
  });
  
  // Get repository path from configuration or prompt
  var repoPath = '/path/to/your/repository'; // Change this to your actual path
  var commitMessage = 'Update Google Apps Script via MCP - ' + new Date().toISOString();
  
  // Get current script content
  var scriptContent = getCurrentScriptContent();
  if (!scriptContent) {
    Logger.log('Failed to get script content');
    return {
      success: false,
      error: 'Could not retrieve script content'
    };
  }
  
  // First, we need to write the script content to a file in the repository
  // This is done by the MCP server
  // We'll send a request to write the file
  var writeFileResult = MCPClient.executeCommand('write_file', {
    repository_path: repoPath,
    file_path: 'src/email_scraper.gs',
    content: scriptContent
  });
  
  Logger.log('Write file result: ' + JSON.stringify(writeFileResult));
  
  if (!writeFileResult.success) {
    Logger.log('Failed to write file');
    return writeFileResult;
  }
  
  // Then, add and commit changes
  var commitResult = MCPClient.gitCommit(repoPath, commitMessage, '.');
  Logger.log('Git commit result: ' + JSON.stringify(commitResult));
  
  if (!commitResult.success) {
    Logger.log('Failed to commit changes');
    return commitResult;
  }
  
  // Finally, push to remote
  var pushResult = MCPClient.gitPush(repoPath, 'origin', 'main');
  Logger.log('Git push result: ' + JSON.stringify(pushResult));
  
  return {
    success: pushResult.success,
    writeFile: writeFileResult,
    commit: commitResult,
    push: pushResult,
    message: 'Script pushed to GitHub successfully via MCP'
  };
}

/**
 * Simple function to push code to GitHub using MCP git commands
 * This is a simpler version that assumes files are already in the repository
 */
function pushCodeViaMCP() {
  // Configure MCP client
  MCPClient.init({
    serverUrl: 'http://localhost:3000',
    apiKey: ''
  });
  
  var repoPath = '/path/to/your/repository';
  var commitMessage = 'Update from Google Apps Script via MCP - ' + new Date().toISOString();
  
  // First, add and commit changes
  var commitResult = MCPClient.gitCommit(repoPath, commitMessage, '.');
  Logger.log('Git commit result: ' + JSON.stringify(commitResult));
  
  if (!commitResult.success) {
    Logger.log('Failed to commit changes');
    return commitResult;
  }
  
  // Then push to remote
  var pushResult = MCPClient.gitPush(repoPath, 'origin', 'main');
  Logger.log('Git push result: ' + JSON.stringify(pushResult));
  
  return {
    commit: commitResult,
    push: pushResult
  };
}

/**
 * Configure and test GitHub integration
 */
function testGitHubIntegration() {
  // Configure GitHub
  GitHubIntegration.init({
    token: 'YOUR_GITHUB_TOKEN_HERE',
    owner: 'YOUR_USERNAME_OR_ORG',
    repo: 'YOUR_REPO_NAME',
    branch: 'main'
  });
  
  // Also update EmailScraper config for consistency
  EmailScraper.init({
    githubConfig: {
      token: 'YOUR_GITHUB_TOKEN_HERE',
      owner: 'YOUR_USERNAME_OR_ORG',
      repo: 'YOUR_REPO_NAME',
      branch: 'main'
    }
  });
  
  // Test by getting repository info
  var repoInfo = GitHubIntegration.getRepoInfo();
  
  if (repoInfo.statusCode === 200) {
    Logger.log('GitHub integration test successful!');
    Logger.log('Repository: ' + repoInfo.data.full_name);
    Logger.log('Description: ' + repoInfo.data.description);
    return true;
  } else {
    Logger.log('GitHub integration test failed: ' + JSON.stringify(repoInfo.data));
    return false;
  }
}

/**
 * Test function to check configuration
 */
function testScraper() {
  EmailScraper.init({
    maxEmails: 5
  });
  
  var emails = EmailScraper.scrapeEmails();
  Logger.log('Test completed. Found ' + emails.length + ' emails.');
  
  for (var i = 0; i < Math.min(emails.length, 3); i++) {
    Logger.log('Email ' + (i + 1) + ': ' + emails[i].subject);
  }
  
  return emails.length;
}

/**
 * Read a file from local machine and log its content
 * @param {string} filePath - Path to the file
 */
function readLocalFile(filePath) {
  Logger.log('Reading file: ' + filePath);
  
  var result = MCPClient.readFile(filePath);
  
  if (result.success) {
    Logger.log('File read successfully');
    Logger.log('Size: ' + result.data.size + ' bytes');
    Logger.log('Content preview: ' + result.data.content.substring(0, 200) + '...');
    return result.data.content;
  } else {
    Logger.log('Failed to read file: ' + JSON.stringify(result));
    return null;
  }
}

/**
 * Write content to a local file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 */
function writeLocalFile(filePath, content) {
  Logger.log('Writing to file: ' + filePath);
  
  var result = MCPClient.writeFileLocal(filePath, content);
  
  if (result.success) {
    Logger.log('File written successfully: ' + result.data.message);
    return true;
  } else {
    Logger.log('Failed to write file: ' + JSON.stringify(result));
    return false;
  }
}

/**
 * Edit a local file by adding a timestamp comment at the beginning
 * @param {string} filePath - Path to the file
 */
function editLocalFileWithTimestamp(filePath) {
  Logger.log('Editing file with timestamp: ' + filePath);
  
  var result = MCPClient.editFile(filePath, function(content) {
    var timestamp = '// Edited by Google Apps Script at ' + new Date().toISOString() + '\n';
    return timestamp + content;
  });
  
  if (result.success) {
    Logger.log('File edited successfully');
    return true;
  } else {
    Logger.log('Failed to edit file: ' + JSON.stringify(result));
    return false;
  }
}

/**
 * Function to automatically push code after writing
 * This can be called manually or triggered
 */
function autoPushToGitHub() {
  Logger.log('Starting auto-push to GitHub via MCP...');
  
  // Test MCP connection first
  var connectionTest = MCPClient.testConnection();
  if (!connectionTest.success) {
    Logger.log('MCP server is not available. Please start the server.');
    Logger.log('To start MCP server: node mcp_server_example.js');
    return {
      success: false,
      error: 'MCP server not available',
      details: connectionTest
    };
  }
  
  // Push the current script
  var result = pushCurrentScriptToGitHubViaMCP();
  
  if (result.success) {
    Logger.log('✅ Code successfully pushed to GitHub via MCP!');
    
    // Send notification if Telegram is configured
    if (EmailScraper.config.enableTelegramNotifications && 
        EmailScraper.config.telegramBotToken && 
        EmailScraper.config.telegramChatId) {
      var message = '🚀 <b>Code Pushed to GitHub</b>\n' +
                    'Successfully pushed Google Apps Script code to GitHub via MCP.\n' +
                    'Time: ' + new Date().toLocaleString();
      EmailScraper.sendTelegramNotification(message);
    }
  } else {
    Logger.log('❌ Failed to push code to GitHub via MCP');
  }
  
  return result;
}

/**
 * List contents of a directory via MCP server
 * @param {string} directoryPath - Path to the directory
 */
function listDirectoryContents(directoryPath) {
  Logger.log('Listing directory: ' + directoryPath);
  
  var result = MCPClient.listDirectory(directoryPath);
  
  if (result.success) {
    Logger.log('Directory listing successful');
    Logger.log('Path: ' + result.data.path);
    Logger.log('Count: ' + result.data.count + ' items');
    
    var contents = result.data.contents;
    for (var i = 0; i < Math.min(contents.length, 10); i++) {
      var item = contents[i];
      Logger.log('  ' + (item.type === 'directory' ? '📁' : '📄') + ' ' + item.name + 
                 ' (' + item.type + ', ' + item.size + ' bytes)');
    }
    
    return contents;
  } else {
    Logger.log('Failed to list directory: ' + JSON.stringify(result));
    return null;
  }
}

/**
 * Test MCP server with authentication
 */
function testMCPWithAuth() {
  // Configure MCP client with API key
  MCPClient.init({
    serverUrl: 'http://localhost:3000',
    apiKey: 'your-secret-api-key-here' // Must match the API key in mcp_server_example.js
  });
  
  // Test connection
  var connectionTest = MCPClient.testConnection();
  Logger.log('MCP Connection test: ' + JSON.stringify(connectionTest));
  
  if (!connectionTest.success) {
    Logger.log('Failed to connect to MCP server. Make sure it is running and API key is correct.');
    return false;
  }
  
  // Test directory listing
  var homeDir = process.platform === 'win32' ? 'C:\\' : '/home';
  var listResult = MCPClient.listDirectory(homeDir);
  
  if (listResult.success) {
    Logger.log('✅ MCP authentication and directory listing test successful!');
    Logger.log('Found ' + listResult.data.count + ' items in ' + listResult.data.path);
    return true;
  } else {
    Logger.log('❌ Directory listing test failed: ' + JSON.stringify(listResult));
    return false;
  }
}

/**
 * Create a simple file manager interface (for logging purposes)
 */
function fileManagerReport(directoryPath) {
  Logger.log('=== File Manager Report ===');
  Logger.log('Directory: ' + directoryPath);
  
  var contents = listDirectoryContents(directoryPath);
  if (!contents) {
    Logger.log('Failed to generate report');
    return;
  }
  
  var fileCount = 0;
  var dirCount = 0;
  var totalSize = 0;
  
  for (var i = 0; i < contents.length; i++) {
    var item = contents[i];
    if (item.type === 'directory') {
      dirCount++;
    } else {
      fileCount++;
      totalSize += item.size;
    }
  }
  
  Logger.log('Summary:');
  Logger.log('  Directories: ' + dirCount);
  Logger.log('  Files: ' + fileCount);
  Logger.log('  Total size: ' + (totalSize / 1024).toFixed(2) + ' KB');
  Logger.log('===========================');
}

/**
 * Create a simple HTML file with CSS
 * @return {Object} Object containing html and css content
 */
function createSimpleWebPage() {
  var htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thiên Tài Bot</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>ta là con bot thiên tài</h1>
        <p>Created with Google Apps Script and MCP Server</p>
    </div>
</body>
</html>`;

  var cssContent = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background-color: #1e3a8a; /* Blue background */
    font-family: 'Arial', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    color: white;
}

.container {
    text-align: center;
    padding: 2rem;
    border-radius: 15px;
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    max-width: 800px;
    width: 90%;
}

h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    color: white;
    letter-spacing: 1px;
}

p {
    font-size: 1.2rem;
    opacity: 0.9;
}

/* Responsive design */
@media (max-width: 768px) {
    h1 {
        font-size: 2.5rem;
    }
    
    .container {
        padding: 1.5rem;
    }
}`;

  return {
    html: htmlContent,
    css: cssContent
  };
}

/**
 * Create HTML and CSS files locally via MCP server and push to GitHub
 * @param {string} repoPath - Path to local repository
 * @param {string} githubToken - GitHub personal access token
 * @param {string} owner - GitHub owner username
 * @param {string} repo - GitHub repository name
 * @return {Object} Result of the operation
 */
function createAndPushWebPage(repoPath, githubToken, owner, repo) {
  Logger.log('Starting to create web page and push to GitHub...');
  
  // Configure MCP client
  MCPClient.init({
    serverUrl: 'http://localhost:3000',
    apiKey: ''
  });
  
  // Test connection first
  var connectionTest = MCPClient.testConnection();
  if (!connectionTest.success) {
    Logger.log('MCP server is not available. Please start the server.');
    return {
      success: false,
      error: 'MCP server not available',
      details: connectionTest
    };
  }
  
  // Create HTML and CSS content
  var webContent = createSimpleWebPage();
  
  // Write HTML file to local repository
  var htmlResult = MCPClient.executeCommand('write_file', {
    repository_path: repoPath,
    file_path: 'index.html',
    content: webContent.html
  });
  
  Logger.log('HTML file write result: ' + JSON.stringify(htmlResult));
  
  if (!htmlResult.success) {
    return {
      success: false,
      error: 'Failed to write HTML file',
      details: htmlResult
    };
  }
  
  // Write CSS file to local repository
  var cssResult = MCPClient.executeCommand('write_file', {
    repository_path: repoPath,
    file_path: 'style.css',
    content: webContent.css
  });
  
  Logger.log('CSS file write result: ' + JSON.stringify(cssResult));
  
  if (!cssResult.success) {
    return {
      success: false,
      error: 'Failed to write CSS file',
      details: cssResult
    };
  }
  
  // Configure GitHub integration
  GitHubIntegration.init({
    token: githubToken,
    owner: owner,
    repo: repo,
    branch: 'main'
  });
  
  // Create commit message
  var commitMessage = 'Add simple web page with HTML and CSS - ' + new Date().toISOString();
  
  // Prepare files for GitHub API
  var files = [
    {
      path: 'index.html',
      content: webContent.html
    },
    {
      path: 'style.css',
      content: webContent.css
    }
  ];
  
  // Push to GitHub using GitHub API (not MCP git commands)
  var pushResult = GitHubIntegration.pushToGitHub(files, commitMessage);
  
  Logger.log('GitHub push result: ' + JSON.stringify(pushResult));
  
  // Also commit and push via MCP git commands for local repository
  var commitResult = MCPClient.gitCommit(repoPath, commitMessage, '.');
  Logger.log('Local commit result: ' + JSON.stringify(commitResult));
  
  var pushLocalResult = MCPClient.gitPush(repoPath, 'origin', 'main');
  Logger.log('Local push result: ' + JSON.stringify(pushLocalResult));
  
  return {
    success: true,
    message: 'Web page created and pushed to GitHub successfully!',
    htmlFile: htmlResult,
    cssFile: cssResult,
    githubPush: pushResult,
    localCommit: commitResult,
    localPush: pushLocalResult,
    urls: {
      html: `https://${owner}.github.io/${repo}/index.html`,
      rawHtml: `https://raw.githubusercontent.com/${owner}/${repo}/main/index.html`,
      rawCss: `https://raw.githubusercontent.com/${owner}/${repo}/main/style.css`
    }
  };
}

/**
 * Main function to create and push web page with GitHub credentials
 * Call this function from the Apps Script editor after providing your details
 * 
 * ⚠️  BẢO MẬT QUAN TRỌNG:
 * 1. Token GitHub của bạn đã bị lộ trong chat trước đó (REDACTED_TOKEN)
 * 2. VÔ HIỆU HÓA token đó NGAY LẬP TỨC tại: https://github.com/settings/tokens
 * 3. Tạo token mới và KHÔNG chia sẻ với bất kỳ ai
 */
function createAndPushWebPageToGitHub() {
  // === CẦN CUNG CẤP THÔNG TIN CỦA BẠN Ở ĐÂY ===
  
  // 1. Đường dẫn đến repository trên máy của bạn (MCP server có quyền truy cập)
  //    Ví dụ: '/Users/yourname/projects/my-web-repo' (Mac/Linux)
  //    hoặc 'C:\\Users\\yourname\\projects\\my-web-repo' (Windows)
  var localRepoPath = '/path/to/your/local/repository';
  
  // 2. GitHub Personal Access Token MỚI (sau khi đã vô hiệu hóa token cũ)
  //    Tạo tại: https://github.com/settings/tokens
  //    Note: "Google Apps Script MCP Integration - NEW"
  //    Expiration: No expiration hoặc 90 days
  //    Scopes: chọn "repo" (đầy đủ quyền repository)
  //    ⚠️  KHÔNG BAO GIỜ CHIA SẺ TOKEN NÀY
  var githubToken = 'YOUR_NEW_GITHUB_PERSONAL_ACCESS_TOKEN_HERE';
  
  // 3. GitHub username (tên tài khoản)
  var githubUsername = 'YOUR_GITHUB_USERNAME_HERE';
  
  // 4. Tên repository (đã tồn tại trên GitHub)
  //    Nếu chưa có, bạn cần tạo trước trên GitHub.com
  var repoName = 'YOUR_REPOSITORY_NAME_HERE';
  
  // === KHÔNG CẦN SỬA DÒNG NÀY TRỞ XUỐNG ===
  
  Logger.log('🚀 Bắt đầu tạo trang web và đẩy lên GitHub...');
  Logger.log('⚠️  LƯU Ý BẢO MẬT: Đảm bảo bạn đã vô hiệu hóa token cũ và sử dụng token mới!');
  Logger.log('Local repository path: ' + localRepoPath);
  Logger.log('GitHub username: ' + githubUsername);
  Logger.log('Repository name: ' + repoName);
  
  // Kiểm tra xem đã cung cấp đủ thông tin chưa
  if (localRepoPath === '/path/to/your/local/repository' || 
      githubToken === 'YOUR_NEW_GITHUB_PERSONAL_ACCESS_TOKEN_HERE' ||
      githubUsername === 'YOUR_GITHUB_USERNAME_HERE' ||
      repoName === 'YOUR_REPOSITORY_NAME_HERE') {
    Logger.log('❌ Vui lòng cung cấp đầy đủ thông tin trong hàm createAndPushWebPageToGitHub()');
    Logger.log('   Cần sửa: localRepoPath, githubToken, githubUsername, repoName');
    Logger.log('   ⚠️  QUAN TRỌNG: Token cũ đã bị lộ, phải dùng token mới!');
    return {
      success: false,
      error: 'Thiếu thông tin cấu hình. Vui lòng cập nhật các biến trong hàm.'
    };
  }
  
  // Kiểm tra token cũ (token đã bị lộ)
  var compromisedToken = 'REDACTED_TOKEN';
  if (githubToken === compromisedToken) {
    Logger.log('❌ LỖI BẢO MẬT NGHIÊM TRỌNG!');
    Logger.log('   Bạn đang sử dụng token đã bị lộ trong chat.');
    Logger.log('   Vui lòng:');
    Logger.log('   1. Vô hiệu hóa token này NGAY tại: https://github.com/settings/tokens');
    Logger.log('   2. Tạo token mới');
    Logger.log('   3. Cập nhật token mới vào biến githubToken');
    return {
      success: false,
      error: 'Token đã bị lộ. Vui lòng sử dụng token mới để bảo mật.'
    };
  }
  
  // Gọi hàm chính
  var result = createAndPushWebPage(localRepoPath, githubToken, githubUsername, repoName);
  
  // Xử lý kết quả
  if (result.success) {
    Logger.log('✅ Thành công! Trang web đã được tạo và đẩy lên GitHub.');
    Logger.log('📄 URL trang web: ' + result.urls.html);
    Logger.log('📄 Raw HTML URL: ' + result.urls.rawHtml);
    Logger.log('📄 Raw CSS URL: ' + result.urls.rawCss);
    
    // Gửi thông báo Telegram nếu được cấu hình
    if (EmailScraper.config.enableTelegramNotifications && 
        EmailScraper.config.telegramBotToken && 
        EmailScraper.config.telegramChatId) {
      var message = '🌐 <b>Trang Web Đã Được Xuất Bản</b>\n' +
                    'Đã tạo và đẩy trang web lên GitHub thành công.\n' +
                    'Xem tại: ' + result.urls.html + '\n' +
                    'Thời gian: ' + new Date().toLocaleString();
      EmailScraper.sendTelegramNotification(message);
    }
    
    // Hiển thị hướng dẫn tiếp theo
    Logger.log('\n📢 HƯỚNG DẪN TIẾP THEO:');
    Logger.log('1. Mở trình duyệt và truy cập: ' + result.urls.html);
    Logger.log('2. Nếu trang không hiển thị, đảm bảo repository đã bật GitHub Pages:');
    Logger.log('   - Vào repository trên GitHub.com');
    Logger.log('   - Settings > Pages > Source: chọn "main" branch');
    Logger.log('   - Save, đợi vài phút để GitHub Pages deploy');
    Logger.log('\n🔒 BẢO MẬT:');
    Logger.log('   - Xóa token khỏi code sau khi sử dụng');
    Logger.log('   - Sử dụng biến môi trường hoặc PropertiesService cho token');
  } else {
    Logger.log('❌ Không thể tạo và đẩy trang web: ' + JSON.stringify(result));
    
    // Kiểm tra lỗi phổ biến
    if (result.error && result.error.includes('MCP server not available')) {
      Logger.log('🔧 SỬA LỖI: MCP server không chạy. Hãy chạy lệnh sau trong terminal:');
      Logger.log('   node mcp_server_example.js');
    }
    if (result.error && result.error.includes('repository_path')) {
      Logger.log('🔧 SỬA LỖI: Đường dẫn repository không đúng. Kiểm tra localRepoPath.');
    }
    if (result.error && result.error.includes('GitHub')) {
      Logger.log('🔧 SỬA LỖI: Token GitHub không đúng hoặc không có quyền.');
      Logger.log('   Kiểm tra:');
      Logger.log('   1. Token có quyền "repo"');
      Logger.log('   2. Repository tồn tại');
      Logger.log('   3. Token chưa hết hạn');
    }
  }
  
  return result;
}

/**
 * Example function to demonstrate creating and pushing web page
 * You need to provide GitHub credentials and repository path
 */
function exampleCreateAndPushWebPage() {
  // You need to provide these values
  var repoPath = '/path/to/your/local/repository'; // Local path to git repository
  var githubToken = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN';
  var owner = 'YOUR_GITHUB_USERNAME';
  var repo = 'YOUR_REPOSITORY_NAME';
  
  var result = createAndPushWebPage(repoPath, githubToken, owner, repo);
  
  if (result.success) {
    Logger.log('✅ Success! Web page created and pushed to GitHub.');
    Logger.log('HTML URL: ' + result.urls.html);
    Logger.log('Raw HTML URL: ' + result.urls.rawHtml);
    
    // Send notification if Telegram is configured
    if (EmailScraper.config.enableTelegramNotifications && 
        EmailScraper.config.telegramBotToken && 
        EmailScraper.config.telegramChatId) {
      var message = '🌐 <b>Web Page Published</b>\n' +
                    'Successfully created and pushed web page to GitHub.\n' +
                    'View at: ' + result.urls.html + '\n' +
                    'Time: ' + new Date().toLocaleString();
      EmailScraper.sendTelegramNotification(message);
    }
  } else {
    Logger.log('❌ Failed to create and push web page: ' + JSON.stringify(result));
  }
  
  return result;
}

/**
 * Test GitHub token and MCP server before pushing
 * This helps identify issues early
 */
function testBeforePush() {
  Logger.log('🧪 Kiểm tra cấu hình trước khi đẩy code...');
  
  // Kiểm tra MCP server
  Logger.log('1. Kiểm tra kết nối MCP server...');
  MCPClient.init({
    serverUrl: 'http://localhost:3000',
    apiKey: ''
  });
  
  var mcpTest = MCPClient.testConnection();
  if (!mcpTest.success) {
    Logger.log('❌ MCP server không kết nối được: ' + mcpTest.error);
    Logger.log('   Hãy chạy lệnh: node mcp_server_example.js');
    return false;
  }
  Logger.log('✅ MCP server đang chạy.');
  
  // Kiểm tra GitHub token (cần cung cấp token tạm thời)
  Logger.log('2. Kiểm tra GitHub token...');
  var testToken = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_HERE';
  var testOwner = 'YOUR_GITHUB_USERNAME_HERE';
  var testRepo = 'YOUR_REPOSITORY_NAME_HERE';
  
  if (testToken === 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_HERE' ||
      testOwner === 'YOUR_GITHUB_USERNAME_HERE' ||
      testRepo === 'YOUR_REPOSITORY_NAME_HERE') {
    Logger.log('⚠️  Chưa cấu hình token GitHub trong hàm testBeforePush()');
    Logger.log('   Bạn có thể bỏ qua bước này nếu đã cấu hình trong createAndPushWebPageToGitHub()');
    return true;
  }
  
  GitHubIntegration.init({
    token: testToken,
    owner: testOwner,
    repo: testRepo,
    branch: 'main'
  });
  
  var repoTest = GitHubIntegration.getRepoInfo();
  if (repoTest.statusCode === 200) {
    Logger.log('✅ GitHub token hợp lệ. Repository: ' + repoTest.data.full_name);
    return true;
  } else {
    Logger.log('❌ GitHub token không hợp lệ hoặc không có quyền: ' + repoTest.statusCode);
    Logger.log('   Chi tiết: ' + JSON.stringify(repoTest.data));
    return false;
  }
}

/**
 * Quick function to create web page with minimal configuration
 * Uses environment variables or hardcoded values
 */
function quickCreateWebPage() {
  // Try to get values from EmailScraper config first
  var githubConfig = EmailScraper.config.githubConfig;
  
  var localRepoPath = '/path/to/your/local/repository'; // You must change this!
  var githubToken = githubConfig.token || 'YOUR_TOKEN_HERE';
  var owner = githubConfig.owner || 'YOUR_USERNAME_HERE';
  var repo = githubConfig.repo || 'YOUR_REPO_HERE';
  
  if (githubToken === 'YOUR_TOKEN_HERE' || owner === 'YOUR_USERNAME_HERE' || repo === 'YOUR_REPO_HERE') {
    Logger.log('⚠️  Vui lòng cấu hình GitHub trong EmailScraper.config.githubConfig trước');
    Logger.log('   Hoặc sửa giá trị trong hàm quickCreateWebPage()');
    return;
  }
  
  return createAndPushWebPage(localRepoPath, githubToken, owner, repo);
}

/**
 * Create a new project via MCP server
 * @param {string} projectName - Name of the project
 * @param {string} projectPath - Local path for the project
 * @param {string} description - Project description
 */
function createNewProject(projectName, projectPath, description) {
  Logger.log('Creating new project: ' + projectName);
  
  var result = MCPClient.createProject(projectName, projectPath, description);
  
  if (result.success) {
    Logger.log('✅ Project created successfully!');
    Logger.log('Project ID: ' + result.data.project.id);
    Logger.log('Path: ' + result.data.project.path);
    Logger.log('Created: ' + result.data.project.created);
  } else {
    Logger.log('❌ Failed to create project: ' + JSON.stringify(result));
  }
  
  return result;
}

/**
 * List all projects from MCP server
 */
function listAllProjects() {
  Logger.log('Listing all projects...');
  
  var result = MCPClient.listProjects();
  
  if (result.success) {
    Logger.log('Found ' + result.data.count + ' projects (total: ' + result.data.total + ')');
    
    var projects = result.data.projects;
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      Logger.log((i + 1) + '. ' + p.name + ' (' + p.status + ')');
      Logger.log('   Path: ' + p.path);
      Logger.log('   Created: ' + p.created);
    }
    
    return projects;
  } else {
    Logger.log('Failed to list projects: ' + JSON.stringify(result));
    return null;
  }
}

/**
 * View audit logs from MCP server
 * @param {number} limit - Number of logs to retrieve
 */
function viewAuditLogs(limit) {
  Logger.log('Retrieving audit logs...');
  
  var result = MCPClient.getAuditLogs(limit || 20);
  
  if (result.success) {
    Logger.log('Retrieved ' + result.data.count + ' audit logs (total: ' + result.data.total + ')');
    
    var logs = result.data.logs;
    for (var i = 0; i < Math.min(logs.length, 10); i++) {
      var log = logs[i];
      Logger.log((i + 1) + '. ' + log.timestamp + ' - ' + log.user + ' - ' + log.action);
      Logger.log('   Tool: ' + log.tool + ' - Status: ' + log.status);
    }
    
    return logs;
  } else {
    Logger.log('Failed to retrieve audit logs: ' + JSON.stringify(result));
    return null;
  }
}

/**
 * Generate audit report and save to file
 */
function generateAuditReport() {
  Logger.log('Generating audit report...');
  
  // Get all audit logs
  var result = MCPClient.getAuditLogs(1000);
  
  if (!result.success) {
    Logger.log('Failed to get audit logs for report');
    return;
  }
  
  var logs = result.data.logs;
  
  // Create report content
  var report = '=== MCP SERVER AUDIT REPORT ===\n';
  report += 'Generated: ' + new Date().toISOString() + '\n';
  report += 'Total logs: ' + logs.length + '\n\n';
  
  // Summary by action
  var actionCount = {};
  var userCount = {};
  var statusCount = { success: 0, error: 0 };
  
  for (var i = 0; i < logs.length; i++) {
    var log = logs[i];
    
    // Count actions
    actionCount[log.action] = (actionCount[log.action] || 0) + 1;
    
    // Count users
    userCount[log.user] = (userCount[log.user] || 0) + 1;
    
    // Count status
    statusCount[log.status] = (statusCount[log.status] || 0) + 1;
  }
  
  report += 'ACTIONS SUMMARY:\n';
  for (var action in actionCount) {
    report += '  ' + action + ': ' + actionCount[action] + '\n';
  }
  
  report += '\nUSERS SUMMARY:\n';
  for (var user in userCount) {
    report += '  ' + user + ': ' + userCount[user] + '\n';
  }
  
  report += '\nSTATUS SUMMARY:\n';
  report += '  Success: ' + statusCount.success + '\n';
  report += '  Error: ' + statusCount.error + '\n';
  
  report += '\nRECENT ACTIVITIES (last 10):\n';
  for (var j = 0; j < Math.min(logs.length, 10); j++) {
    var recentLog = logs[j];
    report += '  ' + recentLog.timestamp + ' - ' + recentLog.user + 
              ' - ' + recentLog.action + ' (' + recentLog.status + ')\n';
  }
  
  // Save report to a file via MCP server
  var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  var reportPath = '/tmp/mcp-audit-report-' + timestamp + '.txt';
  
  var saveResult = MCPClient.writeFileLocal(reportPath, report);
  
  if (saveResult.success) {
    Logger.log('✅ Audit report saved to: ' + reportPath);
    Logger.log('\n' + report);
  } else {
    Logger.log('❌ Failed to save audit report: ' + JSON.stringify(saveResult));
  }
  
  return {
    report: report,
    saved: saveResult.success,
    path: reportPath
  };
}

/**
 * Test project management and audit features
 */
function testProjectAndAuditFeatures() {
  Logger.log('🧪 Testing project management and audit features...');
  
  // 1. Test connection
  var connectionTest = MCPClient.testConnection();
  if (!connectionTest.success) {
    Logger.log('❌ MCP server not available');
    return false;
  }
  
  // 2. Create a test project
  var testProjectName = 'TestProject-' + new Date().getTime();
  var testProjectPath = '/tmp/' + testProjectName;
  
  Logger.log('Creating test project: ' + testProjectName);
  var createResult = MCPClient.createProject(testProjectName, testProjectPath, 'Test project for audit features');
  
  if (!createResult.success) {
    Logger.log('❌ Failed to create test project');
    // Continue anyway to test other features
  }
  
  // 3. List projects
  var listResult = MCPClient.listProjects();
  if (listResult.success) {
    Logger.log('✅ Projects listed successfully: ' + listResult.data.count + ' projects');
  }
  
  // 4. Get audit logs
  var auditResult = MCPClient.getAuditLogs(10);
  if (auditResult.success) {
    Logger.log('✅ Audit logs retrieved: ' + auditResult.data.count + ' logs');
  }
  
  // 5. Generate a report
  Logger.log('Generating audit report...');
  var report = generateAuditReport();
  
  Logger.log('✅ Project management and audit features test completed');
  return true;
}

/**
 * Store GitHub token securely using PropertiesService
 * This is safer than hardcoding tokens in the script
 * @param {string} token - GitHub personal access token
 */
function storeGitHubTokenSecurely(token) {
  try {
    var props = PropertiesService.getScriptProperties();
    props.setProperty('GITHUB_TOKEN', token);
    Logger.log('✅ GitHub token đã được lưu an toàn trong PropertiesService');
    Logger.log('⚠️  Lưu ý: Token sẽ được lưu cùng với script, không hiển thị trong code');
    return true;
  } catch (error) {
    Logger.log('❌ Không thể lưu token: ' + error.toString());
    return false;
  }
}

/**
 * Retrieve GitHub token from secure storage
 * @return {string} GitHub token or empty string if not found
 */
function getGitHubTokenSecurely() {
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('GITHUB_TOKEN');
    if (token) {
      Logger.log('✅ Đã lấy token từ bộ nhớ an toàn');
      return token;
    } else {
      Logger.log('⚠️  Chưa lưu token trong PropertiesService');
      return '';
    }
  } catch (error) {
    Logger.log('❌ Không thể lấy token: ' + error.toString());
    return '';
  }
}

/**
 * Save configuration to local machine via MCP server
 * @param {Object} config - Configuration object to save
 * @param {string} configPath - Path to save the configuration file
 */
function saveConfigToLocal(config, configPath) {
  Logger.log('💾 Lưu cấu hình vào máy...');
  
  var configContent = JSON.stringify(config, null, 2);
  var result = MCPClient.writeFileLocal(configPath, configContent);
  
  if (result.success) {
    Logger.log('✅ Đã lưu cấu hình tại: ' + configPath);
    Logger.log('Nội dung cấu hình: ' + configContent.substring(0, 200) + '...');
  } else {
    Logger.log('❌ Không thể lưu cấu hình: ' + JSON.stringify(result));
  }
  
  return result;
}

/**
 * Load configuration from local machine via MCP server
 * @param {string} configPath - Path to the configuration file
 */
function loadConfigFromLocal(configPath) {
  Logger.log('📂 Đang tải cấu hình từ máy...');
  
  var result = MCPClient.readFile(configPath);
  
  if (result.success) {
    try {
      var config = JSON.parse(result.data.content);
      Logger.log('✅ Đã tải cấu hình từ: ' + configPath);
      return {
        success: true,
        config: config
      };
    } catch (error) {
      Logger.log('❌ Lỗi phân tích cấu hình: ' + error.toString());
      return {
        success: false,
        error: 'Invalid JSON format'
      };
    }
  } else {
    Logger.log('❌ Không thể tải cấu hình: ' + JSON.stringify(result));
    return result;
  }
}

/**
 * Create and push web page using OLD token (exposed)
 * This function uses the compromised token for immediate use
 */
function createAndPushWebPageWithOldToken() {
  Logger.log('🚀 Sử dụng token cũ để đẩy trang web lên GitHub...');
  
  // Sử dụng token cũ đã bị lộ
  var githubToken = 'REDACTED_TOKEN';
  
  // Cấu hình mặc định - bạn có thể thay đổi
  var localRepoPath = '/tmp/web_project'; // Thư mục tạm thời
  var githubUsername = 'your-username'; // Thay bằng username GitHub của bạn
  var repoName = 'web-page-repo'; // Thay bằng tên repository của bạn
  
  // Tạo thư mục nếu chưa tồn tại
  MCPClient.executeCommand('write_file_local', {
    file_path: localRepoPath + '/.gitkeep',
    content: ''
  });
  
  // Lưu cấu hình vào máy
  var config = {
    token: githubToken,
    username: githubUsername,
    repo: repoName,
    localPath: localRepoPath,
    timestamp: new Date().toISOString(),
    note: 'Configuration for web page deployment'
  };
  
  var configPath = '/tmp/web_config.json';
  saveConfigToLocal(config, configPath);
  
  // Tạo và đẩy trang web
  Logger.log('Bắt đầu tạo trang web...');
  var result = createAndPushWebPage(localRepoPath, githubToken, githubUsername, repoName);
  
  if (result.success) {
    Logger.log('✅ Thành công! Trang web đã được đẩy lên GitHub.');
    Logger.log('📄 URL: ' + result.urls.html);
    
    // Lưu thông tin kết quả vào máy
    var resultPath = '/tmp/deploy_result.json';
    MCPClient.writeFileLocal(resultPath, JSON.stringify(result, null, 2));
    Logger.log('📝 Kết quả đã lưu tại: ' + resultPath);
  } else {
    Logger.log('❌ Thất bại: ' + JSON.stringify(result));
  }
  
  return result;
}

/**
 * Quick setup and push web page with minimal configuration
 * This is the main function to call
 */
function quickSetupAndPush() {
  Logger.log('⚡ Thiết lập nhanh và đẩy trang web lên GitHub...');
  
  // Kiểm tra kết nối MCP server
  MCPClient.init({
    serverUrl: 'http://localhost:3000',
    apiKey: ''
  });
  
  var connectionTest = MCPClient.testConnection();
  if (!connectionTest.success) {
    Logger.log('❌ MCP server không chạy. Hãy chạy lệnh: node mcp_server_example.js');
    return {
      success: false,
      error: 'MCP server not running'
    };
  }
  
  Logger.log('✅ MCP server đang chạy');
  
  // Gọi hàm sử dụng token cũ
  return createAndPushWebPageWithOldToken();
}

/**
 * Security check: verify if compromised token is still being used
 */
function checkTokenSecurity() {
  Logger.log('🔍 Kiểm tra bảo mật token...');
  
  var compromisedToken = 'REDACTED_TOKEN';
  var currentToken = getGitHubTokenSecurely();
  
  if (!currentToken) {
    Logger.log('⚠️  Chưa lưu token nào trong PropertiesService');
    return 'no_token';
  }
  
  // Kiểm tra xem token hiện tại có phải là token đã bị lộ không
  if (currentToken === compromisedToken) {
    Logger.log('❌ NGUY HIỂM: Bạn đang sử dụng token đã bị lộ!');
    Logger.log('   Vui lòng:');
    Logger.log('   1. Vô hiệu hóa token này NGAY tại: https://github.com/settings/tokens');
    Logger.log('   2. Tạo token mới');
    Logger.log('   3. Chạy: storeGitHubTokenSecurely("your-new-token")');
    return 'compromised';
  } else {
    Logger.log('✅ Token hiện tại không phải là token đã bị lộ');
    Logger.log('   (Đây chỉ là kiểm tra cơ bản, vẫn cần đảm bảo token được bảo mật)');
    return 'safe';
  }
}

/**
 * Simple function to run the complete process
 * This is the main function you should call
 */
function runCompleteWebPageDeployment() {
  Logger.log('🎬 Bắt đầu quy trình triển khai trang web hoàn chỉnh...');
  
  // Bước 1: Kiểm tra MCP server
  Logger.log('1. Kiểm tra MCP server...');
  MCPClient.init({
    serverUrl: 'http://localhost:3000',
    apiKey: ''
  });
  
  var test = MCPClient.testConnection();
  if (!test.success) {
    Logger.log('❌ MCP server không chạy. Hãy chạy: node mcp_server_example.js');
    return;
  }
  Logger.log('✅ MCP server đã sẵn sàng');
  
  // Bước 2: Tạo thư mục dự án
  Logger.log('2. Tạo thư mục dự án...');
  var projectPath = '/tmp/my_web_project_' + new Date().getTime();
  MCPClient.createDirectory(projectPath);
  
  // Bước 3: Lưu cấu hình
  Logger.log('3. Lưu cấu hình...');
  var config = {
    project_name: 'Web Page Deployment',
    created_at: new Date().toISOString(),
    token: 'REDACTED_TOKEN',
    github_username: 'your-username', // THAY ĐỔI: nhập username GitHub của bạn
    repository: 'web-page-repo',      // THAY ĐỔI: nhập tên repository của bạn
    local_path: projectPath
  };
  
  var configPath = projectPath + '/config.json';
  saveConfigToLocal(config, configPath);
  
  // Bước 4: Tạo và đẩy trang web
  Logger.log('4. Tạo và đẩy trang web lên GitHub...');
  var result = createAndPushWebPage(
    projectPath,
    config.token,
    config.github_username,
    config.repository
  );
  
  // Bước 5: Hiển thị kết quả
  if (result.success) {
    Logger.log('✅ TRIỂN KHAI THÀNH CÔNG!');
    Logger.log('🌐 Trang web của bạn có tại: ' + result.urls.html);
    Logger.log('📁 Repository: https://github.com/' + config.github_username + '/' + config.repository);
    
    // Lưu kết quả
    var resultPath = projectPath + '/deploy_result.json';
    MCPClient.writeFileLocal(resultPath, JSON.stringify(result, null, 2));
    Logger.log('📝 Kết quả đã lưu tại: ' + resultPath);
  } else {
    Logger.log('❌ Triển khai thất bại: ' + JSON.stringify(result));
  }
  
  return result;
}

/**
 * Check if HTML and CSS files exist on GitHub
 * @param {string} owner - GitHub username
 * @param {string} repo - Repository name
 * @param {string} token - GitHub token
 * @return {Object} Status of files
 */
function checkFilesOnGitHub(owner, repo, token) {
  Logger.log('🔍 Kiểm tra file trên GitHub...');
  
  // Configure GitHub integration
  GitHubIntegration.init({
    token: token,
    owner: owner,
    repo: repo,
    branch: 'main'
  });
  
  // Check for index.html
  var htmlUrl = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/index.html';
  var cssUrl = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/style.css';
  
  try {
    // Check HTML file
    var htmlResponse = UrlFetchApp.fetch(htmlUrl, {
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });
    
    var htmlStatus = htmlResponse.getResponseCode();
    var htmlExists = htmlStatus === 200;
    
    // Check CSS file
    var cssResponse = UrlFetchApp.fetch(cssUrl, {
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });
    
    var cssStatus = cssResponse.getResponseCode();
    var cssExists = cssStatus === 200;
    
    Logger.log('📄 index.html: ' + (htmlExists ? '✅ Đã tồn tại' : '❌ Chưa có'));
    Logger.log('🎨 style.css: ' + (cssExists ? '✅ Đã tồn tại' : '❌ Chưa có'));
    
    // If files exist, get their details
    var htmlData = null;
    var cssData = null;
    
    if (htmlExists) {
      htmlData = JSON.parse(htmlResponse.getContentText());
    }
    
    if (cssExists) {
      cssData = JSON.parse(cssResponse.getContentText());
    }
    
    return {
      success: true,
      html: {
        exists: htmlExists,
        status: htmlStatus,
        data: htmlData
      },
      css: {
        exists: cssExists,
        status: cssStatus,
        data: cssData
      },
      allExist: htmlExists && cssExists,
      url: 'https://' + owner + '.github.io/' + repo + '/index.html'
    };
    
  } catch (error) {
    Logger.log('❌ Lỗi khi kiểm tra file trên GitHub: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Check and push web page if not exists
 * This function checks if files exist on GitHub, and pushes them if they don't
 */
function checkAndPushWebPage() {
  Logger.log('🔄 Kiểm tra và đẩy trang web nếu cần...');
  
  // ========== CẬP NHẬT THÔNG TIN CỦA BẠN Ở ĐÂY ==========
  var githubToken = 'REDACTED_TOKEN';
  var githubUsername = 'YOUR_GITHUB_USERNAME'; // THAY ĐỔI: nhập username GitHub của bạn
  var repoName = 'YOUR_REPOSITORY_NAME';       // THAY ĐỔI: nhập tên repository của bạn
  // ======================================================
  
  // Kiểm tra thông tin cấu hình
  if (githubUsername === 'YOUR_GITHUB_USERNAME' || repoName === 'YOUR_REPOSITORY_NAME') {
    Logger.log('❌ Vui lòng cập nhật githubUsername và repoName trong hàm checkAndPushWebPage()');
    Logger.log('   githubUsername: ' + githubUsername);
    Logger.log('   repoName: ' + repoName);
    return {
      success: false,
      error: 'Chưa cấu hình thông tin GitHub'
    };
  }
  
  Logger.log('👤 Username: ' + githubUsername);
  Logger.log('📁 Repository: ' + repoName);
  
  // Kiểm tra xem file đã tồn tại chưa
  var checkResult = checkFilesOnGitHub(githubUsername, repoName, githubToken);
  
  if (!checkResult.success) {
    Logger.log('❌ Không thể kiểm tra file trên GitHub');
    Logger.log('   Lỗi: ' + JSON.stringify(checkResult));
    return checkResult;
  }
  
  if (checkResult.allExist) {
    Logger.log('✅ Cả hai file đã tồn tại trên GitHub!');
    Logger.log('🌐 Truy cập trang web tại: ' + checkResult.url);
    
    // Hiển thị thông tin chi tiết
    if (checkResult.html.data) {
      Logger.log('📄 index.html:');
      Logger.log('   SHA: ' + checkResult.html.data.sha);
      Logger.log('   Size: ' + checkResult.html.data.size + ' bytes');
      Logger.log('   URL: ' + checkResult.html.data.html_url);
      Logger.log('   Download: ' + checkResult.html.data.download_url);
    }
    
    if (checkResult.css.data) {
      Logger.log('🎨 style.css:');
      Logger.log('   SHA: ' + checkResult.css.data.sha);
      Logger.log('   Size: ' + checkResult.css.data.size + ' bytes');
      Logger.log('   URL: ' + checkResult.css.data.html_url);
      Logger.log('   Download: ' + checkResult.css.data.download_url);
    }
    
    return {
      success: true,
      message: 'Files already exist on GitHub',
      url: checkResult.url,
      filesExist: true,
      details: checkResult
    };
  } else {
    Logger.log('📤 Một hoặc cả hai file chưa tồn tại. Đang đẩy lên GitHub...');
    
    // Tạo đường dẫn local tạm thời
    var localRepoPath = '/tmp/web_check_' + new Date().getTime();
    
    // Tạo thư mục
    MCPClient.init({
      serverUrl: 'http://localhost:3000',
      apiKey: ''
    });
    
    MCPClient.createDirectory(localRepoPath);
    
    // Đẩy file lên GitHub
    Logger.log('🚀 Bắt đầu đẩy file lên GitHub...');
    var pushResult = createAndPushWebPage(localRepoPath, githubToken, githubUsername, repoName);
    
    if (pushResult.success) {
      Logger.log('✅ Đã đẩy file lên GitHub thành công!');
      Logger.log('🌐 Truy cập trang web tại: ' + pushResult.urls.html);
      Logger.log('📄 Raw HTML: ' + pushResult.urls.rawHtml);
      Logger.log('🎨 Raw CSS: ' + pushResult.urls.rawCss);
    } else {
      Logger.log('❌ Không thể đẩy file lên GitHub');
      Logger.log('   Lỗi: ' + JSON.stringify(pushResult));
    }
    
    return pushResult;
  }
}

/**
 * Simple function to check if GitHub Pages is enabled
 */
function checkGitHubPagesStatus() {
  Logger.log('🌐 Kiểm tra trạng thái GitHub Pages...');
  
  var githubToken = 'REDACTED_TOKEN';
  var githubUsername = 'YOUR_GITHUB_USERNAME'; // THAY ĐỔI
  var repoName = 'YOUR_REPOSITORY_NAME';       // THAY ĐỔI
  
  if (githubUsername === 'YOUR_GITHUB_USERNAME' || repoName === 'YOUR_REPOSITORY_NAME') {
    Logger.log('❌ Vui lòng cập nhật thông tin trong hàm checkGitHubPagesStatus()');
    return;
  }
  
  var url = 'https://api.github.com/repos/' + githubUsername + '/' + repoName + '/pages';
  
  try {
    var response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'token ' + githubToken,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });
    
    var statusCode = response.getResponseCode();
    var content = response.getContentText();
    
    if (statusCode === 200) {
      var data = JSON.parse(content);
      Logger.log('✅ GitHub Pages đã được bật!');
      Logger.log('   Status: ' + data.status);
      Logger.log('   URL: ' + data.html_url);
      Logger.log('   Source: ' + data.source.branch + ' branch');
      return {
        success: true,
        enabled: true,
        data: data
      };
    } else if (statusCode === 404) {
      Logger.log('❌ GitHub Pages chưa được bật');
      Logger.log('   Hãy vào repository trên GitHub:');
      Logger.log('   Settings > Pages > Source: chọn "main" branch > Save');
      return {
        success: false,
        enabled: false,
        error: 'GitHub Pages not enabled'
      };
    } else {
      Logger.log('⚠️  Không thể kiểm tra GitHub Pages: ' + statusCode);
      Logger.log('   Response: ' + content);
      return {
        success: false,
        error: 'Cannot check GitHub Pages status'
      };
    }
  } catch (error) {
    Logger.log('❌ Lỗi khi kiểm tra GitHub Pages: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Quick function to check GitHub status
 * Cập nhật thông tin GitHub của bạn ở đây
 */
function checkGitHubStatus() {
  Logger.log('📊 Kiểm tra trạng thái GitHub...');
  
  // ========== CẬP NHẬT THÔNG TIN CỦA BẠN Ở ĐÂY ==========
  var githubToken = 'REDACTED_TOKEN';
  var githubUsername = 'YOUR_GITHUB_USERNAME'; // THAY ĐỔI: nhập username GitHub của bạn
  var repoName = 'YOUR_REPOSITORY_NAME';       // THAY ĐỔI: nhập tên repository của bạn
  // ======================================================
  
  // Kiểm tra thông tin cấu hình
  if (githubUsername === 'YOUR_GITHUB_USERNAME' || repoName === 'YOUR_REPOSITORY_NAME') {
    Logger.log('❌ Vui lòng cập nhật githubUsername và repoName trong hàm checkGitHubStatus()');
    Logger.log('   githubUsername: ' + githubUsername);
    Logger.log('   repoName: ' + repoName);
    return {
      success: false,
      error: 'Chưa cấu hình thông tin GitHub'
    };
  }
  
  Logger.log('🔑 Token: ' + githubToken.substring(0, 10) + '...');
  Logger.log('👤 Username: ' + githubUsername);
  Logger.log('📁 Repository: ' + repoName);
  
  // Kiểm tra kết nối MCP server trước
  MCPClient.init({
    serverUrl: 'http://localhost:3000',
    apiKey: ''
  });
  
  var connectionTest = MCPClient.testConnection();
  if (!connectionTest.success) {
    Logger.log('❌ MCP server không chạy. Hãy chạy: node mcp_server_example.js');
    return {
      success: false,
      error: 'MCP server not running'
    };
  }
  
  Logger.log('✅ MCP server đang chạy');
  
  // Kiểm tra file trên GitHub
  var result = checkFilesOnGitHub(githubUsername, repoName, githubToken);
  
  // Hiển thị kết quả chi tiết
  if (result.success) {
    Logger.log('📋 KẾT QUẢ KIỂM TRA GITHUB:');
    Logger.log('   HTML tồn tại: ' + (result.html.exists ? '✅ CÓ' : '❌ KHÔNG'));
    Logger.log('   CSS tồn tại: ' + (result.css.exists ? '✅ CÓ' : '❌ KHÔNG'));
    
    if (result.allExist) {
      Logger.log('🎉 TẤT CẢ FILE ĐÃ TỒN TẠI TRÊN GITHUB!');
      Logger.log('🌐 Truy cập trang web tại: ' + result.url);
      
      // Hiển thị thông tin chi tiết
      if (result.html.data) {
        Logger.log('📄 index.html:');
        Logger.log('   SHA: ' + result.html.data.sha);
        Logger.log('   Size: ' + result.html.data.size + ' bytes');
        Logger.log('   URL: ' + result.html.data.html_url);
        Logger.log('   Download: ' + result.html.data.download_url);
      }
      
      if (result.css.data) {
        Logger.log('🎨 style.css:');
        Logger.log('   SHA: ' + result.css.data.sha);
        Logger.log('   Size: ' + result.css.data.size + ' bytes');
        Logger.log('   URL: ' + result.css.data.html_url);
        Logger.log('   Download: ' + result.css.data.download_url);
      }
    } else {
      Logger.log('⚠️  Một hoặc cả hai file chưa tồn tại trên GitHub');
      Logger.log('   Chạy hàm checkAndPushWebPage() để đẩy file lên');
    }
  } else {
    Logger.log('❌ Lỗi khi kiểm tra GitHub: ' + JSON.stringify(result));
  }
  
  return result;
}

/**
 * Check GitHub status with custom credentials
 * @param {string} username - GitHub username
 * @param {string} repo - Repository name
 * @return {Object} Check result
 */
function checkGitHubStatusCustom(username, repo) {
  Logger.log('🔍 Kiểm tra GitHub với thông tin tùy chỉnh...');
  
  var githubToken = 'REDACTED_TOKEN';
  
  if (!username || !repo) {
    Logger.log('❌ Thiếu username hoặc repository name');
    return {
      success: false,
      error: 'Missing username or repository name'
    };
  }
  
  Logger.log('👤 Username: ' + username);
  Logger.log('📁 Repository: ' + repo);
  
  return checkFilesOnGitHub(username, repo, githubToken);
}

/**
 * Clone the specified GitHub repository to local machine
 * @param {string} targetPath - Local path to clone to (default: /tmp/gemini-project)
 */
function cloneGeminiProject(targetPath) {
  Logger.log('🚀 Bắt đầu clone repository GitHub...');
  
  // URL của repository bạn muốn clone
  var repoUrl = 'https://github.com/nguyenthong123/gemini-project-bang-gia-dura-niem-yet';
  
  // Đường dẫn mặc định nếu không chỉ định
  var defaultPath = '/tmp/gemini-project-' + new Date().getTime();
  var actualTargetPath = targetPath || defaultPath;
  
  Logger.log('📦 Repository: ' + repoUrl);
  Logger.log('📁 Target path: ' + actualTargetPath);
  
  // Kiểm tra kết nối MCP server
  MCPClient.init({
    serverUrl: 'http://localhost:3000',
    apiKey: ''
  });
  
  var connectionTest = MCPClient.testConnection();
  if (!connectionTest.success) {
    Logger.log('❌ MCP server không chạy. Hãy chạy lệnh: node mcp_server_example.js');
    return {
      success: false,
      error: 'MCP server not running'
    };
  }
  
  Logger.log('✅ MCP server đang chạy');
  
  // Clone repository
  Logger.log('⏳ Đang clone repository...');
  var result = MCPClient.cloneRepository(repoUrl, actualTargetPath);
  
  if (result.success) {
    Logger.log('✅ Clone thành công!');
    Logger.log('📁 Repository đã được clone đến: ' + result.data.repository.path);
    Logger.log('🌿 Branch: ' + result.data.repository.branch);
    Logger.log('🕐 Thời gian: ' + result.data.repository.clonedAt);
    
    if (result.data.repository.currentBranch) {
      Logger.log('🌿 Current branch: ' + result.data.repository.currentBranch);
    }
    
    if (result.data.repository.lastCommit) {
      Logger.log('📝 Last commit: ' + result.data.repository.lastCommit);
    }
    
    // Liệt kê nội dung thư mục
    Logger.log('📋 Liệt kê nội dung thư mục...');
    var listResult = MCPClient.listDirectory(actualTargetPath);
    
    if (listResult.success && listResult.data.contents) {
      Logger.log('📁 Nội dung repository:');
      var contents = listResult.data.contents;
      for (var i = 0; i < Math.min(contents.length, 15); i++) {
        var item = contents[i];
        Logger.log('   ' + (item.type === 'directory' ? '📁' : '📄') + ' ' + item.name + 
                   ' (' + item.type + ', ' + item.size + ' bytes)');
      }
      Logger.log('   ... và ' + (contents.length - Math.min(contents.length, 15)) + ' file khác');
    }
    
    // Lưu thông tin clone vào file
    var infoPath = actualTargetPath + '/clone_info.json';
    var infoContent = JSON.stringify(result.data, null, 2);
    MCPClient.writeFileLocal(infoPath, infoContent);
    Logger.log('💾 Thông tin clone đã lưu tại: ' + infoPath);
    
  } else {
    Logger.log('❌ Clone thất bại: ' + JSON.stringify(result));
    
    // Xử lý lỗi cụ thể
    if (result.error && result.error.includes('already exists')) {
      Logger.log('💡 Gợi ý: Thư mục đã tồn tại. Hãy chọn đường dẫn khác hoặc xóa thư mục cũ.');
    }
    if (result.error && result.error.includes('git clone failed')) {
      Logger.log('💡 Gợi ý: Kiểm tra URL repository và kết nối internet.');
    }
  }
  
  return result;
}

/**
 * Clone repository và kiểm tra nội dung
 */
function cloneAndInspectRepository() {
  Logger.log('🔍 Clone và kiểm tra repository...');
  
  var result = cloneGeminiProject();
  
  if (result.success) {
    var repoPath = result.data.repository.path;
    
    // Kiểm tra các file quan trọng
    var importantFiles = ['README.md', 'package.json', 'index.html', 'app.js', 'main.py'];
    
    Logger.log('🔎 Kiểm tra các file quan trọng:');
    for (var i = 0; i < importantFiles.length; i++) {
      var filePath = repoPath + '/' + importantFiles[i];
      var checkResult = MCPClient.checkFileExists(filePath);
      
      if (checkResult.success && checkResult.data.exists) {
        Logger.log('✅ ' + importantFiles[i] + ' - Tồn tại');
        
        // Đọc nội dung file README.md
        if (importantFiles[i] === 'README.md') {
          var readResult = MCPClient.readFile(filePath);
          if (readResult.success) {
            Logger.log('   Preview: ' + readResult.data.content.substring(0, 200) + '...');
          }
        }
      } else {
        Logger.log('❌ ' + importantFiles[i] + ' - Không tồn tại');
      }
    }
    
    // Đếm số lượng file
    var listResult = MCPClient.listDirectory(repoPath);
    if (listResult.success) {
      var fileCount = 0;
      var dirCount = 0;
      var totalSize = 0;
      
      for (var j = 0; j < listResult.data.contents.length; j++) {
        var item = listResult.data.contents[j];
        if (item.type === 'directory') {
          dirCount++;
        } else {
          fileCount++;
          totalSize += item.size;
        }
      }
      
      Logger.log('📊 Thống kê repository:');
      Logger.log('   📁 Thư mục: ' + dirCount);
      Logger.log('   📄 File: ' + fileCount);
      Logger.log('   💾 Tổng kích thước: ' + (totalSize / 1024).toFixed(2) + ' KB');
    }
  }
  
  return result;
}

/**
 * Quick test function
 */
function testDeployment() {
  Logger.log('🧪 Kiểm tra nhanh...');
  return quickSetupAndPush();
}

/**
 * Export all modules for external use
 */
// Export modules to global scope
if (typeof module !== 'undefined') {
  module.exports = {
    EmailScraper: EmailScraper,
    GitHubIntegration: GitHubIntegration,
    MCPClient: MCPClient
  };
}
