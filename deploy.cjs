const { spawn } = require('child_process');
const child = spawn('npx.cmd', ['surge', 'dist', '--domain', 'nazrawe-barber-app.surge.sh'], { cwd: 'f:\\derejedailly', shell: true });

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  if (str.includes('email:')) {
    child.stdin.write('nazrawe.barber.app.2026@gmail.com\n');
  }
  if (str.includes('password:')) {
    child.stdin.write('NazraweBarber2026!\n');
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
