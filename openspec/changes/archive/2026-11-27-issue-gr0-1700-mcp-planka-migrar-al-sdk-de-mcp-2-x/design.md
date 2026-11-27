# Design

## Context

`index.ts` registra ocho tools en un servidor global y selecciona stdio o Express; HTTP solo ofrece diagnóstico. `common/version.ts` ya vale 0.1.0. El proyecto usa ESM, Node16 resolution, Jest y ambos lockfiles; véase la propuesta para la motivación.

## Goals / Non-Goals

**Goals:** preservar los contratos observables mientras se adopta el ciclo de vida stdio del SDK 2 y se verifica con un cliente real.

**Non-Goals:** transporte MCP HTTP real, MCP Events, cambios de publicación o Jenkinsfile.

## Decisions

- Ejecutar `npx @modelcontextprotocol/codemod@latest v1-to-v2 .` y resolver cada marca `@mcp-codemod-error`; revisar el diff para preservar los contratos. El codemod reduce la migración mecánica, pero no sustituye la revisión manual.
- Extraer creación y registro a `buildServer()` y usar `serveStdio(() => buildServer())` desde el subpath `@modelcontextprotocol/server/stdio`, sin `await` ni `.then()` sobre su manejador. Evita mantener la conexión manual del SDK anterior. Mantener `validateEnvironment()` antes de seleccionar transporte y sus avisos seguros.
- Registrar cada tool con `registerTool` y `inputSchema: z.object(...)`; comparar los esquemas originales, incluidos `.describe()`, defaults y optional. Ajustar `z.record`, tipos Zod y enums si aparecen. Aceptar el resultado `isError` del SDK 2 para argumentos inválidos.
- Conservar rutas y respuestas Express, incluido `POST /mcp` y `GET /status`, así como express, sus tipos y node-fetch. No sustituir HTTP por otro transporte; revisar referencias al servidor global que queden al extraer la factoría.
- Fijar server `^2.4.0`, client de desarrollo `^2.4.0`, zod `^4.2.0`, Node `>=20` y versión 0.1.0; buscar usos antes de eliminar `zod-to-json-schema`. Regenerar solo `package-lock.json`, dejando `pnpm-lock.yaml` intacto.
- La prueba de humo compila mediante `execFileSync(process.execPath, ['node_modules/typescript/bin/tsc'])`, inicia `dist/index.js` con el cliente y transporte stdio MCP, credenciales falsas y sin `MCP_SERVER_TYPE`, comprueba los ocho nombres exactos y las descripciones `The ID of the project or board` y `The ID of the list`, y cierra el cliente; límite de 30 segundos.

## Risks / Trade-offs

- [Zod 4 altera opcionalidad o defaults] → comparar esquemas y comportamiento con la versión original y probarlos.
- [Las descripciones desaparecen silenciosamente] → exigir Zod 4.2 y comprobar dos campos de tools distintas mediante `tools/list`.
- [Errores de ciclo de vida o fuga de procesos] → usar el helper de stdio y cerrar el cliente de prueba, incluso ante fallos.
- [Regresión HTTP o exposición de credenciales] → verificar `/status`, respuesta fija y avisos stderr con datos falsos; no registrar contraseñas.

## Migration Plan

Instalar dependencias, aplicar codemod y ajustes, regenerar lockfile npm y ejecutar las verificaciones locales antes de integrar. En caso de regresión, revertir el cambio completo junto con su lockfile; la comprobación del entorno desplegado queda para después del despliegue.
