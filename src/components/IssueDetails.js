import React, { useState, useEffect } from 'react';
import { 
  formatDate, 
  formatDateTime, 
  extractTextFromADF, 
  fetchTicketDetails,
  separateComments,
  getCommentType
} from '../api/jira';

function IssueDetails({ ticket, onClose, user }) {
  const [detailedTicket, setDetailedTicket] = useState(ticket);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ticket) {
      loadTicketDetails();
    }
  }, [ticket]);

  const loadTicketDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await fetchTicketDetails(ticket.key);
      setDetailedTicket(details);
    } catch (err) {
      console.error('Error loading ticket details:', err);
      setError(err.message);
      // Fall back to the basic ticket data
      setDetailedTicket(ticket);
    } finally {
      setLoading(false);
    }
  };
  if (!ticket) return null;

  const openTicketInJira = () => {
    const jiraUrl = `https://${process.env.REACT_APP_JIRA_DOMAIN}/browse/${ticket.key}`;
    window.open(jiraUrl, '_blank');
  };

  // Extract description text from ADF format
  const getDescriptionText = () => {
    if (!detailedTicket?.fields?.description) return null;
    return extractTextFromADF(detailedTicket.fields.description);
  };

  // Get comments from the ticket
  const getComments = () => {
    if (!detailedTicket?.fields?.comment?.comments) return [];
    return detailedTicket.fields.comment.comments;
  };

  return (
    <div className="issue-details-overlay">
      <div className="issue-details-container">
        {/* Header */}
        <div className="issue-details-header">
          <div className="header-left">
            <h1 className="issue-title">{detailedTicket.fields.summary}</h1>
            <div className="issue-meta">
              <span className="issue-key">{detailedTicket.key}</span>
              <span className={`priority-badge ${detailedTicket.fields.priority?.name?.toLowerCase() || 'medium'}`}>
                {detailedTicket.fields.priority?.name || 'Medium'}
              </span>
              <span className="status-badge">
                {detailedTicket.fields.status?.name}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={openTicketInJira}
              className="view-jira-btn"
              title="Open in Jira"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 7H17V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Open in Jira
            </button>
            <button 
              onClick={onClose}
              className="close-btn"
              title="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="issue-details-content">
          <div className="issue-details-grid">
            {/* Left Column */}
            <div className="issue-main-content">
              {loading && (
                <div className="loading-section">
                  <div className="loading-spinner-small"></div>
                  <p>Loading ticket details...</p>
                </div>
              )}

              {error && (
                <div className="error-section">
                  <p className="error-message">Failed to load detailed information: {error}</p>
                </div>
              )}

              <div className="content-section">
                <h3 className="section-title">Description</h3>
                <div className="description-content">
                  {(() => {
                    const descriptionText = getDescriptionText();
                    if (descriptionText) {
                      return <pre className="description-text">{descriptionText}</pre>;
                    } else {
                      return <p className="no-description">No description provided</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Comments/Activity Section */}
              <div className="content-section">
                <h3 className="section-title">Comments & Activity</h3>
                <div className="activity-content">
                  {(() => {
                    const comments = getComments();
                    if (comments && comments.length > 0) {
                      const { internal, customer } = separateComments(comments);
                      
                      return (
                        <div className="comments-container">
                          {/* Customer Comments */}
                          {customer.length > 0 && (
                            <div className="comments-section">
                              <h4 className="comments-section-title">
                                <span className="comment-type-badge customer-badge">Customer</span>
                                Customer Comments ({customer.length})
                              </h4>
                              <div className="comments-list">
                                {customer.map((comment, index) => (
                                  <div key={comment.id || `customer-${index}`} className="comment-item customer-comment">
                                    <div className="comment-header">
                                      <div className="comment-author">
                                        <span className="author-name">
                                          {comment.author?.displayName || 'Unknown User'}
                                        </span>
                                        <span className="comment-type-indicator">Customer</span>
                                        <span className="comment-date">
                                          {formatDateTime(comment.created)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="comment-body">
                                      <pre className="comment-text">
                                        {extractTextFromADF(comment.body)}
                                      </pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Internal Comments */}
                          {internal.length > 0 && (
                            <div className="comments-section">
                              <h4 className="comments-section-title">
                                <span className="comment-type-badge internal-badge">Internal</span>
                                Internal Comments ({internal.length})
                              </h4>
                              <div className="comments-list">
                                {internal.map((comment, index) => (
                                  <div key={comment.id || `internal-${index}`} className="comment-item internal-comment">
                                    <div className="comment-header">
                                      <div className="comment-author">
                                        <span className="author-name">
                                          {comment.author?.displayName || 'Unknown User'}
                                        </span>
                                        <span className="comment-type-indicator">Internal</span>
                                        <span className="comment-date">
                                          {formatDateTime(comment.created)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="comment-body">
                                      <pre className="comment-text">
                                        {extractTextFromADF(comment.body)}
                                      </pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* No comments message */}
                          {customer.length === 0 && internal.length === 0 && (
                            <p className="no-activity">No comments or activity</p>
                          )}
                        </div>
                      );
                    } else {
                      return <p className="no-activity">No comments or activity</p>;
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="issue-sidebar">
              <div className="sidebar-section">
                <h4 className="sidebar-title">Details</h4>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                      <span className="issue-type">
                        {detailedTicket.fields.issuetype?.name}
                      </span>
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Project:</span>
                    <span className="detail-value">{detailedTicket.fields.project?.name}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Project Key:</span>
                    <span className="detail-value">{detailedTicket.fields.project?.key}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Assignee:</span>
                    <span className="detail-value">
                      {detailedTicket.fields.assignee ? (
                        <div className="user-info">
                          <span className="user-name">{detailedTicket.fields.assignee.displayName}</span>
                          <span className="user-email">{detailedTicket.fields.assignee.emailAddress}</span>
                        </div>
                      ) : (
                        <span className="unassigned">Unassigned</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Reporter:</span>
                    <span className="detail-value">
                      {detailedTicket.fields.reporter ? (
                        <div className="user-info">
                          <span className="user-name">{detailedTicket.fields.reporter.displayName}</span>
                          <span className="user-email">{detailedTicket.fields.reporter.emailAddress}</span>
                        </div>
                      ) : (
                        <span className="unknown-user">Unknown</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(detailedTicket.fields.created)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Updated:</span>
                    <span className="detail-value">{formatDate(detailedTicket.fields.updated)}</span>
                  </div>
                  
                  {detailedTicket.fields.duedate && (
                    <div className="detail-row">
                      <span className="detail-label">Due Date:</span>
                      <span className="detail-value">{formatDate(detailedTicket.fields.duedate)}</span>
                    </div>
                  )}
                  
                  {detailedTicket.fields.resolution && (
                    <div className="detail-row">
                      <span className="detail-label">Resolution:</span>
                      <span className="detail-value">{detailedTicket.fields.resolution.name}</span>
                    </div>
                  )}

                  {/* Labels */}
                  {detailedTicket.fields.labels && detailedTicket.fields.labels.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Labels:</span>
                      <div className="detail-value">
                        <div className="labels-list">
                          {detailedTicket.fields.labels.map((label, index) => (
                            <span key={index} className="label-tag">{label}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Components */}
                  {detailedTicket.fields.components && detailedTicket.fields.components.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Components:</span>
                      <div className="detail-value">
                        <div className="components-list">
                          {detailedTicket.fields.components.map((component, index) => (
                            <span key={index} className="component-tag">{component.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IssueDetails;
