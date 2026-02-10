# BugNest - Bug Tracking System

A comprehensive Bug Tracking System built with **Spring Boot** (Backend) and **React** (Frontend).

## 🚀 Tech Stack
- **Backend:** Java Spring Boot, Spring Security (JWT), Spring Data JPA, JavaMailSender
- **Frontend:** React.js (Vite), Axios, CSS Modules (Enterprise SaaS Design)
- **Database:** PostgreSQL

## ⚙️ Configuration

### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is running and create a database named `bugnest`.
Update credentials in `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/bugnest
spring.datasource.username=postgres
spring.datasource.password=YOUR_DB_PASSWORD
```

### 2. Email Configuration (Gmail SMTP)
To enable real email sending (for new user creation), update `application.properties`:
```properties
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD
```
*Note: Use an App Password if using Gmail.*

## ✅ Current Functionality

### Authentication & Roles
- **JWT-Based Login**: Secure authentication.
- **Role-Based Access**:
  - **Admin**: Full access, User Management.
  - **Manager**: Project & Team oversight.
  - **Developer**: Start/Stop work (Dashboard).
  - **Tester**: Report bugs (Dashboard).

### Key Features
1.  **Admin User Management**:
    - View users filtered by Role (Admin, Manager, Developer, Tester).
    - **Create New Users**: Auto-generates a secure password and sends it via **Email**.
2.  **Dashboards**:
    - Dedicated, responsive dashboards for each role.
    - Enterprise SaaS UI design (Sidebar, Navbar, Cards).
3.  **Settings Module**:
    - **Profile**: Update personal details.
    - **Security**: Change Password functionality.
4.  **Email System**:
    - Automated emails for account creation (Welcome Email with Credentials).

## 🏃‍♂️ How to Run

**Backend:**
```bash
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm run dev
```
