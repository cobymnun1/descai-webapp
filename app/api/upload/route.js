import { uploadFile } from '../lib/storage';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type - accept multiple document formats
    const allowedExtensions = ['.pdf', '.txt', '.md', '.docx', '.doc', '.odt', '.rtf', '.epub'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return Response.json({ 
        error: `Invalid file type. Accepted: ${allowedExtensions.join(', ')}` 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    await uploadFile('uploads', file.name, buffer, {
      contentType: file.type,
      upsert: true
    });

    return Response.json({ 
      success: true, 
      filename: file.name,
      size: file.size 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}