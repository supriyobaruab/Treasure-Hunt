CAMPUS QUEST — REACT FRONTEND DEMO

REQUIREMENTS
- Node.js (for Vite development server)
- npm
- VS Code recommended

RUN ON MAC
1. Extract this ZIP.
2. Open the extracted folder in VS Code.
3. Open Terminal in VS Code.
4. Run:
   npm install
   npm run dev
5. Open the Local URL printed by Vite (usually http://localhost:5173).

DEMO LOGINS
Player:
  Team ID: THT-001
  Password: team123

Other sample teams:
  THT-002 / team123
  THT-003 / team123

Organizer:
  Username: admin
  Password: admin12345

DEMO MEMBER PINS
THT-001:
  T001-M1 / 1001
  T001-M2 / 1002
  T001-M3 / 1003
  T001-M4 / 1004
  T001-M5 / 1005

HOW TO TEST
1. Log in as THT-001.
2. Dashboard shows the first riddle.
3. Open Scan QR code.
4. Allow camera access, or type CAMPUS-QR-01 into the manual token field.
5. Choose a member and enter that member's PIN.
6. Complete the checkpoint.
7. The next riddle is unlocked.
8. Open leaderboard to see scores.
9. Log out and use admin/admin12345 to see the organizer interface.

NOTES
- This is frontend-only. All demo data and progress are stored in browser localStorage.
- The demo uses sample teams and riddles. The admin QR screen shows demo tokens and a visual QR-like placeholder; it is not a real QR generator yet.
- QR scanning uses html5-qrcode. Camera access works on localhost in supported browsers.
- This is not secure for a real competition. Client-side data can be edited. Later we will replace local demo logic with PHP API endpoints and MySQL.
- Reset demo from the admin overview to clear progress.
