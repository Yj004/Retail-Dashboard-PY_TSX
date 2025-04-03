# Retail Dashboard

An interactive dashboard for retail order data with login-based authentication, data visualization, and filtering capabilities.

[View the live deployment on Vercel](#) (Link to be added after deployment)

## Features

- **Secure Authentication:** Login-based access to protect your data
- **Interactive Dashboard:** Visualize sales data with charts and statistics
- **Advanced Filtering:** Filter data by multiple criteria (date, status, etc.)
- **Data Table:** View, filter, and paginate through your order data
- **Extensible Schema:** Add new columns to your data as needed
- **Responsive Design:** Works on desktop and mobile devices

## Project Structure

```
retail-dashboard/
├── api/                  # Node.js Express API
│   ├── index.js          # Main API file
│   └── package.json      # Node.js dependencies
├── frontend/             # React frontend
│   ├── public/           # Static files
│   └── src/              # React source code
│       ├── components/   # Reusable components
│       ├── context/      # Context providers
│       ├── pages/        # Page components
│       └── utils/        # Utility functions
└── Data/                 # Data files
    └── retail_data.csv   # Sample retail data
```

## Tech Stack

### Frontend:
- React with functional components and hooks
- Material UI for components and styling
- Chart.js for data visualization
- React Router for navigation
- Context API for state management
- Axios for API requests

### Backend:
- Node.js with Express for the API framework
- JWT for authentication
- CSV parsing for data management
- Deployed on Vercel

## Local Development Setup

### Backend Setup

1. Navigate to the API directory:
   ```
   cd api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the backend server:
   ```
   npm start
   ```

   The API will be available at http://localhost:3001

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

   The application will be available at http://localhost:3000

### Combined Development

1. From the root directory, you can start both frontend and backend:
   ```
   npm run dev
   ```

## Deployment

This project is configured for deployment on Vercel using the `vercel.json` configuration file, which:

1. Sets up serverless API functions for the Node.js backend
2. Configures routing for both the API and frontend
3. Sets necessary environment variables

To deploy:
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically build and deploy both the API and frontend

## Usage

1. Log in with the following credentials:
   - Username: admin
   - Password: password123

2. Navigate through the dashboard using the sidebar menu:
   - **Dashboard:** View sales statistics and charts
   - **Data Table:** Browse and filter order data
   - **Settings:** Add new columns to the dataset

## Security Note

This application uses a simple in-memory user database for demonstration purposes. For production use, implement a proper authentication system with a secure database.

## License

MIT
