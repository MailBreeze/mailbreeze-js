# MailBreeze JavaScript SDK

The official JavaScript/TypeScript SDK for the MailBreeze email platform.

## Features

- **Full TypeScript support** - Complete type definitions for all API methods
- **Zero dependencies** - Uses native `fetch` API
- **Universal runtime** - Works with Node.js (v20+), Bun, and Deno
- **Automatic retries** - Built-in retry logic with exponential backoff
- **ESM & CJS** - Dual module support for all environments

## Installation

```bash
# npm
npm install mailbreeze

# pnpm
pnpm add mailbreeze

# bun
bun add mailbreeze
```

## Quick Start

```typescript
import { MailBreeze } from "mailbreeze";

const mailbreeze = new MailBreeze({
  apiKey: "sk_live_xxx",
});

// Send an email
const result = await mailbreeze.emails.send({
  from: "hello@yourdomain.com",
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our platform!</h1>",
});

console.log(result.id); // email_xxx
```

## Configuration

```typescript
const mailbreeze = new MailBreeze({
  // Required
  apiKey: "sk_live_xxx",

  // Optional
  baseUrl: "https://api.mailbreeze.com", // API endpoint
  timeout: 30000, // Request timeout in ms (default: 30s)
  maxRetries: 3, // Max retry attempts (default: 3)
  authStyle: "header", // "header" (X-API-Key) or "bearer"
});
```

## Resources

### Emails

Send and manage emails.

```typescript
// Send an email
const result = await mailbreeze.emails.send({
  from: "hello@yourdomain.com",
  to: "user@example.com",
  subject: "Hello",
  html: "<p>Hello World!</p>",
});

// Send with a template
const result = await mailbreeze.emails.send({
  from: "hello@yourdomain.com",
  to: ["user1@example.com", "user2@example.com"],
  templateId: "welcome-template",
  variables: { name: "John", plan: "Pro" },
});

// Send with attachments
const result = await mailbreeze.emails.send({
  from: "hello@yourdomain.com",
  to: "user@example.com",
  subject: "Your Report",
  html: "<p>Please find your report attached.</p>",
  attachmentIds: ["att_xxx"],
});

// List emails
const { data, pagination } = await mailbreeze.emails.list({
  status: "delivered",
  page: 1,
  limit: 20,
});

// Get email details
const email = await mailbreeze.emails.get("email_xxx");

// Get email statistics
const stats = await mailbreeze.emails.stats();
console.log(stats.deliveryRate); // 0.98
```

### Attachments

Handle email attachments using a two-step upload process.

```typescript
// Step 1: Create upload URL
const { attachmentId, uploadUrl, uploadToken } = await mailbreeze.attachments.createUpload({
  fileName: "report.pdf",
  contentType: "application/pdf",
  fileSize: 1024000,
});

// Step 2: Upload file directly to URL
await fetch(uploadUrl, {
  method: "PUT",
  body: fileBuffer,
  headers: { "Content-Type": "application/pdf" },
});

// Step 3: Confirm upload
const attachment = await mailbreeze.attachments.confirm({ uploadToken });

// Step 4: Use in email
await mailbreeze.emails.send({
  from: "hello@yourdomain.com",
  to: "user@example.com",
  subject: "Your report",
  html: "<p>Please find the report attached.</p>",
  attachmentIds: [attachmentId],
});
```

### Contact Lists

Create and manage contact lists.

```typescript
// Create a list
const list = await mailbreeze.lists.create({
  name: "Newsletter Subscribers",
  description: "Weekly newsletter recipients",
  customFields: [
    { key: "company", label: "Company", type: "text" },
    { key: "plan", label: "Plan", type: "select", options: ["free", "pro", "enterprise"] },
  ],
});

// List all lists
const { data } = await mailbreeze.lists.list();

// Get a list
const list = await mailbreeze.lists.get("list_xxx");

// Update a list
const updated = await mailbreeze.lists.update("list_xxx", {
  name: "Updated Name",
});

// Delete a list
await mailbreeze.lists.delete("list_xxx");

// Get list statistics
const stats = await mailbreeze.lists.stats("list_xxx");
console.log(stats.activeContacts); // 1000
```

### Contacts

Manage contacts within a specific list.

```typescript
// Get contacts for a list
const contacts = mailbreeze.contacts("list_xxx");

// Create a contact
const contact = await contacts.create({
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  customFields: { company: "Acme Inc" },
});

// List contacts
const { data, pagination } = await contacts.list({
  status: "active",
  page: 1,
  limit: 50,
});

// Get a contact
const contact = await contacts.get("contact_xxx");

// Update a contact
const updated = await contacts.update("contact_xxx", {
  firstName: "Jane",
  customFields: { plan: "enterprise" },
});

// Delete a contact
await contacts.delete("contact_xxx");

// Suppress a contact
await contacts.suppress("contact_xxx", "manual");
```

### Email Verification

Verify email addresses before sending.

```typescript
// Verify a single email
const result = await mailbreeze.verification.verify("user@example.com");
console.log(result.isValid); // true
console.log(result.result); // "valid"
console.log(result.details?.isDisposable); // false

// Batch verification
const batch = await mailbreeze.verification.batch({
  emails: ["user1@example.com", "user2@example.com", "user3@example.com"],
});

// Check batch status
const status = await mailbreeze.verification.get(batch.verificationId);
if (status.status === "completed") {
  console.log(status.results);
  console.log(status.analytics);
}

// List verification batches
const { data } = await mailbreeze.verification.list({
  status: "completed",
  page: 1,
});

// Get verification statistics
const stats = await mailbreeze.verification.stats();
console.log(`Verified: ${stats.totalVerified}, Valid: ${stats.valid}`);
```

### Automations

Enroll contacts in automation workflows.

```typescript
// Enroll a contact in an automation
const enrollment = await mailbreeze.automations.enroll({
  automationId: "auto_welcome",
  contactId: "contact_xxx",
  variables: { couponCode: "WELCOME10" },
});

// List enrollments
const { data } = await mailbreeze.automations.enrollments.list({
  automationId: "auto_xxx",
  status: "active",
});

// Cancel an enrollment
const result = await mailbreeze.automations.enrollments.cancel("enroll_xxx");
console.log(result.cancelled); // true
```

## Error Handling

The SDK provides typed error classes for different failure scenarios:

```typescript
import {
  MailBreezeError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from "mailbreeze";

try {
  await mailbreeze.emails.send({
    from: "invalid",
    to: "user@example.com",
    subject: "Test",
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Validation failed:", error.message);
    console.log("Details:", error.details);
  } else if (error instanceof AuthenticationError) {
    console.log("Invalid API key");
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof NotFoundError) {
    console.log("Resource not found");
  } else if (error instanceof ServerError) {
    console.log("Server error:", error.statusCode);
  } else if (error instanceof MailBreezeError) {
    console.log("API error:", error.code, error.message);
  }
}
```

### Error Properties

All errors extend `MailBreezeError` and include:

- `message` - Human-readable error message
- `code` - Machine-readable error code
- `statusCode` - HTTP status code (when applicable)
- `requestId` - Unique request ID for debugging
- `details` - Additional error details (for validation errors)

## Idempotency

Prevent duplicate operations by passing an idempotency key:

```typescript
const result = await mailbreeze.emails.send({
  from: "hello@yourdomain.com",
  to: "user@example.com",
  subject: "Order Confirmation",
  html: "<p>Thank you for your order!</p>",
  idempotencyKey: `order-confirmation-${orderId}`,
});
```

## TypeScript

All types are exported for use in your application:

```typescript
import type {
  SendEmailParams,
  SendEmailResult,
  Email,
  Contact,
  ContactList,
  VerifyEmailResult,
  Enrollment,
  PaginatedList,
} from "mailbreeze";

function sendWelcomeEmail(params: SendEmailParams): Promise<SendEmailResult> {
  return mailbreeze.emails.send(params);
}
```

## Requirements

- Node.js v20 or higher (or Bun/Deno)
- A MailBreeze API key ([get one here](https://console.mailbreeze.com))

## License

MIT
