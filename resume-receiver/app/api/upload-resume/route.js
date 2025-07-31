// app/api/upload-resume/route.js
import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));
    const text = data.text;

    // ----- Helper Functions from Express -----

    function extractNameFromResume(text) {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      for (let line of lines.slice(0, 5)) {
        if (line.match(/@|contact|phone|email/i)) continue;
        const words = line.split(/\s+/);
        if (
          words.length >= 2 &&
          words.every(w => /^[A-Z][a-z]+$/.test(w) || /^[A-Z]+$/.test(w) || /^[A-Z]\.?$/.test(w))
        ) {
          const formatWord = word =>
            word.replace(/\.$/, '').charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          return {
            firstName: formatWord(words[0]),
            lastName: formatWord(words[words.length - 1]),
          };
        }
      }
      return { firstName: '', lastName: '' };
    }

    function extractExperiences(text) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const workExperience = [];
      for (let i = 0; i < lines.length - 2; i++) {
        const company = lines[i];
        const title = lines[i + 1];
        const dateMatch = lines[i + 2].match(/^([A-Za-z]+\s\d{4})\s[-–]\s([A-Za-z]+\s\d{4}|Present)$/);
        if (dateMatch) {
          workExperience.push({
            company,
            title,
            startDate: dateMatch[1],
            endDate: dateMatch[2],
          });
        }
      }
      return workExperience;
    }

    function extractEducation(text) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const education = [];
      const educationKeywords = ['Bachelor', 'Master', 'BS', 'MS', 'PhD', 'High School', 'University', 'College'];
      const stopKeywords = ['Experience', 'Work', 'Skills', 'Languages', 'Certifications', 'Projects'];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (stopKeywords.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()))) break;
        if (educationKeywords.some(keyword => line.includes(keyword))) {
          let entry = line;
          if (i + 1 < lines.length) entry += ' | ' + lines[i + 1];
          if (i + 2 < lines.length && lines[i + 2].match(/\d{4}/)) entry += ' | ' + lines[i + 2];
          education.push(entry.trim());
        }
      }
      return education;
    }

    function extractSkillsSection(text) {
      const lines = text.split('\n');
      const skills = [];
      let inSkills = false;
      const sectionHeaders = ['education', 'experience', 'work experience', 'projects', 'certifications', 'contact'];
      for (let line of lines) {
        const lowerLine = line.trim().toLowerCase();
        if (inSkills && sectionHeaders.some(header => lowerLine.startsWith(header))) break;
        if (inSkills && line.trim()) skills.push(line.trim());
        if (!inSkills && lowerLine.startsWith('skills')) inSkills = true;
      }
      return skills
        .join(', ')
        .split(/[,•;|]+/)
        .map(s => s.trim())
        .filter(Boolean);
    }

    const { firstName, lastName } = extractNameFromResume(text);

    const extractedData = {
      email: text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '',
      contactNumber: text.match(/(\d{3}[-.\s]?){2}\d{4}/)?.[0] || '',
      firstName,
      lastName,
      workExperience: extractExperiences(text),
      education: extractEducation(text),
      skills: extractSkillsSection(text),
    };

    return NextResponse.json(extractedData);
  } catch (err) {
    console.error('Resume Parse Error:', err);
    return NextResponse.json({ error: 'Failed to process resume.' }, { status: 500 });
  }
}
