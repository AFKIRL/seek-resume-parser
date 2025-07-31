import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false
  }
};

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('resume');

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Invalid file type. Only PDF files are accepted.' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const text = data.text;

    // --- Extraction Logic ---
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const extractName = () => {
      for (let line of lines.slice(0, 5)) {
        if (line.match(/@|contact|phone|email/i)) continue;
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.every(w => /^[A-Z][a-z]+$|^[A-Z]+$|^[A-Z]\.?$/.test(w))) {
          return {
            firstName: formatWord(words[0]),
            lastName: formatWord(words[words.length - 1])
          };
        }
      }
      return { firstName: '', lastName: '' };
    };

    const formatWord = word => word.replace(/\.$/, '').charAt(0).toUpperCase() + word.slice(1).toLowerCase();

    const extractExperiences = () => {
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
    };

    const extractEducation = () => {
      const education = [];
      const stopKeywords = ['Experience', 'Skills', 'Projects'];
      const eduKeywords = ['Bachelor', 'Master', 'University', 'College', 'School'];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (stopKeywords.some(k => line.toLowerCase().includes(k.toLowerCase()))) break;
        if (eduKeywords.some(k => line.includes(k))) {
          let entry = line;
          if (lines[i + 1]) entry += ' | ' + lines[i + 1];
          if (lines[i + 2]?.match(/\d{4}/)) entry += ' | ' + lines[i + 2];
          education.push(entry.trim());
        }
      }
      return education;
    };

    const extractSkills = () => {
      let inSkills = false;
      const skills = [];
      for (let line of lines) {
        const lower = line.toLowerCase();
        if (inSkills) {
          if (['education', 'experience', 'projects', 'contact'].some(h => lower.startsWith(h))) break;
          if (line.trim()) skills.push(line.trim());
        }
        if (lower === 'skills' || lower.startsWith('skills')) inSkills = true;
      }

      return skills
        .join(', ')
        .split(/[,•;|]+/)
        .map(s => s.trim())
        .filter(Boolean);
    };

    const { firstName, lastName } = extractName();
    const result = {
      email: text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '',
      contactNumber: text.match(/(\d{3}[-.\s]?){2}\d{4}/)?.[0] || '',
      firstName,
      lastName,
      workExperience: extractExperiences(),
      education: extractEducation(),
      skills: extractSkills()
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to parse resume.' }, { status: 500 });
  }
}
