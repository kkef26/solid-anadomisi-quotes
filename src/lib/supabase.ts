import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ynxcbvfhrwuenjnvsceq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlueGNidmZocnd1ZW5qbnZzY2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzEyNDMsImV4cCI6MjA4OTAwNzI0M30.wWWbwIEZZ9V9oRLyr_tKmh5QgPySTcKbh5s1k8hp_-w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
