
let logHistory = [];
let logConnections = new Map();
let connectionId = 0;

export function log(message) {
    const formattedMessage = `ZmanBar: ${message}`;
    console.log(formattedMessage);
    addLogEntry('LOG', formattedMessage);
}

export function logError(error, message) {
    const formattedMessage = `ZmanBar Error: ${message}`;
    console.error(formattedMessage, error);
    addLogEntry('ERROR', `${formattedMessage} - ${error.message}`);
}

function addLogEntry(level, message) {
    const logEntry = {
        timestamp: new Date(),
        level,
        message,
    };
    logHistory.push(logEntry);
    for (const [id, callback] of logConnections) {
        try {
            callback(logEntry);
        } catch (e) {
            console.error(`Error in log connection ${id}:`, e);
        }
    }
}

export function getLogs() {
    return logHistory;
}

export function connectToLogs(callback) {
    const id = connectionId++;
    logConnections.set(id, callback);
    return id;
}

export function disconnectFromLogs(id) {
    logConnections.delete(id);
}
