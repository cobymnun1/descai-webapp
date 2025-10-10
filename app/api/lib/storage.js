import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client with service role key for Storage operations
 */
export function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Upload a file to Supabase Storage
 * @param {string} bucket - The bucket name (e.g., 'uploads')
 * @param {string} path - The file path within the bucket
 * @param {Buffer|Blob} fileData - The file data to upload
 * @param {Object} options - Optional upload options (contentType, upsert, etc.)
 * @returns {Promise<{data, error}>}
 */
export async function uploadFile(bucket, path, fileData, options = {}) {
  const supabase = getStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileData, {
      upsert: options.upsert || false,
      contentType: options.contentType,
    });
  
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  
  return { data, error };
}

/**
 * Download a file from Supabase Storage
 * @param {string} bucket - The bucket name
 * @param {string} path - The file path within the bucket
 * @returns {Promise<Buffer>} - File data as Buffer
 */
export async function downloadFile(bucket, path) {
  const supabase = getStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);
  
  if (error) {
    throw new Error(`Storage download failed: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('File not found in storage');
  }
  
  // Convert Blob to Buffer
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - The bucket name
 * @param {string} path - The file path within the bucket
 * @returns {Promise<{data, error}>}
 */
export async function deleteFile(bucket, path) {
  const supabase = getStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
  
  return { data, error };
}

/**
 * Delete multiple files from Supabase Storage
 * @param {string} bucket - The bucket name
 * @param {string[]} paths - Array of file paths to delete
 * @returns {Promise<{data, error}>}
 */
export async function deleteFiles(bucket, paths) {
  const supabase = getStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(paths);
  
  if (error) {
    throw new Error(`Storage batch delete failed: ${error.message}`);
  }
  
  return { data, error };
}

