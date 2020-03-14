# What's Missing
__What's Missing__ is a userscript youtube extension which saves the list of videos in a youtube playlist to find out a video's name in case it gets deleted or set to private.

## How do I install it?

You require the browser extension [Tamper Monkey](https://www.tampermonkey.net/) to use this script.

To install the script, simply access the [OpenUserJS](https://openuserjs.org/scripts/fletcher/Whats_Missing) link and click on the "Install" button OR copy paste the [JS file](./What's\ Missing.user.js) into a Tamper Monkey's new script.

## How does one use it?

When active, the script adds a div container with buttons to the playlist page, below the title and statistics. If the playlist isn't saved, a button named 'Save Playlist' will appear. If the playlist is saved, three buttons will show:
- Update Save: updates the playlist save.
- Check: verify if there are missing videos.
- Delete Save: deletes the playlist save.

Not Saved Playlist            |  Saved Playlist
:-------------------------:|:-------------------------:
![Unsaved](./examples/unsaved.jpg) | ![Saved](./examples/saved.jpg)

The script doesn't keep track of any changes you make, so make sure you update the save often.

If you have more than 100 videos on the playlist, __make sure you scroll down until the last video appears__ before saving or updating the playlist because the saving process depends on it.

__WARNING:__ The saves are stored inside Tamper Monkey's memory. If you uninstall it or the browser itself, the saves will be deleted.

## Credits

- [Rodrigo Neves](https://github.com/r-neves)