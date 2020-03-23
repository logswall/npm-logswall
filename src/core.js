const WebSocket = require('ws');
const uuidv4 = require('uuid').v4;

const Console = (options) => {
    const ws = new WebSocket(options.url || "https://api.logswall.com", { headers: { "Authentication": "Barear " + options.apiSecret } });

    ws.on('error', function error(err) {
        if (err) {
            visio.error = true;
            visio.connected = false;
        }
        console.log(err);
    });

    ws.on('open', function open() {
        visio.connected = true;
        let message;

        while (message = visio.console.queue.shift()) {
            commitMessage(message);
        };

        if (visio.closed) {
            ws.close();
        }
    });

    const toMessage = (...args) => {
        return {
            i: uuidv4(),
            q: options.queueId,
            t: "console",
            m: args
        }
    }

    const commitMessage = (message) => {
        ws.send(JSON.stringify(message));
    }

    const logObject = (message) => {
        return {
            update: (...args) => {
                message = Object.assign(message, { m: args });
                commitMessage(message);
                return logObject(message)
            }
        }
    }

    const visio = {
        connected: false,
        closed: false,
        error: false,
        console: {
            queue: [],
            log: (...args) => {
                const message = toMessage(...args);
                if (visio.connected) {
                    commitMessage(message)
                    console.log(...args)
                } else {
                    visio.console.queue.push(message);
                }

                return logObject(message)
            }
        },
        done: () => {
            visio.closed = true;

            if (!visio.console.queue.length) {
                ws.close();
            }
        }
    }

    return visio;
}

module.exports = { Console }
