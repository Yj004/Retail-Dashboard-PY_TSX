from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import os
import json
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

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

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)

def authenticate_user(fake_db, username: str, password: str):
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

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

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

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

# API Endpoints
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
        state_counts = data["State"].value_counts().to_dict() if "State" in data.columns else {}
        payment_method_counts = data["Payment Method"].value_counts().to_dict() if "Payment Method" in data.columns else {}
        
        # Calculate value distribution (e.g., total value by state)
        state_values = data.groupby("State")["Total"].sum().to_dict() if "State" in data.columns else {}
        
        # Most popular SKUs
        sku_counts = data["SKU"].value_counts().head(10).to_dict() if "SKU" in data.columns else {}
        
        # Average quantity per order by state
        if "State" in data.columns and "Quantity" in data.columns:
            avg_quantity_by_state = data.groupby("State")["Quantity"].mean().to_dict()
        else:
            avg_quantity_by_state = {}
        
        return {
            # KPIs
            "total_records": total_records,
            "total_sales": float(total_sales),
            "total_quantity": int(total_quantity),
            "avg_order_value": float(avg_order_value),
            
            # State breakdown
            "state_counts": state_counts,
            "state_values": state_values,
            "avg_quantity_by_state": avg_quantity_by_state,
            
            # Other categorical breakdowns
            "status_counts": status_counts,
            "delivery_status_counts": delivery_status_counts,
            "country_counts": country_counts,
            "payment_method_counts": payment_method_counts,
            
            # Time series data
            "monthly_sales": monthly_sales,
            "monthly_orders": monthly_orders,
            "monthly_avg_values": monthly_avg,
            
            # Product data
            "top_skus": sku_counts
        }
    except Exception as e:
        print(f"Error in stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating stats: {str(e)}")

@app.get("/data/filter", response_model=List[Dict[str, Any]])
async def filter_data(
    status: Optional[str] = None,
    delivery_status: Optional[str] = None,
    country: Optional[str] = None,
    province: Optional[str] = None,
    state: Optional[str] = None,
    payment_method: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    min_total: Optional[float] = None,
    max_total: Optional[float] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """Filter data based on various parameters"""
    try:
        filtered_data = app.state.data.copy()
        
        if status and status != "All":
            filtered_data = filtered_data[filtered_data["Status"] == status]
        if delivery_status and delivery_status != "All":
            filtered_data = filtered_data[filtered_data["Deliver Status"] == delivery_status]
        if country and country != "All":
            filtered_data = filtered_data[filtered_data["Shipping Country"] == country]
        if province and province != "All":
            filtered_data = filtered_data[filtered_data["Shipping Province"] == province]
        if state and state != "All":
            filtered_data = filtered_data[filtered_data["State"] == state]
        if payment_method and payment_method != "All":
            filtered_data = filtered_data[filtered_data["Payment Method"] == payment_method]
        
        if min_total is not None:
            filtered_data = filtered_data[filtered_data["Total"] >= min_total]
        if max_total is not None:
            filtered_data = filtered_data[filtered_data["Total"] <= max_total]
        
        if from_date:
            from_date = pd.to_datetime(from_date, errors='coerce')
            filtered_data = filtered_data[filtered_data["Date"] >= from_date]
        if to_date:
            to_date = pd.to_datetime(to_date, errors='coerce')
            filtered_data = filtered_data[filtered_data["Date"] <= to_date]
        
        # Get stats for the filtered data
        result = {
            "data": filtered_data.iloc[skip:skip+limit].to_dict(orient="records"),
            "total_count": len(filtered_data),
            "total_sales": float(filtered_data["Total"].sum()),
            "avg_order_value": float(filtered_data["Total"].mean()) if len(filtered_data) > 0 else 0,
            "total_quantity": int(filtered_data["Quantity"].sum())
        }
        
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error filtering data: {str(e)}")

@app.get("/filtered-stats", response_model=Dict[str, Any])
async def get_filtered_stats(
    status: Optional[str] = None,
    delivery_status: Optional[str] = None,
    country: Optional[str] = None,
    province: Optional[str] = None,
    state: Optional[str] = None,
    payment_method: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    min_total: Optional[float] = None,
    max_total: Optional[float] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Get statistics for filtered data"""
    try:
        filtered_data = app.state.data.copy()
        
        if status and status != "All":
            filtered_data = filtered_data[filtered_data["Status"] == status]
        if delivery_status and delivery_status != "All":
            filtered_data = filtered_data[filtered_data["Deliver Status"] == delivery_status]
        if country and country != "All":
            filtered_data = filtered_data[filtered_data["Shipping Country"] == country]
        if province and province != "All":
            filtered_data = filtered_data[filtered_data["Shipping Province"] == province]
        if state and state != "All":
            filtered_data = filtered_data[filtered_data["State"] == state]
        if payment_method and payment_method != "All":
            filtered_data = filtered_data[filtered_data["Payment Method"] == payment_method]
        
        if min_total is not None:
            filtered_data = filtered_data[filtered_data["Total"] >= min_total]
        if max_total is not None:
            filtered_data = filtered_data[filtered_data["Total"] <= max_total]
        
        if from_date:
            from_date = pd.to_datetime(from_date, errors='coerce')
            filtered_data = filtered_data[filtered_data["Date"] >= from_date]
        if to_date:
            to_date = pd.to_datetime(to_date, errors='coerce')
            filtered_data = filtered_data[filtered_data["Date"] <= to_date]
        
        # Calculate stats for the filtered data
        result = {
            "total_count": len(filtered_data),
            "total_sales": float(filtered_data["Total"].sum()),
            "avg_order_value": float(filtered_data["Total"].mean()) if len(filtered_data) > 0 else 0,
            "total_quantity": int(filtered_data["Quantity"].sum()),
            "state_breakdown": filtered_data.groupby("State")["Total"].sum().to_dict(),
            "status_breakdown": filtered_data["Status"].value_counts().to_dict()
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating filtered stats: {str(e)}")

@app.get("/columns", response_model=List[str])
async def get_columns(current_user: User = Depends(get_current_active_user)):
    """Get the list of columns in the dataset"""
    return list(app.state.data.columns)

@app.get("/filter-options", response_model=Dict[str, List[str]])
async def get_filter_options(current_user: User = Depends(get_current_active_user)):
    """Get unique values for filterable columns"""
    try:
        data = app.state.data
        options = {}
        
        categorical_columns = ["Status", "Deliver Status", "Shipping Country", 
                            "Shipping Province", "Payment Method", "Risk Level", "State"]
        
        for col in categorical_columns:
            if col in data.columns:
                # Add "All" option at the beginning and get unique non-empty values
                values = list(data[col][data[col] != ''].dropna().unique())
                options[col] = ["All"] + values
        
        return options
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting filter options: {str(e)}")

@app.post("/data/add-column")
async def add_column(
    column_name: str,
    default_value: str = "",
    current_user: User = Depends(get_current_active_user)
):
    """Add a new column to the dataset with a default value"""
    if column_name in app.state.data.columns:
        raise HTTPException(status_code=400, detail=f"Column '{column_name}' already exists")
    
    try:
        app.state.data[column_name] = default_value
        return {"message": f"Column '{column_name}' added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding column: {str(e)}")

# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
