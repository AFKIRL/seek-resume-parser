import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();

    console.log('Form submitted:', data);

    // You could integrate Firebase, Supabase, or upload to S3 here
    return NextResponse.json({ message: 'Form submitted successfully.' });
  } catch (err) {
    console.error('Error saving form:', err);
    return NextResponse.json({ error: 'Failed to process form.' }, { status: 500 });
  }
}
