# CRM System for Neon 51

A complete CRM system built with Next.js, Supabase, and AI integration for managing leads, contacts, and sales pipeline.

## Features

- 📊 **Pipeline Management** - Visual pipeline with stage management
- 👥 **Contact Management** - Full CRUD operations for contacts
- 📋 **Activity Tracking** - Task management and completion tracking
- 🤖 **AI-Powered Replies** - Smart response generation using OpenAI
- 💬 **Message Management** - Email and WhatsApp conversation tracking
- 🏷️ **Lead Labeling** - Color-coded labels for lead organization

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/hoorishkiyani/CRM.git
cd CRM
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Configure your environment variables in `.env.local`:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
\`\`\`

5. Set up the database:
   - Run the SQL scripts in `scripts/` folder in your Supabase SQL editor
   - First run `001-create-tables.sql`
   - Then run `002-seed-data.sql` for sample data

6. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## Database Schema

The system uses the following main tables:
- `contacts` - Customer contact information
- `leads` - Sales leads with pipeline stages
- `activities` - Tasks and activities for leads
- `messages` - Communication history
- `pipeline_stages` - Configurable pipeline stages

## Deployment

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
