# Email Scraper - Google Apps Script Project

## Overview
This project provides a Google Apps Script solution for scraping, processing, and exporting email data from Gmail. The script is designed to be modular, configurable, and easy to integrate into existing Google Workspace workflows.

## Project Structure

```
project-root/
├── src/
│   └── email_scraper.gs     # Main email scraper module
├── PROJECT_PLAN.md          # This project documentation
└── README.md               # User-facing documentation (to be created)
```

## File Descriptions

### src/email_scraper.gs
The main Google Apps Script file containing:
1. **EmailScraper module** - A self-contained module with all scraping functionality
2. **Configuration system** - Flexible configuration for email filtering and processing
3. **Data extraction functions** - Extract email metadata, body, and attachments
4. **Export functionality** - Export data to Google Sheets
5. **Trigger management** - Set up automated execution
6. **Example functions** - Ready-to-use functions for common scenarios

## Features

### Core Functionality
- **Email Filtering**: Search emails using Gmail query syntax
- **Label Support**: Filter by Gmail labels
- **Data Extraction**: Extract subject, sender, recipient, date, body, and attachments
- **Batch Processing**: Process multiple emails with configurable limits
- **Post-processing**: Mark as read, archive, or leave unchanged

### Export Options
- **Google Sheets Export**: Export structured email data to spreadsheets
- **Automatic Formatting**: Auto-resize columns and create headers
- **Flexible Destination**: Export to specific spreadsheet or active sheet

### Automation
- **Time-based Triggers**: Set up hourly, daily, or custom interval execution
- **Event-based Triggers**: Can be extended to trigger on other events
- **Manual Execution**: Run on-demand from Apps Script editor

## Configuration Options

The scraper can be configured with the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxEmails | number | 100 | Maximum emails to process per run |
| labelFilters | string[] | [] | Array of Gmail labels to filter by |
| query | string | 'is:unread' | Gmail search query |
| markAsRead | boolean | true | Mark processed emails as read |
| archiveAfter | boolean | false | Archive emails after processing |

## Usage Examples

### Basic Usage
```javascript
// Initialize with custom settings
EmailScraper.init({
  maxEmails: 50,
  query: 'from:important@domain.com'
});

// Scrape emails
var emails = EmailScraper.scrapeEmails();

// Export to Google Sheets
EmailScraper.exportToSheets(emails, 'SPREADSHEET_ID', 'Sheet1');
```

### Automated Daily Scrape
```javascript
// Set up daily automatic execution
function setupDailyScraper() {
  EmailScraper.init({
    maxEmails: 200,
    query: 'newer_than:1d'
  });
  EmailScraper.createTimeTrigger(24);
}
```

### Run from Apps Script Editor
1. Open the Apps Script editor
2. Select `runEmailScraper` function
3. Click "Run" to execute

## API Reference

### EmailScraper.init(customConfig)
Initialize the scraper with custom configuration.

### EmailScraper.scrapeEmails()
Scrape emails based on current configuration.

### EmailScraper.exportToSheets(emails, spreadsheetId, sheetName)
Export email data to Google Sheets.

### EmailScraper.createTimeTrigger(intervalHours)
Create a time-based trigger for automatic execution.

### EmailScraper.scrapeAndExport()
Combined function for trigger-based execution.

## Setup Instructions

1. **Create a new Google Apps Script project**
   - Go to [script.google.com](https://script.google.com)
   - Create a new project

2. **Add the code**
   - Copy the contents of `src/email_scraper.gs` into the script editor

3. **Enable required services**
   - In the Apps Script editor, go to Services → Add services
   - Add **Gmail** and **Google Sheets** services

4. **Authorize the script**
   - Run the `testScraper` function
   - Authorize the script when prompted

5. **Configure and run**
   - Modify configuration as needed
   - Run `runEmailScraper` to test

## Security Considerations

- The script requires Gmail and Google Sheets permissions
- Only processes emails accessible to the executing user
- Configuration allows control over email modifications (mark as read, archive)
- Consider using service accounts for production use

## Extending the Project

### Adding New Features
1. **Additional Export Formats**: Add CSV, JSON, or Google Drive export
2. **Email Analytics**: Add sentiment analysis, categorization, or statistics
3. **Integration**: Connect to other services like Slack, CRM systems, or databases
4. **Advanced Filtering**: Add more sophisticated email filtering logic

### Creating Additional Modules
- Create new `.gs` files in the `src/` directory
- Follow the module pattern used in `email_scraper.gs`
- Update documentation accordingly

## Troubleshooting

### Common Issues
1. **Permission Errors**: Ensure Gmail and Sheets services are enabled
2. **No Emails Found**: Check your Gmail query syntax
3. **Export Failures**: Verify spreadsheet ID and sheet name
4. **Trigger Issues**: Check trigger execution logs in Apps Script dashboard

### Debugging
- Use `Logger.log()` statements to trace execution
- Check execution logs in the Apps Script editor
- Test with small batches first using `maxEmails: 5`

## Next Steps

1. Create user-friendly frontend with Google Apps Script HTML Service
2. Add error handling and retry logic
3. Implement data persistence for incremental scraping
4. Add notification system for scraping results
5. Create comprehensive test suite

## License & Attribution
This project is intended for educational and practical use. Modify and distribute as needed.

## MCP (Model Context Protocol) Integration

### Overview
The project now includes MCP (Model Context Protocol) integration, allowing Google Apps Script to communicate with a local MCP server to execute git commands and push code to GitHub.

### How to Use MCP for Pushing Code to GitHub

#### 1. Set Up the MCP Server
1. Install Node.js if not already installed
2. Create a new directory for the MCP server (or use your project root)
3. Save the `mcp_server_example.js` file in your project
4. Install required dependencies:
   ```bash
   npm install express body-parser
   ```
5. Start the MCP server:
   ```bash
   node mcp_server_example.js
   ```
6. The server will run on `http://localhost:3000`

#### 2. Configure Google Apps Script
1. Update the `pushCurrentScriptToGitHubViaMCP()` function in `src/email_scraper.gs`:
   - Change `repoPath` to your local repository path
   - Adjust other settings as needed

2. In the Google Apps Script editor, run `testMCPClient()` to test the connection

#### 3. Push Code to GitHub
1. Make changes to your Google Apps Script code
2. Run `autoPushToGitHub()` function from the Apps Script editor
3. The function will:
   - Get the current script content
   - Send it to the MCP server
   - Write to the local repository
   - Commit and push to GitHub

### Available MCP Functions in Google Apps Script

1. **`testMCPClient()`** - Test connection to MCP server
2. **`pushCurrentScriptToGitHubViaMCP()`** - Push current script to GitHub
3. **`autoPushToGitHub()`** - Complete automated push with notifications
4. **`pushCodeViaMCP()`** - Simple git push (assumes files exist locally)

### Security Considerations
- The MCP server runs locally and should not be exposed to the internet
- Add authentication to the MCP server for production use
- Store sensitive information (API keys, paths) securely

### Troubleshooting
1. **Connection failed**: Ensure MCP server is running on `http://localhost:3000`
2. **Git commands fail**: Check repository path and git permissions
3. **File write errors**: Verify directory permissions

### Example Workflow
```javascript
// After making code changes in Google Apps Script editor
function deployChanges() {
  // Test connection first
  if (testMCPClient()) {
    // Push code to GitHub
    var result = autoPushToGitHub();
    Logger.log('Deployment result: ' + JSON.stringify(result));
  }
}
```

## Multi-Agent Architecture
- **Lead Architect**: DeepSeek-V3 (Cloud)
- **Junior Worker**: Llama-3.2-3B (Local via Ollama)
- **Workflow**: Architect plans -> Worker generates boilerplate/docs via `/run ollama`.
