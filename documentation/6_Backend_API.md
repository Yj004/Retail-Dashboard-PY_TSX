# Backend API

## Overview

The `main.py` file in the `backend` directory implements a FastAPI server that provides data processing and API endpoints for the Shopify Admin Dashboard application. It handles authentication, data loading, and various data operations.

## Key Components

### FastAPI Setup

```python
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
# Additional imports...

# Initialize FastAPI app
app = FastAPI(title="Shopify Admin Dashboard API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify the exact frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

The server:
- Uses FastAPI framework for API development
- Includes CORS middleware to allow cross-origin requests
- Defines the API title and documentation settings

### Data Loading

```python
# Load data
@app.on_event("startup")
async def startup_db_client():
    try:
        app.state.data = pd.read_csv("../Data/shopify.csv")
        # Convert date columns to datetime
        app.state.data['Date'] = pd.to_datetime(app.state.data['Date'], format='%d/%m/%Y', errors='coerce')
        # Convert Total and Quantity to numeric
        app.state.data['Total'] = pd.to_numeric(app.state.data['Total'], errors='coerce').fillna(0)
        app.state.data['Quantity'] = pd.to_numeric(app.state.data['Quantity'], errors='coerce').fillna(0)
        # Clean up data
        app.state.data = app.state.data.fillna('')
        print(f"Loaded {len(app.state.data)} records")
    except Exception as e:
        print(f"Error loading data: {e}")
        app.state.data = pd.DataFrame()
```

On server startup:
- Reads the CSV data file
- Converts date columns to datetime format
- Ensures numeric columns have proper types
- Handles missing values
- Stores the data in the application state

### Authentication System

```python
# Authentication
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "YOUR_SECRET_KEY_HERE"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Demo users (in production, use a database)
fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "Admin User",
        "email": "admin@example.com",
        "hashed_password": pwd_context.hash("password123"),
        "disabled": False,
    }
}
```

The authentication system:
- Uses JWT tokens for secure authentication
- Implements password hashing for security
- Defines token expiration timeframes
- Includes a demo user database (would be replaced with a real database in production)

### Token Generation and Validation

```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user
```

These functions:
- Create JWT tokens with expiration dates
- Validate incoming tokens
- Extract user information from tokens
- Raise appropriate exceptions for invalid tokens

### Login Endpoint

```python
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
```

This endpoint:
- Accepts username and password credentials
- Validates credentials against the user database
- Returns a JWT token if authentication is successful
- Returns an error for invalid credentials

## API Endpoints

### Data Endpoint

```python
@app.get("/data", response_model=List[Dict[str, Any]])
async def get_data(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_active_user)
):
    """Get paginated data with optional filtering"""
    try:
        return app.state.data.iloc[skip:skip+limit].to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving data: {str(e)}")
```

This endpoint:
- Requires authenticated user (via the `current_user` dependency)
- Supports pagination with `skip` and `limit` parameters
- Returns a subset of the data as JSON records
- Handles exceptions with appropriate HTTP status codes

### Stats Endpoint

```python
@app.get("/stats", response_model=Dict[str, Any])
async def get_stats(current_user: User = Depends(get_current_active_user)):
    """Get comprehensive stats about the data for KPIs and charts"""
    try:
        data = app.state.data
        
        # Basic stats
        total_records = len(data)
        total_sales = data["Total"].sum() if "Total" in data.columns else 0
        total_quantity = data["Quantity"].sum() if "Quantity" in data.columns else 0
        
        # Calculate average order value
        avg_order_value = total_sales / total_records if total_records > 0 else 0
        
        # Prepare time-based data (monthly sales)
        if "Date" in data.columns:
            # Ensure date column is datetime
            date_col = pd.to_datetime(data["Date"], errors='coerce')
            monthly_data = data.copy()
            monthly_data['Month'] = date_col.dt.strftime('%Y-%m')
            
            # Monthly sales
            monthly_sales = monthly_data.groupby('Month')['Total'].sum().reset_index()
            monthly_sales = monthly_sales.sort_values('Month').to_dict(orient='records')
            
            # Monthly order counts
            monthly_orders = monthly_data.groupby('Month').size().reset_index(name='count')
            monthly_orders = monthly_orders.sort_values('Month').to_dict(orient='records')
            
            # Monthly average order value
            monthly_avg = monthly_data.groupby('Month').agg(
                avg_value=('Total', 'mean'),
                order_count=('Total', 'count')
            ).reset_index()
            monthly_avg['avg_value'] = monthly_avg['avg_value'].round(2)
            monthly_avg = monthly_avg.sort_values('Month').to_dict(orient='records')
        else:
            monthly_sales = []
            monthly_orders = []
            monthly_avg = []
        
        # Calculate counts by different dimensions
        status_counts = data["Status"].value_counts().to_dict() if "Status" in data.columns else {}
        delivery_status_counts = data["Deliver Status"].value_counts().to_dict() if "Deliver Status" in data.columns else {}
        country_counts = data["Shipping Country"].value_counts().to_dict() if "Shipping Country" in data.columns else {}
        
        # ... additional processing ...
        
        # Return the complete stats object
        return {
            "total_records": total_records,
            "total_sales": total_sales,
            "total_quantity": total_quantity,
            "avg_order_value": avg_order_value,
            "monthly_sales": monthly_sales,
            "monthly_orders": monthly_orders,
            "monthly_avg_values": monthly_avg,
            "status_counts": status_counts,
            "delivery_status_counts": delivery_status_counts,
            "country_counts": country_counts,
            # ... additional stats ...
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating stats: {str(e)}")
```

This endpoint:
- Requires authenticated user
- Calculates various statistics from the dataset:
  - Basic KPIs (total records, sales, quantity)
  - Time series data (monthly sales, order counts, average values)
  - Categorical breakdowns (status, delivery status, countries)
- Handles exceptions with appropriate HTTP status codes

### Additional Endpoints

The backend includes several other endpoints:

1. **Filtered Stats Endpoint**: Returns statistics filtered by various criteria
2. **Filter Options Endpoint**: Returns available options for filter dropdowns
3. **Columns Endpoint**: Returns the available columns in the dataset
4. **Add Column Endpoint**: Adds a new column to the dataset with default values

## Data Processing

The backend performs several data processing tasks:

1. **Data Cleaning**: Handles missing values and type conversions
2. **Data Aggregation**: Groups data by various dimensions (time, category, etc.)
3. **Statistical Calculations**: Computes averages, counts, and sums
4. **Data Transformation**: Formats data for frontend consumption

## Error Handling

The API implements comprehensive error handling:

```python
try:
    # Operation that might fail
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Error message: {str(e)}")
```

This approach:
- Catches exceptions that might occur during processing
- Returns appropriate HTTP status codes
- Provides detailed error messages
- Ensures the API remains stable even when errors occur

## Security Considerations

The API includes several security features:

1. **Authentication**: JWT token-based authentication
2. **Password Hashing**: Secure storage of user passwords
3. **Token Expiration**: Limited validity period for authentication tokens
4. **Dependency Injection**: Users must be authenticated to access protected endpoints

## API Flow

1. **Client Authentication**:
   - Client sends credentials to `/token` endpoint
   - Server validates credentials and returns JWT token
   - Client stores token for subsequent requests

2. **Data Retrieval**:
   - Client includes token in request headers
   - Server validates token and identifies user
   - Server processes the request if authentication is valid
   - Server returns requested data or error response

3. **Error Handling**:
   - Server catches exceptions during processing
   - Server returns appropriate HTTP status codes and error messages
   - Client handles different error scenarios

## Enhancements for Production

For production deployment, several enhancements would be recommended:

1. **Database Integration**: Replace CSV with a proper database
2. **Environment Variables**: Store secrets in environment variables
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Comprehensive Logging**: Implement structured logging
5. **Input Validation**: Add more robust input validation
6. **Pagination Improvements**: Add cursor-based pagination for large datasets 