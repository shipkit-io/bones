---
description:
globs:
alwaysApply: false
---
# Local Storage Implementation Patterns

## Overview

Shipkit uses browser local storage as a fallback when no database is configured. This provides a zero-config development experience while maintaining feature parity with database mode.

## Core Principles

### 1. API Consistency
Local storage services mirror database service APIs exactly:

```typescript
// Database service method
async createProject(teamId: string, name: string, userId: string): Promise<Project>

// Local storage service method
createProject(teamId: string, name: string, userId: string): LocalProject
```

### 2. Data Validation
All local storage operations include validation:

```typescript
if (!projectName?.trim()) {
  throw new Error("Project name is required");
}
```

### 3. Referential Integrity
Local storage maintains relationships between entities:

```typescript
// When deleting a team, remove all associated projects
const teamProjects = this.getTeamProjects(teamId);
teamProjects.forEach(project => this.deleteProject(project.id));
```

## Storage Keys

Use consistent, namespaced keys for local storage:

```typescript
const STORAGE_KEYS = {
  projects: "shipkit-projects",
  projectMembers: "shipkit-project-members",
  teams: "shipkit-teams",
  teamMembers: "shipkit-team-members",
  users: "shipkit-users"
} as const;
```

## Utility Functions

### Safe Storage Access
Always check if we're in a browser environment:

```typescript
function isClient(): boolean {
  return typeof window !== "undefined";
}

function getFromStorage<T>(key: string): T[] {
  if (!isClient()) return [];

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.warn(`Failed to parse ${key} from localStorage:`, error);
    return [];
  }
}
```

### Date Handling
Convert date strings back to Date objects:

```typescript
function parseStoredData<T>(data: any[]): T[] {
  return data.map(item => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    deletedAt: item.deletedAt ? new Date(item.deletedAt) : null
  }));
}
```

## Demo Data Initialization

Provide realistic demo data for first-time users:

```typescript
function initializeDemoData(): void {
  if (this.getAllProjects().length === 0) {
    this.createDemoProjects();
  }
}

private createDemoProjects(): void {
  const demoProjects = [
    { name: "Marketing Website", description: "Company landing page" },
    { name: "Mobile App", description: "iOS and Android application" },
    { name: "API Gateway", description: "Microservices backend" }
  ];

  demoProjects.forEach(project => {
    this.createProject(demoTeamId, project.name, demoUserId);
  });
}
```

## Error Handling

### Graceful Fallbacks
Never throw errors that would break the application:

```typescript
getUserProjects(userId: string): LocalProject[] {
  try {
    const projects = this.getAllProjects();
    return projects.filter(p => this.userHasAccess(userId, p.id));
  } catch (error) {
    console.warn("Failed to get user projects:", error);
    return [];
  }
}
```

### Storage Quota Management
Handle storage quota exceeded errors:

```typescript
function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn("Storage quota exceeded, clearing old data");
      this.clearOldData();
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      throw error;
    }
  }
}
```

## CRUD Operations

### Create Pattern
```typescript
createEntity(data: CreateEntityData): LocalEntity {
  const entity: LocalEntity = {
    id: generateId(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const entities = this.getAllEntities();
  entities.push(entity);
  this.saveEntities(entities);

  return entity;
}
```

### Update Pattern
```typescript
updateEntity(id: string, updates: Partial<LocalEntity>): LocalEntity {
  const entities = this.getAllEntities();
  const index = entities.findIndex(e => e.id === id);

  if (index === -1) {
    throw new Error("Entity not found");
  }

  entities[index] = {
    ...entities[index],
    ...updates,
    updatedAt: new Date()
  };

  this.saveEntities(entities);
  return entities[index];
}
```

### Delete Pattern (Soft Delete)
```typescript
deleteEntity(id: string): void {
  const entities = this.getAllEntities();
  const index = entities.findIndex(e => e.id === id);

  if (index !== -1) {
    entities[index].deletedAt = new Date();
    this.saveEntities(entities);
  }
}
```

## Integration with Services

Services should check for database availability and fallback to local storage:

```typescript
// In service files like project-service.ts
import { LocalProjectStorage } from "@/lib/local-storage/project-storage";

async createProject(teamId: string, name: string, userId: string) {
  if (!db) {
    return LocalProjectStorage.createProject(teamId, name, userId);
  }

  // Database implementation
  return await this.database.createProject(teamId, name, userId);
}
```

## Testing Local Storage

### Unit Tests
Mock localStorage for testing:

```typescript
const mockLocalStorage = {
  store: new Map(),
  getItem: jest.fn(key => mockLocalStorage.store.get(key) || null),
  setItem: jest.fn((key, value) => mockLocalStorage.store.set(key, value)),
  clear: jest.fn(() => mockLocalStorage.store.clear())
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
```

### Integration Tests
Test the fallback behavior:

```typescript
test('should use local storage when database is unavailable', async () => {
  // Mock db as null
  jest.mock('@/server/db', () => ({ db: null }));

  const result = await projectService.createProject('team1', 'Test Project', 'user1');
  expect(result).toBeDefined();
  expect(mockLocalStorage.setItem).toHaveBeenCalled();
});
```

## Performance Considerations

### Lazy Loading
Only load data when needed:

```typescript
private _cachedProjects: LocalProject[] | null = null;

getAllProjects(): LocalProject[] {
  if (this._cachedProjects === null) {
    this._cachedProjects = parseStoredData(getFromStorage(STORAGE_KEYS.projects));
  }
  return this._cachedProjects;
}
```

### Batch Operations
Group multiple operations to reduce localStorage calls:

```typescript
batchCreateProjects(projects: CreateProjectData[]): LocalProject[] {
  const existingProjects = this.getAllProjects();
  const newProjects = projects.map(data => this.createProjectData(data));

  existingProjects.push(...newProjects);
  this.saveProjects(existingProjects);

  return newProjects;
}
```
