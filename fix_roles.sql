-- Drop role constraints if they exist
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Update roles to match Java Enum
UPDATE project_members SET role = 'PROJECT_MANAGER' WHERE role = 'MANAGER';
UPDATE users SET role = 'PROJECT_MANAGER' WHERE role = 'MANAGER';

-- Add updated constraints
ALTER TABLE project_members ADD CONSTRAINT project_members_role_check CHECK (role IN ('PROJECT_MANAGER', 'DEVELOPER', 'TESTER'));
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'TESTER'));

