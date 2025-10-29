@echo off
echo Installing dependencies...
npm install puppeteer

echo.
echo Running VM Travels Form Test...
node test-form-submission.js

echo.
echo Test completed! Press any key to exit.
pause















