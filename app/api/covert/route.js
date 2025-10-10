import { downloadFile, uploadFile, deleteFile } from '../lib/storage';
import { convertToPlaintext } from './helper';

export async function POST(request) {
  try {
    // Parse JSON body
    const body = await request.json();
    const { filename } = body;

    // Validate filename
    if (!filename) {
      return Response.json(
        { error: 'No filename provided' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

    // Download the file from Supabase Storage
    let buffer;
    try {
      buffer = await downloadFile('uploads', filename);
    } catch (error) {
      return Response.json(
        { error: 'File not found in storage' },
        { status: 404 }
      );
    }

    // Convert to plaintext
    let plaintext;
    try {
      plaintext = await convertToPlaintext(buffer, fileExtension);
    } catch (conversionError) {
      return Response.json(
        { error: conversionError.message },
        { status: 500 }
      );
    }

    // Generate text filename
    const baseFilename = filename.substring(0, filename.lastIndexOf('.'));
    const textFilename = `${baseFilename}.txt`;

    // Upload plaintext to Supabase Storage
    await uploadFile('uploads', textFilename, Buffer.from(plaintext, 'utf-8'), {
      contentType: 'text/plain',
      upsert: true
    });

    // Delete original file after successful conversion
    await deleteFile('uploads', filename);

    // Return response
    return Response.json({
      success: true,
      textFilename: textFilename,
      plaintext: plaintext,
      length: plaintext.length
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}