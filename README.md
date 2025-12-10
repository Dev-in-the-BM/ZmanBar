# ZmanBar

### Hebrew Date for GNOME

![ZmanBar](https://github.com/Dev-in-the-BM/ZmanBar/blob/main/screenshot.png?raw=true)

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png" alt="Sparkles" width="50" height="50" /> Features

* Displays the Hebrew date (day and month) in the top panel.
* Shows the full Hebrew date (including year) in the calendar menu.
* Lightweight and native, with minimal resource usage.

---

[![get it on gnome extensions](https://github.com/Dev-in-the-BM/ZmanBar/blob/main/get_it_on_gnome_extensions.png?raw=true)](https://extensions.gnome.org/extension/8774/zmanbar/)

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png" alt="Party Popper" width="50" height="50" /> New - version 1.0 release

**New in this release:** The Hebrew date now updates after shkiah.
You can set your location in the extensions settings, so the extension can calcualte when shkiah is.

<details>
  <summary>Click to view instructions for installing from source</summary>

```sh
# 1. Clone the repository
git clone https://github.com/Dev-in-the-BM/ZmanBar.git

# 2. Copy the extension files
cp -r ZmanBar/ ~/.local/share/gnome-shell/extensions/ZmanBar@dev-in-the-bm.github.io/
```

3. Restart GNOME Shell (`Alt`+`F2`, `r`, `Enter` on X11, or log out/in on Wayland).
4. Enable "ZmanBar" in the Extensions app.

</details>

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png" alt="Red Heart" width="50" height="50" /> Support This Project

If you find this extension useful, please consider supporting its development.

<a href="https://www.buymeacoffee.com/devinthebm" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

<br>

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Hammer%20and%20Wrench.png" alt="Hammer and Wrench" width="50" height="50" /> Development

ZmanBar is a GNOME Shell extension written in modern JavaScript (ESM) for the GJS environment. It integrates with core GNOME components by modifying the existing clock and calendar menu labels (`St.Label`) to include the Hebrew date. Date calculations are handled by an adapted version of the `jewish-date` library.

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📜 License

This project is licensed under the GPL3 License.

