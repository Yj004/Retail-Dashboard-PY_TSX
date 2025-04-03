import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Avatar, 
  Button, 
  TextField, 
  Paper, 
  Box, 
  Typography, 
  Container, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <Container component="main" maxWidth="xs" className="login-container">
      <Paper elevation={3} className="login-paper">
        <Avatar className="login-avatar">
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Shopify Admin Dashboard
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate className="login-form">
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          <Typography variant="body2" color="textSecondary" align="center">
            Demo credentials: admin / password123
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 