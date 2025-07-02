#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkUsername(username) {
  try {
    const response = await fetch(`https://auth.roblox.com/v1/usernames/validate?request.username=${encodeURIComponent(username)}&request.birthday=1990-01-01`);
    
    if (response.status === 200) {
      const data = await response.json();
      if (data.code === 0) {
        return { username, status: 'Available', isAvailable: true };
      } else if (data.code === 1) {
        return { username, status: 'Taken', isAvailable: false };
      } else if (data.code === 2) {
        return { username, status: 'Censored', isAvailable: false };
      } else if (data.code === 10) {
        return { username, status: 'Invalid', isAvailable: false };
      } else {
        return { username, status: `Error (Code ${data.code})`, isAvailable: false };
      }
    } else {
      return { username, status: `HTTP ${response.status}`, isAvailable: false };
    }
  } catch (error) {
    return { username, status: `Error: ${error.message}`, isAvailable: false };
  }
}

async function checkUsernamesFromFile(filename) {
  if (!fs.existsSync(filename)) {
    console.error(`File not found: ${filename}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filename, 'utf8');
  const usernames = content.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length >= 3 && line.length <= 20);

  if (usernames.length === 0) {
    console.error('No valid usernames found in file');
    process.exit(1);
  }

  console.log(`Checking ${usernames.length} usernames...`);
  console.log('Username'.padEnd(20) + 'Status'.padEnd(15) + 'Available');
  console.log('-'.repeat(50));

  const results = [];
  const available = [];

  for (let i = 0; i < usernames.length; i++) {
    const result = await checkUsername(usernames[i]);
    results.push(result);
    
    if (result.isAvailable) {
      available.push(result.username);
    }

    const statusColor = result.isAvailable ? '\x1b[32m' : '\x1b[31m'; // Green for available, red for taken
    const resetColor = '\x1b[0m';
    
    console.log(
      result.username.padEnd(20) + 
      `${statusColor}${result.status}${resetColor}`.padEnd(25) + 
      (result.isAvailable ? 'YES' : 'NO')
    );

    // Rate limiting - wait 200ms between requests
    if (i < usernames.length - 1) {
      await delay(200);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Total checked: ${results.length}`);
  console.log(`Available: ${available.length}`);
  console.log(`Taken/Error: ${results.length - available.length}`);

  // Save available usernames to file
  if (available.length > 0) {
    const availableFile = `available_usernames_${Date.now()}.txt`;
    fs.writeFileSync(availableFile, available.join('\n'));
    console.log(`\nAvailable usernames saved to: ${availableFile}`);
  }

  // Save full results to CSV
  const csvFile = `results_${Date.now()}.csv`;
  const csvContent = 'Username,Status,Available\n' + 
    results.map(r => `${r.username},${r.status},${r.isAvailable}`).join('\n');
  fs.writeFileSync(csvFile, csvContent);
  console.log(`Full results saved to: ${csvFile}`);
}

async function checkSingleUsername(username) {
  console.log(`Checking username: ${username}`);
  const result = await checkUsername(username);
  
  const statusColor = result.isAvailable ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';
  
  console.log(`Status: ${statusColor}${result.status}${resetColor}`);
  console.log(`Available: ${result.isAvailable ? 'YES' : 'NO'}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Roblox Username Checker CLI');
    console.log('');
    console.log('Usage:');
    console.log('  node cli-checker.js <username>           Check single username');
    console.log('  node cli-checker.js -f <filename>        Check usernames from file');
    console.log('');
    console.log('Examples:');
    console.log('  node cli-checker.js testuser123');
    console.log('  node cli-checker.js -f usernames.txt');
    process.exit(0);
  }

  if (args[0] === '-f' || args[0] === '--file') {
    if (args.length < 2) {
      console.error('Please provide a filename');
      process.exit(1);
    }
    await checkUsernamesFromFile(args[1]);
  } else {
    await checkSingleUsername(args[0]);
  }
}

main().catch(console.error);