# Tab Save Server

A simple Node.js server for receiving and archiving tab exports from the Tab-Save Chrome extension.

## Quick Start

1. Install Node.js (v12+)
2. Clone this repo and `cd tab-save-server`
3. (Recommended) set auth token:
   ```bash
   # macOS / Linux / Git Bash
   export TAB_SAVE_TOKEN="your-strong-token"
   ```
   ```powershell
   # Windows PowerShell
   $env:TAB_SAVE_TOKEN="your-strong-token"
   ```
4. Run:
   ```
   node src/server.js
   ```

The server listens at `http://localhost:3000`.

## API

- **POST `/api/tabs`**
  - Headers:
    - `Content-Type: application/json`
    - `Authorization: Bearer <TAB_SAVE_TOKEN>`
  - Body:
    ```json
    { "content": "# tabs..." }
    ```
  - Behavior:
    - Overwrites `src/output.md` with the server receive time and `content`
    - Returns `401` if token is invalid
    - Returns `400` if JSON is malformed

- **GET `/tabs`**
  - Returns an HTML page rendering the saved markdown content
  - Links in markdown `(https://...)` are converted to clickable anchors

- **OPTIONS** (CORS preflight) is supported.

## Notes

- Default token is `changeme` if `TAB_SAVE_TOKEN` is not set (not recommended for production use).
- Output file path is `tab-save-server/src/output.md`.

> This server is optional. Use it only if you want your extension to periodically send tab data to an HTTP server, instead of exporting manually.

## License

GNU General Public License v3.0
