import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

let _settings;
let _logFileStream = null;
let _enableLogging = false;
let _enableFileLogging = false;

function _destroyStream() {
    if (_logFileStream) {
        _logFileStream.close(null);
        _logFileStream = null;
    }
}

async function _createStream() {
    _destroyStream(); 
    if (!_enableFileLogging) return;

    const logFile = Gio.File.new_for_path(GLib.get_home_dir() + '/.ZmanBar.log');
    
    logFile.append_to_async(
        Gio.FileCreateFlags.NONE, // Use NONE to create or append
        GLib.PRIORITY_DEFAULT,
        null,
        (file, res) => {
            try {
                const stream = file.append_to_finish(res);
                _logFileStream = new Gio.DataOutputStream({
                    base_stream: stream,
                    close_base_stream: true,
                });
                log('Log file initialized at: ' + logFile.get_path());
            } catch (e) {
                console.error('ZmanBar: Error creating log file stream: ' + e.message);
            }
        }
    );
}

export function init(settings) {
    _settings = settings;
    _enableLogging = _settings.get_boolean('enable-logging');
    _enableFileLogging = _settings.get_boolean('enable-file-logging');
    
    _createStream();

    _settings.connect('changed::enable-logging', () => {
        _enableLogging = _settings.get_boolean('enable-logging');
        if (!_enableLogging) {
            _enableFileLogging = false; 
            _settings.set_boolean('enable-file-logging', false);
        }
        log(`Journal logging has been ${(_enableLogging ? 'enabled' : 'disabled')}`);
    });

    _settings.connect('changed::enable-file-logging', () => {
        _enableFileLogging = _settings.get_boolean('enable-file-logging');
        log(`File logging has been ${(_enableFileLogging ? 'enabled' : 'disabled')}`);
        if (_enableFileLogging) {
            _createStream();
        } else {
            _destroyStream();
        }
    });

    log('Logger initialized.');
}

export function close() {
    log('Closing logger.');
    _destroyStream();
    _settings = null;
}

function _logToFile(message) {
    if (!_logFileStream || !_enableFileLogging) return;

    const time = GLib.DateTime.new_now_local();
    const logMessage = `[${time.format('%Y-%m-%d %H:%M:%S')}] ${message}\n`;

    _logFileStream.write_all_async(
        new TextEncoder().encode(logMessage),
        GLib.PRIORITY_DEFAULT,
        null,
        (stream, res) => {
            try {
                stream.write_all_finish(res);
            } catch (e) {
                console.error('Failed to write to log file: ' + e.message);
            }
        }
    );
}

function _logToJournal(message) {
    if (!_enableLogging) return;
    console.log(`ZmanBar: ${message}`);
}

export function log(message) {
    _logToJournal(`INFO: ${message}`);
    _logToFile(`INFO: ${message}`);
}

export function logError(error, message = 'An error occurred') {
    let fullMessage = `ERROR: ${message}`;
    if (error instanceof GLib.Error) {
        fullMessage += ` | Domain: ${error.domain}, Code: ${error.code}, Message: ${error.message}`;
    } else if (error instanceof Error) {
        fullMessage += ` | Stack: ${error.stack}`;
    } else {
        fullMessage += ` | Details: ${error}`;
    }
    _logToJournal(fullMessage);
    _logToFile(fullMessage);
}
