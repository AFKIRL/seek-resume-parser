// app/api/submit-form/route.js
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    const filePath = path.join(process.cwd(), 'public', 'submissions.json');

    // Load existing data if it exists
    let existingData = [];
    try {
      const fileContents = await fs.readFile(filePath, 'utf-8');
      existingData = JSON.parse(fileContents);
    } catch (e) {
      existingData = [];
    }

    existingData.push(data);
    await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving form:', error);
    return NextResponse.json({ error: 'Error saving data' }, { status: 500 });
  }
}
