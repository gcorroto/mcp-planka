# planka-mcp-server Specification

## Purpose

Permitir que clientes MCP gestionen recursos de Planka mediante herramientas stdio, conservando el modo HTTP de diagnóstico existente.

## Requirements

### Requirement: Catálogo y contrato de herramientas
El servidor SHALL exponer exactamente las ocho herramientas existentes, conservando nombres, descripciones, parámetros, descripciones de campos, obligatoriedad, valores por defecto y formato de respuestas.

#### Scenario: Listar herramientas por stdio
- **WHEN** un cliente MCP solicita la lista de herramientas
- **THEN** recibe exactamente `mcp_kanban_project_board_manager`, `mcp_kanban_list_manager`, `mcp_kanban_card_manager`, `mcp_kanban_stopwatch`, `mcp_kanban_label_manager`, `mcp_kanban_task_manager`, `mcp_kanban_comment_manager` y `mcp_kanban_membership_manager` con sus esquemas y descripciones originales

#### Scenario: Invocar una herramienta con argumentos válidos
- **WHEN** un cliente invoca una herramienta con argumentos válidos
- **THEN** la operación conserva sus valores predeterminados y el formato de respuesta anterior

### Requirement: Validación de argumentos
El servidor SHALL devolver un resultado de herramienta con `isError: true` cuando los argumentos no cumplan su esquema.

#### Scenario: Argumentos inválidos
- **WHEN** un cliente invoca una herramienta con argumentos incompatibles con su esquema
- **THEN** recibe un resultado de herramienta marcado con `isError: true`

### Requirement: Arranque y diagnóstico
El servidor SHALL usar stdio por defecto y emitir los avisos de entorno por stderr sin revelar contraseñas.

#### Scenario: Variables ausentes
- **WHEN** el servidor arranca sin variables de entorno de Planka requeridas
- **THEN** emite los avisos existentes por stderr y no imprime ninguna contraseña

### Requirement: Modo HTTP de diagnóstico
El modo HTTP SHALL conservar sus rutas y respuestas existentes sin ofrecer un transporte MCP real.

#### Scenario: Estado HTTP
- **WHEN** el servidor arranca con `MCP_SERVER_TYPE=http` y recibe `GET /status`
- **THEN** responde con el estado, nombre y versión existentes

#### Scenario: Petición HTTP de diagnóstico
- **WHEN** recibe `POST /mcp`
- **THEN** devuelve el mensaje fijo existente que indica usar stdio

### Requirement: Versión mínima de Node
El paquete SHALL requerir Node.js 20 o posterior y documentar ese mínimo.

#### Scenario: Consultar requisitos
- **WHEN** se consulta el manifiesto o el README
- **THEN** se indica Node.js 20 como mínimo
