# LWS Manager API Documentation

## Core Types

### URI Types

- `BaseUri` - Base URI type representing http/https URLs
- `WebId` - Union type for WebID representations (URL or string)
- `TaskUri` - URI representing a task location
- `ProcessUri` - URI representing a process location
- `ContainerUri` - URI representing a container location
- `StorageUri` - URI representing a storage location
- `ShapeUri` - URI representing a shape definition location

### Process Types

- `ProcessType` - Enum defining different process types (form, search, list)
- `ProcessSourceType` - Enum defining source types (lws, kg, file)
- `ProcessString` - String representation of a process URI
- `ProcessUrl` - URL representation of a process location

### Core Interfaces

#### Resource Interfaces

```typescript
interface BaseResource {
  url: WebId | PodUri | ProcessUri | TaskUri | StepUri;
  label: string;
  comment?: string;
  version?: string;
}

interface WebIdResource extends BaseResource {
  webId: WebId;
  url: URL;
  created: Date;
  modified?: Date;
  maker: WebIdString;
  isPublic: boolean;
}
```

#### Process Management

```typescript
interface Process extends BaseResource {
  url: ProcessUri;
  container: ContainerUri;
  tasks: Record<TaskString, Task>;
  provider: {
    type: ProcessSourceType;
    location: PodUri | WebId;
    container?: ContainerUri;
    dataset?: string;
  };
}

interface Task extends BaseResource {
  url: TaskUri;
  processContainer: ContainerUri;
  steps: Step[];
  processUrl: ProcessUri;
  email?: string;
  storageContainer?: StorageUri;
  getId(): TaskString;
}

interface Step extends BaseResource {
  url: StepUri;
  taskUrl: TaskUri;
  type: ProcessType;
  order: number;
  description?: string;
  sourceShape?: string;
  storageLocation?: string;
  requirements?: StepRequirements;
}
```

## Store Interfaces

### Session Store

The session store manages authentication state and pod access:

```typescript
interface SessionStore {
  canReadPODURLs: boolean;
  ownPodURLs: PodUri[];
  selectedPodURL: PodUri | null;
  loggedInWebId: WebId | null;
  rerouting: boolean;
  authProvidersSessionData: Record<string, any>;
  profileValues: Record<WebIdString, Record<string, string[]>>;
}
```

### Process Store

The process store manages process execution state:

```typescript
interface ProcessStore {
  typeIndexContainers: Record<WebIdString, ContainerUri[]>;
  typeRegistrations: Record<ContainerUri, TypeRegistration[]>;
  processProviders: WebIdString[];
  processRegistrations: Record<WebIdString, ProcessString[]>;
  taskRegistrations: Record<ProcessString, Record<TaskString, TaskRegistration>>;
  currentProcessUrl: ProcessUri | null;
  currentTaskUrl: TaskUri | null;
  currentStepIndex: number;
  executionData: ProcessExecutionData | null;
}
```

## Custom Elements

The LWS Manager provides several Vue-based custom elements for UI integration:

- `<lws-provider>` - Main provider component for authentication
- `<lws-process-list>` - Lists available processes
- `<lws-task-list>` - Lists tasks for selected process  
- `<lws-source-adder>` - UI for adding new data sources
- `<lws-sources-list>` - Lists connected data sources
- `<lws-process-selector>` - Process/task selection UI
- `<lws-profile-list>` - Shows profile information
- `<lws-pod-logger>` - Displays pod operation logs
- `<lws-progress-tracker>` - Shows process execution progress
- `<lws-step-handler>` - Handles individual process steps

## Helper Functions

### LWSHelpers

Core helper functions for pod operations:

```typescript
getTypeIndexContainers(webId: WebId, reload?: boolean): Promise<URL[]>
getTypeRegistrationsFromContainers(webId: URL, containers: URL[], reload?: boolean): Promise<TypeRegistration[]>
getPropertiesFromTypeRegistration(registration: TypeRegistration): Promise<TypeRegistration>
```

### LWSAuth 

Authentication helper functions:

```typescript
loginToSelectedIdP(oidcIssuer: string): Promise<void>
logoutFromSolidPod(): Promise<void>
getStoredIdP(): string
setStoredIdP(idp: string): void
getSelectedProviderName(selectedIdp: string): string
```

## Usage Example

```typescript
import { register } from '@va-automate/lws-manager';

// Register custom elements
register();

// Use in HTML
<lws-provider target="app">
  <lws-process-selector></lws-process-selector>
  <lws-progress-tracker></lws-progress-tracker>
  <lws-step-handler></lws-step-handler>
</lws-provider>
```

## Error Handling

The library uses standard JavaScript Error objects with descriptive messages. Common errors:

- Authentication errors during login/logout
- Network errors during pod operations
- Invalid URI formats
- Missing or invalid process/task data
- Unauthorized access attempts

## Events

Custom elements emit various events:

- `process-selected` - When a process is selected
- `task-selected` - When a task is selected  
- `step-complete` - When a step is completed
- `auth-complete` - When authentication completes
- `source-added` - When a new data source is added