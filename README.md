# MCP Planka Server

Servidor MCP (Model Context Protocol) para integración completa con tableros Kanban de Planka. Permite gestionar proyectos, tableros, tarjetas, tareas y colaboración directamente desde aplicaciones MCP como Claude.

## 🚀 Características

- **Gestión de Proyectos**: Crear, listar y administrar proyectos
- **Tableros Kanban**: Crear y gestionar tableros con listas personalizadas  
- **Gestión de Tarjetas**: Crear, mover, duplicar y organizar tarjetas
- **Sistema de Tareas**: Crear subtareas y seguimiento de progreso
- **Etiquetas y Categorías**: Organizar tarjetas con etiquetas de colores
- **Comentarios**: Colaboración a través de comentarios en tarjetas
- **Seguimiento de Tiempo**: Cronómetros integrados para time tracking
- **Gestión de Membresías**: Control de acceso y permisos por tablero

## 📋 Herramientas Disponibles

### `mcp_kanban_project_board_manager`
Gestiona proyectos y tableros con operaciones CRUD completas.
- **Parámetros**: `action`, `id`, `projectId`, `name`, `position`, `boardId`

### `mcp_kanban_list_manager`
Administra listas dentro de los tableros.
- **Parámetros**: `action`, `id`, `boardId`, `name`, `position`

### `mcp_kanban_card_manager`
Gestión completa de tarjetas Kanban.
- **Parámetros**: `action`, `id`, `listId`, `name`, `description`, `tasks`

### `mcp_kanban_stopwatch`
Control de cronómetros para seguimiento de tiempo.
- **Parámetros**: `action`, `id`

### `mcp_kanban_label_manager`
Gestión de etiquetas y categorización.
- **Parámetros**: `action`, `boardId`, `name`, `color`, `cardId`, `labelId`

### `mcp_kanban_task_manager`
Control de tareas y subtareas.
- **Parámetros**: `action`, `cardId`, `name`, `tasks`, `isCompleted`

### `mcp_kanban_comment_manager`
Sistema de comentarios para colaboración.
- **Parámetros**: `action`, `cardId`, `text`

### `mcp_kanban_membership_manager`
Control de acceso y permisos por tablero.
- **Parámetros**: `action`, `boardId`, `userId`, `role`, `canComment`

## 🛠️ Instalación

### Instalación General MCP EN LOCAL (NO RECOMENDADO)

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
```bash
cp config.example.env .env
# Editar .env con la configuración de su servidor Planka
```

3. **Compilar**:
```bash
npm run build
```

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Por Defecto |
|----------|-------------|-------------|
| `PLANKA_BASE_URL` | URL base del servidor Planka | `http://localhost:3000` |
| `PLANKA_AGENT_EMAIL` | Email para autenticación | - |
| `PLANKA_AGENT_PASSWORD` | Contraseña para autenticación | - |

### Configuración MCP en Aplicaciones USANDO NPX (RECOMENDADO)

#### Ubicación del archivo de configuración

**Claude Desktop:**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

#### Para Claude Desktop (config.json)

**Configuración básica con NPX:**
```json
{
  "mcpServers": {
    "planka": {
      "command": "npx",
      "args": ["@grec0/mcp-planka"],
      "env": {
        "PLANKA_BASE_URL": "http://localhost:3000",
        "PLANKA_AGENT_EMAIL": "demo@demo.demo",
        "PLANKA_AGENT_PASSWORD": "demo"
      }
    }
  }
}
```

**Para servidor Planka remoto:**
```json
{
  "mcpServers": {
    "planka": {
      "command": "npx",
      "args": ["@grec0/mcp-planka"],
      "env": {
        "PLANKA_BASE_URL": "https://tu-planka-server.com",
        "PLANKA_AGENT_EMAIL": "tu-email@ejemplo.com",
        "PLANKA_AGENT_PASSWORD": "tu-contraseña"
      }
    }
  }
}
```

#### Para instalación local

```json
{
  "mcpServers": {
    "planka": {
      "command": "node",
      "args": ["C:/ruta/a/kanban-mcp/dist/index.js"],
      "env": {
        "PLANKA_BASE_URL": "http://localhost:3000",
        "PLANKA_AGENT_EMAIL": "demo@demo.demo",
        "PLANKA_AGENT_PASSWORD": "demo"
      }
    }
  }
}
```

#### Para entorno de desarrollo

```json
{
  "mcpServers": {
    "planka": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "C:/ruta/a/kanban-mcp",
      "env": {
        "PLANKA_BASE_URL": "http://localhost:3000",
        "PLANKA_AGENT_EMAIL": "demo@demo.demo",
        "PLANKA_AGENT_PASSWORD": "demo"
      }
    }
  }
}
```

### Verificar configuración MCP

Después de configurar el MCP, puedes verificar que funciona correctamente:

1. **Reiniciar la aplicación** (Claude Desktop, etc.)
2. **Probar operación básica**:
   ```
   mcp_kanban_project_board_manager(action: "get_projects", page: 1, perPage: 10)
   ```
3. **Crear un tablero de prueba**:
   ```
   mcp_kanban_project_board_manager(action: "create_board", projectId: "ID_DEL_PROYECTO", name: "Tablero de Prueba", position: 1)
   ```

### Variables de Entorno Principales

```bash
# Configuración básica
PLANKA_BASE_URL=http://localhost:3000
PLANKA_AGENT_EMAIL=demo@demo.demo
PLANKA_AGENT_PASSWORD=demo
```

### Configuración de Servidor Planka Local

Si necesita un servidor Planka local para desarrollo:

```bash
# Usando Docker Compose
docker-compose up -d

# O usando NPM scripts del proyecto
npm run up

# Acceder a Planka
# URL: http://localhost:3000
# Credenciales por defecto: demo@demo.demo / demo
```

## 🚀 Uso

### Iniciar el servidor (instalación local)
```bash
npm run start
```

### Modo desarrollo
```bash
npm run dev
```

### Con inspector MCP
```bash
npm run inspector
```

### Scripts Docker (Para Planka local)
```bash
# Iniciar contenedores Planka
npm run up

# Detener contenedores
npm run down

# Reiniciar contenedores
npm run restart
```

## 📚 Ejemplos de Uso

### Gestión de Proyectos
```javascript
// Listar proyectos
mcp_kanban_project_board_manager({
  action: "get_projects",
  page: 1,
  perPage: 10
})

// Crear tablero
mcp_kanban_project_board_manager({
  action: "create_board",
  projectId: "project_id",
  name: "Mi Nuevo Tablero",
  position: 1
})
```

### Gestión de Tarjetas
```javascript
// Crear tarjeta con tareas
mcp_kanban_card_manager({
  action: "create_with_tasks",
  listId: "list_id",
  name: "Nueva Funcionalidad",
  description: "Implementar nueva característica",
  tasks: ["Diseño", "Desarrollo", "Testing", "Deploy"],
  comment: "Tarjeta creada automáticamente"
})

// Mover tarjeta entre listas
mcp_kanban_card_manager({
  action: "move",
  id: "card_id",
  listId: "new_list_id",
  position: 0
})
```

### Seguimiento de Tiempo
```javascript
// Iniciar cronómetro
mcp_kanban_stopwatch({
  action: "start",
  id: "card_id"
})

// Detener cronómetro
mcp_kanban_stopwatch({
  action: "stop",
  id: "card_id"
})
```

## 🔧 Solución de Problemas

### Error de Conexión con Planka
Si obtiene errores de conexión:

1. **Verificar URL base**: Asegúrese que `PLANKA_BASE_URL` sea correcta
2. **Verificar credenciales**: Email y contraseña deben ser válidos
3. **Verificar conectividad**: El servidor Planka debe estar ejecutándose

```bash
# Probar conectividad manualmente
curl -X POST http://localhost:3000/api/access-tokens \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "demo@demo.demo", "password": "demo"}'
```

### Error NPX "Package not found"
Si NPX no encuentra el paquete:

```bash
# Limpiar cache de NPX
npx clear-npx-cache

# O instalar globalmente
npm install -g @grec0/mcp-planka
```

### Problemas de Autenticación
```bash
# Verificar variables de entorno
echo $PLANKA_BASE_URL
echo $PLANKA_AGENT_EMAIL
# No mostrar password en logs por seguridad
```

### Error de Configuración MCP
1. **Verificar sintaxis JSON** en el archivo de configuración
2. **Reiniciar la aplicación** después de cambios
3. **Verificar rutas absolutas** si usa instalación local

### Variables de Entorno Faltantes
Verificar:
1. `PLANKA_BASE_URL` configurada correctamente
2. `PLANKA_AGENT_EMAIL` y `PLANKA_AGENT_PASSWORD` válidos
3. Servidor Planka accesible desde la red

## 🧪 Testing

```bash
npm test
```

## 📖 Compatibilidad

- **Planka**: v1.0.0+
- **Node.js**: >=18.0.0
- **Sistemas**: Windows, Linux, macOS
- **MCP**: Compatible con Claude Desktop y otros clientes MCP

## 🔐 Seguridad

- Autenticación basada en credenciales de Planka
- Comunicación a través de API REST estándar
- Variables de entorno para credenciales seguras
- Sin almacenamiento local de credenciales

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Add nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📜 License

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/grec0/mcp-planka/issues)
- **Documentación**: [Wiki del Proyecto](https://github.com/grec0/mcp-planka/wiki)
- **Planka**: [Documentación Oficial de Planka](https://docs.planka.cloud/) 