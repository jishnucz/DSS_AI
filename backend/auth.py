"""
Authentication module for Palakkad DSS
Handles user registration, login, and session management with MongoDB
Falls back to in-memory storage if MongoDB is unavailable
"""

from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
import bcrypt
from datetime import datetime, timedelta
import jwt
import os
import uuid

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "palakkad_dss"

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET", "palakkad-dss-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# MongoDB client (lazy initialization)
_client = None
_db = None
_mongo_available = None

# In-memory fallback storage (when MongoDB is not available)
_memory_users = {}
_demo_user_created = False

def _ensure_demo_user():
    """Create a demo user for testing without MongoDB"""
    global _demo_user_created
    if not _demo_user_created:
        demo_password = hash_password("demo123")
        _memory_users["demo@example.com"] = {
            "_id": str(uuid.uuid4()),
            "name": "Demo User",
            "email": "demo@example.com",
            "password": demo_password,
            "created_at": datetime.utcnow(),
            "last_login": None,
            "is_active": True,
        }
        _demo_user_created = True
        print("📝 Demo user created: demo@example.com / demo123")

def is_mongo_available() -> bool:
    """Check if MongoDB is available"""
    global _mongo_available
    if _mongo_available is not None:
        return _mongo_available
    
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        _mongo_available = True
        print("✅ MongoDB connected")
    except Exception as e:
        _mongo_available = False
        print(f"⚠️ MongoDB unavailable, using in-memory storage: {e}")
        _ensure_demo_user()
    
    return _mongo_available

def get_db():
    """Get MongoDB database connection"""
    global _client, _db
    
    if not is_mongo_available():
        return None
    
    if _client is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        _db = _client[DB_NAME]
        _db.users.create_index("email", unique=True)
    return _db


class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def register_user(user: UserRegister) -> dict:
    """Register a new user"""
    db = get_db()
    email = user.email.lower().strip()
    
    # Use in-memory storage if MongoDB unavailable
    if db is None:
        if email in _memory_users:
            raise ValueError("An account with this email already exists")
        
        user_id = str(uuid.uuid4())
        _memory_users[email] = {
            "_id": user_id,
            "name": user.name.strip(),
            "email": email,
            "password": hash_password(user.password),
            "created_at": datetime.utcnow(),
            "last_login": None,
            "is_active": True,
        }
        return {
            "success": True,
            "message": "User registered successfully (in-memory mode)",
            "user_id": user_id
        }
    
    # MongoDB mode
    if db.users.find_one({"email": email}):
        raise ValueError("An account with this email already exists")
    
    # Create user document
    user_doc = {
        "name": user.name.strip(),
        "email": user.email.lower().strip(),
        "password": hash_password(user.password),
        "created_at": datetime.utcnow(),
        "last_login": None,
        "is_active": True,
    }
    
    # Insert user
    result = db.users.insert_one(user_doc)
    
    return {
        "success": True,
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }


def login_user(credentials: UserLogin) -> dict:
    """Authenticate a user and return token"""
    db = get_db()
    email = credentials.email.lower().strip()
    
    # Use in-memory storage if MongoDB unavailable
    if db is None:
        user = _memory_users.get(email)
        
        if not user:
            raise ValueError("Invalid email or password")
        
        if not verify_password(credentials.password, user["password"]):
            raise ValueError("Invalid email or password")
        
        # Update last login
        user["last_login"] = datetime.utcnow()
        
        # Create token
        token = create_access_token({
            "user_id": user["_id"],
            "email": user["email"],
            "name": user["name"]
        })
        
        return {
            "success": True,
            "token": token,
            "user": {
                "id": user["_id"],
                "name": user["name"],
                "email": user["email"],
            },
            "mode": "in-memory"
        }
    
    # MongoDB mode
    user = db.users.find_one({"email": email})
    
    if not user:
        raise ValueError("Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise ValueError("Invalid email or password")
    
    # Update last login
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create token
    token = create_access_token({
        "user_id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"]
    })
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
        }
    }


def verify_token(token: str) -> dict:
    """Verify a JWT token and return user data"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "valid": True,
            "user_id": payload.get("user_id"),
            "email": payload.get("email"),
            "name": payload.get("name")
        }
    except jwt.ExpiredSignatureError:
        return {"valid": False, "error": "Token has expired"}
    except jwt.InvalidTokenError:
        return {"valid": False, "error": "Invalid token"}


def get_user_by_id(user_id: str) -> dict:
    """Get user by ID"""
    db = get_db()
    
    # Use in-memory storage if MongoDB unavailable
    if db is None:
        for email, user in _memory_users.items():
            if user["_id"] == user_id:
                return {
                    "id": user["_id"],
                    "name": user["name"],
                    "email": user["email"],
                    "created_at": user.get("created_at"),
                    "last_login": user.get("last_login"),
                }
        return None
    
    # MongoDB mode
    from bson import ObjectId
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None
    
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "created_at": user.get("created_at"),
        "last_login": user.get("last_login"),
    }
