# Dashboard Data Flow

## Overview

The data flow in the Dashboard component is a critical aspect of the application. This document explains how data is loaded, processed, and visualized, including the handling of errors, fallbacks, and user interactions.

## Data Flow Diagram

```
┌─────────────────┐     ┌───────────────┐     ┌───────────────────┐
│ User Interaction│────▶│ API Request   │────▶│ Data Processing   │
└─────────────────┘     └───────────────┘     └───────────────────┘
                                                        │
┌─────────────────┐     ┌───────────────┐              ▼
│ User Feedback   │◀────│ UI Rendering  │◀────┌───────────────────┐
└─────────────────┘     └───────────────┘     │ State Management  │
                                └─────────────│                   │
                                              └───────────────────┘
```

## Initialization and Data Loading

### Initial Load

When the Dashboard component mounts, it triggers the initial data loading process:

```jsx
// Load data when component mounts
useEffect(() => {
  loadData();
}, [loadData]);
```

### The loadData Function

```jsx
const loadData = useCallback(async (retryCount = 0) => {
  try {
    setLoading(true);
    setError(null);
    
    // First load essential KPI data
    const statsData = await fetchStats();
    
    // Process data before setting state
    // This ensures we have valid defaults for all data structures
    if (!statsData.monthly_sales || !Array.isArray(statsData.monthly_sales)) {
      console.warn('Monthly sales data is missing or not an array, using fallback data');
      statsData.monthly_sales = FALLBACK_DATA.monthly_sales;
    }
    
    if (!statsData.monthly_avg_values || !Array.isArray(statsData.monthly_avg_values)) {
      console.warn('Monthly average values data is missing or not an array, using fallback data');
      statsData.monthly_avg_values = FALLBACK_DATA.monthly_avg_values;
    }
    
    // Set initial data 
    setStats(statsData);
    setLoading(false);
    
    // Mark charts as loaded after a slight delay
    setTimeout(() => {
      setChartLoading({
        monthlySales: false,
        avgOrderValue: false,
        stateValues: false,
        topProducts: false
      });
    }, 300);
    
    // Load filter options in background
    fetchFilterOptions()
      .then(optionsData => setFilterOptions(optionsData))
      .catch(err => console.warn('Filter options loading failed:', err));
    
  } catch (err) {
    console.error('Dashboard data loading error:', err);
    
    // Implement retry logic (max 3 retries)
    if (retryCount < 3) {
      console.log(`Retrying data load (attempt ${retryCount + 1} of 3)...`);
      setTimeout(() => loadData(retryCount + 1), 1000 * (retryCount + 1)); // Exponential backoff
      return;
    }
    
    setError('Failed to load dashboard data. Please check your connection and try again.');
    setLoading(false);
  }
}, []);
```

The `loadData` function:

1. **Initiates Loading State**:
   - Sets `loading` to true
   - Clears any previous errors

2. **API Request**:
   - Calls the `fetchStats` function from the API service
   - Awaits the response asynchronously

3. **Data Validation**:
   - Checks if expected data structures exist
   - Replaces missing or invalid data with fallback values
   - Logs warnings for missing data

4. **State Updates**:
   - Sets the `stats` state with the processed data
   - Updates loading state to false

5. **Progressive UI Updates**:
   - Updates individual chart loading states after a short delay
   - Creates a smoother loading experience

6. **Background Loading**:
   - Loads filter options in the background
   - Doesn't block the main UI rendering

7. **Error Handling**:
   - Catches exceptions during the process
   - Implements retry logic with exponential backoff
   - Sets error state if retries fail

## Data Processing

Once data is loaded, it needs to be processed for visualization:

### Data Formatting

```jsx
const formatTimeSeriesData = useCallback((data, labelKey = 'Month', valueKey = 'Total') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { labels: [], values: [] };
  }

  // Ensure data is sorted by date
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a[labelKey].replace('-', '/') + '/01');
    const dateB = new Date(b[labelKey].replace('-', '/') + '/01');
    return dateA - dateB;
  });

  // Format the month labels for better display
  const formattedLabels = sortedData.map(item => {
    const [year, month] = item[labelKey].split('-');
    const date = new Date(`${year}-${month}-01`);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  });

  const values = sortedData.map(item => parseFloat(item[valueKey]) || 0);

  return { labels: formattedLabels, values };
}, []);
```

This function:
- Validates input data
- Sorts time series data chronologically
- Formats date labels for better display
- Extracts numerical values
- Returns a structured object for chart rendering

### Chart Data Preparation

Each chart has its own preparation function:

```jsx
const prepareMonthlySalesChart = useCallback(() => {
  // Try to use the API data first
  let chartData = stats?.monthly_sales;
  
  // If no valid API data, use fallback data
  if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
    console.warn('Using fallback data for monthly sales chart');
    chartData = FALLBACK_DATA.monthly_sales;
  }
  
  const { labels, values } = formatTimeSeriesData(chartData, 'Month', 'Total');
  
  return {
    labels,
    datasets: [
      {
        label: 'Monthly Sales',
        data: values,
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}15`,
        fill: true,
        borderWidth: 2,
      },
    ],
  };
}, [stats?.monthly_sales, formatTimeSeriesData]);
```

These functions:
- Extract relevant data from the global stats state
- Apply appropriate fallbacks if data is missing
- Call formatters to structure the data
- Add styling information
- Return complete chart configurations

## State Management

The Dashboard component manages multiple state variables:

```jsx
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [filterOptions, setFilterOptions] = useState({});
const [filters, setFilters] = useState({
  status: 'All',
  delivery_status: 'All',
  state: 'All',
  payment_method: 'All',
  from_date: '',
  to_date: '',
});
const [chartLoading, setChartLoading] = useState({
  monthlySales: true,
  avgOrderValue: true,
  stateValues: true,
  topProducts: true
});
```

These states represent:
- The main data (`stats`)
- Overall loading state (`loading`)
- Error messages (`error`)
- Available filter options (`filterOptions`)
- Current filter selections (`filters`)
- Individual chart loading states (`chartLoading`)

## User Interactions

### Filter Applications

```jsx
const applyFilters = async () => {
  try {
    setLoading(true);
    
    // Build query parameters from non-empty filters
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        params[key] = value;
      }
    });

    // Fetch filtered stats
    const response = await axios.get(`http://localhost:8000/filtered-stats`, { 
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    setStats({
      ...stats, // Keep other stats
      // Update with filtered data
      total_records: response.data.total_count,
      total_sales: response.data.total_sales,
      total_quantity: response.data.total_quantity,
      avg_order_value: response.data.avg_order_value,
      state_values: response.data.state_breakdown,
      status_counts: response.data.status_breakdown
    });
    
    setLoading(false);
  } catch (err) {
    setError('Failed to apply filters. Please try again.');
    setLoading(false);
    console.error('Filter application error:', err);
  }
};
```

When users apply filters:
1. The loading state is activated
2. Non-empty filter values are collected
3. An API request is made with the filter parameters
4. The stats state is updated with filtered data
5. The loading state is deactivated
6. Errors are handled if the request fails

### Data Refresh

```jsx
const refreshData = useCallback(() => {
  // Reset chart loading states
  setChartLoading({
    monthlySales: true,
    avgOrderValue: true,
    stateValues: true,
    topProducts: true
  });
  
  // Load data
  loadData();
}, [loadData]);
```

When users request a data refresh:
1. Chart loading states are reset
2. The loadData function is called to fetch fresh data

### Filter Changes

```jsx
const handleFilterChange = (e) => {
  const { name, value } = e.target;
  setFilters(prev => ({
    ...prev,
    [name]: value
  }));
};
```

When users change filter values:
1. The event target's name and value are extracted
2. The filters state is updated with the new value
3. The UI reflects the new filter selection

### Filter Reset

```jsx
const resetFilters = () => {
  setFilters({
    status: 'All',
    delivery_status: 'All',
    state: 'All',
    payment_method: 'All',
    from_date: '',
    to_date: '',
  });
  // Reload original stats
  fetchStats()
    .then(data => setStats(data))
    .catch(err => {
      setError('Failed to reset filters. Please try again.');
      console.error('Filter reset error:', err);
    });
};
```

When users reset filters:
1. The filters state is reset to default values
2. The original, unfiltered stats are loaded
3. Errors are handled if the request fails

## Error Handling

The Dashboard implements a comprehensive error handling strategy:

```jsx
const renderErrorMessage = useCallback(() => {
  if (!error) return null;
  
  return (
    <Alert 
      severity="error" 
      sx={{ mb: 3 }}
      action={
        <Button 
          color="inherit" 
          size="small" 
          onClick={refreshData}
          disabled={loading}
        >
          Retry
        </Button>
      }
    >
      {error}
    </Alert>
  );
}, [error, refreshData, loading]);
```

Error handling includes:
1. Catching exceptions during API requests
2. Setting error messages in state
3. Displaying error alerts to users
4. Providing retry functionality
5. Falling back to default data when possible

## Fallback Data

To ensure the UI always has data to display, the component includes fallback datasets:

```jsx
const FALLBACK_DATA = {
  monthly_sales: [
    { Month: '2023-01', Total: 42500 },
    { Month: '2023-02', Total: 38900 },
    // Additional data...
  ],
  monthly_avg_values: [
    { Month: '2023-01', avg_value: 1250 },
    { Month: '2023-02', avg_value: 1180 },
    // Additional data...
  ]
};
```

This fallback data is used when:
- API requests fail completely
- The API returns incomplete or malformed data
- Specific data structures are missing

## Rendering Strategy

The Dashboard uses a conditional rendering strategy:

```jsx
// Render loading state
if (loading && !stats) {
  return (
    <DashboardLayout title="Dashboard">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '70vh',
        }}
      >
        <CircularProgress />
      </Box>
    </DashboardLayout>
  );
}

// Render error state
if (error && !stats) {
  return (
    <DashboardLayout title="Dashboard">
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    </DashboardLayout>
  );
}
```

For the main component:
1. If loading and no data, show a centered loading spinner
2. If error and no data, show a full-page error alert
3. Otherwise, render the complete dashboard

For individual charts:

```jsx
const renderChart = useCallback((chartKey, chartComponent) => {
  if (chartLoading[chartKey]) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={30} />
      </Box>
    );
  }
  
  return chartComponent;
}, [chartLoading]);
```

This function:
1. Checks if the specific chart is loading
2. Shows a loading spinner if loading
3. Otherwise renders the chart component

## Data Flow Summary

1. **Component Mount**:
   - `useEffect` calls `loadData`
   - `loadData` fetches data from the API
   - Fallback data is used if needed
   - `stats` state is updated

2. **Data Processing**:
   - Chart preparation functions extract data from `stats`
   - Data is formatted for visualization
   - Chart configurations are created

3. **Rendering**:
   - Component renders based on loading/error states
   - Charts render based on individual loading states
   - KPI cards show summary statistics

4. **User Interactions**:
   - Filter changes update the `filters` state
   - Filter application triggers new API requests
   - Data refresh reloads all data
   - Errors show alerts with retry options

5. **Error Recovery**:
   - Automatic retries for failed requests
   - Fallback to default data when possible
   - User-initiated retries via UI buttons

This comprehensive data flow ensures that the Dashboard provides a robust user experience with appropriate feedback at all stages of the process. 