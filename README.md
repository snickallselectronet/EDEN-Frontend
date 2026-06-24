# Introduction

This is the front end code for the client portal.

# Getting Started

You can run the automated start_site.ps1 file to start the front end site.

1.  Open a terminal and paste 'start_site.ps1' to run the file.

Alternatively, you can start the site manually

1. Run 'npm install' in a terminal
2. run 'npm run dev' in terminal to start local site
3. Navigate to http://localhost:58080/
4. You may run into issues if you don't have the .env file with the Auth0 keys. Message Mark or Brian for assistance.

# Building for Deployment

1. change the server request URL in \src\constants\index.tsx
2. Run 'npm run build'
3. Run 'npm run preview' on deployment server
4. May need to add the .env file onto the deployment server.
