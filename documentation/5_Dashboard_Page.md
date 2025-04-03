# Dashboard Page

## Overview

The `Dashboard.js` file located in `frontend/src/pages` is the main dashboard view of the application. It displays key performance indicators (KPIs) and various charts visualizing Shopify sales data.

## Component Structure

The Dashboard component is a complex React functional component that:
- Fetches and processes data from the backend API
- Manages state for data, loading, errors, and filters
- Prepares data for various chart visualizations
- Renders KPI cards, charts, and filter controls
- Handles user interactions like filtering and refreshing data

## State Management

```jsx
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [filterOptions, setFilterOptions] = useState({});
  
// Filter state
const [filters, setFilters] = useState({
  status: 'All',
  delivery_status: 'All',
  state: 'All',
  payment_method: 'All',
  from_date: '',
  to_date: '',
});

// Loading states for individual charts
const [chartLoading, setChartLoading] = useState({
  monthlySales: true,
  avgOrderValue: true,
  stateValues: true,
  topProducts: true
});
```

The component manages several state variables:
- `stats`: Contains all data fetched from the API
- `loading`: Tracks overall loading state
- `error`: Stores error messages if API requests fail
- `filterOptions`: Available options for filter controls
- `filters`: Current filter settings
- `chartLoading`: Loading states for individual charts

## Data Loading

```jsx
// Optimize loadData function
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
1. Sets loading state and clears any previous errors
2. Fetches statistics data from the API
3. Validates and processes the received data
4. Uses fallback data if API data is missing or invalid
5. Updates state with the processed data
6. Progressively updates chart loading states
7. Loads filter options in the background
8. Implements retry logic with exponential backoff if requests fail

## Chart Data Preparation

The component includes several functions to prepare data for different chart types:

### Time Series Data Formatter

```jsx
// Memoize formatTimeSeriesData for performance
const formatTimeSeriesData = useCallback((data, labelKey = 'Month', valueKey = 'Total') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { labels: [], values: [] };
  }

  // Ensure data is sorted by date
  const sortedData = [...data].sort((a, b) => {
    // Convert to comparable format (assuming YYYY-MM format)
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
- Takes raw time series data and extracts labels and values
- Sorts data chronologically
- Formats date labels for better display
- Returns an object with arrays for chart labels and values

### Monthly Sales Chart

```jsx
// Memoize the prepareMonthlySalesChart function
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

This function:
- Accesses monthly sales data from the stats state
- Falls back to sample data if needed
- Uses the formatter to get labels and values
- Returns a complete dataset for Chart.js

### Other Chart Preparation Functions

Similar functions exist for other chart types:
- `prepareAvgOrderValueChart`: Prepares average order value time series
- `prepareStateValueChartData`: Prepares geographic sales distribution
- `prepareStatusChartData`: Prepares order status distribution
- `prepareDeliveryStatusChartData`: Prepares delivery status distribution
- `preparePaymentMethodChartData`: Prepares payment method distribution
- `prepareTopSkusChart`: Prepares top products by order count

## Chart Rendering

```jsx
// Add renderMonthlySalesChart function with memoization
const renderMonthlySalesChart = useCallback(() => {
  const chartData = prepareMonthlySalesChart();
  
  if (!chartData) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="textSecondary" sx={{ mb: 1 }}>No monthly sales data available</Typography>
        <Typography variant="caption" color="text.secondary">
          Check the backend response format or ensure data is being provided
        </Typography>
      </Box>
    );
  }
  
  return <Line data={chartData} options={lineOptions} />;
}, [prepareMonthlySalesChart, lineOptions]);
```

Each chart has a dedicated render function that:
- Gets the prepared data from the appropriate preparation function
- Handles cases where data is missing or invalid
- Returns either the chart component or an appropriate message
- Uses memoization to prevent unnecessary re-renders

### Generic Chart Rendering

```jsx
// Add a simple and well-defined renderChart function
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

This function provides a consistent way to:
- Show loading indicators for charts that are still loading
- Render the actual chart component when data is ready

## Filter Handling

```jsx
// Apply filters
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

const handleFilterChange = (e) => {
  const { name, value } = e.target;
  setFilters(prev => ({
    ...prev,
    [name]: value
  }));
};
```

These functions:
- Update filter state when filter controls change
- Apply filters to get filtered data from the API
- Reset filters and reload original data

## Error Handling

```jsx
// Restore the renderErrorMessage function
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

This function:
- Displays error messages when API requests fail
- Provides a retry button to attempt data loading again
- Is conditionally rendered only when errors exist

## Component Rendering

The component renders a complex UI with:
1. **Dashboard Layout Wrapper**: Provides consistent layout
2. **Error Messages**: Shows errors with retry options
3. **Filter Bar**: Controls for filtering data
4. **KPI Cards**: Four cards showing key metrics
5. **Charts Section**: Various charts showing different aspects of the data
6. **Footer**: Copyright and timestamp information

## Component Optimization

The component is heavily optimized using:
1. **Memoization**: `useCallback` and `useMemo` to prevent unnecessary recalculations
2. **Progressive Loading**: Charts load progressively to improve perceived performance
3. **Fallback Data**: Default data ensures UI is always populated
4. **Error Recovery**: Retry mechanisms and clear error states
5. **Loading Indicators**: Visual feedback during data loading

## Chart Configuration

The component uses custom chart configurations:

```jsx
// Enhanced Chart Options with consistent theme
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 15,
        font: {
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          size: 12,
        },
        color: colors.text,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleFont: {
        family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        size: 13
      },
      titleColor: colors.text,
      bodyColor: colors.textLight,
      borderColor: colors.border,
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 4,
      usePointStyle: true,
    },
  },
};
```

These configurations are further specialized for different chart types:
- `lineOptions`: Enhanced options for line charts
- `barOptions`: Enhanced options for bar charts
- `pieOptions`: Enhanced options for pie charts

## Flow of Execution

1. **Component Mount**:
   - `useEffect` hook calls `loadData`
   - API request is made to fetch statistics

2. **Data Processing**:
   - API response is validated
   - Fallback data is used if needed
   - Data is formatted for charts

3. **Rendering**:
   - Loading indicators are shown initially
   - KPI cards and charts are rendered when data is available
   - Error messages are displayed if loading fails

4. **User Interactions**:
   - Filter changes update filter state
   - Filter application triggers new API requests
   - Refresh button reloads all data
   - Chart section refresh buttons reload specific charts

## Performance Considerations

The Dashboard component implements several performance optimizations:
1. **Memoization**: Prevents unnecessary recalculations
2. **Lazy Loading**: Charts load progressively
3. **Fallback Data**: Ensures UI is always populated
4. **Optimized Chart Rendering**: Minimizes re-renders
5. **Responsive Design**: Adapts to different screen sizes 