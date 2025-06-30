import React from 'react';
import Layout from './Layout';

const CreateIssueForm = ({ onClose, onSuccess, user }) => {
  return (
    <Layout user={user}>
      <div className="create-issue-container">
        <div className="create-issue-header">
          <div className="header-left">
            <h1 className="page-title">Create a Request</h1>
            <p className="user-subtitle">Test version</p>
          </div>
          <button onClick={onClose} className="back-to-dashboard-btn">
            ← Back to Dashboard
          </button>
        </div>
        <div className="create-issue-form">
          <p>Test create issue form</p>
        </div>
      </div>
    </Layout>
  );
};

export default CreateIssueForm;
