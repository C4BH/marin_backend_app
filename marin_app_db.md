# MARIN DATABASE SCHEMA (MongoDB)

## COLLECTIONS OVERVIEW

Total Collections: 9
Estimated Document Size: Medium (5-50KB per document)
Indexing Strategy: Query pattern optimized

---

## 1. USERS COLLECTION

**Collection Name:** `users`
**Estimated Size:** 10K-100K documents (MVP)

### Schema:
```javascript
{
  _id: ObjectId,
  name: String (required, indexed),
  email: String (required, unique, indexed),
  password: String (bcrypt hashed),
  phone: String,
  
  role: Enum ['user', 'advisor', 'admin'] (indexed),
  
  // Auth
  isEmailVerified: Boolean,
  verificationCode: String,
  verificationCodeExpires: Date,
  refreshTokens: [{
    token: String (encrypted),
    device: String,
    expiresAt: Date,
    createdAt: Date
  }],
  
  // Social Login
  authProvider: {
    type: Enum ['email', 'google', 'apple'],
    providerId: String,
    providerData: Mixed
  },
  
  // Profile
  dateOfBirth: Date,
  gender: Enum ['male', 'female', 'other'],
  height: Number, // cm
  weight: Number, // kg
  
  // Relations
  enterpriseId: ObjectId (ref: enterprises, indexed),
  
  // Stats
  meetingStats: {
    totalMeetings: Number,
    completedMeetings: Number,
    cancelledMeetings: Number,
    noShowCount: Number
  },
  
  // Advisor Specific (if role === 'advisor')
  advisorProfile: {
    specialization: [String],
    bio: String,
    certifications: [String],
    experience: Number,
    averageRating: Number (indexed),
    totalReviews: Number,
    isAvailable: Boolean,
    hourlyRate: Number
  },
  
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
```javascript
{ email: 1 } // unique
{ role: 1 }
{ enterpriseId: 1 }
{ 'advisorProfile.averageRating': -1 }
{ 'advisorProfile.specialization': 1 }
```

---

## 2. SUPPLEMENTS COLLECTION

**Collection Name:** `supplements`
**Estimated Size:** 1K-5K documents (MVP)

### Schema:
```javascript
{
  _id: ObjectId,
  name: String (required, indexed),
  brand: String (indexed),
  category: [String] (indexed),
  form: Enum ['tablet', 'capsule', 'powder', 'liquid', 'gummy'],
  
  // Ingredients
  ingredients: [{
    name: String,
    amount: Number,
    unit: String,
    dailyValue: Number,
    source: Enum ['natural', 'synthetic']
  }],
  
  // Usage
  usage: {
    recommendedDosage: String,
    frequency: String,
    timing: String,
    duration: String
  },
  
  // Scientific Data (from Consensus API)
  scientificData: {
    consensusScore: Number (0-10),
    studyCount: Number,
    effectiveness: Enum ['low', 'moderate', 'high'],
    summary: String,
    lastUpdated: Date,
    sources: [{
      title: String,
      url: String,
      publicationDate: Date
    }]
  },
  
  // Medical Info (from Vademecum API)
  medicalInfo: {
    description: String,
    approvedUses: [String],
    sideEffects: [String],
    interactions: [String],
    contraindications: [String],
    warnings: [String]
  },
  
  // Ratings
  rating: Number (0-5, indexed),
  reviewCount: Number,
  
  // Data Source
  sourceType: Enum ['vademecum', 'consensus', 'manual'],
  sourceId: String,
  lastSynced: Date,
  
  // Commercial (future)
  price: Number,
  currency: String,
  availability: Boolean,
  
  isActive: Boolean (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
```javascript
{ name: 'text', 'ingredients.name': 'text' } // Full-text search
{ category: 1 }
{ brand: 1 }
{ rating: -1 }
{ isActive: 1 }
{ 'scientificData.consensusScore': -1 }
```

---

## 3. USER_SUPPLEMENTS COLLECTION

**Collection Name:** `userSupplements`
**Estimated Size:** 50K-500K documents (MVP)

### Schema:
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, required, indexed),
  supplementId: ObjectId (ref: supplements, required, indexed),
  
  // Usage Details
  quantity: Number,
  usage: String, // "1 tablet morning"
  frequency: String, // "daily", "twice daily"
  timing: String, // "morning, empty stomach"
  
  // Goals
  goals: [String], // ["energy", "immunity", "muscle"]
  startDate: Date (indexed),
  endDate: Date,
  isActive: Boolean (indexed),
  
  // User Feedback
  personalRating: Number (1-10),
  effectiveness: Number (1-10),
  notes: String,
  
  // Relations
  prescribedBy: ObjectId (ref: users, advisor),
  relatedMeeting: ObjectId (ref: meetings),
  
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
```javascript
{ userId: 1, isActive: 1 }
{ userId: 1, supplementId: 1 } // compound
{ supplementId: 1 }
{ startDate: 1 }
{ prescribedBy: 1 }
```

---

## 4. MEETINGS COLLECTION

**Collection Name:** `meetings`
**Estimated Size:** 10K-100K documents (MVP)

### Schema:
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: users, required, indexed),
  advisor: ObjectId (ref: users, required, indexed),
  
  scheduledTime: Date (required, indexed),
  duration: Number (minutes),
  status: Enum ['scheduled', 'completed', 'cancelled', 'no_show'] (indexed),
  
  // Post-Meeting
  userRating: Number (1-5),
  advisorRating: Number (1-5),
  userRatingNote: String,
  advisorRatingNote: String,
  
  // Meeting Content
  advisorNotes: String,
  discussedSupplements: [ObjectId] (ref: supplements),
  recommendations: [ObjectId] (ref: supplements),
  
  // Cancellation
  cancelledBy: ObjectId (ref: users),
  cancellationReason: String,
  
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date
}
```

### Indexes:
```javascript
{ user: 1, status: 1 }
{ advisor: 1, status: 1 }
{ scheduledTime: 1 }
{ status: 1, scheduledTime: 1 } // compound
```

---

## 5. COMMENTS COLLECTION

**Collection Name:** `comments`
**Estimated Size:** 20K-200K documents (MVP)

### Schema:
```javascript
{
  _id: ObjectId,
  author: ObjectId (ref: users, required, indexed),
  
  // Polymorphic relation
  targetType: Enum ['supplement', 'advisor', 'meeting'] (indexed),
  targetId: ObjectId (required, indexed),
  
  rating: Number (1-5, required),
  text: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
```javascript
{ author: 1 }
{ targetType: 1, targetId: 1 } // compound
{ targetId: 1, rating: -1 }
```

---

## 6. FORM_QUESTIONS COLLECTION

**Collection Name:** `formQuestions`
**Estimated Size:** 50-100 documents (static)

### Schema:
```javascript
{
  _id: ObjectId,
  questionNumber: Number (unique),
  questionText: String (required),
  category: Enum ['health', 'lifestyle', 'diet', 'goals', 'medical_history'] (indexed),
  
  answerType: Enum ['text', 'multiple_choice', 'rating', 'yes_no', 'number'],
  options: [String], // for multiple_choice
  
  isRequired: Boolean,
  order: Number (indexed),
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
```javascript
{ order: 1, isActive: 1 }
{ category: 1 }
```

---

## 7. FORM_RESPONSES COLLECTION

**Collection Name:** `formResponses`
**Estimated Size:** 100K-1M documents (MVP)

### Schema:
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, required, indexed),
  formQuestionId: ObjectId (ref: formQuestions, required, indexed),
  
  answer: Mixed (String | Number | Boolean),
  answeredAt: Date
}
```

### Indexes:
```javascript
{ userId: 1, formQuestionId: 1 } // compound, unique
{ formQuestionId: 1 }
```

---

## 8. ENTERPRISES COLLECTION

**Collection Name:** `enterprises`
**Estimated Size:** 100-1K documents (MVP)

### Schema:
```javascript
{
  _id: ObjectId,
  name: String (required, indexed),
  email: String (required, unique),
  contactPerson: String,
  phone: String,
  
  plan: Enum ['bronze', 'silver', 'gold'] (indexed),
  maxUsers: Number,
  
  planFeatures: {
    meetingsPerUserPerMonth: Number,
    prioritySupport: Boolean,
    customBranding: Boolean,
    analyticsAccess: Boolean
  },
  
  users: [ObjectId] (ref: users),
  
  subscriptionStartDate: Date,
  subscriptionEndDate: Date (indexed),
  
  isActive: Boolean (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
```javascript
{ email: 1 } // unique
{ isActive: 1, plan: 1 }
{ subscriptionEndDate: 1 }
```

---

## 9. NOTIFICATIONS COLLECTION

**Collection Name:** `notifications`
**Estimated Size:** 100K-1M documents (MVP)

### Schema:
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, required, indexed),
  
  type: Enum ['supplement_reminder', 'meeting_reminder', 'form_due', 'meeting_request'] (indexed),
  title: String (required),
  body: String (required),
  
  scheduledFor: Date (indexed),
  sentAt: Date,
  readAt: Date,
  
  status: Enum ['pending', 'sent', 'failed', 'read'] (indexed),
  
  relatedEntity: {
    type: Enum ['supplement', 'meeting', 'form'],
    id: ObjectId
  },
  
  createdAt: Date
}
```

### Indexes:
```javascript
{ userId: 1, status: 1 }
{ scheduledFor: 1, status: 1 } // compound
{ type: 1, status: 1 }
```

---

## COLLECTION RELATIONSHIPS SUMMARY
```
users (1) ←→ (N) userSupplements (N) ←→ (1) supplements
users (1) ←→ (N) meetings (N) ←→ (1) users (advisor)
users (1) ←→ (N) comments (N) ←→ (1) [supplements|users|meetings]
users (1) ←→ (N) formResponses (N) ←→ (1) formQuestions
users (N) ←→ (1) enterprises
users (1) ←→ (N) notifications
```

## DATA VOLUME ESTIMATES (1 Year MVP)

| Collection | Documents | Avg Size | Total Size |
|------------|-----------|----------|------------|
| users | 50K | 5KB | 250MB |
| supplements | 2K | 15KB | 30MB |
| userSupplements | 200K | 2KB | 400MB |
| meetings | 50K | 3KB | 150MB |
| comments | 100K | 1KB | 100MB |
| formQuestions | 100 | 1KB | 100KB |
| formResponses | 500K | 500B | 250MB |
| enterprises | 500 | 3KB | 1.5MB |
| notifications | 1M | 500B | 500MB |
| **TOTAL** | | | **~1.7GB** |

## BACKUP & RETENTION POLICY

- **Daily Backup**: Automated at 02:00 UTC
- **Retention**: 30 days rolling
- **Point-in-Time Recovery**: Available (7 days)
- **Data Archival**: Inactive users >2 years → cold storage