// Jira API configuration and utility functions
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3003/api';

// Fetch tickets assigned to the current user
export const fetchMyTickets = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tickets = await response.json();
    return tickets;
  } catch (error) {
    console.error('Error fetching Jira tickets:', error);
    throw error;
  }
};

// Fetch current user information
export const fetchCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
};

// Fetch detailed ticket information including description and comments
export const fetchTicketDetails = async (ticketKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketKey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const ticketDetails = await response.json();
    return ticketDetails;
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    throw error;
  }
};

// Fetch tickets for a specific user by email
export const fetchUserTickets = async (userEmail) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/user/${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tickets = await response.json();
    return tickets;
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    throw error;
  }
};

// Utility function to format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Utility function to format date with time
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Utility function to extract text from Jira's Atlassian Document Format (ADF)
export const extractTextFromADF = (adfContent) => {
  if (!adfContent) return '';
  
  // If it's a simple string, return it
  if (typeof adfContent === 'string') {
    return adfContent;
  }
  
  // If it's ADF format, extract text recursively
  if (adfContent.type === 'doc' && adfContent.content) {
    return extractContentText(adfContent.content);
  }
  
  return '';
};

// Helper function to recursively extract text from ADF content
const extractContentText = (content) => {
  if (!Array.isArray(content)) return '';
  
  let text = '';
  
  for (const node of content) {
    if (node.type === 'text') {
      text += node.text || '';
    } else if (node.type === 'paragraph' && node.content) {
      text += extractContentText(node.content) + '\n';
    } else if (node.type === 'heading' && node.content) {
      text += extractContentText(node.content) + '\n';
    } else if (node.type === 'bulletList' && node.content) {
      for (const listItem of node.content) {
        if (listItem.type === 'listItem' && listItem.content) {
          text += '• ' + extractContentText(listItem.content) + '\n';
        }
      }
    } else if (node.type === 'orderedList' && node.content) {
      let index = 1;
      for (const listItem of node.content) {
        if (listItem.type === 'listItem' && listItem.content) {
          text += `${index}. ` + extractContentText(listItem.content) + '\n';
          index++;
        }
      }
    } else if (node.type === 'codeBlock' && node.content) {
      text += '```\n' + extractContentText(node.content) + '\n```\n';
    } else if (node.type === 'blockquote' && node.content) {
      text += '> ' + extractContentText(node.content) + '\n';
    } else if (node.content) {
      text += extractContentText(node.content);
    }
  }
  
  return text;
};

// Utility function to get priority color class
export const getPriorityColorClass = (priority) => {
  if (!priority) return 'ticket-priority-low';
  
  const priorityName = priority.name?.toLowerCase();
  
  switch (priorityName) {
    case 'highest':
      return 'ticket-priority-highest';
    case 'high':
      return 'ticket-priority-high';
    case 'medium':
      return 'ticket-priority-medium';
    case 'low':
      return 'ticket-priority-low';
    case 'lowest':
      return 'ticket-priority-lowest';
    default:
      return 'ticket-priority-medium';
  }
};

// Utility function to check if a comment is internal (visible only to agents/admins)
export const isInternalComment = (comment) => {
  // Check if comment has visibility restrictions
  if (comment.visibility) {
    // Internal comments are typically restricted to roles like "Administrators", "jira-servicedesk-users", etc.
    const visibilityType = comment.visibility.type;
    const visibilityValue = comment.visibility.value;
    
    if (visibilityType === 'role') {
      // Common internal role names in Jira Service Desk
      const internalRoles = [
        'Administrators',
        'jira-servicedesk-users',
        'Service Desk Team',
        'Agents',
        'servicedesk-users',
        'jira-administrators'
      ];
      
      return internalRoles.some(role => 
        visibilityValue.toLowerCase().includes(role.toLowerCase())
      );
    }
    
    if (visibilityType === 'group') {
      // Common internal group names
      const internalGroups = [
        'jira-servicedesk-users',
        'jira-administrators',
        'servicedesk-agents'
      ];
      
      return internalGroups.some(group => 
        visibilityValue.toLowerCase().includes(group.toLowerCase())
      );
    }
  }
  
  // If no visibility restrictions, it's a customer-facing comment
  return false;
};

// Utility function to get comment type for display
export const getCommentType = (comment) => {
  return isInternalComment(comment) ? 'internal' : 'customer';
};

// Utility function to separate comments by type
export const separateComments = (comments) => {
  if (!comments || !Array.isArray(comments)) {
    return { internal: [], customer: [] };
  }
  
  const internal = comments.filter(comment => isInternalComment(comment));
  const customer = comments.filter(comment => !isInternalComment(comment));
  
  return { internal, customer };
};
