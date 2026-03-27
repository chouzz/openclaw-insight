# OpenClaw Insight

A web application for analyzing and visualizing OpenClaw logs.

## Features

- **Session List**: View all OpenClaw sessions with their statistics
- **Event Timeline**: Visualize the event flow for each session
- **Tool Call Analysis**: Statistics and analysis of tool calls
- **Token Usage Tracking**: Track token consumption and costs
- **Search and Filter**: Filter by session ID, tool type, and more
- **Internationalization (i18n)**: Auto-detects system language and supports English and Chinese

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- pnpm
- next-intl for internationalization

## Quick Start

### Install Dependencies

```bash
pnpm install
```

### Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

The application will automatically detect your system language and display in English or Chinese accordingly.

### Build for Production

```bash
pnpm build
pnpm start
```

## Log Location

The application reads logs from the directory:
```
/Users/zhouhua/.openclaw/agents/main/sessions
```

To change the log directory, edit the `LOGS_DIR` constant in `src/lib/logParser.ts`.

## Project Structure

```
src/
├── app/
│   ├── [locale]/                    # Localized routes
│   │   ├── session/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx         # Session detail page
│   │   ├── page.tsx                 # Home page
│   │   └── layout.tsx               # Locale layout with i18n provider
│   ├── api/
│   │   └── logs/
│   │       ├── route.ts             # Get all sessions API
│   │       └── [sessionId]/
│   │           └── route.ts         # Get single session API
│   ├── globals.css                  # Global styles
│   └── layout.tsx                   # Root layout
├── lib/
│   └── logParser.ts                 # Log parsing utilities
└── types/
    └── log.ts                       # TypeScript type definitions
```

## Internationalization

The application uses `next-intl` for internationalization with the following features:

- **Auto-detection**: Automatically detects browser/system language
- **Supported locales**: English (en) and Chinese (zh-CN)
- **Default locale**: English
- **URL structure**: Routes are prefixed with locale (e.g., `/en/`, `/zh-CN/`)

### Adding a New Language

1. Add the locale to `i18n.ts`:
   ```typescript
   export const locales = ['en', 'zh-CN', 'es'] as const;
   ```

2. Create translation file `messages/es.json`

3. Update middleware matcher in `middleware.ts`

### Translation Files

Translation files are located in the `messages/` directory:
- `messages/en.json` - English translations
- `messages/zh-CN.json` - Chinese translations

## Data Visualization

### Home Page

- Overview of all sessions
- Overall statistics: sessions, events, tokens, cost, tool calls
- Search and filter functionality
- Session list with key information for each session

### Session Detail Page

- Session information and statistics
- Tool call statistics (success/failure counts)
- Event timeline with filter options
  - Messages (user/assistant/system)
  - Tool calls
  - Tool results
  - Thinking level changes
  - Custom events

## Development Tips

- Log parsing is done on the server side (Node.js Runtime)
- Frontend uses TypeScript and React 19
- Responsive design supporting desktop and mobile devices
- Uses `useTranslations` hook from next-intl for all UI text

## Testing

Run tests with:

```bash
pnpm test
```

Run tests with coverage:

```bash
pnpm test:coverage
```

Run tests in watch mode:

```bash
pnpm test:watch
```

## License

MIT
