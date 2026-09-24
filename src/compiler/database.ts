/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseSchema } from './types';

export const UNIVERSITY_SCHEMA: DatabaseSchema = {
  tables: {
    students: {
      name: 'students',
      description: 'Undergraduate and postgraduate student registry',
      columns: [
        { name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, description: 'Unique Student ID' },
        { name: 'name', type: 'TEXT', nullable: false, description: 'Full student name' },
        { name: 'email', type: 'TEXT', nullable: false, description: 'Institutional email address' },
        { name: 'department', type: 'TEXT', nullable: false, description: 'Academic department (CS, EE, SE, etc.)' },
        { name: 'cgpa', type: 'REAL', nullable: false, description: 'Cumulative Grade Point Average (0.00 - 4.00)' },
        { name: 'age', type: 'INTEGER', nullable: true, description: 'Student age in years' },
      ],
    },
    courses: {
      name: 'courses',
      description: 'Departmental course catalog and offerings',
      columns: [
        { name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, description: 'Unique Course ID' },
        { name: 'course_name', type: 'TEXT', nullable: false, description: 'Course title' },
        { name: 'credit_hours', type: 'INTEGER', nullable: false, description: 'Credits count (e.g., 3, 4)' },
        { name: 'department', type: 'TEXT', nullable: false, description: 'Offering department code' },
        { name: 'instructor', type: 'TEXT', nullable: true, description: 'Course lead instructor' },
      ],
    },
    enrollments: {
      name: 'enrollments',
      description: 'Student course registrations and term grades',
      columns: [
        { name: 'student_id', type: 'INTEGER', nullable: false, description: 'Foreign key to students.id' },
        { name: 'course_id', type: 'INTEGER', nullable: false, description: 'Foreign key to courses.id' },
        { name: 'semester', type: 'TEXT', nullable: false, description: 'Academic term (e.g., Fall 2024)' },
        { name: 'grade', type: 'TEXT', nullable: true, description: 'Letter grade awarded (A, B+, etc.)' },
      ],
    },
    departments: {
      name: 'departments',
      description: 'Academic faculties and resource allocations',
      columns: [
        { name: 'dept_code', type: 'TEXT', primaryKey: true, nullable: false, description: 'Department code (CS, EE, MATH)' },
        { name: 'dept_name', type: 'TEXT', nullable: false, description: 'Full department name' },
        { name: 'budget', type: 'REAL', nullable: false, description: 'Annual research budget in USD' },
        { name: 'building', type: 'TEXT', nullable: false, description: 'Campus hall/building location' },
      ],
    },
    users: {
      name: 'users',
      description: 'System authentication accounts (Simulated auth table for security testing)',
      columns: [
        { name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, description: 'Account ID' },
        { name: 'username', type: 'TEXT', nullable: false, description: 'Login username' },
        { name: 'password_hash', type: 'TEXT', nullable: false, description: 'Hashed password' },
        { name: 'role', type: 'TEXT', nullable: false, description: 'Role (admin, student, faculty)' },
        { name: 'last_login', type: 'TEXT', nullable: true, description: 'Last active timestamp' },
      ],
    },
  },
};

export const INITIAL_DATABASE_DATA: Record<string, Record<string, any>[]> = {
  students: [
    { id: 101, name: 'Ali Khan', email: 'ali.khan@uni.edu', department: 'CS', cgpa: 3.82, age: 21 },
    { id: 102, name: 'Sara Ahmed', email: 'sara.ahmed@uni.edu', department: 'CS', cgpa: 3.91, age: 20 },
    { id: 103, name: 'Zainab Fatima', email: 'zainab.f@uni.edu', department: 'EE', cgpa: 3.45, age: 22 },
    { id: 104, name: 'Bilal Tariq', email: 'bilal.t@uni.edu', department: 'SE', cgpa: 2.85, age: 23 },
    { id: 105, name: 'Hamza Malik', email: 'hamza.m@uni.edu', department: 'CS', cgpa: 3.15, age: 21 },
    { id: 106, name: 'Ayesha Noor', email: 'ayesha.n@uni.edu', department: 'MATH', cgpa: 3.75, age: 19 },
    { id: 107, name: 'Usman Ghani', email: 'usman.g@uni.edu', department: 'EE', cgpa: 2.94, age: 24 },
    { id: 108, name: 'Mariam Raza', email: 'mariam.r@uni.edu', department: 'SE', cgpa: 3.68, age: 22 },
    { id: 109, name: 'Farhan Siddiqui', email: 'farhan.s@uni.edu', department: 'CS', cgpa: 3.20, age: 20 },
    { id: 110, name: 'Khadija Bibi', email: 'khadija.b@uni.edu', department: 'MATH', cgpa: 3.98, age: 21 },
  ],
  courses: [
    { id: 501, course_name: 'Compiler Construction', credit_hours: 3, department: 'CS', instructor: 'Dr. Tariq' },
    { id: 502, course_name: 'Database Systems', credit_hours: 4, department: 'CS', instructor: 'Dr. Amina' },
    { id: 503, course_name: 'Digital Logic Design', credit_hours: 3, department: 'EE', instructor: 'Prof. Rashid' },
    { id: 504, course_name: 'Software Engineering', credit_hours: 3, department: 'SE', instructor: 'Engr. Noman' },
    { id: 505, course_name: 'Linear Algebra', credit_hours: 3, department: 'MATH', instructor: 'Dr. Saima' },
  ],
  enrollments: [
    { student_id: 101, course_id: 501, semester: 'Fall 2024', grade: 'A' },
    { student_id: 101, course_id: 502, semester: 'Fall 2024', grade: 'A-' },
    { student_id: 102, course_id: 501, semester: 'Fall 2024', grade: 'A+' },
    { student_id: 103, course_id: 503, semester: 'Fall 2024', grade: 'B+' },
    { student_id: 104, course_id: 504, semester: 'Fall 2024', grade: 'B-' },
    { student_id: 105, course_id: 501, semester: 'Fall 2024', grade: 'B' },
    { student_id: 106, course_id: 505, semester: 'Fall 2024', grade: 'A' },
  ],
  departments: [
    { dept_code: 'CS', dept_name: 'Computer Science', budget: 450000.0, building: 'Al-Khawarizmi Hall' },
    { dept_code: 'EE', dept_name: 'Electrical Engineering', budget: 380000.0, building: 'Tesla Block' },
    { dept_code: 'SE', dept_name: 'Software Engineering', budget: 320000.0, building: 'Turing Complex' },
    { dept_code: 'MATH', dept_name: 'Mathematics', budget: 210000.0, building: 'Euler Tower' },
  ],
  users: [
    { id: 1, username: 'admin', password_hash: '$2a$12$e8Yw3R6jQG.m/x1Z...', role: 'superadmin', last_login: '2026-09-23 10:15:00' },
    { id: 2, username: 'dr_tariq', password_hash: '$2a$12$K19vW8xL9p2N.y2A...', role: 'faculty', last_login: '2026-09-22 14:20:00' },
    { id: 3, username: 'ali_khan', password_hash: '$2a$12$L77rT5mQ8k9J.z3P...', role: 'student', last_login: '2026-09-24 08:30:00' },
  ],
};
