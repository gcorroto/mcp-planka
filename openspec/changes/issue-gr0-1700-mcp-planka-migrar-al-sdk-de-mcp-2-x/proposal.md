# Proposal

## Why

El servidor usa el SDK MCP 1.6.1 y Zod 3. La migración al SDK 2.x permite adoptar la versión actual del protocolo, conservando el contrato de las herramientas y el comportamiento HTTP existente.

## What Changes

- Migrar el servidor stdio al SDK MCP 2.x y Zod 4.2 o posterior, conservando las ocho herramientas y sus contratos.
- **BREAKING**: exigir Node.js 20 o posterior; los argumentos inválidos producen un resultado de herramienta con `isError: true` según SDK 2.x.
- Mantener los avisos de entorno por stderr y el modo HTTP Express actual, sin convertirlo en transporte MCP.
- Actualizar la versión del paquete a 0.1.0, dependencias, lockfile npm y documentación; añadir una prueba de humo con cliente MCP real.

## Capabilities

### New Capabilities

- `planka-mcp-server`: contrato de herramientas stdio, validación, arranque y compatibilidad del modo HTTP existente.

### Modified Capabilities

Ninguna: no hay especificaciones principales existentes.

## Impact

Afecta a `index.ts`, esquemas Zod y posibles tipos asociados, dependencias npm y lockfile, pruebas y README. Se conservan Express, sus tipos y node-fetch; no se modifican Jenkinsfile ni el flujo de publicación. `common/version.ts` ya declara 0.1.0.
