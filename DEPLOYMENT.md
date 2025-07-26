# Deployment Guide

## Environment Variables Setup

### Required Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://your-project-id.supabase.co`
   - Found in: Supabase Dashboard → Settings → API

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in: Supabase Dashboard → Settings → API
   - This is safe to expose in the browser

### Optional Variables

3. **OPENAI_API_KEY**
   - Required for AI-powered reply generation
   - Get from: https://platform.openai.com/api-keys
   - Format: `sk-proj-...`

## Vercel Deployment Steps

### 1. Add Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your CRM project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

\`\`\`
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://lqsluwnfduckidvphzik.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc2x1d25mZHVja2lkdnBoemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU2ODIsImV4cCI6MjA2OTA2MTY4Mn0.ncvHMzV_3_1qX14OzNbeiSFp_ucXLkEZ_AHeDuxNGXE

Name: OPENAI_API_KEY
Value: your-openai-api-key
\`\`\`

### 2. Set Environment for All Environments

Make sure to set the environment variables for:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 3. Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Select **Redeploy**
4. Or push a new commit to trigger automatic deployment

## Database Setup

### 1. Run SQL Scripts in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Run `scripts/001-create-tables.sql`
3. Run `scripts/002-seed-data.sql`

### 2. Verify Database

Check that these tables exist:
- contacts
- leads  
- activities
- messages
- pipeline_stages

## Troubleshooting

### Environment Variable Issues

If you see "supabaseUrl is required":
1. Verify variables are set in Vercel
2. Check variable names are exact (case-sensitive)
3. Ensure variables are set for the correct environment
4. Redeploy after adding variables

### Database Connection Issues

1. Verify Supabase URL and key are correct
2. Check Supabase project is active
3. Ensure RLS policies allow access
4. Run database scripts if tables don't exist

## Testing

After deployment:
1. Visit your Vercel URL
2. Check that the environment check passes
3. Verify you can see the pipeline
4. Test creating a contact
5. Test creating a lead
6. Test all CRUD operations
