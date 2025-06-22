# Coffee Scheduler Frontend

A Next.js frontend application for the Coffee Scheduler - smart coffee chat scheduling across time zones.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit http://localhost:3000 to see the application!

## 🛠 Tech Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Heroicons
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Utilities**: clsx for conditional styling

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── lib/                # Utility libraries
│   ├── api.ts          # API client configuration
│   └── utils.ts        # Helper functions
└── types/              # TypeScript type definitions
    └── index.ts        # Shared types
```

## 🔧 Configuration

### Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend app URL

### Development (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (`.env.production`)
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend-url.com
```

## 🌟 Features Ready to Build

The framework is set up with:

- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ API integration layer with Axios
- ✅ Shared types for backend integration
- ✅ Utility functions for common operations
- ✅ Responsive design foundation
- ✅ Error handling and interceptors

## 🔗 Backend Integration

The frontend is configured to communicate with the coffee scheduler backend:

- Authentication via cookies
- Calendar operations
- Contact management
- Scheduling algorithms

## 📝 Ready for Development

The framework is now ready for feature development. Key areas to implement:

1. **Authentication Pages** - Login/logout flows
2. **Dashboard** - Main user interface
3. **Contact Management** - Add/edit/delete contacts
4. **Scheduling Interface** - Batch scheduling with calendar view
5. **Settings** - User preferences and timezone configuration

## 🎯 Next Steps

Share your vision and specs for the user interface, and we can iterate on:

- Page layouts and navigation
- Component design and interactions
- User experience flows
- Feature prioritization

The foundation is solid and ready for your creative direction!