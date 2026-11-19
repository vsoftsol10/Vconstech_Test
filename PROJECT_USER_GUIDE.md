# VConstech Project Flow

*Last updated: 15 October 2026*

This guide follows VConstech from local setup and application startup through sign-in, project work, supporting workflows, and sign-out. It describes the application structure and representative user flows based on this repository. Screen labels, available actions, and permissions can vary by account and deployed version.

# Module: Project lifecycle from setup to sign-out

## 1. Purpose

This section summarizes the full operational sequence: configure the frontend and backend, start the application, sign in, manage a construction project and its related records, review saved work, and sign out.

## 2. Prepare and configure the project

**Step 1 :** Install Node.js and npm and arrange access to a PostgreSQL database.

**Step 2 :** In `Vconstech_backend`, install the backend dependencies with `npm install`.

**Step 3 :** Configure a private backend environment file with `DATABASE_URL`, `JWT_SECRET`, and any deployment-specific settings. The backend uses `PORT` when provided and otherwise listens on port `5001`.

**Step 4 :** In `Vconstech_frontend`, install the frontend dependencies with `npm install`.

**Step 5 :** Configure `VITE_API_URL` to point to the backend API base URL, including the `/api` prefix used by the frontend API clients.

**Step 6 :** Keep database URLs, signing secrets, credentials, and other private environment values out of source control.

For a database with committed migrations that have not yet been applied, use the backend deployment command `npm run migrate:deploy` after confirming the target database. Production database provisioning, hosting, backups, and deployment approvals are managed outside this repository.

## 3. Start the services

**Step 1 :** Start the backend from `Vconstech_backend` with `npm run dev` during development, or `npm start` to run the server directly.

**Step 2 :** The backend loads its Express middleware and API routes and creates a Prisma client for PostgreSQL access.

**Step 3 :** The backend begins listening on `PORT`, defaulting to `5001`. If the port is already occupied, choose an available port or stop the process that owns it.

**Step 4 :** After the backend starts listening, it schedules the subscription/trial-expiry job.

**Step 5 :** In a separate terminal, start the website from `Vconstech_frontend` with `npm run dev`.

**Step 6 :** Open the local URL printed by Vite. For a production frontend build, run `npm run build`; deployment of the generated output is not specified by this repository.

**Step 7 :** Confirm that the website can reach the configured API and that the API can reach PostgreSQL before using project or account data.

The backend does not show a general database-schema reconciliation step in its startup path. Apply the appropriate Prisma migrations to the intended database and resolve database connection errors before normal use.

## 4. Use the application from sign-in through daily work

**Step 1 :** Sign in through the correct administrator, employee, or super-administrator entry point using the credentials assigned to that account.

**Step 2 :** Review the dashboard and open the work area needed for the task.

**Step 3 :** Create or open the relevant project and check its client, location, schedule, budget, status, and assigned team information where available.

**Step 4 :** Add or update engineers/members and project assignments as needed.

**Step 5 :** Record contract information and project files in their respective modules when those workflows are used.

**Step 6 :** Associate materials with the project, process available material requests, and record material usage as work proceeds.

**Step 7 :** Record daily progress and labour attendance or payment information in the relevant project and labour areas.

**Step 8 :** Review project financial information and prepare or update bills using the billing workflow.

**Step 9 :** Reopen important records and verify that changes, uploads, and transactions were saved.

**Step 10 :** Sign out using the application navigation when finished. If the session is rejected or the account is inactive, sign in again or contact the administrator.

The exact order of contract, file, material, finance, and labour tasks depends on the construction workflow used by the organization.

## 5. Background operations and ongoing maintenance

**Step 1 :** While the backend is running, the subscription/trial-expiry job is scheduled by the server startup path. Its operation depends on the configured environment, database, and service availability.

**Step 2 :** File uploads, notifications, payment notifications, subscription synchronization, and CRM integration endpoints operate through their respective backend routes when configured and used.

**Step 3 :** Review the application and server errors when a request or integration fails; retry only after confirming whether the original operation was saved.

**Step 4 :** Database backup, restore, retention, production deployment, and support escalation are not fully specified by this repository; follow the organization's operational policy.

# Module: System at a glance

## 1. Process Flow

**Step 1 :** User browser [React interface and page navigation] -> VConstech frontend.

**Step 2 :** VConstech frontend [HTTP API request] -> Express backend at the configured `VITE_API_URL`.

**Step 3 :** Express backend [Prisma client] -> PostgreSQL database.

**Step 4 :** Express backend [static file route] -> files stored under the backend uploads directory.

**Step 5 :** Express backend -> configured CRM, payment-notification, subscription-sync, or other external service where applicable.

**Step 6 :** Express backend [JSON response or error] -> VConstech frontend.

**Step 7 :** VConstech frontend [update page, display result, or show error] -> User.

## 2. Main parts

**Step 1 :** Frontend: `Vconstech_frontend` renders React pages, handles browser navigation, collects input, and calls the API.

**Step 2 :** Backend: `Vconstech_backend` uses Express routes and middleware to handle requests, apply business logic, authenticate selected requests, and connect to services and the database.

**Step 3 :** Database: PostgreSQL stores application records. Prisma defines the schema and provides the database client and migrations.

**Step 4 :** Upload storage: the backend exposes its uploads directory through the `/uploads` route. The actual file and backup policy depends on deployment.

The browser communicates with the backend API; application database reads and writes are performed by the backend through Prisma.

# Module: Application startup flow

## 1. Process Flow

**Step 1 :** Start backend process -> Load Express application and database client.

**Step 2 :** Load application -> Configure CORS, JSON and form parsing, static uploads, and API routes.

**Step 3 :** Configure routes -> Listen on `PORT` (default `5001`).

**Step 4 :** Backend listening -> Schedule subscription/trial-expiry job.

**Step 5 :** Start frontend separately -> Vite serves the React application.

**Step 6 :** Browser opens Vite URL -> React Router renders the selected page.

**Step 7 :** Page request -> Frontend sends HTTP request to the API base URL configured by `VITE_API_URL`.

If the backend cannot bind to its port or cannot connect to the database for a requested operation, check the startup log, `PORT`, database configuration, and database availability. The frontend and backend run as separate processes during local development.

# Module: Standard request and response flow

## 1. Process Flow

**Step 1 :** User -> React website: Open a page or submit a form.

**Step 2 :** React website -> Express API: Send an HTTP request to the configured endpoint.

**Step 3 :** Express API -> Route middleware: Match the route and run any authentication, role, or input checks attached to that route.

**Step 4 :** Route/controller -> Prisma -> PostgreSQL: Read or update application records when required.

**Step 5 :** Backend -> Optional service: Call an external integration when that feature requires it.

**Step 6 :** Backend -> React website: Return JSON success data or an error response.

**Step 7 :** React website -> User: Refresh the displayed data or show the outcome.

## 2. Typical request path

**Step 1 :** The user opens a screen or submits information from a React page.

**Step 2 :** The page's API client builds a request using `VITE_API_URL` and the module endpoint.

**Step 3 :** The Express router matches the endpoint. Authentication and role checks are applied where configured for that route.

**Step 4 :** Backend handlers validate or process the request and use Prisma for database operations.

**Step 5 :** The backend responds with JSON. A failed or unavailable operation can return an error for the frontend to display.

**Step 6 :** The user confirms the result in the page by checking the updated record or its status.

Not every endpoint has identical access middleware. Do not assume that a page being visible means every related API action has the same permission requirements.

# Module: Sign-in, session, and account access

## 1. Sign-in

Administrator and employee accounts use separate sign-in pages. Super-administrator access has its own sign-in page. Use the entry point and credentials supplied by the application administrator.

## 2. Process Flow

**Step 1 :** User -> Sign-in page: Enter the credentials requested by the page.

**Step 2 :** Frontend -> Authentication API: Submit the sign-in request.

**Step 3 :** Authentication API -> PostgreSQL: Find the account and read the account details.

**Step 4 :** Backend: Check the submitted password and account state.

**Step 5 :** Backend -> Frontend: On successful authentication, return a signed token and account information, or indicate that a password change is required.

**Step 6 :** Frontend: Store the session token for subsequent API requests.

**Step 7 :** User -> Protected page: Open available pages and submit requests using the current session.

For the standard `/api/auth/login` flow, the backend returns a seven-day JWT for a successful login. Protected backend routes verify supplied tokens and may reject expired tokens, inactive accounts, or accounts whose subscription has expired. Password-change-required accounts receive a separate, short-lived token for the password-change flow.

## 3. Employee and super-administrator access

Employee pages include the employee dashboard, profile, file, material, and labour views. The API checks the identity in the request token and may limit the records returned to the employee or company. Super-administrator pages are separate from the normal administrator sidebar. Access restrictions depend on the page and backend route configuration.

## 4. Sign-out and recovery

Use the sign-out action shown in your account navigation. If access is rejected, sign in again. If a temporary password or forced password change is involved, follow the on-screen password-change flow or ask an administrator for help.

# Module: Project lifecycle

## 1. Project creation and management

**Step 1 :** Sign in with an account that can access the administrator project area.

**Step 2 :** Open **Project Management** and review the project list.

**Step 3 :** Choose **New Project** and enter the project details requested by the form.

**Step 4 :** Save the project and confirm that it appears in the project list.

**Step 5 :** Open a project to review its details, status, assigned members, and progress information where available.

**Step 6 :** Use the edit or progress actions shown by the page to maintain the record.

**Step 7 :** Remove a project only when intended and after considering the effect on related records.

## 2. Process Flow

**Step 1 :** Project form -> Frontend validation and request.

**Step 2 :** Project API -> Authentication and any route-specific access checks.

**Step 3 :** Project handler -> Prisma -> Create or update project data in PostgreSQL.

**Step 4 :** Project API -> Frontend -> Return the result.

**Step 5 :** Frontend -> Project list/details -> Refresh the view so the user can confirm the saved project.

The fields available for projects depend on the current form and deployment. Use the actual page as the source of truth for required fields.

# Module: Team members and employee workflow

## 1. Team member lifecycle

**Step 1 :** An authorized administrator opens **Add Member** and enters the details requested for an engineer or site-team member.

**Step 2 :** The administrator saves the member record and reviews it in the available member or engineer list.

**Step 3 :** Where supported, the administrator assigns the member to the appropriate project.

**Step 4 :** The employee uses the employee sign-in page and reviews the projects and pages available to that account.

**Step 5 :** The employee records or reviews permitted project information, files, materials, labour records, or profile data.

**Step 6 :** The administrator reopens the project or related module to review submitted changes.

## 2. Process Flow

**Step 1 :** Administrator -> Add Member: Enter account/member data.

**Step 2 :** Frontend -> Engineer/user API: Submit the record.

**Step 3 :** Backend -> PostgreSQL: Save the member and applicable company/project association.

**Step 4 :** Employee -> Employee sign-in: Authenticate using the account credentials.

**Step 5 :** Employee page -> Backend API: Request permitted project information or submit an update.

**Step 6 :** Administrator and employee pages -> Backend API: Read the updated record according to their configured access.

Account creation, role assignment, and project access are restricted by the application configuration. Contact the administrator if an account or project is unavailable.

# Module: Materials, requests, and usage

## 1. Material workflow

**Step 1 :** Open **Material Management** and review the available dashboard, project, and request views.

**Step 2 :** Add or edit material records using the actions shown in the page.

**Step 3 :** Associate material information with the relevant project where the workflow requests it.

**Step 4 :** Review incoming material requests and use the available request actions.

**Step 5 :** When material is used, open the relevant project and log the date, material, quantity, and remarks requested by the form.

**Step 6 :** Review the updated usage information and confirm that it is associated with the intended project.

## 2. Process Flow

**Step 1 :** User -> Material page: Select a material, project, request, or usage action.

**Step 2 :** Frontend -> Material API family: Submit or retrieve the corresponding record.

**Step 3 :** Backend -> PostgreSQL: Read or update material, project-material, material-request, or usage-log records.

**Step 4 :** Backend -> Frontend: Return the result.

**Step 5 :** User -> Material page: Verify the saved record and project association.

The backend exposes distinct route families for materials, project materials, material requests, usage logs, and notifications. Exact request approval steps and stock policies are organization-specific.

# Module: Daily progress and labour

## 1. Daily progress flow

**Step 1 :** Open the relevant project and its progress/update area.

**Step 2 :** Enter the date and progress information requested by the form.

**Step 3 :** Submit the update and confirm that it appears in the project record.

## 2. Labour flow

**Step 1 :** Open **Labour Management** as an administrator or the relevant employee labour page.

**Step 2 :** Select the correct project and labour record.

**Step 3 :** Use the available attendance or payment action and enter the requested date, quantity, amount, or notes.

**Step 4 :** Review the submitted information and confirm it is attached to the correct person and project.

## 3. Process Flow

**Step 1 :** User -> Progress or labour page: Enter a project-related update.

**Step 2 :** Frontend -> Daily-progress or labour API: Submit the update.

**Step 3 :** Backend -> PostgreSQL: Save the progress, attendance, labour, or payment record.

**Step 4 :** Backend -> Frontend: Return a result or an error.

**Step 5 :** User -> Project/labour detail view: Check that the update was saved.

# Module: Financial management and billing

## 1. Financial workflow

**Step 1 :** Open **Financial Management** and review the project and financial information shown.

**Step 2 :** Select the relevant project or transaction to inspect its details.

**Step 3 :** Open **Billing** from the financial-management section to create or maintain a bill.

**Step 4 :** Enter client, project, bill items, charges, deductions, tax, and payment information requested by the bill form.

**Step 5 :** Review the line items and totals before saving.

**Step 6 :** Use available edit, print, or document actions and verify the saved bill and its status.

## 2. Process Flow

**Step 1 :** User -> Financial or billing page: Open a record or submit bill information.

**Step 2 :** Frontend -> Financial or bills API: Request financial data or save the bill.

**Step 3 :** Backend -> PostgreSQL: Read or write financial transaction and bill records.

**Step 4 :** Backend -> Frontend: Return updated details or an error.

**Step 5 :** User: Verify the saved bill or transaction before relying on its totals or status.

The backend exposes financial and bill APIs separately. Payment notifications are a separate API family; a notification should not be treated as proof of settlement unless the relevant transaction status confirms it.

# Module: Contracts and files

## 1. Contract workflow

**Step 1 :** Open **Contract Management** and find the relevant contract or project.

**Step 2 :** Use the available create or edit action and enter the contract details requested.

**Step 3 :** Save and reopen the record to verify the details.

## 2. File workflow

**Step 1 :** Open **File Management** as an administrator or the employee file page as an employee.

**Step 2 :** Select the project or folder when requested.

**Step 3 :** Choose an authorized file and provide the name or details requested by the upload form.

**Step 4 :** Submit the upload and verify that the file appears in the intended location.

**Step 5 :** Use only the file actions available on the page to view, download, organize, or remove it.

## 3. Process Flow

**Step 1 :** User -> Contract/file page: Enter contract information or select a file.

**Step 2 :** Frontend -> Contract or upload API: Send the request.

**Step 3 :** Backend -> PostgreSQL and/or uploads storage: Save record metadata and, for uploads, process the file.

**Step 4 :** Backend -> Frontend: Return a result.

**Step 5 :** User: Reopen the record or file list to confirm the operation.

Follow the organization’s rules for confidential files, file retention, and deletion. The repository does not specify a production backup or retention policy for uploads.

# Module: Super administrator and profile

## 1. Super-administrator workflow

Authorized super administrators use the separate super-administrator pages to create or manage application users. Enter accurate account information, set only authorized access options, and verify the saved user record. This area is not the same as ordinary project member management.

## 2. Profile workflow

Open **Profile** in the appropriate administrator or employee area. Review the details shown, update editable fields, save, and confirm the changes. Contact an administrator when a field is not editable.

# Module: Notifications and integrations

## 1. Notifications and connected services

The backend exposes notification, payment-notification, subscription-sync, and CRM-integration routes. These features may depend on external credentials, service availability, database records, or deployment-specific configuration.

## 2. Process Flow

**Step 1 :** A user action or external event creates a request to a notification or integration endpoint.

**Step 2 :** The backend route applies its configured middleware and processes the request.

**Step 3 :** The backend reads or updates local records and calls an external service when required.

**Step 4 :** The service response or error is handled by the backend.

**Step 5 :** The application presents the resulting status where a corresponding page or notification is implemented.

Do not assume an integration is enabled merely because its API route exists. Confirm the integration configuration and test behavior in the deployment environment.

# Module: Route and API map

## 1. Frontend route families

The React application defines page routes for administrator sign-in and dashboard, projects, materials, contracts, financial management and billing, file management, labour management, members/engineers, profile, employee pages, and super-administrator pages.

The application also includes password-change, employee labour detail, and project detail routes. Use the current navigation and account permissions to discover which pages are available.

## 2. Backend API families

**Step 1 :** `/api/auth`, `/api/invitations`, and `/api/registration` -> Authentication, invitations, and registration.

**Step 2 :** `/api/projects`, `/api/engineers`, `/api/users`, `/api/clients`, and `/api/superadmin` -> Project and account-related records.

**Step 3 :** `/api/materials`, `/api/project-materials`, `/api/material-requests`, `/api/usage-logs`, and `/api/notifications` -> Materials, project material associations, requests, usage, and notifications.

**Step 4 :** `/api/financial`, `/api/bills`, `/api/contracts`, `/api/labours`, `/api/daily-progress`, and `/api/reports` -> Financial, billing, contract, labour, progress, and report operations.

**Step 5 :** `/api/payment-notifications`, `/api/subscription-sync`, `/api/integrations/crm`, and `/webhook` -> Payment, subscription, CRM integration, and webhook operations.

**Step 6 :** `/uploads` -> Static access to files exposed by the backend uploads directory.

An API family can contain endpoints with different authentication and authorization behavior. Review the specific route and deployment configuration when verifying access control.

# Module: Technology stack

## 1. Frontend

The application uses React 18 and Vite 7. React Router handles browser navigation; Tailwind CSS and Lucide React support the interface; Axios and browser `fetch` are used for HTTP calls. Recharts, jsPDF, and jsPDF AutoTable support applicable charts and document output.

## 2. Backend

The API uses Node.js with ES modules and Express 5. Prisma Client connects the backend to PostgreSQL. JWT and bcryptjs support token-based authentication and password verification. Multer handles file uploads; Socket.IO, PDFKit, ExcelJS, and Nodemailer are included for applicable features.

## 3. Database and persistence

PostgreSQL stores application records described by the Prisma schema. Prisma migrations are stored under `Vconstech_backend/prisma/migrations`. The browser does not access PostgreSQL directly.

## 4. Configuration

`DATABASE_URL` configures the Prisma database connection, `JWT_SECRET` is used to sign and verify authentication tokens, `PORT` selects the backend port (default `5001`), and `VITE_API_URL` sets the frontend API base URL. Do not put private values in the frontend or public source control.

# Module: Troubleshooting and recovery

## 1. Backend does not start

Check that backend dependencies are installed, the chosen port is available, and environment configuration is valid. Confirm PostgreSQL is reachable and the appropriate migrations have been applied. Read the backend startup output for the reported failure.

## 2. Sign-in or API requests fail

Confirm that the frontend points to the correct API base URL and that the backend is running. Sign in again if the token has expired. Inactive accounts, invalid tokens, or unavailable database connections can prevent API operations.

## 3. A project, employee, or list is missing

Clear page search or filter values, verify the selected account and project, and confirm the record is assigned or accessible to the signed-in user.

## 4. A save or upload fails

Review required fields and the displayed error. Confirm the backend and database are available; for uploads, check the selected file and any configured size or storage restrictions. Reopen the record before retrying to avoid duplicate submissions.

## 5. An integration or notification does not work

Confirm the relevant service is configured and available in the deployment environment. Contact the administrator responsible for the integration; do not change secret values or send credentials in a support request.

## 6. Report an issue

Provide the page, action, approximate time, displayed error, and record identifier when appropriate. Never include passwords, session tokens, API keys, or private environment values.

# Module: Scope and implementation notes

• This flow describes application routes and representative use, not a guaranteed organization-wide operating policy.

• Available pages and actions depend on account type, project assignment, route middleware, and deployment configuration.

• The repository does not define a complete role-to-screen and role-to-API permission matrix.

• External integration behavior depends on deployment settings and services outside this repository.

• Production hosting, database backups, file retention, monitoring, and support escalation must be confirmed with the system owner.

*Last updated: 15 October 2026*
