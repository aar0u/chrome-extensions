# Tab-Save

Open-Source Chrome Extension for Exporting/Importing Open Tabs + Archiving in Various Formats and File Types

## Features
- Export all open tabs as markdown links
- (Optional) Periodically POST your tab list to a local server for backup or remote access

## Optional Server
- See `tab-save-server/README.md` for setup
- The server is not required for manual export; use it only if you want automated, periodic HTTP export

## Release Zip
```
7z a release.zip ./* -xr!tab-save-server -xr!.git -x!package.json -x!README.md
```

## License

GNU General Public License v3.0
