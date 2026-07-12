const http = require('http');

const users = [
  { role: 'Super Admin', email: 'admin@transitops.com' },
  { role: 'Fleet Manager', email: 'fleet.manager@transitops.com' },
  { role: 'Safety Officer', email: 'safety.officer@transitops.com' },
  { role: 'Financial Analyst', email: 'finance@transitops.com' }
];

function testLogin(email) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email,
      password: 'TransitOps@2024!'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('=== AUTOMATIC LOGIN TEST ===');
  let allSuccess = true;
  for (const u of users) {
    try {
      const res = await testLogin(u.email);
      console.log(`✓ ${u.role} (${u.email}) logged in successfully! Role in response: ${res.data.user.role}`);
    } catch (err) {
      console.error(`✗ ${u.role} (${u.email}) login FAILED! Error: ${err.message}`);
      allSuccess = false;
    }
  }

  if (allSuccess) {
    console.log('\n🎉 ALL FOUR DEMO ACCOUNTS LOGGED IN SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n❌ SOME LOGINS FAILED.');
    process.exit(1);
  }
}

run();
