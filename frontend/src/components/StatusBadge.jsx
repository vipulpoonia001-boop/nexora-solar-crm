import React from 'react';
import { getStatusColor } from '../utils/helpers';

const StatusBadge = ({ status, label }) => {
  const displayLabel = label || status;
  return (
    <span className={`status-badge ${getStatusColor(status)} capitalize`}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
