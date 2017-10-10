This is an demo about writeback. Unfortunately, tableau public doesn't allow live connections. You would need your own tableau server. 

Here are the steps that you can follow to setup: 
1. ensure that you have node and npm installed. 
2. copy the following spreadsheet into your own google drive: https://docs.google.com/spreadsheets/d/1ujsct_iHLJmwty8PdmjfuuUsNJqoBEHLTyO8jXAzZps/edit?usp=sharing
3. copy the id (the part of the url after /d/) the spreadsheet into the spreadSheetId variable in /public/js/googleAPI.js
4. create a simple tableau visualization with a live connection to the spreadsheet you've created and publish to your tableau server.
5. copy and paste the url of your published viz to "url" variable in public/js/renderViz.js 
6. run "npm install" from the root directory of the project in your terminal
7. run "npm start"
8. see the app run in localhost:8000
