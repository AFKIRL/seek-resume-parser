const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdf = require('pdf-parse');

const fs = require('fs');
const path = require('path');


const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer to handle file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- The Main Upload Route ---

app.post('/upload-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'Invalid file type. Only PDF files are accepted.' });
  }

  try {
    const dataBuffer = req.file.buffer;
    const data = await pdf(dataBuffer);

    const text = data.text;

    // === Name Extraction Logic ===
    function extractNameFromResume(text) {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

      for (let line of lines.slice(0, 5)) {
        if (line.match(/@|contact|phone|email/i)) continue;

        const words = line.split(/\s+/);
        if (
          words.length >= 2 &&
          words.every(w =>
            /^[A-Z][a-z]+$/.test(w) || /^[A-Z]+$/.test(w) || /^[A-Z]\.?$/.test(w)
          )
        ) {
          const firstName = formatWord(words[0]);
          const lastName = formatWord(words[words.length - 1]);

          return { firstName, lastName };
        }
      }

      return { firstName: '', lastName: '' };
    }



    function formatWord(word) {
      word = word.replace(/\.$/, '');
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    // Get Work Experience

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

      const educationKeywords = ['Bachelor', 'Master', 'BS', 'MS', 'PhD', 'High School', 'University', 'College', 'Academy', 'School'];
      const stopKeywords = ['Experience', 'Work', 'Skills', 'Languages', 'Certifications', 'Projects'];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (stopKeywords.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()))) {
          break;
        }

        if (educationKeywords.some(keyword => line.includes(keyword))) {
          let entry = line;

          if (i + 1 < lines.length && !stopKeywords.some(k => lines[i + 1].toLowerCase().includes(k.toLowerCase()))) {
            entry += ' | ' + lines[i + 1];
          }
          if (i + 2 < lines.length && lines[i + 2].match(/\d{4}/)) {
            entry += ' | ' + lines[i + 2];
          }

          education.push(entry.trim());
        }
      }
      return education
    }

    function extractSkillsSection(text) {
      const lines = text.split('\n');
      const skills = [];
      let inSkillsSection = false;

      const sectionHeaders = ['education', 'experience', 'work experience', 'projects', 'certifications', 'contact'];

      for (let line of lines) {
        const lowerLine = line.trim().toLowerCase();

        if (inSkillsSection) {
          if (sectionHeaders.some(header => lowerLine.startsWith(header))) {
            break;
          }
          if (line.trim()) {
            skills.push(line.trim());
          }
        }

        // Start collecting when we hit "Skills" or similar
        if (lowerLine === 'skills' || lowerLine.startsWith('skills')) {
          inSkillsSection = true;
        }
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

    res.json(extractedData);

  } catch (error) {
    console.error('Error during PDF parsing:', error);
    res.status(500).json({ error: 'Failed to parse the resume.' });
  }
});

app.post('/submit-form', (req, res) => {
  const formData = req.body;

  const formattedText = `
===========================
Submission Date: ${new Date().toLocaleString()}
Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Contact Number: ${formData.contactNumber}

Education:
${Array.isArray(formData.education) ? formData.education.join('\n') : formData.education}

Work Experience:
${Array.isArray(formData.workExperience)
      ? formData.workExperience.map(exp =>
        typeof exp === 'string'
          ? exp
          : `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})`
      ).join('\n')
      : formData.workExperience}

Skills:
${Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
===========================

`;

  const filePath = path.join(__dirname, 'submissions.txt');
  fs.appendFile(filePath, formattedText, (err) => {
    if (err) {
      console.error('Error saving form data:', err);
      return res.status(500).json({ error: 'Failed to save form data.' });
    }

    console.log('Form data saved to submissions.txt');
    res.status(200).json({ message: 'Form submitted successfully.' });
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});