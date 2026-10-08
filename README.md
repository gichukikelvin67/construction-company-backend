H1 Aesthetics API

-Construction & Business Management Backend

A production-oriented REST API designed to support construction and business management operations.

The API provides authentication, authorization, project management, invoicing, inventory, notifications and other business workflows through a structured backend architecture.



H1 Features

=> Authentication & Security

- User registration and authentication
- JWT access tokens
- Refresh tokens
- Password hashing
- Protected routes
- Role-based authorization
- Helmet security headers
- CORS configuration
- Environment-based secrets

=> User Management

- User accounts
- Role-based permissions
- Protected administrative operations
- User activity tracking

=> Project Management

- Create projects
- Update projects
- Track project status
- Manage project information
- Project-related business workflows

=> Invoice Management

- Create invoices
- Track invoice status
- Partial payments
- Outstanding balances
- Overdue invoice detection
- Invoice notifications

=> Inventory Management

- Materials/products
- Stock levels
- Stock movements
- Inventory history
- Low-stock detection
- Inventory tracking

=> Notifications

The backend supports system notifications for important business events.

Examples include:

- Overdue invoices
- Payment-related events
- Business workflow notifications

=> Automated Jobs

Background jobs are used for automated business processes.

Example:

```text
Overdue Invoice Job
       ↓
Find overdue invoices
       ↓
Check outstanding balance
       ↓
Create notifications
       ↓
Notify relevant business users


H2  Technology Stack

| Technology | Purpose |
|---|---|
| TypeScript | Application language |
| Node.js | Runtime |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | Database ODM |
| JWT | Authentication |
| bcrypt | Password hashing |
| Helmet | HTTP security |
| CORS | Cross-origin control |
| dotenv | Environment configuration |
| tsx | Development runtime |

---

H2 Architecture

The backend follows a modular architecture designed to keep business logic separated from routing and infrastructure.

```text
src/
│
├── config/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── services/
│
├── jobs/
│
├── utils/
│
└── server.ts
```

H1 Request flow

```text
Client
  ↓
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Model
  ↓
MongoDB
```

This separation makes the application easier to test, maintain and extend.



H1 Security

Security is treated as a core part of the API architecture.

Sensitive configuration is stored using environment variables.

Example:

=> .env
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
PORT=


Environment files containing secrets must never be committed to Git.

The API also uses:

- Password hashing
- JWT authentication
- Protected routes
- Role-based authorization
- HTTP security headers
- CORS configuration
- Input validation
- Environment-based configuration



=> Getting Started

 1. Clone the repository


git clone YOUR_REPOSITORY_URL


 2. Install dependencies


npm install

 3. Configure environment variables

Create:


.env


Example:

.env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

Never commit `.env` to GitHub.

 4. Start development server


npm run dev

The API will run locally at:


http://localhost:5000




# API Health Check

The API exposes a health endpoint:

GET /api/health

Example response:

json
{
  "status": "ok"
}




H2 API Structure

The API is organized around business resources.

/api/auth
/api/users
/api/projects
/api/invoices
/api/inventory
/api/notifications


The exact endpoints may evolve as the platform develops.



H3 Development

The project uses TypeScript and a development watch process for rapid development.

Example:


npm run dev


Before deployment, the application should be tested for:

- Authentication failures
- Authorization failures
- Invalid input
- Database failures
- Expired tokens
- Duplicate requests
- Unauthorized access
- Business-rule violations



H3 Future Improvements

Planned improvements include:

- Automated API testing
- Advanced audit logging
- Improved validation
- Rate limiting
- Centralized error handling
- API documentation
- Docker deployment
- CI/CD
- Monitoring
- Performance optimization
- Advanced reporting



H1 Project Goal

Aesthetics is designed to demonstrate how modern software engineering can be used to digitize real business operations.

The long-term goal is to provide businesses with a centralized platform for managing their projects, finances, inventory and operational workflows.


H1  Developer

Kelvin Kariuki

Full-Stack Software Developer

GitHub: `gichukikelvin67`


### Built to solve real business problems.
