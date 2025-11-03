import React from 'react';
import Badge from '../UI/Badge';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const DealCard = ({ deal, onClick, className = '' }) => {
  const getStatusVariant = (status) => {
    const variants = {
      open: 'primary',
      won: 'success',
      lost: 'danger'
    };
    return variants[status] || 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilClose = (expectedCloseDate) => {
    if (!expectedCloseDate) return null;
    const today = new Date();
    const closeDate = new Date(expectedCloseDate);
    const diffTime = closeDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Closing today';
    if (diffDays <= 7) return `${diffDays} days left`;
    return null;
  };

  const daysLeft = getDaysUntilClose(deal.expected_close_date);
  const isUrgent = daysLeft && (daysLeft.includes('overdue') || parseInt(daysLeft) <= 7);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isUrgent ? 'border-l-4 border-l-red-500' : ''
      } ${className}`}
      onClick={() => onClick && onClick(deal)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {deal.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {deal.company_name}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-1 ml-2">
          <Badge variant={getStatusVariant(deal.status)} size="sm">
            {deal.status?.toUpperCase()}
          </Badge>
          {deal.stage_probability && (
            <span className="text-xs text-gray-500">
              {deal.stage_probability}% probability
            </span>
          )}
        </div>
      </div>

      {/* Deal Value */}
      <div className="flex items-center justify-center mb-3 p-3 bg-gray-50 rounded-lg">
        <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
        <span className="text-lg font-bold text-gray-900">
          {formatCurrency(deal.amount)}
        </span>
      </div>

      {/* Deal Information */}
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <FunnelIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span className="truncate">{deal.stage_name}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <UserCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span className="truncate">
            {deal.contact_first_name} {deal.contact_last_name}
          </span>
        </div>

        {deal.assigned_first_name && (
          <div className="flex items-center text-sm text-gray-600">
            <UserCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-xs">
              Assigned to: {deal.assigned_first_name} {deal.assigned_last_name}
            </span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span>Close: {formatDate(deal.expected_close_date)}</span>
        </div>

        {daysLeft && (
          <div className={`text-sm font-medium ${
            daysLeft.includes('overdue') ? 'text-red-600' :
            daysLeft.includes('left') ? 'text-yellow-600' :
            'text-gray-600'
          }`}>
            {daysLeft}
          </div>
        )}
      </div>

      {/* Activity Indicator */}
      {deal.activity_count > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">{deal.activity_count}</span>
            <span className="ml-1">activity{deal.activity_count !== 1 ? 'ies' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealCard;