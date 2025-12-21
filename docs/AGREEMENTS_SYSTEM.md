# Products Management System with Static Agreements

This system manages products in MongoDB while displaying static legal agreements (Privacy Policy, Terms of Service, Security Policy) that list which products are covered. Only products are stored in the database, not the agreements themselves.

## 📁 Structure

```
src/
├── Models/
│   ├── Agreements.ts         # Agreement schema & model
│   ├── Products.ts           # Product schema & model
│   └── index.ts              # Export all models
├── Utils/
│   ├── dbConnect.ts          # MongoDB connection utility
│   └── index.ts              # Export utilities
├── Library/
│   ├── auth.ts               # Better Auth configuration
│   └── index.ts              # Export auth
├── app/
│   ├── api/
│   │   ├── agreements/
│   │   │   ├── route.ts      # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       └── route.ts  # GET, PUT, DELETE
│   │   └── products/
│   │       ├── route.ts      # GET (list), POST (create)
│   │       └── [id]/
│   │           └── route.ts  # GET, PUT, DELETE
│   └── agreements/
│       └── [slug]/
│           └── page.tsx      # Dynamic agreement page
└── Components/
    └── Agreements/
        └── AgreementContent.tsx  # Agreement display component
```

## 🔐 Authentication

All write operations (POST, PUT, DELETE) require **admin authentication** via Better Auth.

The system uses Better Auth configured in `src/Library/auth.ts` with MongoDB adapter.

```typescript
// Authentication check in API routes
import { auth } from "@/Library/auth";

async function isAdmin(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        // Check if user has admin role
        return (session?.user as any)?.role === "admin";
    } catch (error) {
        return false;
    }
}
```

### Setup Required

1. **Environment Variables** (.env.local):
```env
# MongoDB Connection
MONGODB_01=mongodb://localhost:27017/your-database

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Optional: Social Auth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

2. **Database Connection**:
```typescript
import { dbConnect } from "@/Utils/dbConnect";

// In your API routes
await dbConnect();
```

## 📊 Data Models

### Product Model (Database Only)

```typescript
{
  ProductID: string;          // UUID
  Name: string;
  Slug: string;               // Unique URL-friendly identifier
  Description?: string;
  Version?: string;
  Category?: string;
  Status: string;             // active | inactive | deprecated
  Icon?: string;
  URL?: string;
  CreatedBy: string;          // User ID
  Metadata: {
    Repository?: string;
    Documentation?: string;
    SupportEmail?: string;
    Tags?: string[];
  };
}
```

### Agreement Content (Static - Hardcoded)

Agreements are defined as static content in the component with:
- Title, Version, Effective Date
- Markdown content (the legal text)
- Metadata (description, keywords, author)

The system fetches all active products and displays them in the agreement page.

## 🚀 API Endpoints

### Products API (Database Only)

~~### Agreements API~~ (Removed - Agreements are static)
```bash
GET /api/agreements?page=1&limit=10&type=security&status=published
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `type` (string): Filter by agreement type
- `status` (string): Filter by status (admin only)
- `slug` (string): Find by slug
- `productID` (string): Filter by product ID

**Response:**
```json
{
  "success": true,
  "data": [...agreements],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get Single Agreement
```bash
GET /api/agreements/[id-or-slug]
```

**Response:**
```json
{
  "success": true,
  "data": {
    ...agreement,
    "products": [...covered products]
  }
}
```

#### Create Agreement (Admin Only)
```bash
POST /api/agreements
Content-Type: application/json
Authorization: Bearer <token>

{
  "Type": "covered_products_privacy",
  "Title": "Privacy Policy for Covered Products",
  "Slug": "covered-products-privacy",
  "Content": "# Privacy Policy\n\n...",
  "Version": "1.0.0",
  "ProductIDs": ["product-uuid-1", "product-uuid-2"],
  "Status": "published",
  "EffectiveDate": "2025-01-01",
  "Metadata": {
    "Description": "Privacy policy description",
    "Keywords": ["privacy", "data protection"],
    "Author": "Legal Team"
  }
}
```

#### Update Agreement (Admin Only)
```bash
PUT /api/agreements/[id-or-slug]
Content-Type: application/json
Authorization: Bearer <token>

{
  "Title": "Updated Title",
  "Content": "Updated content...",
  "Version": "1.1.0"
}
```

#### Delete Agreement (Admin Only)
```bash
DELETE /api/agreements/[id-or-slug]
Authorization: Bearer <token>
```

### Products API

#### List Products
```bash
GET /api/products?page=1&limit=20&status=active&search=portfolio
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status
- `category` (string): Filter by category
- `search` (string): Search in name, description, tags

#### Get Single Product
```bash
GET /api/products/[id-or-slug]
```

Returns product with related agreements.

#### Create Product (Admin Only)
```bash
POST /api/products
Content-Type: application/json
Authorization: Bearer <token>

{
  "Name": "Portfolio Website",
  "Slug": "portfolio-website",
  "Description": "Personal portfolio and blog",
  "Version": "2.0.0",
  "Category": "Web Application",
  "Status": "active",
  "Icon": "🌐",
  "URL": "https://meet.com",
  "Metadata": {
    "Repository": "https://github.com/...",
    "Documentation": "https://docs...",
    "SupportEmail": "support@meet.com",
    "Tags": ["portfolio", "nextjs", "react"]
  }
}
```

#### Update Product (Admin Only)
```bash
PUT /api/products/[id-or-slug]
```

#### Delete Product (Admin Only)
```bash
DELETE /api/products/[id-or-slug]
```

## 🎨 Frontend Usage

### Display Agreement Page

Visit any agreement at:
```
/agreements/covered-products-privacy
/agreements/covered-products-terms
/agreements/security
```

The page automatically:
- Fetches agreement from API
- Displays covered products
- Renders markdown content
- Shows version and effective date

### Custom Agreement Component

```tsx
import AgreementContent from "@/Components/Agreements/AgreementContent";

<AgreementContent slug="covered-products-privacy" />
```

## 📝 Adding New Agreements

1. **Create the agreement via API** (as admin):
```bash
curl -X POST http://localhost:3000/api/agreements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "Type": "covered_products_privacy",
    "Title": "Privacy Policy for Covered Products",
    "Slug": "covered-products-privacy",
    "Content": "# Your markdown content here...",
    "Version": "1.0.0",
    "Status": "published"
  }'
```

2. **Add to sitemap** (optional):
Edit `src/Components/Organisms/Sitemap/Content.tsx` and add to Legal & Policies section.

3. **Create static route** (optional):
Add slug to `generateStaticParams()` in `src/app/agreements/[slug]/page.tsx`.

## 🔧 Database Setup

Ensure MongoDB is connected via `dbConnect()` utility. Models will auto-create collections:
- `agreements` - Stores all agreements
- `products` - Stores all products

Indexes are automatically created for:
- Agreement: Type, Status, Slug, ProductIDs
- Product: Slug, Status, Tags

## 🛡️ Security Features

- ✅ Admin-only write operations
- ✅ Soft deletes (isDeleted flag)
- ✅ Session validation via Better Auth
- ✅ Unique slug enforcement
- ✅ Product validation for ProductIDs
- ✅ Status-based visibility (non-admins see published only)

## 📦 Dependencies

```json
{
  "mongoose": "^8.x",
  "@better-auth/core": "^1.x",
  "react-markdown": "^9.x",
  "motion": "^10.x",
  "uuid": "^9.x"
}
```

## 🚦 Example Workflow

1. **Create Products**:
```bash
POST /api/products
{
  "Name": "My App",
  "Slug": "my-app"
}
```

2. **Create Agreement**:
```bash
POST /api/agreements
{
  "Type": "covered_products_privacy",
  "Title": "Privacy Policy",
  "Slug": "covered-products-privacy",
  "ProductIDs": ["<product-id-from-step-1>"],
  "Content": "# Privacy Policy\n\n...",
  "Status": "published"
}
```

3. **View Agreement**:
Visit `/agreements/covered-products-privacy`

4. **Update Agreement**:
```bash
PUT /api/agreements/covered-products-privacy
{
  "Version": "1.1.0",
  "Content": "Updated content..."
}
```

## 📞 Support

For issues or questions about the agreements system, contact the development team or open an issue in the repository.
