const fs = require('fs');
function readFd(pid, fd) {
  try {
    const p = `/proc/${pid}/fd/${fd}`;
    console.log(`=== Reading PID ${pid} FD ${fd} ===`);
    // FD can be a pipe or socket and might block, so we'll check stat first or read with a timeout/non-blocking
    const stat = fs.statSync(p);
    console.log('Stat:', stat);
  } catch (e) {
    console.error(`Error reading PID ${pid} FD ${fd}:`, e.message);
  }
}

readFd(6, 1);
readFd(6, 2);
