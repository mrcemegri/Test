import React from 'react';
import Badge from '../UI/Badge';
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const ContactCard = ({ contact, onClick, className = '' }) => {
  const getLifecycleStageVariant = (stage) => {
    const variants = {
      lead: 'warning',
      mql: 'info',
      sql: 'primary',
      opportunity: 'success',
      customer: 'default'
    };
    return variants[stage] || 'default';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={() => onClick && onClick(contact)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <UserCircleIcon className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {contact.first_name} {contact.last_name}
            </h3>
            <p className="text-sm text-gray-500">{contact.job_title}</p>
          </div>
        </div>
        <Badge variant={getLifecycleStageVariant(contact.lifecycle_stage)} size="sm">
          {contact.lifecycle_stage?.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Contact Information */}
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span className="truncate">{contact.email}</span>
        </div>

        {contact.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{contact.phone}</span>
          </div>
        )}

        {contact.company_name && (
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{contact.company_name}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span>Created {new Date(contact.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            {contact.deal_count > 0 && (
              <>
                <span className="font-medium">{contact.deal_count}</span>
                <span className="ml-1">deal{contact.deal_count !== 1 ? 's' : ''}</span>
              </>
            )}
            {contact.deal_count === 0 && (
              <span>No deals</span>
            )}
          </div>
          {contact.assigned_first_name && (
            <div className="flex items-center text-gray-500">
              <UserCircleIcon className="h-4 w-4 mr-1" />
              <span className="text-xs">
                {contact.assigned_first_name} {contact.assigned_last_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactCard;