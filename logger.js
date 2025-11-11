const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

let _logStream = null;

function _getStream() {
    if (!_logStream) {
        const logFile = Gio.File.new_for_path(GLib.get_home_dir() + '/.ZmanBar.log');
        // Open the file for appending, creating it if it doesn't exist.
        // Using REPLACE is risky if the extension restarts quickly. APPEND is safer.
        const rawStream = logFile.append_to(Gio.FileCreateFlags.NONE, null);
        _logStream = new Gio.DataOutputStream({
            base_stream: rawStream,
            close_base_stream: true,
        });
    }
    return _logStream;
}

export function log(message) {
    const stream = _getStream();
    const time = new Date();
    const logMessage = `[${time.toLocaleDateString()} ${time.toLocaleTimeString()}] ${message}\n`;

    // Asynchronously write to the log file without blocking the UI
    stream.put_string(logMessage, null, (stream, res) => {
        stream.put_string_finish(res);
    });
}

export function close() {
    if (_logStream) {
        _logStream.close(null);
        _logStream = null;
    }
}
