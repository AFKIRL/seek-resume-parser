import { NextResponse } from 'next/server';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false, // disable Next's default body parser
  },
};

// Convert Web Request to Node-style req/res for formidable
export async function POST(request) {
  const form = formidable({ 
    multiples: false,
    keepExtensions: true,
    fileWriteStreamHandler: () => {
      // Ignore writing to file, capture file into memory
      const chunks = [];
      return new WritableStream({
        write(chunk) {
          chunks.push(chunk);
        },
        close() {
          const buffer = Buffer.concat(chunks);
          // You can now parse the buffer (PDF, DOCX, etc.)
          // For now we just log the size
          console.log('Received file buffer, size:', buffer.length);
        }
      });
    }
  });

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  const req = Object.assign(request, {
    headers: Object.fromEntries(request.headers),
  });

  const body = await request.body?.getReader().read();
  if (!body?.value) {
    return NextResponse.json({ error: 'Empty body' }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(body.value);
      controller.close();
    }
  });

  const response = new Response(stream);
  const formData = await response.formData();
  const file = formData.get('resume');

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 👇 You can now pass `buffer` to a PDF parser like pdf-parse, etc.
  return NextResponse.json({
    filename: file.name,
    size: buffer.length,
    type: file.type,
  });
}
