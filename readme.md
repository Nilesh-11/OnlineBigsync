
# Online BigSync
This software is my undergoing final year B.Tech. project.
It is an implementation of "**IEEE Std C37.118.2 protocol**" which is IEEE Standard for Synchrophasor 
Data Transfer for Power Systems.
It uses the algorithm developed in paper "**A Novel Event Detection and Classification Scheme Using Wide-Area Frequency Measurements**" to detect and classify events.

## Tech-stack

 1. Frontend : **React.js** to visualize real-time event detection and classification.
 2. Backend : **Python** for implementing algorithms discussed in the paper. It uses **fastAPI** server for API calls, **PosrgresSql** as database.

## Prerequisites for installing

Make sure you have the following software installed on your system:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (Comes with Node.js)
- [fastAPI](https://fastapi.tiangolo.com/)
- [postgresql](https://www.postgresql.org/download/)

> If fastAPI not installed install it by `pip install fastapi`

## Backend Setup

### 1. Navigate to the fastAPI backend directory
```sh
cd  python-backend
```
### 2. Install backend dependencies
```sh
pip install -r requirements.txt
```
### 3. Configure Environment variables
```sh
DBHOST='localhost'
DBPORT='5432'
DBNAME='postgres'
DBUSERNAME='postgres'
DBPASSWORD='acoolpassword'
SERVER_IP='127.0.0.1'
SERVER_PORT=8080
```

### 4. Start the backend server
```sh
python server.py
```

## Frontend setup
### 1. Navigate to react frontend directory
```sh
cd  app
```

### 2. Start the development server
- Install frontend dependencies
```sh
npm install
```
- Start the React development server
```sh
npm start
```

>The react app will be accessible at http://localhost:3000

### Serve the production build
- Installing serve package
```sh
npm i -S serve
```
- Serving the build folder using npx
```sh
npx serve -s build
```

