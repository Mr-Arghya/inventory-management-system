# InventoryHub - Multi-Tenant Inventory Management Platform

A full-stack, multi-tenant inventory management system built with Node.js/Express backend and Next.js frontend. Designed for small to medium businesses to manage products, orders, stock movements, and suppliers.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   cd /home/arghya/Documents/Assignments/TechExactly
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create environment file
   # Edit .env with your MongoDB connection string and JWT secret
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install  # or pnpm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

---

## 👥 Test Credentials

The system uses a multi-tenant architecture with role-based access control. Below are test accounts for different tenants and roles.

### Tenant 1: TechExactly Solutions

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Owner** | owner1@techexactly.com | Owner@123 | Full access: All features, settings, team management |
| **Manager** | manager1@techexactly.com | Manager@123 | Manage products, orders, view reports |
| **Staff** | staff1@techexactly.com | Staff@123 | View products, basic order management |

### Tenant 2: RetailMax Inc

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Owner** | owner2@retailmax.com | Owner@123 | Full access: All features, settings, team management |
| **Manager** | manager2@retailmax.com | Manager@123 | Manage products, orders, view reports |
| **Staff** | staff2@retailmax.com | Staff@123 | View products, basic order management |

### Creating Additional Users

Users can be added by the tenant owner through the settings page or via API:
```javascript
POST /api/user/register
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "SecurePassword123",
  "businessName": "TechExactly Solutions",
  "user_type": "staff"  // owner, manager, or staff
}
```

---

## ✨ Features Implemented

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-Tenancy** | Logical tenant isolation via `tenant_id` | ✅ Complete |
| **User Authentication** | JWT + Session-based auth with role hierarchy | ✅ Complete |
| **Product Management** | Create, update, delete products with variants | ✅ Complete |
| **Variant Support** | Multiple variants per product (size, color) | ✅ Complete |
| **Stock Tracking** | Real-time stock with movement history | ✅ Complete |
| **Order Management** | Create, fulfill, cancel orders with stock reservation | ✅ Complete |
| **Stock Reservation** | 15-minute hold on stock when order is placed | ✅ Complete |
| **Supplier Management** | Add and manage supplier relationships | ✅ Complete |
| **Purchase Orders** | Create and receive purchase orders | ✅ Complete |
| **Dashboard Analytics** | Stats, charts, low-stock alerts | ✅ Complete |
| **Low Stock Alerts** | Visual indicators for items below threshold | ✅ Complete |

### User Roles & Permissions

| Feature | Owner | Manager | Staff |
|---------|-------|---------|-------|
| View Dashboard | ✅ | ✅ | ✅ |
| Manage Products | ✅ | ✅ | ❌ |
| View Products | ✅ | ✅ | ✅ |
| Manage Orders | ✅ | ✅ | Read-only |
| Fulfill Orders | ✅ | ✅ | ❌ |
| Manage Stock | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ✅ |
| Manage Team | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |

### Technical Features

| Feature | Description |
|---------|-------------|
| **MongoDB Transactions** | Atomic operations for stock and orders |
| **Optimistic Concurrency** | Version field for conflict detection |
| **Soft Delete** | All entities support soft delete |
| **Audit Trail** | Stock movement history for all changes |
| **Responsive UI** | Mobile-friendly React components |
| **Dark Mode** | Theme support with next-themes |
| **Pagination** | Server-side pagination for large datasets |
| **Filter & Search** | Advanced filtering on all list views |

---

## 📁 Project Structure

```
TechExactly/
├── backend/
│   ├── config/           # Configuration files
│   ├── connectors/       # External service connections
│   ├── controller/       # Request handlers
│   ├── lib/              # Utility libraries
│   ├── middleware/       # Express middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── templates/        # Email templates
│   ├── app.js            # Express app setup
│   └── server.js         # Entry point
├── frontend/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & validations
│   ├── services/         # API client
│   ├── styles/           # Global styles
│   └── types/            # TypeScript types
├── ARCHITECTURE.md       # Detailed architecture docs
└── README.md             # This file
```

---

## ⚙️ Configuration

### Backend Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/inventory_saas

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🧪 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/register` | Register new tenant owner |
| POST | `/user/login` | Login with email/password |
| GET | `/user/check` | Verify auth session |
| POST | `/auth/logout` | Logout and invalidate session |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (paginated) |
| POST | `/products` | Create new product |
| GET | `/products/:id` | Get product details |
| PATCH | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product (soft) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/order` | List orders (filtered) |
| POST | `/order` | Create new order |
| GET | `/order/:id` | Get order details |
| POST | `/order/:id/cancel` | Cancel order |
| POST | `/order/:id/fulfill` | Fulfill order/items |
| PATCH | `/order/:id/status` | Update order status |
| GET | `/order/stats` | Get order statistics |

### Stock
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stock-movement` | List stock movements |
| POST | `/stock-movement/adjust` | Adjust stock manually |
| GET | `/stock-movement/variant/:id` | Movements by variant |

### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers` | List suppliers |
| POST | `/suppliers` | Create supplier |
| GET | `/suppliers/:id` | Get supplier details |
| PATCH | `/suppliers/:id` | Update supplier |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard statistics |
| GET | `/dashboard/stats` | Detailed stats |

---

## 📝 Assumptions

1. **Tenant Isolation**: All data access is scoped to the authenticated user's tenant via `tenant_id` in JWT token
2. **Single Database**: Uses shared database with logical separation (not database-per-tenant)
3. **Stock Reservation**: 15-minute hold on stock when order is created, auto-released if payment/fulfillment not completed
4. **Role Hierarchy**: Owner > Manager > Staff with inherited permissions
5. **Soft Delete**: Deletion marks records as `is_deleted: true` rather than removing
6. **Synchronous Processing**: Stock updates happen synchronously during order creation
7. **No Payment Gateway**: Payment processing is mocked (status only)
8. **Single Currency**: All transactions assume USD for MVP

---

## ⚠️ Known Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| No Redis Cache | Higher database load for repeated queries | Add Redis in v2 |
| Manual Reservation Cleanup | Expired reservations need manual trigger | Add scheduled jobs (Bull/Agenda) |
| No Real-time Updates | Inventory changes require page refresh | WebSocket integration planned |
| Limited Search | Basic regex search on product names | Add Elasticsearch in v2 |
| No Rate Limiting | API vulnerable to abuse | Add express-rate-limit |
| No File Validation | Uploaded files not strictly validated | Add file type/size validation |
| No Audit Logs | User actions not fully audited | Add comprehensive audit trail |
| No Email Notifications | OTP and alerts not sent via email | Configure SMTP settings |
| No GraphQL API | REST-only for now | GraphQL layer planned |
| Single Region | No multi-region deployment | Cloud deployment planned |

---

## 🔧 Development Notes

### Running Tests

```bash
# Backend unit tests (if implemented)
cd backend
npm test

# Frontend tests (if implemented)
cd frontend
npm test
```

### Database Migrations

```bash
# Create migration (manual process)
cd backend
node scripts/migrate.js
```

### Seeding Test Data

```bash
cd backend
node scripts/seed.js
```

---

## 📊 Time Breakdown

| Phase | Time Spent | Description |
|-------|------------|-------------|
| **Architecture Design** | 4 hours | Multi-tenancy model, data schemas, auth flow |
| **Backend Development** | 16 hours | Models, services, controllers, routes |
| **Authentication** | 6 hours | JWT, sessions, role middleware |
| **Order & Stock System** | 8 hours | Transaction handling, reservation logic |
| **Frontend Development** | 20 hours | Components, pages, API integration |
| **Dashboard & Analytics** | 4 hours | Stats, charts, visualizations |
| **Bug Fixes & Polish** | 6 hours | Edge cases, validation, UX improvements |
| **Documentation** | 4 hours | README, ARCHITECTURE.md |
| **Total** | **~68 hours** | |

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB 6+ with Mongoose
- **Authentication**: JWT + Session-based
- **Security**: bcrypt, crypto-js
- **Utilities**: moment, nodemailer, multer

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 19 + Radix UI Primitives
- **Styling**: Tailwind CSS
- **State**: React Context
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

### DevOps
- **Version Control**: Git
- **Package Managers**: npm (backend), pnpm (frontend)
- **Development**: nodemon, Next.js dev server

---

## 🔐 Security Considerations

- Passwords hashed with bcrypt
- JWT tokens encrypted with crypto-js
- Session validation on every request
- Role-based access control (RBAC)
- Tenant-scoped data access
- Soft delete for data recovery
- Input validation on all endpoints

---

## 📈 Future Enhancements

### Short-term (1-2 months)
- [ ] Redis caching layer
- [ ] Background job queue (Bull/Agenda)
- [ ] API rate limiting
- [ ] File upload validation
- [ ] Email notifications

### Medium-term (3-6 months)
- [ ] WebSocket real-time updates
- [ ] GraphQL API layer
- [ ] Advanced analytics & reporting
- [ ] Multi-language support
- [ ] Mobile app (React Native)

### Long-term (6+ months)
- [ ] Microservices architecture
- [ ] Multi-region deployment
- [ ] Advanced search (Elasticsearch)
- [ ] AI-powered demand forecasting
- [ ] Marketplace for integrations

---

## 📄 License

This project is for educational and demonstration purposes.

---

## 👨‍💻 Author

Built by Arghya Mallick as part of an assignment for TechExactly.

---


