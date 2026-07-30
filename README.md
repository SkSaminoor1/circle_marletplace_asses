# Circle Marketplace

Circle Marketplace is a second-hand marketplace where product listings require different attributes based on their category (e.g. mobile phones need battery health and RAM, while sofas need dimensions and material). 

The application is built on a dynamic form architecture where administrators can configure categories and dynamic fields directly from the Admin panel. The seller form automatically consumes this configuration and renders the appropriate inputs without needing any frontend or database schema changes for new categories.

## Demo Login

Use the following demo administrator account to access the category and field management features in the Admin Dashboard:

- **Username:** `admin`
- **Password:** `admin0`

*These credentials are for local/demo use only and should not be used in any production deployment.*

## Tech Stack

**Backend:**
- Django 4.2+
- Django REST Framework

**Frontend:**
- React 18
- Vite
- Tailwind CSS

**Database:**
- SQLite (default for local development)
- PostgreSQL (supported for production)

**Other Libraries:**
- `drf-spectacular` (OpenAPI schema generation)
- `django-cors-headers` (CORS configuration)
- `django-filter` (Query parameters filtering)

## Features

- **Dynamic Categories & Fields:** Form inputs are dynamically generated from database configurations.
- **Category/Field Manager:** Admin dashboard to configure category attributes, validations, and display orders.
- **Configurable Validation:** Restricts input values based on range limits (minimum/maximum numeric values, text lengths).
- **Conditional Fields:** Controls field visibility dynamically depending on other fields' selections (e.g., showing warranty expiry only if "Under Warranty" is selected).
- **Product Listings & PDP:** Browsing interface and product detail pages displaying dynamic specifications.
- **Product Images:** Support for multiple image uploads with primary image tagging.
- **Search & Filters:** Real-time homepage search, category filter, condition filter, and sorting options.

## Architecture

The data model separates static listing information from dynamic category-specific fields:

1. **Category & Field Definitions:**
   - `Category` represents a group of items (e.g., Mobile Phone).
   - `FieldDefinition` defines a reusable attribute blueprint (e.g., RAM).
   - `CategoryField` binds a field to a category with custom labels, validation rules, placeholders, and defaults.
   - `FieldOption` and `FieldCondition` store choices and visibility logic.

2. **Listings & Values:**
   - `Listing` stores common listing details like title, description, price, condition, location, and status.
   - `ListingFieldValue` stores dynamic values mapping to specific typed columns (`value_text`, `value_number`, `value_boolean`, `value_date`, `value_json`) to enforce database-level type safety.
   - `ListingImage` links uploaded image files to listings.

The React frontend fetches the category configuration fields via the API and dynamically builds the form inputs.

## Running Locally

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell):**
     ```bash
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run database migrations:
   ```bash
   python manage.py migrate
   ```

6. Seed sample category, product, and admin login data:
   ```bash
   python manage.py seed_data
   ```
   *(Required: This command creates the initial catalog structure, sample listings, and the `admin` superuser account needed for login.)*

7. Start the backend development server:
   ```bash
   python manage.py runserver
   ```
   *The backend server runs at [http://localhost:8000](http://localhost:8000).*

### Frontend

1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the local configuration file:
   - Copy `.env.example` to `.env`. It contains:
     ```env
     VITE_API_BASE_URL=http://localhost:8000/api
     ```

4. Start the frontend development server:
   - **Using cmd/Windows:**
     ```bash
     cmd /c npm run dev
     ```
   - **Using standard shell:**
     ```bash
     npm run dev
     ```
   *The frontend server runs at [http://localhost:5173](http://localhost:5173).*

## Database

By default, the project runs on an SQLite database (`db.sqlite3`), allowing it to be run locally without external dependencies.

To use PostgreSQL, configure the following environment variables in `backend/.env`:
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`

## Tests

To run the automated tests:
```bash
cd backend
python manage.py test
```
*43 automated backend tests are currently included.*

## API Documentation

Interactive API documentation is generated via Swagger and can be viewed at:
[http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

## Sample Data

The `python manage.py seed_data` command populates the database with:
- Three default categories: `Mobile Phone`, `Laptop`, and `Sofa` with validation configurations.
- Sample listing products located in Bengaluru, Mumbai, Delhi, Hyderabad, and Pune.
- Pre-configured demo wallets.

## Bonus

- **Demo Wallet System:** Allows simulating purchases between buyers and sellers. Uses pessimistic row locking (`select_for_update`) and atomic transactions (`transaction.atomic()`) for safe balance changes, and supports idempotency key processing. Note that this is a simulated demo wallet with fake credits, and does not involve real payments or gateways.
- **Search, Filters & Sorting:** Real-time homepage catalog searching, category filtering, and sorting.
- **Swagger/OpenAPI docs:** Automatically exposed endpoint documentation.
