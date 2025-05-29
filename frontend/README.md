# Vocaria Frontend

React frontend for the Vocaria application.

## Features

- Modern chat interface
- Authentication (Login/Register)
- Conversation management
- Real-time messaging
- Responsive design with Tailwind CSS
- State management with React Query

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

4. The application will be available at `http://localhost:5173`

## Project Structure

- `/src/api` - API client and configuration
- `/src/components` - Reusable React components
- `/src/hooks` - Custom React hooks
- `/src/pages` - Page components
- `/src/types` - TypeScript type definitions
- `/src/styles` - Global styles and Tailwind configuration

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Technologies Used

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query
- Axios
- Headless UI
- Heroicons

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001/api
```
