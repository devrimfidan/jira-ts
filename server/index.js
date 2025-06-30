const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Jira API configuration
const JIRA_BASE_URL = `https://${process.env.REACT_APP_JIRA_DOMAIN}/rest/api/3`;

// Helper function to create authentication headers
const getAuthHeaders = () => {
  const email = process.env.REACT_APP_JIRA_EMAIL;
  const apiToken = process.env.REACT_APP_JIRA_API_TOKEN;
  
  if (!email || !apiToken) {
    throw new Error('Jira credentials not found in environment variables');
  }
  
  const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
  
  return {
    'Authorization': `Basic ${credentials}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
};

// Route to get current user
app.get('/api/user', async (req, res) => {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(`${JIRA_BASE_URL}/myself`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const userData = await response.json();
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user information:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to get user's tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const headers = getAuthHeaders();
    const email = process.env.REACT_APP_JIRA_EMAIL;
    
    // JQL query to get ALL tickets created by the current user (including closed ones)
    const jql = `reporter = "${email}" ORDER BY priority DESC, created DESC`;
    
    const response = await fetch(`${JIRA_BASE_URL}/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,priority,assignee,created,updated,issuetype,project,reporter,description,comment&expand=properties`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data.issues || []);
  } catch (error) {
    console.error('Error fetching Jira tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to get tickets assigned to the user
app.get('/api/tickets/assigned', async (req, res) => {
  try {
    const headers = getAuthHeaders();
    const email = process.env.REACT_APP_JIRA_EMAIL;
    
    // JQL query to get open tickets assigned to the current user
    const jql = `assignee = "${email}" AND status != Done AND status != Closed ORDER BY priority DESC, created DESC`;
    
    const response = await fetch(`${JIRA_BASE_URL}/search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,status,priority,assignee,created,updated,issuetype,project,reporter`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data.issues || []);
  } catch (error) {
    console.error('Error fetching assigned Jira tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to get projects
app.get('/api/projects', async (req, res) => {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(`${JIRA_BASE_URL}/project`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const projects = await response.json();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to get issue types for a project
app.get('/api/projects/:projectId/issuetypes', async (req, res) => {
  try {
    const headers = getAuthHeaders();
    const { projectId } = req.params;
    
    const response = await fetch(`${JIRA_BASE_URL}/project/${projectId}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const project = await response.json();
    res.json(project.issueTypes || []);
  } catch (error) {
    console.error('Error fetching issue types:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to get tickets for a specific user by email
app.get('/api/tickets/user/:userEmail', async (req, res) => {
  try {
    const headers = getAuthHeaders();
    const { userEmail } = req.params;
    
    // Create label search term for this user
    const labelTerm = `requested-by-${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    // JQL query to get tickets either created by the user OR labeled as requested by them
    const jql = `(reporter = "${userEmail}" OR labels = "${labelTerm}" OR description ~ "Requested by: ${userEmail}") ORDER BY priority DESC, created DESC`;
    
    const response = await fetch(`${JIRA_BASE_URL}/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,priority,assignee,created,updated,issuetype,project,reporter,description,comment,labels&expand=properties`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data.issues || []);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to get detailed ticket information including description and comments
app.get('/api/tickets/:ticketKey', async (req, res) => {
  try {
    const headers = getAuthHeaders();
    const { ticketKey } = req.params;
    
    // Get ticket details with description and comments (including visibility properties)
    const response = await fetch(`${JIRA_BASE_URL}/issue/${ticketKey}?fields=summary,status,priority,assignee,created,updated,issuetype,project,reporter,description,comment,labels,components,resolution,duedate&expand=properties`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const ticketData = await response.json();
    res.json(ticketData);
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to create a new issue
app.post('/api/issues', async (req, res) => {
  try {
    const headers = getAuthHeaders();
    const { projectId, issueTypeId, summary, description, priority, requestedBy } = req.body;
    
    // Add the requester information to the description
    const enhancedDescription = requestedBy 
      ? `Requested by: ${requestedBy}\n\n${description || ""}`
      : description || "";
    
    const issueData = {
      fields: {
        project: {
          id: projectId
        },
        issuetype: {
          id: issueTypeId
        },
        summary: summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: enhancedDescription
                }
              ]
            }
          ]
        },
        priority: {
          id: priority
        },
        // Add labels to track the requester
        labels: requestedBy ? [`requested-by-${requestedBy.toLowerCase().replace(/[^a-z0-9]/g, '-')}`] : []
      }
    };
    
    const response = await fetch(`${JIRA_BASE_URL}/issue`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(issueData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errorMessages?.join(', ') || `HTTP error! status: ${response.status}`);
    }
    
    const newIssue = await response.json();
    res.json(newIssue);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Jira API proxy server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Jira API proxy server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard will be available at http://localhost:3000`);
});
