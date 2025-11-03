const successResponse = (data, message = 'Operation successful', meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta
  };
};

const errorResponse = (error, message = 'Operation failed') => {
  return {
    success: false,
    message,
    error: error.message || 'Unknown error occurred',
    ...(error.details && { details: error.details })
  };
};

const paginatedResponse = (data, total, limit, offset, message = 'Data retrieved successfully') => {
  return {
    success: true,
    message,
    data,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1
    }
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};