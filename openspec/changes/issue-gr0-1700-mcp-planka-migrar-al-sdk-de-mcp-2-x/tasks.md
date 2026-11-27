# Tasks

## 1. Dependencias y migración

- [x] 1.1 Instalar dependencias con `npm ci`, ejecutar `npx @modelcontextprotocol/codemod@latest v1-to-v2 .` y resolver todas las marcas; verificar mediante búsqueda que no queda `@mcp-codemod-error`.
- [x] 1.2 Actualizar server `^2.4.0`, client dev `^2.4.0`, zod `^4.2.0`, engines Node `>=20` y versión del paquete `0.1.0`; comprobar `common/version.ts`, buscar usos de `zod-to-json-schema` antes de retirarlo y regenerar `package-lock.json` sin cambiar `pnpm-lock.yaml`.
- [x] 1.3 Actualizar el mínimo de Node en README y comprobar que coincide con engines.

## 2. Servidor y contratos

- [x] 2.1 Extraer `buildServer()` con las ocho herramientas registradas mediante `registerTool` y `z.object`; revisar contra el código original nombres, descripciones, campos, defaults, obligatoriedad y respuestas, adaptando las incompatibilidades de Zod 4.
- [x] 2.2 Usar `serveStdio(() => buildServer())` sin await ni then, conservar `validateEnvironment()` y verificar avisos stderr sin contraseñas con variables falsas o ausentes.
- [x] 2.3 Mantener Express y sus rutas de diagnóstico; arrancar HTTP en un puerto libre y verificar `/status` y la respuesta fija de `POST /mcp`, deteniendo solo el proceso iniciado para la prueba.
- [x] 2.4 Crear `tests/server-smoke.test.ts`: compilar con `execFileSync(process.execPath, ['node_modules/typescript/bin/tsc'])`, conectar cliente MCP stdio a `dist/index.js` con variables falsas y sin `MCP_SERVER_TYPE`, comprobar exactamente las ocho tools y las dos descripciones indicadas en el diseño, cerrar el cliente y usar timeout de 30 s; ejecutar el test.

## 3. Verificación integrada

- [x] 3.1 Ejecutar `npm run build`, `npm test` y `npm run check`, resolviendo fallos hasta que pasen.
- [x] 3.2 Buscar referencias al SDK antiguo en código, tests, scripts y `package.json` y marcas del codemod; comprobar que no quedan y revisar el diff para confirmar que Jenkinsfile, publicación y lockfile pnpm permanecen intactos.

## Verificación tras el despliegue

- [ ] Comprobar tras el despliegue que el servidor actualizado arranca y responde en el entorno desplegado; esta comprobación requiere un entorno no disponible en el workspace.
