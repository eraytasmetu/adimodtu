/**
 * Utility functions for handling Google Drive links
 */

/**
 * Converts various Google Drive sharing links to direct download links
 * @param {string} url - The Google Drive sharing URL
 * @returns {string} - Direct download URL or original URL if not Google Drive
 */
function convertGoogleDriveLink(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Check if it's a Google Drive link
  if (!url.includes('drive.google.com')) {
    return url;
  }
  
  let fileId = '';
  
  // Handle different Google Drive URL formats
  if (url.includes('/file/d/')) {
    // Format: https://drive.google.com/file/d/FILE_ID/view
    fileId = url.split('/file/d/')[1]?.split('/')[0];
  } else if (url.includes('id=')) {
    // Format: https://drive.google.com/open?id=FILE_ID
    fileId = url.split('id=')[1]?.split('&')[0];
  } else if (url.includes('/uc?export=download&id=')) {
    // Already a direct download link
    return url;
  } else if (url.includes('/uc?id=')) {
    // Format: https://drive.google.com/uc?id=FILE_ID
    fileId = url.split('/uc?id=')[1]?.split('&')[0];
  }
  
  if (fileId) {
    // Return direct download link
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  // If we can't parse the URL, return original
  return url;
}

/**
 * Alternative method using different Google Drive export format
 * Sometimes the uc?export=download format doesn't work, so we try alternatives
 */
function getAlternativeGoogleDriveLink(url) {
  if (!url || typeof url !== 'string') return url;
  
  if (!url.includes('drive.google.com')) {
    return url;
  }
  
  let fileId = '';
  
  // Extract file ID from various formats
  if (url.includes('/file/d/')) {
    fileId = url.split('/file/d/')[1]?.split('/')[0];
  } else if (url.includes('id=')) {
    fileId = url.split('id=')[1]?.split('&')[0];
  }
  
  if (fileId) {
    // Try alternative format that sometimes works better
    return `https://drive.google.com/uc?id=${fileId}`;
  }
  
  return url;
}

/**
 * Checks if a URL is accessible (basic validation)
 */
async function validateAudioUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error validating audio URL:', error);
    return false;
  }
}

module.exports = {
  convertGoogleDriveLink,
  getAlternativeGoogleDriveLink,
  validateAudioUrl
}; 