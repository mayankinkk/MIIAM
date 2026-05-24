import { Storage } from '@google-cloud/storage';

// Initialize storage using the default credentials
// In production, this picks up the service account from the GCP environment
// In local development, you'd need GOOGLE_APPLICATION_CREDENTIALS set
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

const BUCKET_NAME = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'miiam-storage-bucket';
const bucket = storage.bucket(BUCKET_NAME);

/**
 * Uploads a file to Google Cloud Storage
 * @param fileBuffer The buffer containing the file data
 * @param destination The path where the file should be saved in the bucket
 * @param mimeType The MIME type of the file (e.g., 'image/jpeg')
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(fileBuffer: Buffer, destination: string, mimeType: string): Promise<string> {
  const file = bucket.file(destination);
  
  await file.save(fileBuffer, {
    metadata: {
      contentType: mimeType,
    },
    resumable: false,
  });

  // Make the file publicly accessible (if bucket allows public access)
  // If your bucket enforces uniform bucket-level access, this might fail, 
  // and you should rely on the bucket's IAM policies instead.
  try {
    await file.makePublic();
  } catch (error) {
    console.warn(`Could not make file public: ${error}`);
  }

  return `https://storage.googleapis.com/${BUCKET_NAME}/${destination}`;
}
