# Prime Rides DMS

Prime Rides DMS is a dealership management system built for a car trading business. It combines a Django REST API with a React + Vite frontend to manage inventory, customer relationships, deals, finance, payments, insurance, staff access, and operational workflows from one platform.

## Overview

This project is organized into two main parts:

- `backend/` – Django REST API and business logic
- `frontend/dms/` – React dashboard and UI for dealership operations

The application supports the full lifecycle of a vehicle sale and financing workflow, including stock intake, deal creation, customer tracking, pricing, payment collection, financing workflows, and document management.

## Core features

### Inventory and stock management
- Vehicle stock tracking with metadata such as make, model, year, variant, mileage, source, supplier, and pricing
- Stock status workflow: available, reserved, booked, sold, in service, and in house
- Document handling for certificates and related media files
- Car demand tracking and procurement workflows

### Customer, lead, and sales workflow
- Customer records and deal tracking
- Lead management for inbound demand and sales follow-up
- Quote and proforma generation for vehicles and financing packages
- Delivery note processing and sales progression tracking

### Finance and accounting
- Bank and lender configuration management
- Loan and EMI workflows
- Cash receipts, balance sheets, and general finance processing
- Insurance bands, insurance policies, and service package management
- Expense presets and configurable finance rules

### Operations and access control
- JWT-based authentication and role-aware access
- Staff management and user access configuration
- Ledger account management for operational accounting
- API schema and Swagger documentation via DRF Spectacular

## Tech stack

### Backend
- Python 3.x
- Django 6
- Django REST Framework
- PostgreSQL via `dj_database_url`
- JWT authentication via `djangorestframework-simplejwt`
- DRF Spectacular for API docs
- Whitenoise, gunicorn, and Django security middleware for deployment-ready setup

### Frontend
- React 19
- Vite
- React Router
- Tailwind CSS
- PWA manifest support via Vite PWA plugin
- Toast notifications and responsive dashboard interface

## Repository structure

```text
.
├── backend/
│   ├── accounts/
│   ├── company/
│   ├── config/
│   ├── customers/
│   ├── delivery_note/
│   ├── finance/
│   ├── insurance/
│   ├── inventory/
│   ├── leads/
│   ├── ledger_accounts/
│   ├── media/
│   ├── proforma/
│   ├── progression/
│   ├── quotes/
│   ├── rta/
│   ├── manage.py
│   ├── requirements.txt
│   └── schema.yml
├── frontend/
│   └── dms/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.js
├── .env.example
├── .gitignore
├── README.md
└── backend.zip
```

## Prerequisites

Before running the project, make sure you have:

- Python 3.11+
- Node.js 18+
- npm
- PostgreSQL database (or a compatible connection string)
- Git

## Environment setup

Create a `.env` file in the project root for the Django backend configuration. A template is available at `.env.example` and includes a sample `DATABASE_URL` value.

Example:

```env
SECRET_KEY=your-long-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

If you are running the project locally, ensure the database is reachable and the `DATABASE_URL` matches your PostgreSQL instance.

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

The API will be available at:

- http://localhost:8000
- http://localhost:8000/api/docs/
- http://localhost:8000/api/schema/

## Frontend setup

```bash
cd frontend/dms
npm install
npm run dev
```

Then open:

- http://localhost:5173

The frontend is a Vite React app and uses the backend API for authentication and all department modules.

## Default usage

Once both services are running:

1. Open the frontend in the browser.
2. Log in with a valid staff account.
3. Use the dashboard to access inventory, customers, deals, finance, and operations modules.
4. Use the generated API documentation for backend integrations and testing.

## Production notes

The backend is configured for deployment-style settings with `DEBUG` toggles, CORS policy, static file handling, and PostgreSQL configuration. The app also contains deployment-related packages such as `gunicorn` for production serving.

## License

This project does not include a license file in the repository. Check with the project owner before redistributing or using it commercially.

## Notes

- The repository contains generated media and sample assets under `backend/media/` and `backend/car_photos/`.
- The frontend includes PWA support and a branded dealer dashboard UI.
- The codebase is structured for a multi-module dealership workflow and is suitable for further extension with reporting, approval flows, and ERP integrations.
