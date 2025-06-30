import React, { useState, useEffect } from 'react';
import Layout from './Layout';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3003/api';

const CreateIssueForm = ({ onClose, onSuccess, user, selectedUser }) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [formData, setFormData] = useState({
    projectId: '',
    issueTypeId: '',
    summary: '',
    description: '',
    priority: '3' // Medium priority by default
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (formData.projectId) {
      loadIssueTypes(formData.projectId);
    }
  }, [formData.projectId]);

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
        if (projectsData.length > 0) {
          setFormData(prev => ({ ...prev, projectId: projectsData[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const loadIssueTypes = async (projectId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/issuetypes`);
      if (response.ok) {
        const typesData = await response.json();
        setIssueTypes(typesData);
        if (typesData.length > 0) {
          setFormData(prev => ({ ...prev, issueTypeId: typesData[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading issue types:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Updated to match the server's expected format
      const issueData = {
        projectId: formData.projectId,
        issueTypeId: formData.issueTypeId,
        summary: formData.summary,
        description: formData.description || formData.summary,
        priority: formData.priority,
        requestedBy: selectedUser?.email || 'contact@targeted.services'
      };

      const response = await fetch(`${API_BASE_URL}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Issue created:', result);
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Error creating issue:', errorData);
        setError(errorData.error || 'Failed to create issue');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to create issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Layout user={user}>
      <div className="create-issue-container">
        {/* Header */}
        <div className="create-issue-header">
          <div className="header-left">
            <h1 className="page-title">Create a Request</h1>
            <p className="user-subtitle">
              Creating request for: {selectedUser?.name || 'Targeted Services'} ({selectedUser?.email || 'contact@targeted.services'})
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="back-to-dashboard-btn"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Form */}
        <div className="create-issue-form">
          <form onSubmit={handleSubmit} className="form-content">
            {error && (
              <div className="error-alert">
                <p className="error-text">{error}</p>
              </div>
            )}

            <div className="form-grid">
              {/* Project Selection */}
              <div className="form-group">
                <label htmlFor="projectId" className="form-label">
                  Project *
                </label>
                <select
                  id="projectId"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Type Selection */}
              <div className="form-group">
                <label htmlFor="issueTypeId" className="form-label">
                  Request Type *
                </label>
                <select
                  id="issueTypeId"
                  name="issueTypeId"
                  value={formData.issueTypeId}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.projectId}
                  className="form-select"
                >
                  <option value="">Select a request type</option>
                  {issueTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="form-group">
                <label htmlFor="priority" className="form-label">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="1">Highest</option>
                  <option value="2">High</option>
                  <option value="3">Medium</option>
                  <option value="4">Low</option>
                  <option value="5">Lowest</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            <div className="form-group full-width">
              <label htmlFor="summary" className="form-label">
                Summary *
              </label>
              <input
                type="text"
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                required
                placeholder="Brief summary of your request"
                className="form-input"
              />
            </div>

            {/* Description */}
            <div className="form-group full-width">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Provide more details about your request..."
                className="form-textarea"
              />
            </div>

            {/* Submit Buttons */}
            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateIssueForm;
