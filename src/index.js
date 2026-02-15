#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const SERVICE_MAP = {
  80: 'HTTP', 443: 'HTTPS', 3000: 'Dev', 3001: 'Dev', 3306: 'MySQL',
  4200: 'Angular', 5000: 'Flask', 5173: 'Vite', 5432: 'PostgreSQL',
  6379: 'Redis', 8000: 'Django', 8080: 'HTTP-Alt', 27017: 'MongoDB'
};

const program = new Command();

program
  .name('port-list')
  .description('List all listening ports on the system')
  .version('1.0.0');

program
  .command('list')
  .description('List all listening ports')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      const { stdout } = await execPromise('lsof -i -P -n | grep LISTEN');
      const lines = stdout.trim().split('\n').filter(l => l);
      
      const ports = [];
      for (const line of lines) {
        const match = line.match(/:(\d+)\s/);
        if (match) {
          const parts = line.trim().split(/\s+/);
          ports.push({
            port: parseInt(match[1]),
            pid: parts[1],
            command: parts[0],
            address: line.match(/(TCP|UDP)\s+(\S+)/)?.[2] || '*'
          });
        }
      }
      
      if (options.json) {
        console.log(JSON.stringify(ports, null, 2));
        return;
      }
      
      console.log(chalk.blue.bold('\n📡 Listening Ports\n'));
      console.log(chalk.gray('═'.repeat(60)));
      console.log(' Port     PID       Command        Address');
      console.log(chalk.gray('─'.repeat(60)));
      
      for (const p of ports) {
        const service = SERVICE_MAP[p.port] || '';
        console.log(` ${chalk.cyan(String(p.port).padEnd(7))} ${String(p.pid).padEnd(9)} ${p.command.substring(0, 14).padEnd(14)} ${p.address}`);
      }
      
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.green(`   Total: ${ports.length} port(s)\n`));
    } catch (error) {
      console.log(chalk.yellow('No listening ports found'));
    }
  });

program.parse();
