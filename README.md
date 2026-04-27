# News Reader

A dynamic news application with a TypeScript-based full-stack architecture. This project features a backend server powered by Express.js and a modern frontend built with React and Vite.

## 📋 Project Overview

The News Reader application allows users to stay updated with the latest news by fetching data from The News API. The application is designed with a client-server architecture, separating the frontend (web) and backend (server) components.

## 🏗️ Project Structure

```
news-reader/
├── server/          # Express.js backend server
├── web/             # React + Vite frontend application
├── package.json     # Root package configuration
├── .env.example     # Environment variables template
└── .gitignore       # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/essamE-dev/news-reader.git
cd news-reader
```

2. Install dependencies for both server and web:
```bash
npm run server:install
```

3. Set up environment variables:
```bash
# Copy the .env.example file and rename it to .env
cp .env.example server/.env
```

4. Add your API token from [The News API](https://www.thenewsapi.com/):
```bash
# Edit server/.env and add your THENEWSAPI_TOKEN
THENEWSAPI_TOKEN=your_thenewsapi_token_here
PORT=5177
```

### Development

Run both server and web development servers concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Start the server
npm run server:dev

# Terminal 2: Start the web application
npm run web:dev
```

**Access the application:**
- Frontend: http://localhost:5176
- Backend API: http://localhost:5177

## 📦 Tech Stack

### Backend
- **Express.js** - Web framework for Node.js
- **CORS** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable management
- **node-fetch** - Fetch API for Node.js

### Frontend
- **React** 18 - UI library
- **Vite** - Next generation frontend tooling
- **TypeScript** - Static type checking
- **React DOM** - React package for working with the DOM

### Development Tools
- **concurrently** - Run multiple npm scripts simultaneously
- **TypeScript** - Type safety and better development experience

## 📂 Available Scripts

### Root Level
- `npm run server:install` - Install dependencies for both server and web
- `npm run server:dev` - Run server in development mode
- `npm run web:dev` - Run web application in development mode
- `npm run dev` - Run both server and web concurrently

### Server (server/)
- `npm run dev` - Start the Express server

### Web (web/)
- `npm run dev` - Start the Vite development server
- `npm run build` - Build the TypeScript and Vite application
- `npm run preview` - Preview the production build

## 🔐 Environment Variables

Create a `.env` file in the `server/` directory:

```env
THENEWSAPI_TOKEN=your_api_token_here
PORT=5177
```

- **THENEWSAPI_TOKEN** - Your API token from [The News API](https://www.thenewsapi.com/)
- **PORT** - Port on which the server will run (default: 5177)

## 📝 License

This project is currently unlicensed.

## 👤 Author

**essamE-dev** - [GitHub Profile](https://github.com/essamE-dev)

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [The News API Documentation](https://www.thenewsapi.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
