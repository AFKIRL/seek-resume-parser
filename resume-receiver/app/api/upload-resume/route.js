import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // You can now parse buffer using pdf-parse, etc.
    // For now, mock extracted data
    const extractedData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      contactNumber: '+1234567890',
      workExperience: 'Software Developer at XYZ Corp (2020 - 2023)',
      education: 'BSc Computer Science, ABC University, 2018',
      skills: 'React, Node.js, Python',
      fileInfo: {
        filename: file.name,
        type: file.type,
        size: buffer.length,
      }
    };

    return NextResponse.json(extractedData);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
