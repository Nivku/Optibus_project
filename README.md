# Optibus Fullstack Home Assignment - Vehicle Management App

This project includes a backend Part (Node.js, Express, TypeScript, Drizzle ORM with SQLite) and a 
frontend application (React, Vite). I used Drizzle to make it easier to connect with the database.





# Running the Application

Run the **backend** and **frontend** concurrently in two separate terminals.

---

## 1. Backend Setup & Run:

**In your first terminal write the following commands:**

1. Navigate to backend directory:

```
cd backend
```
2. Install dependencies:
```
npm install
```
3. Setup database:
```
npm run db:push
```
4. Seed database (populates the DB using vehicles.json)

```
npm run db:seed
```
5.Start backend server (runs the API in dev mode)
```
npm run dev
```


##  2. Frontend Setup & Run:

**In your second terminal write the following commands:**

1. Navigate to frontend directory:
```
cd frontend
```
2. Install dependencies
```
npm install
```
3. Start frontend dev server 

```
npm run dev
```

4. Open the app on http://localhost:5173/


##  3. Running Backend Tests:

1. Navigate to backend directory:
```
cd backend
```
2. Run the tests
```
npm run test
```

