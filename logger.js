import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

let _logStream = null;
let _logFile = null;

function _getLogFile() {
    if (!_logFile) {
        _logFile = Gio.File.new_for_path(GLib.get_home_dir() + '/.ZmanBar.log');
    }
    return _logFile;
}

function _getStream() {
    if (!_logStream) {
        const logFile = _getLogFile();
        try {
            // Open the file for appending, creating it if it doesn't exist.
            const rawStream = logFile.append_to(Gio.FileCreateFlags.NONE, null);
            _logStream = new Gio.DataOutputStream({
                base_stream: rawStream,
                close_base_stream: true,
            });

            // Write the initialization message directly and synchronously.
            const time = new Date();
            const separator = '-----\n';
            const logMessage = `[${time.toLocaleDateString()} ${time.toLocaleTimeString()}] INFO: Log file initialized at: ${logFile.get_path()}\n`;
            _logStream.write_all(new TextEncoder().encode(separator), null);
            _logStream.write_all(new TextEncoder().encode(logMessage), null);

        } catch (e) {
            console.error('Error opening log file: ' + e.message);
        }
    }
    return _logStream;
}

export function getLogFilePath() {
    return _getLogFile().get_path();
}

export function log(message) {
    const stream = _getStream();
    if (!stream) {
        console.log('Log stream not available, logging to console:', message);
        return;
    }

    const time = new Date();
    const logMessage = `[${time.toLocaleDateString()} ${time.toLocaleTimeString()}] INFO: ${message}\n`;

    // Synchronously write to the log file
    try {
        stream.write_all(new TextEncoder().encode(logMessage), null);
    } catch (e) {
        console.error('Failed to write to log file: ' + e.message);
    }
}

export function logError(error, message = 'An error occurred') {
    const stream = _getStream();
    if (!stream) {
        console.error('Log stream not available, logging error to console:', message, error);
        return;
    }

    const time = new Date();
    let errorMessage = `[${time.toLocaleDateString()} ${time.toLocaleTimeString()}] ERROR: ${message}\n`;

    if (error instanceof GLib.Error) {
        errorMessage += `Domain: ${error.domain}, Code: ${error.code}, Message: ${error.message}\n`;
    } else if (error instanceof Error) {
        errorMessage += `Stack: ${error.stack}\n`;
    } else {
        errorMessage += `Details: ${error}\n`;
    }

    // Synchronously write to the log file
    try {
        stream.write_all(new TextEncoder().encode(errorMessage), null);
    } catch (e) {
        console.error('Failed to write error to log file: ' + e.message);
    }
}

export function close() {
    if (_logStream) {
        log('Closing log stream.');
        _logStream.close(null);
        _logStream = null;
    }
}