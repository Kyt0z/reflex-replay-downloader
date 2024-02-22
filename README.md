# Reflex Arena Replay Downloader

### WARNING!
This is likely unsafe to use on any publicly available web server. Only use on a local webserver! The reason is that `fetch.php` is very crude - it does **no spam checking**, **no timeout checking** and **no caching**.

## Requirements
- Web server with PHP
  - must be able to `file_get_contents(...)` on remote URLs