# Instrucciones de Migración - Sistema de Rutinas

## Cambios Realizados

He modificado completamente el flujo de la aplicación para separar la **creación de rutinas** del **inicio de entrenamientos**:

### Antes:
- Al presionar "Iniciar Rutina" en Inicio → Creabas los ejercicios manualmente cada vez

### Ahora:
1. **Crear Rutinas** → Defines plantillas de rutinas con sus ejercicios (una sola vez)
2. **Iniciar Entrenamiento** → Seleccionas una rutina existente
3. **Ejecutar Entrenamiento** → Haces la rutina con cronómetro
4. **Finalizar Día** → Guarda el entrenamiento con tiempo y nombre de rutina

## Estructura de Archivos Creados/Modificados

### Nuevos Archivos:
1. `scripts/create_routine_templates.sql` - Migración de base de datos
2. `app/(app)/rutinas/crear/page.tsx` - Crear plantillas de rutinas
3. `app/(app)/rutinas/iniciar/page.tsx` - Seleccionar rutina para entrenar
4. `app/(app)/rutinas/sesion/[id]/page.tsx` - Sesión activa de entrenamiento

### Archivos Modificados:
1. `app/(app)/rutinas/page.tsx` - Muestra plantillas en lugar de historial
2. `app/(app)/inicio/page.tsx` - Botón redirige a selección de rutina
3. `app/(app)/calendario/page.tsx` - Incluye nombre de rutina y duración
4. `components/calendar-view.tsx` - Muestra información completa

## Pasos para Aplicar la Migración

### 1. Aplicar Migración de Base de Datos

Necesitas ejecutar el SQL en tu base de datos de Supabase:

**Opción A: Desde el Dashboard de Supabase**
1. Ve a tu proyecto en Supabase
2. Navega a SQL Editor
3. Copia y pega el contenido de `scripts/create_routine_templates.sql`
4. Ejecuta el script

**Opción B: Desde la CLI de Supabase**
```bash
supabase db push
# O si tienes el archivo:
psql $DATABASE_URL < scripts/create_routine_templates.sql
```

### 2. Verificar las Nuevas Tablas

El script crea:
- `routine_templates` - Plantillas de rutinas
- `routine_template_exercises` - Ejercicios de cada plantilla
- Agrega columnas a `workouts`: `routine_name` y `duration_minutes`

### 3. Reiniciar la Aplicación

```bash
npm run dev
```

## Flujo de Usuario Actualizado

### 1. Crear una Rutina (una vez)
- Ve a **Rutinas** → Botón "Crear"
- Asigna un nombre (ej: "Piernas", "Full Body")
- Agrega ejercicios con sets, reps y peso
- Guarda la plantilla

### 2. Iniciar un Entrenamiento
- Ve a **Inicio** → Botón "Iniciar Rutina"
- Selecciona una de tus rutinas guardadas
- Presiona "Iniciar"

### 3. Durante el Entrenamiento
- Verás todos los ejercicios de la rutina
- Un cronómetro cuenta el tiempo transcurrido
- Sigue los ejercicios como guía

### 4. Finalizar el Día
- Presiona "Finalizar Día"
- Agrega notas opcionales
- El entrenamiento se guarda con:
  - Nombre de la rutina
  - Duración en minutos
  - Fecha actual
  - Notas (opcional)

### 5. Ver en Calendario
- El calendario muestra el nombre de la rutina
- Muestra la duración del entrenamiento
- Tooltip con información completa al pasar el mouse

## Migración de Datos Existentes

Si ya tienes entrenamientos en la tabla `workouts`:
- Los entrenamientos antiguos seguirán funcionando
- Tendrán `routine_name` y `duration_minutes` como `NULL`
- No necesitas hacer nada, son compatibles

## Notas Importantes

- La carpeta `app/(app)/rutinas/nueva` ya no se usa pero puedes eliminarla manualmente
- Las plantillas de rutina son independientes de los entrenamientos realizados
- Puedes editar una plantilla sin afectar entrenamientos pasados
- El cronómetro empieza automáticamente al iniciar la sesión

## Soporte

Si encuentras algún problema:
1. Verifica que la migración SQL se aplicó correctamente
2. Revisa la consola del navegador para errores
3. Asegúrate de que las políticas RLS se crearon correctamente
