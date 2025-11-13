

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
        this._window = null;
        this._searchResults = [];
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

        const searchEntry = new Gtk.SearchEntry({
            placeholder_text: 'e.g., "New York, NY" or "90210"',
            hexpand: true,
            margin_top: 6,
            margin_bottom: 6,
        });
        locationExpander.add_row(searchEntry);

        this._resultsListBox = new Gtk.ListBox({
            margin_top: 6,
            selection_mode: Gtk.SelectionMode.SINGLE,
            visible: false, // Initially hidden
        });
        locationExpander.add_row(this._resultsListBox);


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

        this._resultsListBox.connect('row-activated', (box, row) => {
            const index = row.get_index();
            const result = this._searchResults[index];

            if (result) {
                log(`Location selected: ${result.display_name}`);
                log(`Setting location to: Lat ${result.lat}, Lon ${result.lon}`);
                this.settings.set_string('location-name', result.display_name);
                this.settings.set_double('latitude', parseFloat(result.lat));
                this.settings.set_double('longitude', parseFloat(result.lon));

                locationExpander.set_subtitle(result.display_name);
                searchEntry.set_text('');
                this._clearResults();
                locationExpander.set_expanded(false);
            }
        });
    }

    _performSearch(query) {
        log(`Searching for location: "${query}"`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
        const message = new Soup.Message({
            method: 'GET',
            uri: GLib.Uri.parse(url, GLib.UriFlags.NONE)
        });
        message.request_headers.append('User-Agent', `GNOME Shell Extension ZmanBar/${this.metadata.version} (https://github.com/dev-in-the-bm/ZmanBar)`);

        this._httpSession.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, result) => {
            try {
                const bytes = session.send_and_read_finish(result);
                const response = new TextDecoder().decode(bytes.get_data());
                log(`Nominatim response: ${response}`);
                const data = JSON.parse(response);
                this._updateResults(data);
            }
            catch (e) {
                logError(e, 'Error fetching location');
                this._clearResults();
            }
        });
    }

    _updateResults(results) {
        this._clearResults();
        this._searchResults = results || []; // Store results

        const resultCount = this._searchResults.length;
        log(`Found ${resultCount} results for location search.`);
        log(`Search results: ${JSON.stringify(this._searchResults)}`);

        if (resultCount === 0) {
            const row = new Gtk.ListBoxRow();
            row.set_child(new Gtk.Label({ label: 'No results found.', margin_top: 6, margin_bottom: 6 }));
            row.set_selectable(false);
            this._resultsListBox.append(row);
        } else {
            this._searchResults.forEach(result => {
                const row = new Gtk.ListBoxRow();
                const label = new Gtk.Label({
                    label: result.display_name,
                    halign: Gtk.Align.START,
                    margin_top: 6,
                    margin_bottom: 6,
                    margin_start: 6,
                    margin_end: 6,
                });
                row.set_child(label);
                this._resultsListBox.append(row);
            });
        }
        this._resultsListBox.set_visible(true);
    }

    _clearResults() {
        log('Clearing search results.');
        this._searchResults = [];
        while (this._resultsListBox.get_row_at_index(0)) {
            this._resultsListBox.remove(this._resultsListBox.get_row_at_index(0));
        }
        this._resultsListBox.set_visible(false);
    }
}
