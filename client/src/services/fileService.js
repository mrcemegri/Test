import api from './api';

export const fileService = {
  // Upload file
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Upload multiple files
  uploadMultipleFiles: async (files) => {
    const uploadPromises = files.map(file => fileService.uploadFile(file));
    const responses = await Promise.all(uploadPromises);
    return responses;
  },

  // Download file
  downloadFile: async (filename) => {
    const response = await api.get(`/files/download/${filename}`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Get file info
  getFileInfo: async (filename) => {
    const response = await api.get(`/files/info/${filename}`);
    return response.data;
  },

  // Delete file
  deleteFile: async (filename) => {
    const response = await api.delete(`/files/${filename}`);
    return response.data;
  },

  // Get file URL for display
  getFileUrl: (filename) => {
    return `${api.defaults.baseURL}/files/download/${filename}`;
  },

  // Validate file type
  isValidFileType: (file, allowedTypes) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type;
      }
      return file.type.includes(type.replace('*', ''));
    });
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file icon based on type
  getFileIcon: (mimeType) => {
    const iconMap = {
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'application/pdf': 'pdf',
      'application/msword': 'document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
      'application/vnd.ms-excel': 'spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
      'text/plain': 'text',
    };

    return iconMap[mimeType] || 'file';
  },
};