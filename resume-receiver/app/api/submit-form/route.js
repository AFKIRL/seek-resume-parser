// app/api/submit-form/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();

    // You can connect to a database or third-party API here if needed.
    console.log('Submitted Form:', body);

    return NextResponse.json({ message: 'Form submitted successfully.' });
  } catch (error) {
    console.error('Error in submit-form:', error);
    return NextResponse.json({ error: 'Failed to submit form.' }, { status: 500 });
  }
}
