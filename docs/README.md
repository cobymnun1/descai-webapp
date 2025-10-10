# DeScAi - Research Paper Review System

A Next.js-based web application for uploading, analyzing, and managing research paper reviews using AI-powered analysis with OpenAI GPT-4o-mini and Supabase database integration.

## 📋 Overview

DeScAi is a comprehensive document analysis platform that automatically generates structured peer reviews of research papers. The system processes various document formats, performs AI-powered analysis across multiple dimensions (originality, clarity, rigor, reproducibility, data transparency, and interpretation), and stores results in a Supabase database for easy access and management.

## ✨ Key Features

### 🔄 Document Processing Pipeline
- **Multi-format Support**: PDF, TXT, MD, DOCX, DOC, ODT, RTF, EPUB
- **Automated Conversion**: Seamless document-to-plaintext conversion
- **Format-Specific Processing**: 
  - PDF extraction via `pdf-parse`
  - DOCX extraction via `mammoth`
  - Direct UTF-8 reading for TXT/MD

### 🤖 AI-Powered Review Generation
- **OpenAI Integration**: Uses GPT-4o-mini for comprehensive analysis
- **Multi-dimensional Scoring**: Evaluates papers across 6 key dimensions
- **Structured Output**: JSON-formatted reviews with rationales and scores
- **Validation System**: Ensures all scores and required fields are valid

### 💾 Database Integration
- **Supabase Backend**: Cloud-hosted PostgreSQL database
- **Dual Storage**: Files saved locally + structured data in database
- **JSONB Support**: Full review context preserved with queryable scores
- **RLS Security**: Row-level security policies for data protection

### 🎨 Beautiful Review Reports
- **Professional UI**: Gradient headers, score cards, progress indicators
- **Color-coded Sections**: Visual distinction between review categories
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Report Format**: Clean, printable layout for stakeholder sharing

### 🔧 Manual Push Feature
- **Database Testing**: Verify Supabase connection independently
- **Error Recovery**: Retry failed automatic pushes
- **Batch Migration**: Push multiple existing reviews to database

## 🏗️ Architecture

### Two-API Design Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                       │
│                     (app/page.js)                       │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           │ Upload & Analyze         │ Manual Push
           ↓                          ↓
┌──────────────────────┐    ┌──────────────────────────┐
│   /api/analyze       │    │   /api/push-review       │
│ ┌──────────────────┐ │    │ ┌──────────────────────┐ │
│ │ OpenAI GPT-4     │ │    │ │ Read review.json     │ │
│ │ JSON validation  │ │    │ │ Validate scores      │ │
│ │ File saving      │─┼────│ │ Map to DB schema     │ │
│ └──────────────────┘ │    │ │ Insert to Supabase   │ │
│                      │    │ └──────────────────────┘ │
└──────────────────────┘    └────────────┬─────────────┘
                                         │
                            ┌────────────▼──────────────┐
                            │  SUPABASE DATABASE        │
                            │  - reviews table          │
                            │  - JSONB + numeric cols   │
                            └───────────────────────────┘
```

### Benefits of Separation
- **Single Responsibility**: Each API has one focused purpose
- **Testability**: Test AI generation and database operations independently
- **Reusability**: Manual push, batch operations, migration scripts
- **Error Isolation**: Database failures don't break AI analysis
- **Graceful Degradation**: Files save locally even if database is down

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- npm, yarn, pnpm, or bun
- OpenAI API key
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend_v1/Home-page/descai
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env.local` in the `descai` directory:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional (defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
descai/
├── app/
│   ├── api/
│   │   ├── analyze/          # AI review generation
│   │   │   ├── route.js      # OpenAI integration
│   │   │   └── prompt.md     # System prompt
│   │   ├── covert/           # Document conversion
│   │   │   ├── route.js      # Conversion endpoint
│   │   │   └── helper.js     # Format-specific converters
│   │   ├── push-review/      # Database operations
│   │   │   └── route.js      # Supabase integration
│   │   ├── reviews/          # Review retrieval
│   │   │   ├── route.js      # List all reviews
│   │   │   └── [id]/
│   │   │       └── route.js  # Get single review
│   │   └── upload/           # File upload
│   │       └── route.js      # Multipart form handling
│   ├── review/
│   │   └── [id]/
│   │       ├── page.js       # Review report page
│   │       └── review.module.css
│   ├── page.js               # Home page
│   ├── layout.js             # Root layout
│   └── globals.css           # Global styles
├── public/
│   ├── uploads/              # Source text files
│   └── reviews/              # Generated review JSONs
├── docs/                     # Documentation
├── package.json
└── next.config.mjs
```

## 🎯 Usage Workflow

### 1. Upload & Analyze (Automatic Flow)
1. Select a PDF or DOCX file
2. Click "Upload & Convert"
3. Click "Analyze with OpenAI"
4. Wait ~15-30 seconds for AI analysis
5. Review is saved to file + database automatically
6. View report by clicking "View Report"

### 2. Manual Database Push (Testing/Recovery)
1. Scroll to "Manual Database Push" section
2. Click "Load Existing Reviews"
3. Select a review to push
4. Click "Push to DB"
5. Verify success message

### 3. View Reviews
1. Click "Load Database Reviews"
2. Browse saved reviews
3. Click "View Report" for detailed view
4. Navigate between reviews

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o-mini |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Service role key (bypasses RLS) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | Alternative to service key (requires RLS) |
| `NEXT_PUBLIC_APP_URL` | No | Base URL (defaults to localhost:3000) |

*Use either service role key OR anon key, not both. Service role recommended for backend operations.

### OpenAI Configuration
- **Model**: gpt-4o-mini (cost-effective, fast)
- **Temperature**: 0.3 (balanced creativity/consistency)
- **Max Tokens**: 3000
- **JSON Mode**: Enabled for structured output

### Supabase Setup
See [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) for complete setup instructions.

## 📊 Review Dimensions

Each paper is evaluated across 6 key dimensions:

1. **Originality** (0-1): Novel contributions vs. existing literature
2. **Clarity** (0-1): Writing quality, structure, accessibility
3. **Rigor** (0-1): Methodological soundness, statistical validity
4. **Reproducibility** (0-1): Ability to replicate findings
5. **Data Transparency** (0-1): Data availability and documentation
6. **Interpretation** (0-1): Conclusions supported by results

Additional metrics:
- **Field Familiarity** (0-1): Accessibility to non-specialists

## 🧪 Testing

### Test Database Connection
```bash
# Use manual push to verify Supabase credentials
1. Load existing reviews
2. Push one review
3. Check for success/RLS errors
```

### Test AI Generation
```bash
# Upload a paper and analyze
1. Use a short paper (faster testing)
2. Check validation warnings/errors
3. Verify JSON structure in response
```

### Test Full Flow
```bash
# End-to-end test
1. Upload new document
2. Convert to text
3. Analyze with AI
4. Verify database record created
5. View report page
```

## 🐛 Troubleshooting

### Common Issues

**"RLS policy violation"**
- Use service role key in `.env.local`
- Or disable RLS: `ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;`

**"OpenAI API error"**
- Check API key is valid
- Verify billing is active
- Check rate limits

**"Review file not found"**
- Ensure file exists in `public/reviews/`
- Check filename spelling

**"Database push failed"**
- File is still saved locally
- Use manual push to retry
- Check Supabase credentials

## 📚 Documentation

- [API_GUIDE.md](./API_GUIDE.md) - Complete API reference
- [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) - Database setup & troubleshooting
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - System architecture details

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Frontend**: React 19.1.0
- **Backend**: Next.js API Routes (Node.js)
- **AI**: OpenAI GPT-4o-mini
- **Database**: Supabase (PostgreSQL)
- **Document Processing**: pdf-parse, mammoth
- **Styling**: CSS Modules

## 🔒 Security

- Environment variables for sensitive keys
- RLS policies for database access
- File type validation
- Score range validation
- JSON structure validation

**Production Recommendations:**
- Enable RLS policies
- Add rate limiting
- Implement user authentication
- Add file size limits
- Enable CORS restrictions

## 🚧 Roadmap

### Upcoming Features
- [ ] Batch document processing
- [ ] Export reports to PDF
- [ ] Comparison view for multiple papers
- [ ] Analytics dashboard
- [ ] User authentication & profiles
- [ ] Version history for reviews
- [ ] Collaborative review editing
- [ ] Custom review templates

## 📄 License

(Add license information)

## 👥 Contributors

DeScAi Development Team

---

**Version**: 0.1.0  
**Status**: Active Development  
**Last Updated**: October 2025

For detailed API documentation, see [API_GUIDE.md](./API_GUIDE.md)  
For database setup, see [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)
