/**
 * Converts a file buffer to plaintext based on the file extension
 * @param {Buffer} buffer - The file buffer to convert
 * @param {string} fileExtension - The file extension (e.g., '.pdf', '.txt', '.docx')
 * @returns {Promise<string>} - The converted plaintext
 */
export async function convertToPlaintext(buffer, fileExtension) {
  const ext = fileExtension.toLowerCase();

  switch (ext) {
    case '.txt':
    case '.md':
      // Read directly as UTF-8
      return buffer.toString('utf-8');

    case '.pdf':
      try {
        const pdf = (await import('pdf-parse')).default;
        const data = await pdf(buffer);
        return data.text;
      } catch (error) {
        throw new Error(`PDF conversion failed: ${error.message}`);
      }

    case '.docx':
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } catch (error) {
        throw new Error(`DOCX conversion failed: ${error.message}`);
      }

    case '.doc':
    case '.odt':
    case '.rtf':
    case '.epub':
      throw new Error(`Conversion for ${ext} files is not yet implemented`);

    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}