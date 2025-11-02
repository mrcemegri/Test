import React from 'react';
import { useQuery } from 'react-query';
import {
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  HandRaisedIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const fetchDashboardMetrics = async () => {
  const response = await api.get('/dashboard/metrics');
  return response.data.data;
};

const fetchRecentActivities = async () => {
  const response = await api.get('/dashboard/recent-activities');
  return response.data.data;
};

const Dashboard = () => {
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery('dashboardMetrics', fetchDashboardMetrics);

  const {
    data: activities,
    isLoading: activitiesLoading,
  } = useQuery('recentActivities', fetchRecentActivities);

  const statCards = [
    {
      name: 'Total Deals',
      value: metrics?.deals?.total || 0,
      change: '+12%',
      changeType: 'positive',
      icon: HandRaisedIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Open Deals',
      value: metrics?.deals?.open || 0,
      change: '+8%',
      changeType: 'positive',
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Won Deals',
      value: metrics?.deals?.won || 0,
      change: '+23%',
      changeType: 'positive',
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Contacts',
      value: metrics?.contacts?.total || 0,
      change: '+15%',
      changeType: 'positive',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Companies',
      value: metrics?.companies?.total || 0,
      change: '+5%',
      changeType: 'positive',
      icon: BuildingOfficeIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Pipeline Value',
      value: `$${(metrics?.pipeline_value || 0).toLocaleString()}`,
      change: '+18%',
      changeType: 'positive',
      icon: ChartBarIcon,
      color: 'bg-pink-500',
    },
  ];

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="text-center text-red-600">
        Error loading dashboard data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your sales pipeline today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon
                    className={`h-6 w-6 ${stat.color} text-white rounded-md p-1`}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">{stat.change}</span>
                <span className="text-gray-500"> from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activities
            </h3>
            {activitiesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center`}>
                        <span className="text-primary-600 text-sm font-medium">
                          {activity.type[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.subject}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent activities</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <a
                href="/contacts/new"
                className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Add New Contact
              </a>
              <a
                href="/companies/new"
                className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Add New Company
              </a>
              <a
                href="/deals/new"
                className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create New Deal
              </a>
              <a
                href="/activities/new"
                className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Log Activity
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;