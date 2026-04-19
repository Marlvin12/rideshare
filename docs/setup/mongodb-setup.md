# MongoDB Setup

Choose local MongoDB or MongoDB Atlas. Configure `server/.env` with the correct `MONGO_URI`.

## Option 1: Local MongoDB

### Install (macOS)

```bash
brew tap mongodb/brew
brew install mongodb-community
```

### Start

```bash
brew services start mongodb-community
```

Or run manually with custom data path:

```bash
mongod --dbpath ~/mongodb/data --logpath ~/mongodb/mongodb.log --fork
```

### Configure .env

```env
MONGO_URI=mongodb://localhost:27017/ride_app
```

The `ride_app` database and collections are created automatically on first use.

## Option 2: MongoDB Atlas

### 1. Create User

1. Go to https://cloud.mongodb.com/
2. Database Access > Add New Database User
3. Username and password (save the password)
4. Privileges: Read and write to any database

### 2. Whitelist IP

1. Network Access > Add IP Address
2. For development: Allow Access from Anywhere (`0.0.0.0/0`)
3. For production: Add specific IPs only

### 3. Get Connection String

1. Database > Connect > Connect your application
2. Copy the connection string
3. Replace `<password>` with your user password

### Configure .env

```env
MONGO_URI=mongodb+srv://user:password@cluster.example.com/ride_app?retryWrites=true&w=majority
```

## Management Commands

### Check Status

```bash
mongosh --eval "db.version()"
```

### Stop MongoDB (local)

```bash
brew services stop mongodb-community
# or
pkill mongod
```

### Connect to Shell

```bash
mongosh
use ride_app
show collections
db.users.find()
db.rides.find()
```

### View Logs (local, custom path)

```bash
tail -f ~/mongodb/mongodb.log
```

## Troubleshooting Authentication

**Error 8000 or auth failed**

1. **Atlas:** Verify user exists in Database Access
2. **Atlas:** Check password (no special chars that need URL encoding)
3. **Atlas:** Ensure IP is whitelisted in Network Access
4. **Atlas:** Confirm user has read/write privileges

**Quick test:** Switch to local MongoDB to isolate Atlas issues:

```env
MONGO_URI=mongodb://localhost:27017/ride_app
```
