// app/api/upload-resume/route.js
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false, // required for formidable
  },
};

const parseForm = req =>
  new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve(files);
    });
  });

export async function POST(req) {
  try {
    const files = await parseForm(req);
    const resume = files.resume;

    // TODO: Add logic to extract info from resume.path (PDF/DOCX parsing)
    const extractedData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      contactNumber: '+1234567890',
      workExperience: 'Software Developer at XYZ Corp (2020 - 2023)',
      education: 'BSc Computer Science, ABC University, 2018',
      skills: 'React, Node.js, Python'
    };

    return NextResponse.json(extractedData);
  } catch (error) {
    console.error('Resume parsing failed:', error);
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 });
  }
}
