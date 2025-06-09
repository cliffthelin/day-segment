# Dexie Database Versioning Guide

## Overview

This document outlines our approach to managing Dexie database schema versions to prevent conflicts and runtime errors.

## Key Principles

1. **Single Source of Truth**: The schema version is defined in `lib/schema-version.ts`
2. **One Version Call**: We use a single `this.version(CURRENT_SCHEMA_VERSION)` call
3. **Explicit Version Increments**: Always increment `CURRENT_SCHEMA_VERSION` when changing the schema

## How to Make Schema Changes

1. Update `CURRENT_SCHEMA_VERSION` in `lib/schema-version.ts`
2. Modify the schema in the `.stores({})` call in `lib/db.ts`
3. Add data migrations in the `.upgrade()` handler if needed

## Common Issues

### Version Conflict Errors

If you see errors like:
\`\`\`
VersionError: The requested version (x) is less than the existing version (y)
\`\`\`

This usually means:
- You're running an older version of the code with a newer database
- Multiple versions of the app are running in different tabs

### Blocked Database

If the database is blocked:
1. Close all tabs running the application
2. Reload the page

## Development Checks

In development mode, we have automatic checks that will:
- Alert when the database is blocked
- Notify when a version change is detected
- Close the database connection on version changes

## Data Migrations

For complex data migrations between versions:

\`\`\`typescript
this.version(CURRENT_SCHEMA_VERSION).stores({
  // Schema definition
}).upgrade(tx => {
  // Migration code here
  return tx.table('someTable').toCollection().modify(item => {
    // Modify items as needed
  });
});
