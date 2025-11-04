#!/usr/bin/env node

/**
 * Diagnostic script to check Supabase database and profile status
 * Run with: node diagnose-db.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
})

async function diagnose() {
  console.log('🔍 Starting Supabase diagnostics...\n')

  // 1. Check connection
  console.log('1️⃣ Testing Supabase connection...')
  try {
    const { data, error } = await supabase.from('profiles').select('count')
    if (error) {
      console.log(`   ⚠️  Connection test: ${error.message}`)
      console.log(`   Error details:`, error)
    } else {
      console.log('   ✅ Connection successful')
    }
  } catch (err) {
    console.log(`   ❌ Connection failed: ${err.message}`)
  }

  console.log('')

  // 2. Get current session
  console.log('2️⃣ Checking authentication session...')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.log(`   ❌ Session error: ${sessionError.message}`)
    console.log('   💡 You need to be logged in. Please log in first.')
    return
  }

  if (!session) {
    console.log('   ⚠️  No active session found')
    console.log('   💡 Please log in to your application first, then run this script again.')
    return
  }

  console.log(`   ✅ Logged in as: ${session.user.email}`)
  console.log(`   👤 User ID: ${session.user.id}`)
  console.log('')

  // 3. Check if profile exists
  console.log('3️⃣ Checking if profile exists...')
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.log(`   ❌ Profile query error: ${profileError.message}`)
      console.log(`   Error code: ${profileError.code}`)
      console.log(`   Error details:`, profileError)

      if (profileError.code === 'PGRST116') {
        console.log('\n   💡 No profile found in database!')
        console.log('   This means the profile was not created when you signed up.')
        console.log('   The auto-create trigger might not be working.')
      }
    } else if (!profile) {
      console.log('   ⚠️  Profile not found')
      console.log('   💡 Creating profile manually...')
      await createProfile(session.user)
    } else {
      console.log('   ✅ Profile found!')
      console.log('   Profile data:', JSON.stringify(profile, null, 2))
    }
  } catch (err) {
    console.log(`   ❌ Unexpected error: ${err.message}`)
    console.log('   Stack:', err.stack)
  }

  console.log('')

  // 4. Test RLS policies
  console.log('4️⃣ Testing RLS policies...')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)

    if (error) {
      console.log(`   ❌ RLS policy test failed: ${error.message}`)
    } else {
      console.log(`   ✅ RLS policies working correctly (found ${data?.length || 0} profile(s))`)
    }
  } catch (err) {
    console.log(`   ❌ RLS test error: ${err.message}`)
  }

  console.log('\n✨ Diagnostics complete!\n')
}

async function createProfile(user) {
  console.log('   🔨 Attempting to create profile...')

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'User',
        }
      ])
      .select()
      .single()

    if (error) {
      console.log(`   ❌ Failed to create profile: ${error.message}`)
      console.log(`   Error details:`, error)
    } else {
      console.log('   ✅ Profile created successfully!')
      console.log('   Profile data:', JSON.stringify(data, null, 2))
    }
  } catch (err) {
    console.log(`   ❌ Unexpected error creating profile: ${err.message}`)
  }
}

// Run diagnostics
diagnose().catch(console.error)
