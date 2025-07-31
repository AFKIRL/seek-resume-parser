"use client"

import Image from 'next/image';
import React, { useState, useMemo } from 'react';

// --- Helper Components & Icons ---

const FileUploadIcon = () => (
  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-16 h-16 text-green-500 mx-auto my-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);


// --- Main Component ---

export default function ResumeUploader() {
  const initialFormData = {
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    workExperience: '',
    education: '',
    skills: '',
  };


  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const requiredFields = ['firstName', 'lastName', 'email', 'contactNumber', 'workExperience', 'education'];

  // Memoize the validation check to avoid re-calculating on every render
  const isFormValid = useMemo(() => {
    return requiredFields.every(field => {
      const value = formData[field];

      if (typeof value === 'string') {
        return value.trim() !== '';
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return false;
    });
  }, [formData, requiredFields]);


  const validateField = (name, value) => {
    const stringValue = String(value || '');

    if (requiredFields.includes(name) && stringValue.trim() === '') {
      return 'This field is required.';
    }

    if (name === 'email' && stringValue && !/\S+@\S+\.\S+/.test(stringValue)) {
      return 'Please enter a valid email address.';
    }

    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const parseRealResume = async (fileToUpload) => {
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('resume', fileToUpload);

    try {
      const response = await fetch('/api/upload-resume', {
  method: 'POST',
  body: formData,
});

      if (!response.ok) {
        throw new Error('Server responded with an error!');
      }

      const extractedData = await response.json();

      // Populate the form with data from the server
      setFormData(extractedData);
      setErrors({}); // Clear any previous errors

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to parse resume. Please try again or fill the form manually.');
    } finally {
      setIsProcessing(false);
    }
  };
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseRealResume(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form Data Before Submit:', formData);
    if (isFormValid) {
      console.log('Form Submitted:', formData);
      setIsSubmitted(true);

      try {
        const response = await fetch('/api/submit-form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});

        if (!response.ok) {
          throw new Error('Failed to save form submission.');
        }

        console.log('Form submission saved to file.');
      } catch (err) {
        console.error(err);
      }

    } else {
      console.log('Form submission blocked due to validation errors.');
      const newErrors = {};
      requiredFields.forEach(field => {
        const value = formData[field];
        const isEmpty = (
          typeof value === 'string' && value.trim() === '' ||
          Array.isArray(value) && value.length === 0
        );

        if (isEmpty) {
          newErrors[field] = 'This field is required.';
        }
      });

      setErrors(newErrors);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitted(false);
  };

  // Render the summary of submitted data
  if (isSubmitted) {
    return (
      <div className="bg-gray-100 min-h-screen font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg animate-fade-in">
          <CheckCircleIcon />
          <h2 className="text-2xl font-bold text-center text-gray-800">Registration Submitted!</h2>
          <p className="text-center text-gray-600 mt-2 mb-6">Your details have been recorded.</p>

          <div className="space-y-4">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-gray-800 whitespace-pre-wrap">
                  {
                    Array.isArray(value)
                      ? value.every(v => typeof v === 'string')
                        ? value.join('\n')
                        : value.map((v, i) =>
                          typeof v === 'object'
                            ? `• ${v.title} at ${v.company} (${v.startDate} - ${v.endDate})`
                            : `• ${v}`
                        ).join('\n')
                      : typeof value === 'object'
                        ? JSON.stringify(value)
                        : value || 'N/A'
                  }
                </p>
              </div>
            ))}

          </div>

          <button
            onClick={handleReset}
            className="w-full mt-8 bg-blue-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Register Another Applicant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFF' }} className="min-h-screen font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <Image className={'text-center m-auto'} src={'/logo-black-site.png'} width={300} height={200} alt={'work-abroad'} />
          <h1 className="text-xl sm:text-2xl font-bold text-blue-800">Applicant Registration</h1>
          <p className="text-gray-600 mt-2">Upload your resume to auto-fill the form, or enter your details manually.</p>
        </div>

        {/* File Upload Section */}
        {!file && (
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors mb-8">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileUploadIcon />
              <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-500">PDF or DOCX (MAX. 5MB)</p>
            </div>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          </label>
        )}

        {file && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2 rounded-lg w-full text-center">
              <p className="font-semibold break-words">{file.name}</p>
              {isProcessing && (
                <p className="text-sm mt-1 animate-pulse">Parsing your resume, please wait...</p>
              )}
            </div>
            <button
              onClick={handleReset}
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200 cursor-pointer w-full sm:w-auto"
            >
              Reupload
            </button>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-bold text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
              <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleInputChange} className={`text-sm text-gray-700 w-full p-2 border rounded-md transition-shadow ${errors.firstName ? 'border-red-500' : 'border-gray-300'} focus:border-orange-300 focus:shadow-[0_0_0_4px_#e2863b3b] focus:ring-0 focus:outline-none shadow-md`} required />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-bold text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
              <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleInputChange} className={`text-sm text-gray-700 w-full outline-none px-3 py-2 border rounded-md transition-shadow ${errors.lastName ? 'border-red-500' : 'border-gray-300'} focus:border-orange-300 focus:shadow-[0_0_0_4px_#e2863b3b] focus:ring-0 focus:outline-none shadow-md`} required />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className={`text-sm text-gray-700 w-full p-2 border rounded-md transition-shadow ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:border-orange-300 focus:shadow-[0_0_0_4px_#e2863b3b] focus:ring-0 focus:outline-none shadow-md`} required />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Contact Number */}
            <div className="md:col-span-2">
              <label htmlFor="contactNumber" className="block text-sm font-bold text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
              <input type="tel" name="contactNumber" id="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className={`text-gray-700 w-full p-2 text-sm border rounded-md transition-shadow ${errors.contactNumber ? 'border-red-500' : 'border-gray-300'} focus:border-orange-300 focus:shadow-[0_0_0_4px_#e2863b3b] focus:ring-0 focus:outline-none shadow-md`} required />
              {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
            </div>

            {/* Education */}
            <div className="md:col-span-2">
              <label htmlFor="education" className="block text-sm font-bold text-gray-700 mb-2">Education <span className="text-red-500">*</span></label>
              <textarea name="education" id="education" rows="4" value={
                Array.isArray(formData.education)
                  ? formData.education.join('\n')
                  : formData.education
              } onChange={handleInputChange} className={`text-gray-700 w-full p-2 text-sm border rounded-md transition-shadow ${errors.education ? 'border-red-500' : 'border-gray-300'} focus:border-orange-300 focus:shadow-[0_0_0_4px_#e2863b3b] focus:ring-0 focus:outline-none shadow-md`} placeholder="e.g., Degree, University, Year Graduated" required></textarea>
              {errors.education && <p className="text-red-500 text-xs mt-1">{errors.education}</p>}
            </div>

            {/* Work Experience */}
            <div className="md:col-span-2">
              <label htmlFor="workExperience" className="block text-sm font-bold text-gray-700 mb-2">Work Experience <span className="text-red-500">*</span></label>
              <textarea name="workExperience" id="workExperience" rows="6" value={Array.isArray(formData.workExperience)
                ? formData.workExperience.map(
                  exp => `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})`
                ).join('\n')
                : formData.workExperience} onChange={handleInputChange} className={`text-gray-700 w-full p-2 text-sm border rounded-md transition-shadow ${errors.workExperience ? 'border-red-500' : 'border-gray-300'} focus:border-orange-300 focus:shadow-[0_0_0_4px_#e2863b3b] focus:ring-0 focus:outline-none shadow-md`} placeholder="List your previous job roles, companies, and durations." required></textarea>
              {errors.workExperience && <p className="text-red-500 text-xs mt-1">{errors.workExperience}</p>}
            </div>

            {/* Skills */}
            <div className="md:col-span-2">
              <label htmlFor="skills" className="block text-sm font-bold text-gray-700 mb-2">Skills (Optional)</label>
              <textarea name="skills" id="skills" rows="3" value={formData.skills} onChange={handleInputChange} className="text-gray-700 w-full p-2 text-sm border border-gray-300 rounded-md transition-shadow focus:border-orange-300 focus:shadow-[0_0_0_4px_#e2863b3b] focus:ring-0 focus:outline-none shadow-md" placeholder="e.g., Communication, Project Management, Software names..."></textarea>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <button
              type="submit"
              // disabled={!isFormValid || isProcessing}
              className="w-full md:w-auto text-white font-bold py-3 px-12 rounded-lg text-lg bg-blue-800 cursor-pointer transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-orange-300"
            >
              {isProcessing ? 'Processing...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}