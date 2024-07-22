// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ytdl = require('ytdl-core');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
}

app.on('ready', createWindow);

ipcMain.on('download-video', async (event, url) => {
    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[/\\?%*:|"<>]/g, '-'); // sanitize file name
        const output = path.join(__dirname, `${title}.mp4`);

        const videoStream = ytdl(url, { quality: 'highest' });

        let starttime;
        videoStream.pipe(fs.createWriteStream(output));

        videoStream.once('response', () => {
            starttime = Date.now();
        });

        videoStream.on('progress', (chunkLength, downloaded, total) => {
            const percent = downloaded / total;
            const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
            const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;

            event.sender.send('download-progress', {
                percent: (percent * 100).toFixed(2),
                downloaded: (downloaded / 1024 / 1024).toFixed(2),
                total: (total / 1024 / 1024).toFixed(2),
                estimatedDownloadTime: estimatedDownloadTime.toFixed(2)
            });
        });

        videoStream.on('end', () => {
            event.sender.send('download-complete', output);
        });

        videoStream.on('error', (error) => {
            event.sender.send('download-error', error.message);
        });

    } catch (error) {
        event.sender.send('download-error', error.message);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
