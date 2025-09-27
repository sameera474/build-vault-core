import { z } from 'zod';

// Test Report validation schema
export const testReportSchema = z.object({
  report_number: z.string()
    .trim()
    .min(1, { message: "Report number is required" })
    .max(50, { message: "Report number must be less than 50 characters" })
    .regex(/^[A-Za-z0-9\-_]+$/, { message: "Report number can only contain letters, numbers, hyphens, and underscores" }),
  
  test_type: z.string()
    .trim()
    .min(1, { message: "Test type is required" })
    .max(100, { message: "Test type must be less than 100 characters" }),
  
  material_type: z.string()
    .trim()
    .max(100, { message: "Material type must be less than 100 characters" })
    .optional(),
  
  test_date: z.string()
    .trim()
    .min(1, { message: "Test date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format" }),
  
  technician_name: z.string()
    .trim()
    .max(100, { message: "Technician name must be less than 100 characters" })
    .optional(),
  
  compliance_status: z.enum(['pending', 'pass', 'fail', 'review_required']),
  
  project_id: z.string()
    .trim()
    .optional(),
  
  notes: z.string()
    .trim()
    .max(2000, { message: "Notes must be less than 2000 characters" })
    .optional(),
  
  results: z.record(z.string(), z.any()).optional()
});

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Name can only contain letters, spaces, hyphens, and apostrophes" }),
  
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  
  message: z.string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(1000, { message: "Message must be less than 1000 characters" })
});

// Project validation schema
export const projectSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Project name is required" })
    .max(200, { message: "Project name must be less than 200 characters" }),
  
  description: z.string()
    .trim()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional(),
  
  location: z.string()
    .trim()
    .max(200, { message: "Location must be less than 200 characters" })
    .optional(),
  
  start_date: z.string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format" })
    .optional(),
  
  end_date: z.string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format" })
    .optional(),
  
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled'])
});

// User profile validation schema
export const profileSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Name can only contain letters, spaces, hyphens, and apostrophes" }),
  
  role: z.enum(['admin', 'user'])
});

// Team invitation validation schema
export const teamInvitationSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  
  role: z.enum(['admin', 'user'])
});

export type TestReportFormData = z.infer<typeof testReportSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type TeamInvitationFormData = z.infer<typeof teamInvitationSchema>;