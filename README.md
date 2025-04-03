# Shopify Admin Dashboard

An interactive dashboard for Shopify order data with login-based authentication, data visualization, and filtering capabilities.

## Features

- **Secure Authentication:** Login-based access to protect your data
- **Interactive Dashboard:** Visualize sales data with charts and statistics
- **Data Table:** View, filter, and paginate through your order data
- **Extensible Schema:** Add new columns to your data as needed
- **Responsive Design:** Works on desktop and mobile devices

## Project Structure

```
admin_shopify_dashboard/
├── backend/                 # Python FastAPI backend
│   ├── main.py              # Main API file
│   └── requirements.txt     # Python dependencies
├── frontend/                # React frontend
│   ├── public/              # Static files
│   └── src/                 # React source code
│       ├── components/      # Reusable components
│       ├── context/         # Context providers
│       ├── pages/           # Page components
│       └── utils/           # Utility functions
└── Data/                    # Data files
    └── shopify.csv          # Sample order data
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```
   python main.py
   ```

   The API will be available at http://localhost:8000

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

## Usage

1. Log in with the following credentials:
   - Username: admin
   - Password: password123

2. Navigate through the dashboard using the sidebar menu:
   - **Dashboard:** View sales statistics and charts
   - **Data Table:** Browse and filter order data
   - **Settings:** Add new columns to the dataset

## Adding New Columns

1. Go to the Settings page
2. Enter the name of your new column
3. Optionally, provide a default value
4. Click "Add Column"

The new column will be immediately available in the data table.

## Security Note

This application uses a simple in-memory user database for demonstration purposes. For production use, you should implement a proper authentication system with a secure database.

## License

MIT 