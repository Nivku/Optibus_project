# Optibus Fullstack Home Assignment - Vehicle Management App

**This project includes a backend Part (Node.js, Express, TypeScript, Drizzle ORM with SQLite) 
and a frontend application (React, Vite). I used Drizzle to make it easier to send command to the database**


# App Features
### The Vehicle Management application offers a comprehensive interface for fleet management, including: ### 

* **Full CRUD Functionality:** Users can Create, Read, Update, and Delete vehicles via the main table and dedicated forms/buttons.

* **Status Management:** Quick status changes (Available, InUse, Maintenance) are handled directly through dropdown menus in the table.

* **Data Filtering & Search:** The list can be quickly filtered by License Plate, vehicle Status, and sorted by the creation date.

* **List view information:** Vehicle ID, License Plate, Status, and Created At date.

* **Validation Enforcement:** The application enforces business logic, such as preventing the deletion of vehicles
that are InUse or Maintenance and the 5% rule for Maintenance.






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

