
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Gdk from 'gi://Gdk';
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export const createAboutPage = (metadata, settings) => {
    const aboutPage = new Adw.PreferencesPage({
        title: _('About'),
        iconName: 'info-symbolic',
    });

    const group = new Adw.PreferencesGroup();
    aboutPage.add(group);

    const clamp = new Adw.Clamp({
        maximum_size: 450,
        margin_top: 24,
        margin_bottom: 24,
    });
    group.add(clamp);

    const box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
    });
    clamp.set_child(box);

    if (metadata.icon) {
        const icon = new Gtk.Image({
            icon_name: metadata.icon,
            pixel_size: 64,
            margin_bottom: 12,
        });
        box.append(icon);
    }
    const nameLabel = new Gtk.Label({
        use_markup: true,
        label: `<span size="xx-large" weight="bold">${metadata.name}</span>`,
        justify: Gtk.Justification.CENTER,
        margin_bottom: 12,
    });
    box.append(nameLabel);

    const hebrewDateLabel = new Gtk.Label({
        use_markup: true,
        label: `<span size="large" weight="bold">${_('Hebrew Date for GNOME')}</span>`,
        justify: Gtk.Justification.CENTER,
        margin_bottom: 12,
    });
    box.append(hebrewDateLabel);

    const infoGroup = new Adw.PreferencesGroup();
    box.append(infoGroup);

    const versionRow = new Adw.ActionRow({
        title: _('Version'),
        subtitle: '1.0.0',
        icon_name: 'info-symbolic',
        activatable: true,
    });
    infoGroup.add(versionRow);

    const loggingGroup = new Adw.PreferencesGroup({
        title: _('Developer Settings'),
        visible: false,
    });
    box.append(loggingGroup);

    const loggingRow = new Adw.SwitchRow({
        title: _('Enable Logging'),
        subtitle: _('Enable verbose logging for debugging.'),
    });
    loggingGroup.add(loggingRow);

    settings.bind('enable-logging', loggingRow, 'active', Gio.SettingsBindFlags.DEFAULT);

    let clickCount = 0;
    const versionClick = new Gtk.GestureClick();
    versionClick.connect('released', () => {
        clickCount++;
        if (clickCount >= 5) {
            loggingGroup.set_visible(true);
        }
    });
    versionRow.add_controller(versionClick);


    const githubRow = new Adw.ActionRow({
        title: _('GitHub'),
        subtitle: metadata.url,
        activatable: true,
    });
    const githubFile = Gio.File.new_for_path(metadata.path + '/github-mark-white.svg');
    const githubIcon = new Gtk.Image({
        gicon: new Gio.FileIcon({ file: githubFile }),
        pixel_size: 24,
    });
    githubRow.add_prefix(githubIcon);
    githubRow.connect('activated', () => {
        Gio.AppInfo.launch_default_for_uri(metadata.url, null);
    });
    infoGroup.add(githubRow);

    box.append(new Gtk.Separator({ margin_top: 24, margin_bottom: 24 }));

    const devNameLabel = new Gtk.Label({
        use_markup: true,
        label: '<span size="xx-large" weight="bold">Hi 👋, I\'m Dev-in-the-BM</span>',
        justify: Gtk.Justification.CENTER,
        margin_bottom: 12,
    });
    box.append(devNameLabel);

    const devInfoGroup = new Adw.PreferencesGroup({
        margin_bottom: 0,
    });
    box.append(devInfoGroup);

    const siteRow = new Adw.ActionRow({
        title: _('Check out my site:'),
        subtitle: 'https://dev-in-the-bm.github.io',
        activatable: true,
    });
    const siteIcon = new Gtk.Image({
        icon_name: 'web-browser-symbolic',
    });
    siteRow.add_prefix(siteIcon);
    siteRow.connect('activated', () => {
        Gio.AppInfo.launch_default_for_uri('https://dev-in-the-bm.github.io/', null);
    });
    devInfoGroup.add(siteRow);

    const jtechRow = new Adw.ActionRow({
        title: _('Or say hi on JTech Forums :'),
        subtitle: 'https://forums.jtechforums.org',
        activatable: true,
    });
    const jtechFile = Gio.File.new_for_path(metadata.path + '/Jtech_logo.png');
    const jtechIcon = new Gtk.Image({
        gicon: new Gio.FileIcon({ file: jtechFile }),
        pixel_size: 24,
    });
    jtechRow.add_prefix(jtechIcon);
    jtechRow.connect('activated', () => {
        Gio.AppInfo.launch_default_for_uri('https://forums.jtechforums.org/invites/DSQpWEfMbr', null);
    });
    devInfoGroup.add(jtechRow);

    const bmcImage = new Gtk.Image({
        gicon: new Gio.FileIcon({ file: Gio.File.new_for_path(metadata.path + '/bmc-button.svg') }),
        pixel_size: 200,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        margin_top: 0,
    });
    bmcImage.set_tooltip_text(_('Buy me a coffee'));

    const gesture = new Gtk.GestureClick();
    gesture.connect('released', () => {
        Gio.AppInfo.launch_default_for_uri('https://www.buymeacoffee.com/devinthebm', null);
    });
    bmcImage.add_controller(gesture);

    const motion = new Gtk.EventControllerMotion();
    motion.connect('enter', () => {
        bmcImage.set_state_flags(Gtk.StateFlags.PRELIGHT, false);
        bmcImage.set_cursor(Gdk.Cursor.new_from_name('pointer'));
    });
    motion.connect('leave', () => {
        bmcImage.unset_state_flags(Gtk.StateFlags.PRELIGHT);
        bmcImage.set_cursor(null);
    });
    bmcImage.add_controller(motion);

    box.append(bmcImage);

    return aboutPage;
};
