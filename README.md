# FlowPilot

AI-powered FlowPilot: Professional Webflow CMS management application

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Franksami/Flowpilot.git
   cd Flowpilot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Framework**: Next.js 15.3.5 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.x with JIT compilation
- **State Management**: Zustand with persistence
- **UI Components**: Shadcn/UI with Radix primitives
- **Forms**: React Hook Form with Zod validation
- **Security**: HTTP-only cookies, encrypted localStorage, CSP headers
- **Development**: ESLint, Prettier, Husky pre-commit hooks

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
├── components/            # React components
│   ├── onboarding/       # Onboarding flow components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and core logic
│   ├── actions/          # Next.js Server Actions
│   ├── auth/             # Authentication utilities
│   ├── store/            # Zustand state management
│   └── types/            # TypeScript type definitions
├── .github/workflows/    # CI/CD pipelines
└── .taskmaster/         # Task management system
```

## 🔐 Security Features

- **Server-side API proxy** - No client-side API key exposure
- **Secure token storage** - HTTP-only cookies with encrypted localStorage fallback
- **Input validation** - Zod schemas for all user inputs
- **CSP headers** - Content Security Policy protection
- **XSS protection** - Input sanitization and secure headers

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
```

## 🧪 Development Workflow

1. **Code Quality**: Pre-commit hooks ensure code quality
2. **Type Safety**: TypeScript strict mode catches errors early
3. **Testing**: Build verification and linting on every commit
4. **CI/CD**: GitHub Actions pipeline for automated checks

## 📊 TaskMaster Integration

This project uses TaskMaster for project management:

```bash
# Check current tasks
task-master list

# Get next task to work on
task-master next

# Mark task as complete
task-master set-status --id=<task-id> --status=done
```

## 🔗 External Integrations

- **Webflow API**: Secure server-side integration
- **GitHub Actions**: Automated CI/CD pipeline
- **Vercel/Netlify**: Deployment ready

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
ENCRYPTION_KEY=your-32-character-key
WEBFLOW_BASE_URL=https://api.webflow.com/v2
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### Docker

```bash
docker build -t flowpilot .
docker run -p 3000:3000 flowpilot
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Open an issue on GitHub
- **TaskMaster Help**: Run `task-master help` in the project directory

---

Built with ❤️ for modern web development

# Trigger deployment
