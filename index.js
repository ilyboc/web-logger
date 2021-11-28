const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const { Buffer } = require('buffer')
const WSServer = require('ws').Server
const server = require('http').createServer()
const wss = new WSServer({ server: server })
var options = {
    logFile: path.join(__dirname, 'log.txt').toString(),
    endOfLineChar: require('os').EOL
};

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'))
})

server.on('request', app);

wss.on('connection', function connection(ws) {
    ws.send(JSON.stringify(fs.readFileSync(options.logFile).toString().split(options.endOfLineChar).slice(-10)))

    let fileSize = fs.statSync(options.logFile).size;
    fs.watchFile(options.logFile, function (current, previous) {
        if (current.mtime <= previous.mtime) { return; }
        let newFileSize = fs.statSync(options.logFile).size;
        let sizeDiff = newFileSize - fileSize;
        if (sizeDiff < 0) {
            fileSize = 0;
            sizeDiff = newFileSize;
        }
        let buffer = new Buffer(sizeDiff);
        let fileDescriptor = fs.openSync(options.logFile, 'r');
        fs.readSync(fileDescriptor, buffer, 0, sizeDiff, fileSize);
        fs.closeSync(fileDescriptor);
        fileSize = newFileSize;
        ws.send(JSON.stringify(buffer.toString().split(options.endOfLineChar)))
        
    });
});

server.listen(process.env.PUBLIC_PORT, () => {
	console.log(`http/ws server listening on ${process.env.PUBLIC_PORT}`);
})