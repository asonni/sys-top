const path = require('path');
const { ipcRenderer } = require('electron');
const { cpu, mem, os } = require('node-os-utils');

let cpuOverload;
let memOverload;
let cpuAlertFrequency;
let memAlertFrequency;

const isDev = process.env.NODE_ENV !== 'production';

// Get settings & values
ipcRenderer.on('settings:get', (e, settings) => {
  cpuOverload = +settings.cpuOverload;
  memOverload = +settings.memOverload;
  cpuAlertFrequency = +settings.cpuAlertFrequency;
  memAlertFrequency = +settings.memAlertFrequency;
});

// Run every 1 second
setInterval(async () => {
  // CPU Usage
  const cpuUsage = await cpu.usage();
  document.getElementById('cpu-usage').innerText = `${Math.round(cpuUsage)}%`;
  document.getElementById('cpu-progress').style.width = `${cpuUsage}%`;

  // Make progress bar red if overload;
  if (cpuUsage >= cpuOverload) {
    document.getElementById('cpu-progress').style.background = 'red';
  } else {
    document.getElementById('cpu-progress').style.background = '#30c88b';
  }

  // Check CPU overload
  if (
    cpuUsage >= cpuOverload &&
    runNotify(cpuAlertFrequency, 'lastCPUNotify')
  ) {
    notifyUser({
      title: 'CPU Overload',
      body: `CPU is over ${cpuOverload}%`
    });

    localStorage.setItem('lastCPUNotify', +new Date());
  }

  const cpuFree = await cpu.free();
  document.getElementById('cpu-free').innerText = `${Math.round(cpuFree)}%`;

  // RAM Usage
  const memInfo = await mem.info();
  const memUsage = memInfo.usedMemMb / 1000 + (100 - memInfo.totalMemMb / 1000);
  document.getElementById('mem-usage').innerText = `${(
    memInfo.usedMemMb / 1000
  ).toFixed(2)} GB`;
  document.getElementById('mem-free').innerText = `${(
    memInfo.freeMemMb / 1000
  ).toFixed(2)} GB`;
  document.getElementById('mem-progress').style.width = `${memUsage}%`;

  // Make progress bar red if overload;
  if (memUsage >= memOverload) {
    document.getElementById('mem-progress').style.background = 'red';
  } else {
    document.getElementById('mem-progress').style.background = '#30c88b';
  }

  // Check Memory overload
  if (
    memUsage >= memOverload &&
    runNotify(memAlertFrequency, 'lastRAMNotify')
  ) {
    notifyUser({
      title: 'Memory Overload',
      body: `Memory is over ${memOverload}%`
    });

    localStorage.setItem('lastRAMNotify', +new Date());
  }

  // Uptime
  document.getElementById('sys-uptime').innerText = secondsToDhms(os.uptime());
}, 1000);

// Set model
document.getElementById('cpu-model').innerText = cpu.model();
document.getElementById('cpu-name').innerText = cpu.model();

// Computer Name
document.getElementById('comp-name').innerText = os.hostname();

// OS
document.getElementById('os').innerText = `${os.type()} ${os.arch()}`;

// Total Mem
mem.info().then(info => {
  document.getElementById('mem-total').innerText = `${Math.round(
    info.totalMemMb / 1000
  )} GB`;
});

// Show days, hours, mins, sec
function secondsToDhms(seconds) {
  seconds = +seconds;
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 23)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d, ${h}h, ${m}m, ${s}s`;
}

// Send notification
function notifyUser(options) {
  if (isDev) {
    options.icon = path.join(__dirname, 'img', 'icon.png');
  }
  new Notification(options.title, options);
}

// Check how much time has passed since notification
function runNotify(frequency, name) {
  if (localStorage.getItem(name) === null) {
    // Store timestamp
    localStorage.setItem(name, +new Date());
    return true;
  }
  const notifyTime = new Date(parseInt(localStorage.getItem(name)));
  const now = new Date();
  const diffTime = Math.abs(now - notifyTime);
  const minutesPassed = Math.ceil(diffTime / (1000 * 60));

  if (minutesPassed > frequency) {
    return true;
  }
  return false;
}
