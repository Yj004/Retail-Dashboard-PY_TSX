import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DashboardLayout from '../components/DashboardLayout';
import { fetchData, fetchFilteredData, fetchFilterOptions } from '../utils/api';

const DataTable = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState({});
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [rowCount, setRowCount] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    delivery_status: '',
    country: '',
    province: '',
    payment_method: '',
    from_date: '',
    to_date: '',
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [dataResult, optionsResult] = await Promise.all([
          fetchData(0, pageSize),
          fetchFilterOptions(),
        ]);
        
        setData(dataResult);
        setRowCount(dataResult.length > pageSize ? 1000 : dataResult.length); // Estimate row count
        
        if (dataResult.length > 0) {
          // Create columns dynamically from the first row
          const cols = Object.keys(dataResult[0]).map((key) => ({
            field: key,
            headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            flex: 1,
            minWidth: 150,
          }));
          setColumns(cols);
        }
        
        setFilterOptions(optionsResult);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
        console.error(err);
      }
    };

    loadInitialData();
  }, [pageSize]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Remove empty filters
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        );
        
        const skip = page * pageSize;
        const data = await fetchFilteredData(activeFilters, skip, pageSize);
        
        setData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
        console.error(err);
      }
    };

    loadData();
  }, [page, pageSize, filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(0); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      delivery_status: '',
      country: '',
      province: '',
      payment_method: '',
      from_date: '',
      to_date: '',
    });
    setPage(0);
  };

  // Render loading state
  if (loading && data.length === 0) {
    return (
      <DashboardLayout title="Data Table">
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
  if (error && data.length === 0) {
    return (
      <DashboardLayout title="Data Table">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Order Data">
      <Typography variant="h4" className="page-title">
        Order Data
      </Typography>

      {/* Filter Section */}
      <Paper elevation={2} className="filter-bar">
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Order Status"
              name="status"
              select
              value={filters.status}
              onChange={handleFilterChange}
              margin="normal"
              variant="outlined"
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions.Status?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Delivery Status"
              name="delivery_status"
              select
              value={filters.delivery_status}
              onChange={handleFilterChange}
              margin="normal"
              variant="outlined"
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions['Deliver Status']?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Country"
              name="country"
              select
              value={filters.country}
              onChange={handleFilterChange}
              margin="normal"
              variant="outlined"
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions['Shipping Country']?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Province"
              name="province"
              select
              value={filters.province}
              onChange={handleFilterChange}
              margin="normal"
              variant="outlined"
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions['Shipping Province']?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Payment Method"
              name="payment_method"
              select
              value={filters.payment_method}
              onChange={handleFilterChange}
              margin="normal"
              variant="outlined"
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions['Payment Method']?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleClearFilters}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="From Date"
              name="from_date"
              type="date"
              value={filters.from_date}
              onChange={handleFilterChange}
              margin="normal"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="To Date"
              name="to_date"
              type="date"
              value={filters.to_date}
              onChange={handleFilterChange}
              margin="normal"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Data Table */}
      <Paper elevation={2} sx={{ mt: 3, p: 0, height: 650, width: '100%' }}>
        <DataGrid
          rows={data.map((row, index) => ({ ...row, id: index }))}
          columns={columns}
          page={page}
          pageSize={pageSize}
          rowsPerPageOptions={[25, 50, 100]}
          pagination
          paginationMode="server"
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowCount={rowCount}
          loading={loading}
          disableSelectionOnClick
          density="standard"
          sx={{ border: 'none' }}
        />
      </Paper>
    </DashboardLayout>
  );
};

export default DataTable; 