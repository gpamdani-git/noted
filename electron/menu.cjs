// Native Application Menu for Noted (macOS & Windows)
// Matches Notion Desktop REA native menus & keyboard shortcuts

const { app, Menu, shell, BrowserWindow } = require('electron');

function setupMenu(mainWindow) {
  const isMac = process.platform === 'darwin';

  const sendAction = (action) => {
    const targetWin = mainWindow || BrowserWindow.getFocusedWindow();
    if (targetWin && targetWin.webContents) {
      targetWin.webContents.send('menu:action', action);
    }
  };

  const template = [
    ...(isMac
      ? [
          {
            label: 'Noted',
            submenu: [
              {
                label: 'About Noted',
                click: () => sendAction('about')
              },
              {
                label: 'Check for Updates...',
                click: () => sendAction('check-updates')
              },
              { type: 'separator' },
              {
                label: 'Preferences...',
                accelerator: 'CmdOrCtrl+,',
                click: () => sendAction('open-settings')
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: 'Hide Noted' },
              { role: 'hideOthers', label: 'Hide Others' },
              { role: 'unhide', label: 'Show All' },
              { type: 'separator' },
              { role: 'quit', label: 'Quit Noted' }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Page',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendAction('new-page')
        },
        {
          label: 'New Subpage',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => sendAction('new-subpage')
        },
        { type: 'separator' },
        {
          label: 'Quick Search / Open...',
          accelerator: 'CmdOrCtrl+P',
          click: () => sendAction('search')
        },
        { type: 'separator' },
        {
          label: 'Import Markdown...',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendAction('import')
        },
        {
          label: 'Export Page as Markdown',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => sendAction('export')
        },
        { type: 'separator' },
        {
          label: 'Move to Trash...',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => sendAction('trash')
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Close Window' } : { role: 'quit', label: 'Exit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Find in Page...',
                accelerator: 'CmdOrCtrl+F',
                click: () => sendAction('search')
              },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }]
              }
            ]
          : [
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Find in Page...',
                accelerator: 'CmdOrCtrl+F',
                click: () => sendAction('search')
              }
            ])
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+\\',
          click: () => sendAction('toggle-sidebar')
        },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Toggle Dark / Light Theme',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => sendAction('toggle-theme')
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' }
            ]
          : [{ role: 'close' }])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Noted Documentation & Guides',
          click: async () => {
            await shell.openExternal('https://github.com/gpamdani-git/noted');
          }
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => sendAction('shortcuts')
        },
        {
          label: 'Open Web Version',
          click: async () => {
            await shell.openExternal('https://noted-alpha-eight.vercel.app');
          }
        },
        { type: 'separator' },
        {
          label: 'Report an Issue...',
          click: async () => {
            await shell.openExternal('https://github.com/gpamdani-git/noted/issues');
          }
        },
        {
          label: 'Check for Updates...',
          click: () => sendAction('check-updates')
        },
        { type: 'separator' },
        {
          label: 'About Noted',
          click: () => sendAction('about')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { setupMenu };
