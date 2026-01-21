# Architecture Documentation

## 1. Multi-Tenancy Approach

### 1.1 Tenant Isolation Strategy

This application implements a **shared-database, schema-separated** multi-tenancy model using MongoDB. Each tenant's data is logically isolated through a `tenant_id` field that references the tenant's owner user document.

#### Why This Approach?
- **Cost Efficiency**: Single database instance reduces infrastructure costs
- **Simplified Operations**: No need for database-per-tenant provisioning
- **Scalability**: MongoDB's sharding capabilities can scale horizontally
- **Data Isolation**: Application-level enforcement ensures data privacy between tenants

### 1.2 Tenant Data Model

**User Model** - Serves as both user identity and tenant root:
```javascript
{
  _id: ObjectId,
  user_type: "owner" | "manager" | "staff",
  tenant: [{
    user_id: ObjectId,  // Reference to tenant member
    joined_at: Date,
    is_removed: Boolean
  }]
}
```

**All Business Entities** include `tenant_id`:
```javascript
{
  tenant_id: { type: ObjectId, ref: "users", required: true }
}
```

### 1.3 Tenant Resolution Flow

1. **User Authentication**: User logs in and receives session token
2. **Token Decoding**: JWT contains `owner_id` (for non-owners) or `_id` (for owners)
3. **Request Context**: All API requests include `tenant_id` derived from:
   - `req.user.owner_id` for managers/staff
   - `req.user._id` for owners

### 1.4 Tenant Context Enforcement

All services filter queries by `tenant_id`:
```javascript
// Example from OrderService
const order = await Order.findOne({
  _id: new Types.ObjectId(orderId),
  tenant_id: new Types.ObjectId(tenantId),
});
```

---

## 2. Data Modeling Decisions

### 2.1 User & Tenant Model

**Design Decision**: Combined user and tenant in same collection

**Rationale**:
- Owners are both platform users and tenant administrators
- Eliminates separate tenant collection overhead
- Simplifies permission checking (one query gets both user and tenant info)
- The `tenant` array enables team collaboration within a tenant

**Trade-offs**:
- + Fast lookups for owner → tenant relationship
- - Slightly more complex user creation flow
- - Requires careful index design for tenant array queries

### 2.2 Product Model with Variants

```javascript
{
  tenant_id: ObjectId,
  name: String,
  sku: String,
  category: String,
  variants: [{
    attributes: { size: String, color: String },
    stock: Number,
    cost: Number,
    price: Number,
    low_threshold: Number
  }]
}
```

**Design Decision**: Embedded variant schema within product

**Rationale**:
- Variants are always accessed with their parent product
- Reduces database round-trips (no variant collection lookup)
- Enables atomic stock updates for product+variant
- Simpler data modeling for inventory tracking

**Trade-offs**:
- + Fast reads for product with variants
- + Atomic updates across product attributes
- - Variant limit (MongoDB document size ~16MB)
- - Requires re-saving entire product to update one variant

### 2.3 Order Model with Items

```javascript
{
  tenant_id: ObjectId,
  order_number: String,  // Unique across all tenants
  items: [OrderItemSchema],
  order_status: String,
  payment_status: String,
  stock_reservation_expiry: Date,
  version: Number  // Optimistic concurrency
}
```

**Design Decision**: Embedded order items with virtual fields

**Rationale**:
- Order items are always retrieved with the order
- Enables single-query order fetching
- Virtual fields (`all_items_fulfilled`, `can_be_cancelled`) calculate state dynamically
- Version field enables optimistic locking for concurrent updates

### 2.4 Stock Movement Tracking

```javascript
{
  tenant_id: ObjectId,
  product_id: ObjectId,
  variant_id: ObjectId,
  movement_type: "purchase" | "sale" | "return" | "adjustment",
  quantity: Number,
  previous_stock: Number,
  new_stock: Number,
  reference_type: "order" | "purchase" | "manual"
}
```

**Design Decision**: Separate stock movement collection

**Rationale**:
- Immutable audit trail of all stock changes
- Enables historical analysis and reporting
- Supports regulatory compliance requirements
- Decouples movement tracking from product stock state

---

## 3. Concurrency Handling

### 3.1 MongoDB Transactions

**Implementation**: Used for all order operations that modify stock

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Perform stock updates
  // Create order
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
} finally {
  session.endSession();
}
```

**Why Transactions?**
- **Atomicity**: Stock reservation and order creation must succeed or fail together
- **Consistency**: Prevents orphaned reservations if order creation fails
- **Isolation**: Prevents race conditions during concurrent order creation

### 3.2 Stock Reservation with Expiry

**Mechanism**:
1. Order created → stock reserved (15-minute hold)
2. Reservation stored in order with `stock_reservation_expiry`
3. Background job releases expired reservations

```javascript
const ORDER_CONFIG = {
  STOCK_RESERVATION_MINUTES: 15,
  MAX_RETRIES: 3,
};

async releaseExpiredReservations() {
  const expiredOrders = await Order.find({
    order_status: { $in: ["pending", "confirmed"] },
    stock_reservation_expiry: { $lt: new Date() }
  });
  // Release stock and cancel orders
}
```

**Why Time-Bound Reservations?**
- Prevents indefinite stock holding
- Automatic recovery of unavailable stock
- Encourages prompt order fulfillment

### 3.3 Optimistic Concurrency Control

**Implementation**: Version field in orders

```javascript
orderSchema.path("version", Number);
orderSchema.pre("save", function(next) {
  if (!this.isNew) {
    this.version += 1;
  }
  next();
});
```

**Why Version Field?**
- Detects concurrent modifications
- Prevents lost updates in high-traffic scenarios
- Enables retry logic for conflict resolution

### 3.4 Session-Based Authentication

```javascript
{
  session_id: String,
  user_id: ObjectId,
  expiry_time: Date,
  login_time: Date,
  logout_time: Date  // null until logged out
}
```

**Why Sessions + JWT?**
- JWT for stateless API authentication
- Session document for server-side validation
- Enables force logout and session management
- Tracks active sessions per user

---

## 4. Performance Optimization Strategy

### 4.1 Database Indexes

**Critical Indexes**:
```javascript
// Order indexes
OrderSchema.index({ tenant_id: 1, createdAt: -1 });
OrderSchema.index({ tenant_id: 1, order_status: 1 });
OrderSchema.index({ order_number: 1 });

// Stock Movement indexes
StockMovementSchema.index({ tenant_id: 1, createdAt: -1 });
StockMovementSchema.index({ product_id: 1, createdAt: -1 });
```

**Index Design Rationale**:
- Compound indexes for common query patterns
- Cover tenant-scoped queries (always filter by tenant_id)
- Descending sort for time-based queries (most recent first)

### 4.2 Aggregation Pipeline Optimizations

**Example**: Order listing with pagination

```javascript
async listOrders({ tenantId, filter, sort, page, limit }) {
  const skip = (page - 1) * limit;
  
  const orders = await Order.aggregate([
    { $match: { tenant_id: new Types.ObjectId(tenantId), ...filter } },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },
    ...OrderAggregation  // Additional lookups/transformation
  ]);
}
```

**Optimizations**:
- `$match` first to reduce document flow
- `$skip`/`$limit` early to reduce pipeline processing
- `$lookup` with pipeline for efficient joins

### 4.3 Caching Strategy

**Session Cache**:
- JWT tokens cached on client
- Session validation cached in memory (implied)

**Recommendation for Production**:
- Redis for session store
- Redis for frequently accessed tenant configs
- HTTP caching headers for read-only endpoints

### 4.4 Connection Pooling

**Implicit via Mongoose**:
- Default pool size handles concurrent requests
- Connection reuse reduces database overhead

---

## 5. Scalability Considerations

### 5.1 Horizontal Scaling

**Application Layer**:
- Stateless design enables multiple instances
- Load balancer distributes requests
- JWT validation is local (no session store dependency)

**Database Layer**:
- MongoDB replica sets for read scaling
- Sharding ready: `tenant_id` as shard key candidate
- Connection pooling across instances

### 5.2 Vertical Scaling

**Resource Recommendations**:
- CPU: Multi-core for concurrent request handling
- Memory: Sufficient for MongoDB working set
- Storage: SSD for fast document access

### 5.3 Growth Projections

| Scale Level | Users/Tenant | Concurrent Requests | Recommendation |
|-------------|--------------|---------------------|----------------|
| Small       | < 100        | < 50                | Single instance |
| Medium      | 100-1000     | 50-500              | 2-4 instances + replica set |
| Large       | 1000-10000   | 500-5000            | Auto-scaling group + sharded cluster |

### 5.4 Current Limitations

| Limitation | Impact | Mitigation Strategy |
|------------|--------|---------------------|
| No Redis cache | Higher DB load | Add Redis for sessions and hot data |
| Single MongoDB instance | No HA, limited reads | Deploy replica set |
| No CDN for assets | Slower static asset delivery | Add CDN layer |
| Synchronous stock checks | Blocking operations | Async stock reservation |

---

## 6. Trade-offs Made

### 6.1 Architecture Trade-offs

| Decision | Pro | Con |
|----------|-----|-----|
| Shared database | Cost-effective, simple ops | Requires strict tenant_id enforcement |
| Embedded variants | Fast reads, atomic updates | Document size limit, update complexity |
| JWT + Sessions | Security + session control | Token refresh complexity |
| No caching layer | Simpler architecture | Higher DB load |

### 6.2 Performance Trade-offs

| Pattern | Benefit | Cost |
|---------|---------|------|
| Real-time stock reservation | Accuracy | Blocking operation |
| Synchronous order creation | Simpler consistency | Slower response time |
| Aggregation-based listing | Rich filtering | Memory usage |
| Detailed audit logging | Compliance | Storage overhead |

### 6.3 Development Trade-offs

| Approach | Reason | Future Work |
|----------|--------|-------------|
| Basic role hierarchy | MVP speed | Granular permissions |
| Simple order workflow | Core functionality | Advanced workflows (returns, refunds) |
| Manual reservation cleanup | Simplicity | Scheduled jobs with Bull/Agenda |

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
User Login → Verify Credentials → Create Session → Generate JWT → Return Tokens
```

### 7.2 Authorization Layers

1. **Authentication Middleware**: Validates JWT token
2. **Session Validation**: Checks session expiry and logout status
3. **Role Checking**: Owner > Manager > Staff hierarchy
4. **Tenant Filtering**: All queries scoped to user's tenant

### 7.3 Data Protection

- Password hashing via bcrypt
- Encrypted token transmission
- Tenant-scoped data access
- Soft delete for data recovery

---

## 8. API Design Patterns

### 8.1 Request Flow

```
Client → Middleware (Auth, Filter) → Controller → Service → Database
         ↓                    ↓
    Token validation    Query formatting
```

### 8.2 Response Standard

```javascript
{
  status: Number,      // HTTP status
  message: String,     // Human-readable message
  data: Any,          // Response payload
  error: Boolean      // Error flag
}
```

### 8.3 Error Handling

- Global error middleware catches exceptions
- Standardized error responses
- Status codes: 200 (success), 400 (validation), 401 (auth), 404 (not found), 500 (server)

---

## 9. Future Improvements

### 9.1 Short-term (1-3 months)

- [ ] Redis integration for sessions and caching
- [ ] Background job queue (Bull/Agenda) for reservation cleanup
- [ ] API rate limiting
- [ ] Request validation middleware (Joi/Zod)

### 9.2 Medium-term (3-6 months)

- [ ] WebSocket support for real-time inventory updates
- [ ] Advanced analytics and reporting
- [ ] Multi-tenant analytics dashboard
- [ ] Email/SMS notifications

### 9.3 Long-term (6+ months)

- [ ] GraphQL API layer
- [ ] Microservices migration
- [ ] Multi-region deployment
- [ ] Advanced search (Elasticsearch)

---

## 10. Deployment Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (Nginx/AWS)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐        ┌────▼─────┐        ┌────▼─────┐
   │  Node.js │        │  Node.js │        │  Node.js │
   │ Instance │        │ Instance │        │ Instance │
   └────┬─────┘        └────┬─────┘        └────┬─────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼───────┐
                    │   MongoDB     │
                    │   Replica Set │
                    └───────────────┘
```

---

## 11. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Node.js 18+ | Application server |
| Framework | Express.js | API framework |
| Database | MongoDB 6+ | Primary data store |
| ORM | Mongoose | MongoDB ODM |
| Authentication | JWT + Session | Auth strategy |
| Frontend | Next.js 14 | React framework |
| UI Components | Custom + shadcn/ui | Component library |
| State Management | React Context | Client state |
| Styling | Tailwind CSS | Utility-first CSS |

---

## 12. Conclusion

This architecture provides a solid foundation for a multi-tenant inventory management system with:

- **Logical tenant isolation** through application-level enforcement
- **Concurrent operation safety** via MongoDB transactions
- **Scalable design** ready for horizontal growth
- **Clear separation** of concerns (Controller → Service → Model)

The trade-offs made prioritize development speed and operational simplicity while maintaining production-ready reliability for small-to-medium scale deployments.

