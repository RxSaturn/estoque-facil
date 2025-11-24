#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const readline = require('readline');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Limpar a tela
console.clear();

// Cabeçalho
console.log(`${colors.blue}======================================================`);
console.log(`        INICIANDO ESTOQUE FACIL - VERSAO 1.0`);
console.log(`======================================================${colors.reset}`);
console.log();

// Verificar diretórios
const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

if (!fs.existsSync(backendDir)) {
  console.error(`${colors.red}[ERRO] Pasta 'backend' não encontrada!${colors.reset}`);
  console.error('Este script deve ser executado na pasta raiz do projeto.');
  process.exit(1);
}

if (!fs.existsSync(frontendDir)) {
  console.error(`${colors.red}[ERRO] Pasta 'frontend' não encontrada!${colors.reset}`);
  console.error('Este script deve ser executado na pasta raiz do projeto.');
  process.exit(1);
}

// Detectar porta ocupada
const isPortInUse = async (port) => {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
};

// Função para iniciar processos
const startProcess = (name, dir, command, args, color) => {
  console.log(`[*] Iniciando ${name}...`);
  
  const isWindows = os.platform() === 'win32';
  const proc = spawn(command, args, {
    cwd: dir,
    shell: true,
    stdio: 'pipe',
    detached: !isWindows
  });
  
  // Lidar com saída
  proc.stdout.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim() !== '') {
        console.log(`${color}[${name}]${colors.reset} ${line}`);
      }
    });
  });
  
  proc.stderr.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim() !== '') {
        console.log(`${colors.red}[${name} ERRO]${colors.reset} ${line}`);
      }
    });
  });
  
  proc.on('close', (code) => {
    console.log(`${color}[${name}]${colors.reset} Processo finalizado com código ${code}`);
  });
  
  return proc;
};

// Função principal para iniciar tudo
const startAll = async () => {
  try {
    // Verificar portas
    const backendPortInUse = await isPortInUse(5000);
    const frontendPortInUse = await isPortInUse(3000);
    
    if (backendPortInUse) {
      console.warn(`${colors.yellow}[AVISO] Porta 5000 já está em uso! O backend pode falhar ao iniciar.${colors.reset}`);
    }
    
    if (frontendPortInUse) {
      console.warn(`${colors.yellow}[AVISO] Porta 3000 já está em uso! O frontend pode falhar ao iniciar.${colors.reset}`);
    }
    
    // Iniciar backend
    const backendProcess = startProcess(
      'BACKEND',
      backendDir,
      'npm',
      ['start'],
      colors.green
    );
    
    console.log(`[*] Aguardando 5 segundos para o backend inicializar...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Iniciar frontend
    const frontendProcess = startProcess(
      'FRONTEND',
      frontendDir,
      'npm',
      ['start'],
      colors.yellow
    );
    
    console.log();
    console.log(`${colors.green}[✓] Estoque Fácil iniciado com sucesso!${colors.reset}`);
    console.log(`    - Backend: http://localhost:5000`);
    console.log(`    - Frontend: http://localhost:3000`);
    console.log();
    console.log(`${colors.yellow}[!] Pressione Ctrl+C para encerrar todos os processos.${colors.reset}`);
    console.log();
    
    // Lidar com sinal de interrupção
    process.on('SIGINT', () => {
      console.log(`\n${colors.yellow}[!] Encerrando aplicação...${colors.reset}`);
      
      // Matar processos
      if (os.platform() === 'win32') {
        spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
        spawn('taskkill', ['/pid', frontendProcess.pid, '/f', '/t']);
      } else {
        process.kill(-backendProcess.pid, 'SIGKILL');
        process.kill(-frontendProcess.pid, 'SIGKILL');
      }
      
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`${colors.red}[ERRO] Falha ao iniciar aplicação:${colors.reset}`, error);
    process.exit(1);
  }
};

// Iniciar a aplicação
startAll();