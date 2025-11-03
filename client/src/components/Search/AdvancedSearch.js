import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  CalendarIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Badge from '../UI/Badge';
import contactService from '../../services/contactService';
import dealService from '../../services/dealService';
import companyService from '../../services/companyService';

const AdvancedSearch = ({ onSearch, onFilter, type = 'all' }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    assignedTo: '',
    status: '',
    lifecycleStage: '',
    company: '',
    valueRange: { min: '', max: '' }
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery);

    if (searchQuery.length >= 2) {
      setLoading(true);
      try {
        const results = await Promise.all([
          type === 'all' || type === 'contacts' ?
            contactService.searchContacts(searchQuery, { limit: 5 }) : Promise.resolve([]),
          type === 'all' || type === 'deals' ?
            dealService.searchDeals(searchQuery, { limit: 5 }) : Promise.resolve([]),
          type === 'all' || type === 'companies' ?
            companyService.searchCompanies(searchQuery, { limit: 5 }) : Promise.resolve([])
        ]);

        const allSuggestions = [
          ...results[0]?.data || [],
          ...results[1]?.data || [],
          ...results[2]?.data || []
        ].slice(0, 10);

        setSuggestions(allSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = () => {
    if (onSearch) {
      onSearch(query, filters);
    }
    setShowSuggestions(false);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const clearFilters = () => {
    const defaultFilters = {
      dateRange: 'all',
      assignedTo: '',
      status: '',
      lifecycleStage: '',
      company: '',
      valueRange: { min: '', max: '' }
    };

    setFilters(defaultFilters);

    if (onFilter) {
      onFilter(defaultFilters);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.first_name || suggestion.last_name || suggestion.name || suggestion.subject);
    setShowSuggestions(false);
    handleSearchSubmit();
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="search"
              type="text"
              placeholder={`Search ${type === 'all' ? 'contacts, deals, companies' : type}...`}
              className="pl-10 pr-4"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            />

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                <div className="py-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center space-x-2">
                        {suggestion.first_name && (
                          <UserCircleIcon className="h-4 w-4 text-gray-400" />
                        )}
                        {suggestion.name && !suggestion.first_name && (
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                        )}
                        {suggestion.subject && (
                          <FunnelIcon className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-medium">
                          {suggestion.first_name ? `${suggestion.first_name} ${suggestion.last_name}` :
                           suggestion.name || suggestion.subject}
                        </span>
                        {suggestion.email && (
                          <span className="text-gray-500 ml-2">
                            ({suggestion.email})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="ml-2 flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSearchSubmit}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-primary-50 border-primary-200' : ''}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="quarter">This quarter</option>
                <option value="year">This year</option>
              </select>
            </div>

            {/* Status Filter */}
            {(type === 'all' || type === 'deals') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            )}

            {/* Lifecycle Stage Filter */}
            {(type === 'all' || type === 'contacts') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lifecycle Stage
                </label>
                <select
                  value={filters.lifecycleStage}
                  onChange={(e) => handleFilterChange('lifecycleStage', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All stages</option>
                  <option value="lead">Lead</option>
                  <option value="mql">Marketing Qualified</option>
                  <option value="sql">Sales Qualified</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            )}

            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <Input
                type="text"
                placeholder="Company name"
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
              />
            </div>

            {/* Value Range Filter (for deals) */}
            {(type === 'all' || type === 'deals') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Value Range
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min}
                    onChange={(e) => handleFilterChange('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value
                    })}
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max}
                    onChange={(e) => handleFilterChange('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value
                    })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {filters.dateRange !== 'all' && (
                <Badge variant="primary" size="sm">
                  Date: {filters.dateRange}
                  <button
                    onClick={() => handleFilterChange('dateRange', 'all')}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.status && (
                <Badge variant="primary" size="sm">
                  Status: {filters.status}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.lifecycleStage && (
                <Badge variant="primary" size="sm">
                  Stage: {filters.lifecycleStage}
                  <button
                    onClick={() => handleFilterChange('lifecycleStage', '')}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;