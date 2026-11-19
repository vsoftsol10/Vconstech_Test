# VConstech

VConstech is a construction project management application for coordinating projects, materials, finances, billing, contracts, files, engineers, and labour. It includes administrative, employee, and super-administrator interfaces.

## Technology stack

- **Frontend:** React 18, Vite 7, React Router, Tailwind CSS, Axios
- **Backend:** Node.js, Express 5 (ES modules)
- **Database and ORM:** PostgreSQL, Prisma 6
- **Additional libraries:** Socket.IO, JWT, Multer, PDFKit, ExcelJS, Recharts, and jsPDF

## Documentation

- [Project User Guide](./PROJECT_USER_GUIDE.md) — module-by-module instructions for administrators, employees, and super administrators.
- [System and Business Flow Architecture](./docs/VCONSTECH_ARCHITECTURE.md) — diagrams of the application components and construction project workflow, with [System Architecture PNG](./docs/VCONSTECH_SYSTEM_ARCHITECTURE.png) and [Business Flow PNG](./docs/VCONSTECH_BUSINESS_FLOW_ARCHITECTURE.png) downloads.
- [Frontend README](./Vconstech_frontend/README.md) — frontend development commands and configuration.

## Run locally

Install dependencies in each application directory:

```powershell
cd Vconstech_backend
npm install
```

```powershell
cd Vconstech_frontend
npm install
```

Configure the backend database connection with `DATABASE_URL` and set the frontend API base URL with `VITE_API_URL` in local environment files. Do not commit credentials or production secrets.

Start the backend and frontend in separate terminals:

```powershell
cd Vconstech_backend
npm run dev
```

```powershell
cd Vconstech_frontend
npm run dev
```

The backend exposes its API on port `5001` by default. For a production database deployment, apply committed Prisma migrations with `npm run migrate:deploy` from `Vconstech_backend`.
