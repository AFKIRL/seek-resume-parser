# seek-resume-parser
A web tool that accepts resume's from users in order to fill up the registration form automatically based on the data extracted from the resume

# Features 
- Accepts resume input from users (PDF, Word Files)
- Automatically populates the registration form based on extracted data from the file
- Saves the data locally

# How to Run Locally

Requirements

- Node JS Installed

* Start a terminal(command prompt) and navigate to the root folder

- Setup Backend

* navigate to receiver-backend folder and run ```npm install express multer cors pdf-parse```
* after that run ```node server.js``` or ```npm run dev```

- Setup Frontend

* navigate to resume-receiver folder and run ```npm install```
* after that run ```yarn dev``` or ```npm run dev```

# How to test

* After running ```yarn dev``` on the resume-receiver folder you can now access localhost:3000 for local testing
* You can then manually input your data or upload a resume in which the web tool will fill out any detected data that matches the form fields
* After filling everything you can submit the form
* This redirects you to another page that displays all the submitted data

# Demo URL
https://www.youtube.com/watch?v=mnyMOsYYvAs

# Images
https://drive.google.com/drive/folders/13lLOUAURxhS9mwtcjjkFxQHqEeU1iKQy?usp=sharing
