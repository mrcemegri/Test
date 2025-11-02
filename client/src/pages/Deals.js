import React from 'react';

const Deals = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Deals Pipeline</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage your sales pipeline and track deal progression.
      </p>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          <p>Deals pipeline Kanban board will be implemented here.</p>
          <p className="mt-2">Features will include:</p>
          <ul className="mt-2 text-sm list-disc list-inside">
            <li>Drag-and-drop deal management</li>
            <li>Pipeline stage customization</li>
            <li>Deal value tracking</li>
            <li>Sales forecasting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Deals;