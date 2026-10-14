# Key Manager Architecture

API keys are encrypted at rest using Electron's `safeStorage` API with AES-256-CBC hardware-bound key fallback.
