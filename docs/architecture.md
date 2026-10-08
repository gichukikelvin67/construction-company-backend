H1 Aesthetics Architecture

## Overview

Aesthetics follows a modular client-server architecture.

The frontend communicates with the backend through REST APIs, while the backend manages authentication, business logic, database operations, notifications and automated background processes.



H1 System Architecture


                         ┌─────────────────────┐
                         │       CLIENT        │
                         │                     │
                         │   React Frontend    │
                         └──────────┬──────────┘
                                    │
                                    │ HTTPS / REST
                                    ▼
                         ┌─────────────────────┐
                         │     EXPRESS API     │
                         │                     │
                         │  Routes & Controllers│
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
           ┌────────────┐    ┌────────────┐    ┌────────────┐
           │ Middleware │    │  Services  │    │ Validation │
           │            │    │            │    │            │
           │ Auth / RBAC│    │ Business   │    │ Input      │
           └──────┬─────┘    │ Logic      │    │ Validation │
                  │          └──────┬─────┘    └────────────┘
                  │                 │
                  └─────────────────┼─────────────────┐
                                    ▼                 │
                              ┌─────────────┐          │
                              │  Mongoose   │          │
                              │             │          │
                              │ Data Models │          │
                              └──────┬──────┘          │
                                     │                 │
                                     ▼                 │
                              ┌─────────────┐          │
                              │   MongoDB   │          │
                              │             │          │
                              │ Application │          │
                              │    Data     │          │
                              └─────────────┘          │
                                                       │
                                    ┌──────────────────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │ Background  │
                             │    Jobs     │
                             └──────┬──────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │Notifications│
      



H2 Request Lifecycle

A typical API request follows this flow:


Client
  ↓
HTTP Request
  ↓
Route
  ↓
Authentication Middleware
  ↓
Authorization / Role Check
  ↓
Controller
  ↓
Service Layer
  ↓
Mongoose Model
  ↓
MongoDB
  ↓
Service
  ↓
Controller
  ↓
HTTP Response
  ↓
Client


This separation keeps HTTP handling, authentication, business logic and database operations from becoming tightly coupled.


H1 Authentication Flow

User
 │
 │ Login
 ▼
Auth Endpoint
 │
 ▼
Validate Credentials
 │
 ▼
Compare Password Hash
 │
 ▼
Generate Access Token
 │
 ▼
Generate Refresh Token
 │
 ▼
Authenticated Client


Protected requests then follow:


Request
   │
   ▼
Authorization Header
   │
   ▼
Authentication Middleware
   │
   ▼
Verify Access Token
   │
   ├── Invalid → Reject
   │
   └── Valid
         │
         ▼
   Attach User Context
         │
         ▼
   Controller


H2 Business Modules

The application is organized around business functionality.


Authentication
     │
     ├── Registration
     ├── Login
     ├── Access Tokens
     └── Refresh Tokens

Users
     │
     ├── Profiles
     ├── Roles
     └── Permissions

Projects
     │
     ├── Project information
     ├── Status
     └── Project workflows

Invoices
     │
     ├── Invoice creation
     ├── Payment tracking
     ├── Outstanding balances
     └── Overdue detection

Inventory
     │
     ├── Materials
     ├── Stock levels
     ├── Stock movements
     └── Low-stock detection

Notifications
     │
     ├── System notifications
     └── Business event notifications

Background Jobs
     │
     └── Automated business processes


H3  Automated Overdue Invoice Workflow

A background job periodically checks for invoices that meet the overdue criteria.

                 Scheduled Job
                      │
                      ▼
              Query Outstanding
                  Invoices
                      │
                      ▼
                Due Date Passed?
                 /          \
               No            Yes
               │              │
               ▼              ▼
             Skip       Create Notification
                              │
                              ▼
                     Relevant Business Users


The job is designed to prevent overdue invoices from being silently missed.



H1 Security Architecture

Security is applied at multiple layers:


                    SECURITY
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
 Authentication    Authorization    Configuration
       │               │                │
       ▼               ▼                ▼
 JWT Tokens        RBAC           Environment Variables
       │               │
       └───────────────┼────────────────┘
                       │
                       ▼
                 Protected APIs


Security considerations include:

- Password hashing
- JWT authentication
- Protected routes
- Role-based authorization
- HTTP security headers
- CORS configuration
- Environment-based secrets
- Input validation
- Database access controls


H4  Scalability Considerations

The backend is structured so that individual components can be improved independently as the application grows.

Potential production improvements include:

- Redis caching
- API rate limiting
- Background job queues
- Database indexing
- Horizontal API scaling
- Centralized logging
- Monitoring
- Automated testing
- Containerized deployment
- CI/CD

-

H2 Design Principles

Aesthetics follows several engineering principles:

H2 Separation of concerns

Routes, controllers, services, middleware and models have distinct responsibilities.

H2 Security by design

Authentication, authorization and secret management are considered part of the architecture rather than afterthoughts.

H2 Maintainability

The codebase is organized into reusable modules so additional business functionality can be added without unnecessarily affecting existing modules.

H2Extensibility

The architecture allows new modules and integrations to be introduced as the platform grows.