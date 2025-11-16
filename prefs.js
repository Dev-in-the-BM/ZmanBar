

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup?version=3.0';
import GLib from 'gi://GLib';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { log, logError } from './logger.js';

export default class ZmanBarPreferences extends ExtensionPreferences {
    constructor(metadata) {
        super(metadata);
        this._httpSession = Soup.Session.new();
        this._searchTimeout = null;
        this._currentSearchMessage = null; // To track the current request
        this._window = null;
        this._searchResults = [];
        this._spinner = null;
    }

    _onWindowDestroy() {
        log('ZmanBar Preferences window closed.');
        log('ZmanBar Preferences window opened.');
    }

    fillPreferencesWindow(window) {
        log('Filling preferences window...');
        this.settings = this.getSettings();

        this._window = window;
        this._window.connect('destroy', this._onWindowDestroy.bind(this));

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Location Settings',
            description: 'Set your location to get accurate Zmanim.',
        });
        page.add(group);
        window.add(page);

        // --- Location Expander Row ---
        const locationExpander = new Adw.ExpanderRow({
            title: 'Location',
            subtitle: this.settings.get_string('location-name') || 'Not Set',
        });
        group.add(locationExpander);

        const contentBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 6,
            margin_top: 6,
            margin_bottom: 6,
        });
        locationExpander.add_row(contentBox);

        const searchEntry = new Gtk.SearchEntry({
            placeholder_text: 'Enter a location, like "Monsey" or "10952"',
            hexpand: true,
        });
        contentBox.append(searchEntry);

        this._spinner = new Gtk.Spinner({
            halign: Gtk.Align.CENTER,
            margin_top: 12,
            margin_bottom: 12,
            spinning: false,
            visible: false,
        });
        contentBox.append(this._spinner);

        this._resultsBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            visible: false, // Initially hidden
        });
        contentBox.append(this._resultsBox);


        // --- Event Handlers ---
        searchEntry.connect('search-changed', () => {
            const query = searchEntry.get_text().trim();
            log(`Search text changed: "${query}"`);
            if (this._searchTimeout) {
                GLib.source_remove(this._searchTimeout);
            }
            this._searchTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                const query = searchEntry.get_text().trim();
                if (query.length > 2) {
                    this._performSearch(query);
                } else {
                    this._clearResults();
                }
                this._searchTimeout = null;
                return GLib.SOURCE_REMOVE;
            });
        });

    }

    _performSearch(query) {
        log(`Searching for location: "${query}"`);
        this._clearResults();

        this._spinner.set_visible(true);
        this._spinner.start();

        // Cancel any ongoing search
        if (this._currentSearchMessage) {
            this._httpSession.cancel_message(this._currentSearchMessage, Soup.Status.CANCELLED);
            this._currentSearchMessage = null;
        }

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
        this._currentSearchMessage = new Soup.Message({
            method: 'GET',
            uri: GLib.Uri.parse(url, GLib.UriFlags.NONE)
        });
        this._currentSearchMessage.request_headers.append('User-Agent', `GNOME Shell Extension ZmanBar/${this.metadata.version} (https://github.com/dev-in-the-bm/ZmanBar)`);
        const message = this._currentSearchMessage;

        this._httpSession.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, result) => {
            // Clear the current message reference once the callback is entered.
            this._currentSearchMessage = null;
            this._spinner.stop();
            this._spinner.set_visible(false);

            try {
                const bytes = session.send_and_read_finish(result);
                const response = new TextDecoder().decode(bytes.get_data());
                log(`Nominatim response: ${response}`);
                const data = JSON.parse(response);
                this._updateResults(data);
            }
            catch (error) {
                // Don't log an error if the request was intentionally cancelled
                if (error instanceof GLib.Error && error.matches(Soup.http_error_quark(), Soup.Status.CANCELLED)) {
                    log('Location search was cancelled.');
                } else {
                    logError(error, 'Error fetching location');
                }
                this._clearResults();
            }
        });
    }

    _updateResults(results) {
        this._clearResults();
        this._searchResults = results || []; // Store results

        const resultCount = this._searchResults.length;
        this._spinner.stop();
        this._spinner.set_visible(false);

        log(`Found ${resultCount} results for location search.`);
        log(`Search results: ${JSON.stringify(this._searchResults)}`);

        if (resultCount === 0) {
            const noResultsLabel = new Gtk.Label({
                label: 'No results found.',
                margin_top: 12,
                margin_bottom: 12,
                css_classes: ['dim-label'],
            });
            this._resultsBox.append(noResultsLabel);
        } else {
            this._searchResults.forEach((result, index) => {
                const parts = result.display_name.split(', ');
                const title = parts[0];
                const subtitle = parts.slice(1).join(', ');

                const row = new Adw.ActionRow({
                    title: title,
                    subtitle: subtitle || '',
                    activatable: true,
                });

                row.connect('activated', () => {
                    log(`Location selected: ${result.display_name}`);
                    log(`Setting location to: Lat ${result.lat}, Lon ${result.lon}`);
                    this.settings.set_string('location-name', result.display_name);
                    this.settings.set_double('latitude', parseFloat(result.lat));
                    this.settings.set_double('longitude', parseFloat(result.lon));

                    // Update the expander subtitle and close it
                    const expander = this._resultsBox.get_ancestor(Adw.ExpanderRow);
                    if (expander) {
                        expander.set_subtitle(result.display_name);
                        expander.set_expanded(false);
                    }

                    // Clear search
                    const searchEntry = this._resultsBox.get_ancestor(Gtk.Box).get_first_child();
                    if (searchEntry instanceof Gtk.SearchEntry) {
                        searchEntry.set_text('');
                    }
                    this._clearResults();
                });

                this._resultsBox.append(row);
            });
        }
        this._resultsBox.set_visible(true);
    }

    _clearResults() {
        log('Clearing search results.');
        this._spinner.stop();
        this._spinner.set_visible(false);
        this._searchResults = [];
        let child = this._resultsBox.get_first_child();
        while (child) {
            this._resultsBox.remove(child);
            child = this._resultsBox.get_first_child();
        }
        this._resultsBox.set_visible(false);
    }
}
