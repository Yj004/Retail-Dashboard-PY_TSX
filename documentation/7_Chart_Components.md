# Chart Components and Data Visualization

## Overview

The Shopify Admin Dashboard uses Chart.js integrated with React through the `react-chartjs-2` library to create interactive and visually appealing data visualizations. This document explains the chart components, their configuration, and data flow.

## Chart.js Configuration

### Chart.js Registration

```jsx
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
```

The application registers the necessary Chart.js components:
- Scales for categories and numerical values
- Elements for points, lines, bars, and arcs (pie/doughnut charts)
- UI components like titles, tooltips, and legends

### Base Chart Options

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

The base options define shared configuration for all charts:
- Responsive behavior
- Legend styling and positioning
- Tooltip appearance and formatting
- Font families and sizes
- Color schemes

### Specialized Chart Options

The application extends the base options for different chart types:

#### Line Chart Options

```jsx
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
```

Line chart options include:
- Axis styling and grid configuration
- Custom formatting for currency values
- Line and point styling
- Custom tooltips for currency values

#### Bar Chart Options

```jsx
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
```

Bar chart options include:
- Bar width and spacing configuration
- Enhanced tooltips that can display original data values
- Custom formatting for currency and percentages

#### Pie Chart Options

```jsx
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
```

Pie chart options include:
- Cutout percentage (creating a donut chart)
- Legend positioning

## Chart Types and Components

The application implements several types of charts using the `react-chartjs-2` components:

### Line Charts

Used for time series data including:
- Monthly Sales Trend
- Average Order Value Trend

```jsx
<Line data={prepareMonthlySalesChart()} options={lineOptions} />
```

### Bar Charts

Used for categorical data including:
- Sales by State
- Top Products (by Order Count)

```jsx
<Bar data={prepareTopSkusChart()} options={barOptions} />
```

### Pie Charts

Used for distribution data including:
- Order Status Distribution
- Payment Method Distribution
- Delivery Status Distribution

```jsx
<Pie data={prepareStatusChartData()} options={pieOptions} />
```

## Data Preparation for Charts

### Time Series Data Formatter

```jsx
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

This utility function:
- Takes raw time series data
- Handles validation and empty data cases
- Sorts data chronologically
- Formats date labels for better readability
- Extracts numerical values
- Returns labeled data suitable for charts

### Monthly Sales Chart Preparation

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

This function:
- Accesses monthly sales data from the application state
- Falls back to sample data if necessary
- Uses the formatter to process the data
- Returns a complete configuration object for Chart.js with:
  - Labels (dates)
  - Dataset with values
  - Visual styling (colors, borders, etc.)

### Top Products Chart Preparation

```jsx
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
```

This function:
- Processes product order data
- Sorts products by order count
- Limits to top 10 products
- Calculates percentages
- Truncates long SKU names for display
- Stores original data for tooltips
- Applies color gradients
- Returns a complete chart configuration

## Chart Rendering and Loading States

The application implements custom rendering functions for charts that handle loading states:

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
- Takes a chart key and component
- Shows a loading spinner if the chart is still loading
- Renders the actual chart component when data is ready

## Advanced Styling Features

### Color Gradient Generator

```jsx
const generateColorGradient = (baseColor, count, opacity = 0.8) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const adjustedOpacity = opacity - (i * 0.05);
    colors.push(`${baseColor}${Math.max(0.3, adjustedOpacity).toFixed(2)})`);
  }
  return colors;
};
```

This function:
- Creates an array of color values with decreasing opacity
- Takes a base color and count of items
- Generates a visually appealing gradient
- Ensures minimum opacity for visibility

### Enhanced Tooltips

```jsx
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
```

The tooltip callbacks:
- Provide custom formatting for different chart types
- Display additional context like percentages
- Format numbers for readability
- Show original values for truncated labels

## Chart Optimization

The application implements several optimization strategies:

1. **Memoization**: Uses React's `useCallback` and `useMemo` to prevent unnecessary recalculations
2. **Conditional Rendering**: Only renders charts when data is available
3. **Fallback Data**: Ensures charts are displayed even if API data is missing
4. **Progressive Loading**: Charts load individually rather than all at once
5. **Efficient Styling**: Reuses style configurations across chart types 