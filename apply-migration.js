#!/usr/bin/env node

/**
 * Script to apply SQL migration to Supabase database
 * Run with: node apply-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('⚠️  WARNING: This script needs a service role key to run migrations.')
console.log('The anon key does not have sufficient permissions to modify RLS policies.\n')

console.log('📋 Please apply the migration manually:\n')
console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard')
console.log('2. Select your project: wpgaxoqbrdyfihwzoxlc')
console.log('3. Go to SQL Editor')
console.log('4. Copy and paste the following SQL:\n')
console.log('─'.repeat(80))

const migrationPath = path.join(__dirname, 'supabase', 'migrations', '003_fix_rls_recursion.sql')
const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

console.log(migrationSQL)
console.log('─'.repeat(80))

console.log('\n5. Click "Run" to execute the migration')
console.log('\n✅ After running the migration, your 500 errors should be fixed!\n')

console.log('Alternative: If you want to run this automatically, you can:')
console.log('1. Get your service role key from Supabase Dashboard > Settings > API')
console.log('2. Add it to .env.local as SUPABASE_SERVICE_ROLE_KEY')
console.log('3. Run this script again with the --auto flag\n')
