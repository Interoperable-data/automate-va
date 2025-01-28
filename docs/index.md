# JOSEPHA

## Automating Authorization processes

JOSEPHA (JOined System for Enhanced Process Handling and Automation) is a Vue-based Custom Element Library designed for running linked data registration processes, primarily created for ERA's vehicle authorization automation. The elements can however be used with any process description, as long as it is described in linked data.

## Key Features

- Connecting to Solid Pod Provider for linked data storage
- Creating ResourceCollections for application data stored elsewhere
- Managing Things (CRUD) based on SHACL-shapes, which display as forms
- Searching relevant data in triple stores and Solid Pods
- Organization management with units and roles

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Documentation Sections

- Introduction
  - General automation requirements
  - Technological recommendations
  - Storage aspects of automated, confidential processes
  - Processes as linked data themselves
- Components - Component and functions
- Registers - details of the involved registers
- Use Cases - Treat the lifecycle of resources in the registers

::: tip 
NOTE This documentation is generated using VitePress and automatically deployed on updates. :::