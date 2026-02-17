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

### 🔐 Authentication & Roles
- **JWT-Based Login**: Secure cross-origin authentication.
- **Enterprise Role-Based Access (RBAC)**:
  - **Admin**: Full system control & User Management.
  - **Manager**: Project oversight, team management, and bug assignment.
  - **Developer**: View projects, update bug status (In Progress/Review), and manage Kanban board.
  - **Tester**: Report bugs, verify fixes, and track project quality.

### 🛠️ Key Modules
1.  **Project Management**:
    - Create and manage projects with unique keys (e.g., `PRJ-1`).
    - Add/Invite team members to specific projects.
    - Role-based project visibility.
2.  **Bug Tracking System**:
    - Report bugs with priority (Low, Medium, High) and detailed descriptions.
    - Assign bugs to specific developers.
    - Track status: `OPEN` → `IN_PROGRESS` → `REVIEW` → `TESTING` → `CLOSED`.
3.  **Visual Kanban Board**:
    - Drag-and-drop style status updates for a quick overview of project health.
4.  **Admin User Management**:
    - centralized user directory with role-based filtering.
    - **Automated Onboarding**: Create users and trigger auto-generated password emails.
5.  **Settings & Profile**:
    - Personal details management and secure password change.

## 🏃‍♂️ How to Run

**Backend (Java 17+):**
```bash
./mvnw spring-boot:run
```

**Frontend (Node.js):**
```bash
cd frontend
npm install
npm run dev
```
