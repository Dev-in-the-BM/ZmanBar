const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

var logFile = Gio.file_new_for_path(GLib.get_home_dir() + '/.ZmanBar.log');
var logStream = logFile.append_to(Gio.FileCreateFlags.REPLACE, null);

export function log(message) {
    let time = new Date();
    let logMessage = `[${time.toLocaleDateString()} ${time.toLocaleTimeString()}] ${message}\n`;
    logStream.write(logMessage, null);
}

export function close() {
    logStream.close(null);
}

// Add a timeout to flush the stream periodically
Mainloop.timeout_add_seconds(5, () => {
    logStream.flush(null);
    return true; // Keep the timeout running
});
