import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Snackbar,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';
import { fetchColumns, addColumn } from '../utils/api';

const Settings = () => {
  const [columns, setColumns] = useState([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const loadColumns = async () => {
      try {
        setLoading(true);
        const columnsList = await fetchColumns();
        setColumns(columnsList);
        setLoading(false);
      } catch (err) {
        setError('Failed to load columns');
        setLoading(false);
        console.error(err);
      }
    };

    loadColumns();
  }, []);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim()) {
      setError('Column name is required');
      setOpenSnackbar(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addColumn(newColumnName, defaultValue);
      
      // Update columns list
      const updatedColumns = await fetchColumns();
      setColumns(updatedColumns);
      
      // Reset form
      setNewColumnName('');
      setDefaultValue('');
      
      // Show success message
      setSuccess(`Column '${newColumnName}' added successfully`);
      setOpenSnackbar(true);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add column');
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <DashboardLayout title="Settings">
      <Typography variant="h4" className="page-title">
        Dashboard Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add New Column
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box component="form" onSubmit={handleAddColumn} noValidate>
                <TextField
                  fullWidth
                  label="Column Name"
                  margin="normal"
                  variant="outlined"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  required
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Default Value (Optional)"
                  margin="normal"
                  variant="outlined"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  disabled={loading}
                >
                  Add Column
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Existing Columns
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {columns.map((column, index) => (
                  <ListItem key={index} divider={index < columns.length - 1}>
                    <ListItemText primary={column} />
                  </ListItem>
                ))}
                {columns.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No columns found" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default Settings; 