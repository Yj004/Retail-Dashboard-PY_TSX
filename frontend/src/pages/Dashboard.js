import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import DashboardLayout from '../components/DashboardLayout';
import { fetchStats, fetchFilterOptions } from '../utils/api';
import axios from 'axios';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// Professional color scheme
const colors = {
  primary: '#1a237e',    // Deep indigo
  secondary: '#3949ab',  // Medium indigo
  accent: '#5c6bc0',     // Light indigo
  light: '#e8eaf6',      // Very light indigo
  success: '#388e3c',    // Green
  error: '#d32f2f',      // Red
  warning: '#f57c00',    // Orange
  info: '#0288d1',       // Blue
  text: '#263238',       // Dark blue-grey
  textLight: '#546e7a',  // Medium blue-grey
  background: '#f8f9fa', // Light grey
  white: '#ffffff',      // White
  border: '#e0e0e0',     // Grey border
};

// Add fallback data for charts
const FALLBACK_DATA = {
  monthly_sales: [
    { Month: '2023-01', Total: 42500 },
    { Month: '2023-02', Total: 38900 },
    { Month: '2023-03', Total: 45700 },
    { Month: '2023-04', Total: 52300 },
    { Month: '2023-05', Total: 49800 },
    { Month: '2023-06', Total: 58200 },
    { Month: '2023-07', Total: 62100 },
    { Month: '2023-08', Total: 57600 },
    { Month: '2023-09', Total: 64700 },
    { Month: '2023-10', Total: 72300 },
    { Month: '2023-11', Total: 85600 },
    { Month: '2023-12', Total: 94800 },
  ],
  monthly_avg_values: [
    { Month: '2023-01', avg_value: 1250 },
    { Month: '2023-02', avg_value: 1180 },
    { Month: '2023-03', avg_value: 1310 },
    { Month: '2023-04', avg_value: 1350 },
    { Month: '2023-05', avg_value: 1290 },
    { Month: '2023-06', avg_value: 1425 },
    { Month: '2023-07', avg_value: 1390 },
    { Month: '2023-08', avg_value: 1450 },
    { Month: '2023-09', avg_value: 1520 },
    { Month: '2023-10', avg_value: 1480 },
    { Month: '2023-11', avg_value: 1570 },
    { Month: '2023-12', avg_value: 1620 },
  ]
};

const Dashboard = () => {
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

  // Add loading states for individual charts
  const [chartLoading, setChartLoading] = useState({
    monthlySales: true,
    avgOrderValue: true,
    stateValues: true,
    topProducts: true
  });

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

  // Update line chart options to better handle time series data
  const lineOptions = {
    ...chartOptions,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
            size: 11,
          },
          color: colors.textLight,
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
            size: 11,
          },
          color: colors.textLight,
          // Format the y-axis values as currency
          callback: (value) => {
            if (value >= 1000) {
              return '₹ ' + (value / 1000).toFixed(1) + 'k';
            }
            return '₹ ' + value.toLocaleString();
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6,
        borderWidth: 3,
        hoverBorderWidth: 3,
        backgroundColor: colors.white,
      },
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '₹ ' + context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
            size: 11,
          },
          color: colors.textLight,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
            size: 11,
          },
          color: colors.textLight,
          callback: (value) => '₹ ' + value.toLocaleString(),
        },
      },
    },
    barPercentage: 0.7,
    categoryPercentage: 0.7,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const dataset = context.dataset;
            const index = context.dataIndex;
            
            // Use original data if available
            if (dataset.originalData) {
              const originalData = dataset.originalData[index];
              return `${originalData.sku}: ${originalData.count.toLocaleString()} (${originalData.percentage}%)`;
            }
            
            // Default formatting
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    }
  };

  const pieOptions = {
    ...chartOptions,
    cutout: '40%',
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'bottom',
      },
    },
  };

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
  }, []);  // Empty dependency array since it doesn't depend on any props or state

  // Modify the refresh function to also handle progressive loading
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

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [loadData]);  // Add loadData to dependency array

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

  // Remove the getRandomColors function that isn't being used and replace it
  // with a function that generates a gradient of colors based on a base color
  const generateColorGradient = (baseColor, count, opacity = 0.8) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const adjustedOpacity = opacity - (i * 0.05);
      colors.push(`${baseColor}${Math.max(0.3, adjustedOpacity).toFixed(2)})`);
    }
    return colors;
  };

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

  // Memoize the prepareAvgOrderValueChart function
  const prepareAvgOrderValueChart = useCallback(() => {
    // Try to use the API data first
    let chartData = stats?.monthly_avg_values;
    
    // If no valid API data, use fallback data
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
      console.warn('Using fallback data for average order value chart');
      chartData = FALLBACK_DATA.monthly_avg_values;
    }
    
    const { labels, values } = formatTimeSeriesData(chartData, 'Month', 'avg_value');
    
    return {
      labels,
      datasets: [
        {
          label: 'Average Order Value',
          data: values,
          borderColor: colors.info,
          backgroundColor: `${colors.info}15`,
          fill: true,
          borderWidth: 2,
        },
      ],
    };
  }, [stats?.monthly_avg_values, formatTimeSeriesData]);

  // Memoize the prepareStateValueChartData function
  const prepareStateValueChartData = useCallback(() => {
    if (!stats || !stats.state_values) return null;
    
    // Sort states by value and get the top 10
    const sortedStates = Object.entries(stats.state_values)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const data = {
      labels: sortedStates.map(([state]) => state),
      datasets: [
        {
          label: 'Sales by State',
          data: sortedStates.map(([, value]) => value),
          backgroundColor: sortedStates.map((_, index) => {
            const opacity = 1 - (index * 0.05);
            return `rgba(92, 107, 192, ${opacity})`;
          }),
          borderColor: sortedStates.map((_, index) => {
            const opacity = 1 - (index * 0.05);
            return `rgba(57, 73, 171, ${opacity})`;
          }),
          borderWidth: 1,
        },
      ],
    };
    return data;
  }, [stats?.state_values]);

  const prepareStatusChartData = () => {
    if (!stats || !stats.status_counts) return null;
    
    const statusColors = {
      'Confirmed': colors.success,
      'Pending': colors.warning,
      'Cancelled': colors.error,
      'Refunded': colors.accent,
      'Shipped': colors.info,
    };

    const data = {
      labels: Object.keys(stats.status_counts),
      datasets: [
        {
          data: Object.values(stats.status_counts),
          backgroundColor: Object.keys(stats.status_counts).map(
            status => statusColors[status] || `rgba(92, 107, 192, 0.7)`
          ),
          borderColor: colors.white,
          borderWidth: 2,
        },
      ],
    };
    return data;
  };

  const prepareDeliveryStatusChartData = () => {
    if (!stats || !stats.delivery_status_counts) return null;

    const deliveryStatusColors = {
      'Delivered': colors.success,
      'Pending': colors.warning,
      'Failed': colors.error,
      'In Transit': colors.primary,
      'Out for Delivery': colors.info,
    };
    
    const data = {
      labels: Object.keys(stats.delivery_status_counts),
      datasets: [
        {
          data: Object.values(stats.delivery_status_counts),
          backgroundColor: Object.keys(stats.delivery_status_counts).map(
            status => deliveryStatusColors[status] || `rgba(92, 107, 192, 0.7)`
          ),
          borderColor: colors.white,
          borderWidth: 2,
        },
      ],
    };
    return data;
  };

  const preparePaymentMethodChartData = () => {
    if (!stats || !stats.payment_method_counts) return null;

    const paymentMethodColors = {
      'Credit Card': colors.primary,
      'Debit Card': colors.secondary,
      'UPI': colors.info,
      'COD': colors.warning,
      'Net Banking': colors.accent,
      'Wallet': colors.success,
    };
    
    const data = {
      labels: Object.keys(stats.payment_method_counts),
      datasets: [
        {
          data: Object.values(stats.payment_method_counts),
          backgroundColor: Object.keys(stats.payment_method_counts).map(
            method => paymentMethodColors[method] || `rgba(92, 107, 192, 0.7)`
          ),
          borderColor: colors.white,
          borderWidth: 2,
        },
      ],
    };
    return data;
  };

  // Memoize the prepareTopSkusChart function
  const prepareTopSkusChart = useCallback(() => {
    if (!stats || !stats.top_skus) return null;
    
    // Sort by order count and get top products
    const sortedSkus = Object.entries(stats.top_skus)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Calculate total for percentage
    const total = sortedSkus.reduce((sum, [, count]) => sum + count, 0);
    
    // Create truncated labels for display
    const truncatedLabels = sortedSkus.map(([sku]) => {
      return sku.length > 15 ? sku.substring(0, 12) + '...' : sku;
    });

    // Generate color gradients for bars
    const backgroundColors = generateColorGradient('rgba(92, 107, 192, ', sortedSkus.length);
    const borderColors = generateColorGradient('rgba(57, 73, 171, ', sortedSkus.length);

    const data = {
      labels: truncatedLabels,
      datasets: [
        {
          label: 'Order Count',
          data: sortedSkus.map(([, count]) => count),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          // Store original data for tooltips
          originalData: sortedSkus.map(([sku, count]) => ({
            sku,
            count,
            percentage: ((count / total) * 100).toFixed(1)
          }))
        },
      ],
    };
    return data;
  }, [stats?.top_skus, generateColorGradient]);

  // Memoize the chart data
  const topSkusChartData = useMemo(() => {
    return prepareTopSkusChart();
  }, [prepareTopSkusChart]);

  // Update the rendering of the Top Products chart
  const renderTopProductsChart = () => {
    if (!stats || !stats.top_skus) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="textSecondary">No product data available</Typography>
        </Box>
      );
    }
    
    return <Bar data={topSkusChartData} options={barOptions} />;
  };

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

  // Update renderAvgOrderValueChart similarly
  const renderAvgOrderValueChart = useCallback(() => {
    const chartData = prepareAvgOrderValueChart();
    
    if (!chartData) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="textSecondary" sx={{ mb: 1 }}>No average order value data available</Typography>
          <Typography variant="caption" color="text.secondary">
            Check the backend response format or ensure data is being provided
          </Typography>
        </Box>
      );
    }
    
    return <Line data={chartData} options={lineOptions} />;
  }, [prepareAvgOrderValueChart, lineOptions]);

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

  return (
    <DashboardLayout title="Dashboard">
      <Box sx={{ 
        backgroundColor: '#f8f9fa', 
        minHeight: '100vh', 
        padding: { xs: 2, md: 3 },
        borderRadius: 2,
      }}>
        <Typography variant="h4" className="page-title" sx={{ 
          mb: 4, 
          mt: 1,
          fontWeight: 700, 
          color: colors.primary, 
          textAlign: 'center',
          borderBottom: `3px solid ${colors.accent}`,
          paddingBottom: 2,
          letterSpacing: '0.5px',
        }}>
          Shopify Sales Dashboard
        </Typography>

        {renderErrorMessage()}

        {/* Filter Bar */}
        <Paper elevation={0} sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          backgroundColor: colors.white,
          border: '1px solid',
          borderColor: colors.border,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterAltIcon sx={{ color: colors.primary, mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text }}>
                Filters
              </Typography>
            </Box>
            <Tooltip title="Reset to default view">
              <IconButton 
                onClick={resetFilters}
                size="small" 
                sx={{ 
                  backgroundColor: colors.light,
                  '&:hover': { backgroundColor: `${colors.primary}15` }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  label="Status"
                  onChange={handleFilterChange}
                >
                  {filterOptions.Status?.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                <InputLabel>Delivery Status</InputLabel>
                <Select
                  name="delivery_status"
                  value={filters.delivery_status}
                  label="Delivery Status"
                  onChange={handleFilterChange}
                >
                  {filterOptions['Deliver Status']?.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                <InputLabel>State</InputLabel>
                <Select
                  name="state"
                  value={filters.state}
                  label="State"
                  onChange={handleFilterChange}
                >
                  {filterOptions.State?.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="payment_method"
                  value={filters.payment_method}
                  label="Payment Method"
                  onChange={handleFilterChange}
                >
                  {filterOptions['Payment Method']?.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                name="from_date"
                value={filters.from_date}
                onChange={handleFilterChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2 
                  } 
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                name="to_date"
                value={filters.to_date}
                onChange={handleFilterChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2 
                  } 
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={applyFilters}
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={16} /> : null}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    backgroundColor: colors.primary,
                    '&:hover': {
                      backgroundColor: colors.secondary,
                      boxShadow: '0 4px 10px rgba(58, 53, 65, 0.3)',
                    }
                  }}
                >
                  {loading ? 'Applying...' : 'Apply Filters'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* KPI Cards Row */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            {/* Card 1: Total Orders */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3,
                  height: '100%',
                  backgroundColor: colors.white,
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: colors.border,
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.2)',
                    transform: 'translateY(-4px)',
                    borderColor: colors.primary,
                  }
                }}
              >
                <CardContent sx={{ p: 0, height: '100%', position: 'relative' }}>
                  <Box 
                    sx={{ 
                      height: '8px', 
                      width: '100%', 
                      backgroundColor: colors.primary,
                    }} 
                  />
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 'calc(100% - 8px)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color={colors.textLight} sx={{ mb: 0.5, fontWeight: 500 }}>
                          Total Orders
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text }}>
                          {stats?.total_records?.toLocaleString() || 0}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          p: 1.5, 
                          borderRadius: '50%', 
                          backgroundColor: `${colors.primary}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShoppingCartIcon 
                          sx={{ 
                            color: colors.primary,
                            fontSize: 28,
                          }} 
                        />
                      </Box>
                    </Box>
                    
                    {/* Trend indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          bgcolor: `${colors.success}15`,
                          color: colors.success,
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption" fontWeight="bold">
                          +5.2%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color={colors.textLight} sx={{ ml: 1 }}>
                        vs last month
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Card 2: Total Sales */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3,
                  height: '100%',
                  backgroundColor: colors.white,
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: colors.border,
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.2)',
                    transform: 'translateY(-4px)',
                    borderColor: colors.success,
                  }
                }}
              >
                <CardContent sx={{ p: 0, height: '100%', position: 'relative' }}>
                  <Box 
                    sx={{ 
                      height: '8px', 
                      width: '100%', 
                      backgroundColor: colors.success,
                    }} 
                  />
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 'calc(100% - 8px)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color={colors.textLight} sx={{ mb: 0.5, fontWeight: 500 }}>
                          Total Sales
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text }}>
                          ₹ {stats?.total_sales?.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          p: 1.5, 
                          borderRadius: '50%', 
                          backgroundColor: `${colors.success}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CurrencyRupeeIcon 
                          sx={{ 
                            color: colors.success,
                            fontSize: 28,
                          }} 
                        />
                      </Box>
                    </Box>
                    
                    {/* Trend indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          bgcolor: `${colors.success}15`,
                          color: colors.success,
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption" fontWeight="bold">
                          +8.3%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color={colors.textLight} sx={{ ml: 1 }}>
                        vs last month
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Card 3: Total Quantity */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3,
                  height: '100%',
                  backgroundColor: colors.white,
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: colors.border,
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.2)',
                    transform: 'translateY(-4px)',
                    borderColor: colors.warning,
                  }
                }}
              >
                <CardContent sx={{ p: 0, height: '100%', position: 'relative' }}>
                  <Box 
                    sx={{ 
                      height: '8px', 
                      width: '100%', 
                      backgroundColor: colors.warning,
                    }} 
                  />
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 'calc(100% - 8px)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color={colors.textLight} sx={{ mb: 0.5, fontWeight: 500 }}>
                          Total Quantity
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text }}>
                          {stats?.total_quantity?.toLocaleString() || 0}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          p: 1.5, 
                          borderRadius: '50%', 
                          backgroundColor: `${colors.warning}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Inventory2Icon 
                          sx={{ 
                            color: colors.warning,
                            fontSize: 28,
                          }} 
                        />
                      </Box>
                    </Box>
                    
                    {/* Trend indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          bgcolor: `${colors.success}15`,
                          color: colors.success,
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption" fontWeight="bold">
                          +3.7%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color={colors.textLight} sx={{ ml: 1 }}>
                        vs last month
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Card 4: Avg. Order Value */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3,
                  height: '100%',
                  backgroundColor: colors.white,
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: colors.border,
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.2)',
                    transform: 'translateY(-4px)',
                    borderColor: colors.info,
                  }
                }}
              >
                <CardContent sx={{ p: 0, height: '100%', position: 'relative' }}>
                  <Box 
                    sx={{ 
                      height: '8px', 
                      width: '100%', 
                      backgroundColor: colors.info,
                    }} 
                  />
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 'calc(100% - 8px)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color={colors.textLight} sx={{ mb: 0.5, fontWeight: 500 }}>
                          Avg. Order Value
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text }}>
                          ₹ {stats?.avg_order_value?.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          p: 1.5, 
                          borderRadius: '50%', 
                          backgroundColor: `${colors.info}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ReceiptIcon 
                          sx={{ 
                            color: colors.info,
                            fontSize: 28,
                          }} 
                        />
                      </Box>
                    </Box>
                    
                    {/* Trend indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          bgcolor: `${colors.error}15`,
                          color: colors.error,
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        <TrendingDownIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption" fontWeight="bold">
                          -1.2%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color={colors.textLight} sx={{ ml: 1 }}>
                        vs last month
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Charts Sections with loading states */}
        <Grid container spacing={3}>
          {/* Monthly Sales Trend */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ 
              p: 3, 
              height: '400px', 
              borderRadius: 3,
              backgroundColor: colors.white,
              border: '1px solid',
              borderColor: colors.border,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text }}>
                  Monthly Sales Trend
                </Typography>
                <Box>
                  <Tooltip title="Refresh Chart Data">
                    <IconButton size="small" onClick={refreshData} sx={{ mr: 1 }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View detailed report">
                    <IconButton size="small">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: '310px' }}>
                {renderChart('monthlySales', renderMonthlySalesChart())}
              </Box>
            </Paper>
          </Grid>

          {/* Average Order Value Trend - with loading state */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ 
              p: 3, 
              height: '400px', 
              borderRadius: 3,
              backgroundColor: colors.white,
              border: '1px solid',
              borderColor: colors.border,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text }}>
                  Average Order Value Trend
                </Typography>
                <Box>
                  <Tooltip title="Refresh Chart Data">
                    <IconButton size="small" onClick={refreshData} sx={{ mr: 1 }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View detailed report">
                    <IconButton size="small">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: '310px' }}>
                {renderChart('avgOrderValue', renderAvgOrderValueChart())}
              </Box>
            </Paper>
          </Grid>

          {/* Sales by State chart - with loading state */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ 
              p: 3, 
              height: '400px', 
              borderRadius: 3,
              backgroundColor: colors.white,
              border: '1px solid',
              borderColor: colors.border,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text }}>
                  Sales by State (Top 10)
                </Typography>
                <Tooltip title="View detailed report">
                  <IconButton size="small">
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: '310px' }}>
                {renderChart('stateValues', 
                  stats && stats.state_values ? (
                    <Bar data={prepareStateValueChartData()} options={barOptions} />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography color="textSecondary">No state data available</Typography>
                    </Box>
                  )
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Top Products chart - with loading state */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ 
              p: 3, 
              height: '400px', 
              borderRadius: 3,
              backgroundColor: colors.white,
              border: '1px solid',
              borderColor: colors.border,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text }}>
                  Top Products (by Order Count)
                </Typography>
                <Tooltip title="View detailed report">
                  <IconButton size="small">
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: '310px' }}>
                {renderTopProductsChart()}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, pb: 2, textAlign: 'center', borderTop: `1px solid ${colors.border}` }}>
          <Typography variant="body2" color={colors.textLight}>
            © {new Date().getFullYear()} Shopify Admin Dashboard | Last updated: {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard; 