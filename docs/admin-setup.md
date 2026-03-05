---
title: "Setting Up Admin Access"
description: "Learn how to set up administrator access when deploying your Shipkit application to Vercel using environment variables."
---

# Setting Up Admin Access

This document explains how to set up administrator access when deploying your Shipkit application to Vercel.

## Overview

Shipkit uses an environment variable to determine which users have administrator access. This allows you to set up admin access during deployment without modifying any code.

For the most up-to-date documentation, visit [shipkit.io/docs/env](https://shipkit.io/docs/env).

## Environment Variable

You need to set the `ADMIN_EMAIL` environment variable:

- `ADMIN_EMAIL` - A comma-separated list of email addresses that should have admin access

## Setting Up Admin Access During Vercel Deployment

### Option 1: One-Click Deploy

When using the "Deploy to Vercel" button, you'll be prompted to set the admin environment variable:

1. Click the "Deploy to Vercel" button on the Shipkit website
2. You'll be taken to the Vercel deployment page
3. In the "Environment Variables" section, you'll see the `ADMIN_EMAIL` field
4. Enter your admin email(s) in the `ADMIN_EMAIL` field (comma-separated if multiple)
5. Complete the deployment process

### Option 2: Manual Setup in Vercel Dashboard

If you've already deployed your application or prefer to set this variable later:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add the `ADMIN_EMAIL` environment variable with a value like `admin@example.com,another-admin@example.com`
4. Save your changes and redeploy your application

## Example Values

```
ADMIN_EMAIL=admin@example.com,ceo@example.com,tech-lead@example.com
```

With the above configuration, users with emails `admin@example.com`, `ceo@example.com`, or `tech-lead@example.com` will have admin access.

## Default Values

If you don't set the `ADMIN_EMAIL` environment variable, the default admin settings will be used:

- Default admin emails: `lacymorrow0@gmail.com`

## Checking Admin Status in Your Code

You can check if a user is an admin in your code using the provided components and hooks:

### Using the AdminOnly Component

```tsx
import { AdminOnly } from "@/components/admin/admin-check";

// In your component
return (
  <div>
    <h1>Welcome to the Dashboard</h1>

    <AdminOnly email={session?.user?.email}>
      {/* This content will only be visible to admins */}
      <div>
        <h2>Admin Controls</h2>
        <p>This section is only visible to administrators.</p>
      </div>
    </AdminOnly>
  </div>
);
```

## Security Considerations

- Admin checking is performed server-side for security
- The admin emails are never exposed to the client
- Always validate admin status on the server before performing privileged operations
