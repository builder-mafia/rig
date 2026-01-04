# ALLIN

An open-source AI all-in-one kit with chat interface and extensible features.

## About

ALLIN is a platform that bundles various AI-powered features in a single place. Currently focused on providing a ChatGPT/Gemini-like chat interface, with plans to continuously add more creative AI features.

## Project Structure

```
ALLIN/
├── apps/
│   ├── web/              # Next.js web application
│   └── desktop-app/      # Tauri desktop application
├── packages/
│   ├── allin-api/        # API definitions for extensions
│   ├── allin-extension/  # Extension system core
│   ├── chat/             # Chat functionality (providers, facades)
│   ├── db-atom/          # Database state management
│   ├── db-schema/        # Database schemas
│   ├── message-metadata-schema/  # Message metadata types
│   └── ui/               # Shared UI components (shadcn/ui)
└── extensions/
    └── quiz/             # Example extension (quiz feature)
```

## Tech Stack

- **Framework**: Next.js 15, React 19
- **Desktop**: Tauri (Rust)
- **State Management**: Jotai + RxJS
- **UI**: shadcn/ui, Tailwind CSS, Lucide Icons
- **Database**: IndexedDB
- **AI Providers**: OpenAI, Google AI, Anthropic
- **Testing**: Vitest
- **Monorepo**: Turbo + pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.6.0+

### Installation

```bash
# Install dependencies
pnpm install

# Run web app in development mode
pnpm dev

# Run desktop app
pnpm dev:app

# Build all apps
pnpm build

# Run tests
pnpm test
```

## Contributing

Contributions are welcome in any form:

- New AI feature ideas
- UX/UI improvements
- Performance optimizations
- Test coverage and refactoring
- Documentation

Please open an issue to discuss your ideas or submit a pull request.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

