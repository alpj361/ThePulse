# 🧪 **GUÍA DE PRUEBAS - NUEVOS GRÁFICOS DE SONDEOS**

## 🎯 **Resumen de Mejoras Implementadas**

### **✨ Nuevas Funcionalidades**

1. **🔄 TrendSelector Mejorado**:
   - ✅ **Botón "Seleccionar todas"** para tendencias
   - ✅ **Tab de Tweets** - últimos 50 tweets de tendencias
   - ✅ **Preview de tweets** con información completa
   - ✅ **Controles avanzados** (mostrar todas, limpiar)

2. **📈 Nuevos Gráficos**:
   - ✅ **SentimentAreaChart** - Evolución de sentimientos en tiempo real
   - ✅ **StorytellingChart** - Cronología interactiva de eventos
   - ✅ **Contexto adaptativo** - Colores y estilos según el tema

3. **🔧 Backend Actualizado**:
   - ✅ **Prompt de ChatGPT mejorado** - incluye `evolucion_sentimiento` y `cronologia_eventos`
   - ✅ **Fallbacks robustos** - datos de prueba si falla el servicio
   - ✅ **Debugging extensivo** - logs detallados para diagnóstico

---

## 🧪 **INSTRUCCIONES DE PRUEBA**

### **Paso 1: Iniciar ExtractorW (Requerido para datos reales)**

```bash
# Terminal 1 - Backend
cd ExtractorW
npm start

# Verificar que esté corriendo en http://localhost:8080
```

### **Paso 2: Verificar ThePulse**

```bash
# Terminal 2 - Frontend (ya debe estar corriendo)
cd ThePulse
npm run dev

# Verificar que esté corriendo en http://localhost:5173
```

### **Paso 3: Probar TrendSelector Mejorado**

1. **Ir a Sondeos**: http://localhost:5173/sondeos
2. **Clic en configuración de contextos** (icono de engranaje)
3. **Seleccionar "Tendencias"** y expandir accordion
4. **Verificar pestañas**:
   - ✅ **Tab "Tendencias"** - debe mostrar keywords actuales
   - ✅ **Tab "Tweets"** - debe mostrar últimos 50 tweets
   - ✅ **Botón "Seleccionar todas"** - debe funcionar
   - ✅ **Mostrar todos toggle** - debe expandir la lista

### **Paso 4: Hacer un Sondeo con Datos Reales**

1. **Escribir pregunta**: `"¿Cuáles son las principales preocupaciones políticas en Guatemala esta semana?"`
2. **Seleccionar contexto**: `tendencias` + algunas tendencias específicas
3. **Hacer clic en "Sondear"**
4. **Verificar logs en DevTools Console**:

```
🎯 Iniciando sondearTema: {...}
📡 Enviando sondeo a ExtractorW con contexto: [...]
🔍 Debug - Resultado de ExtractorW: {...}
📊 Datos de análisis finales: {...}
🎯 Debug - Resultado final recibido: {...}
🎯 Debug - Renderizando Advanced Analytics: {...}
```

### **Paso 5: Verificar Nuevos Gráficos**

**Debe aparecer sección "Advanced Analytics" con:**

1. **📈 Gráfico de Sentimientos** (SentimentAreaChart):
   - ✅ Área con gradientes emocionales
   - ✅ Líneas de referencia para eventos importantes
   - ✅ Tooltip rico con percentajes y emojis
   - ✅ Colores adaptativos según contexto

2. **📖 Cronología de Eventos** (StorytellingChart):
   - ✅ Timeline vertical con eventos expandibles
   - ✅ Cards con información detallada
   - ✅ Iconografía por categoría (política, economía, etc.)
   - ✅ Resumen estadístico al final

---

## 🐛 **TROUBLESHOOTING**

### **❌ "Los gráficos no aparecen"**

**Revisar en Console:**

```
📊 Datos de análisis finales: {
  tieneEvolucionSentimiento: false,  // ❌ Debe ser true
  tieneCronologiaEventos: false,     // ❌ Debe ser true
}
```

**Soluciones:**

1. **Verificar ExtractorW**: `http://localhost:8080` debe responder
2. **Verificar logs de ExtractorW**: Buscar errores en terminal
3. **Verificar datos de prueba**: Deben incluir los nuevos campos

### **❌ "Solo aparecen datos de prueba"**

**Verificar en Console:**

```
🔍 Debug - Resultado de ExtractorW: {
  tieneResultado: false,  // ❌ ExtractorW no responde
}
```

**Soluciones:**

1. **Reiniciar ExtractorW**: `cd ExtractorW && npm start`
2. **Verificar autenticación**: Login en ThePulse
3. **Verificar créditos**: Usuario debe tener créditos

### **❌ "Error de sintaxis en sondeos.ts"**

**Si aparece error ESBuild:**

```bash
cd ThePulse
# Verificar que no hay errores de sintaxis
npm run build
```

**Solución:**
- Verificar que `generarDatosPrueba` tiene sintaxis correcta
- Reiniciar servidor de desarrollo

---

## 📊 **DATOS ESPERADOS**

### **Con ExtractorW (Datos Reales)**

```json
{
  "temas_relevantes": [...],
  "distribucion_categorias": [...],
  "evolucion_sentimiento": [
    {"tiempo": "Lun", "positivo": 45, "neutral": 30, "negativo": 25},
    // ... 7 días de datos
  ],
  "cronologia_eventos": [
    {
      "fecha": "2024-01-03",
      "titulo": "Evento detectado por IA",
      "descripcion": "Análisis basado en datos reales",
      "impacto": "alto",
      "categoria": "politica"
    }
  ]
}
```

### **Con Datos de Prueba (Fallback)**

```json
{
  "evolucion_sentimiento": [
    {"tiempo": "Lun", "positivo": 45, "neutral": 30, "negativo": 25},
    // ... datos simulados
  ],
  "cronologia_eventos": [
    {
      "fecha": "2024-01-03", 
      "titulo": "Emergencia de [consulta] como tendencia",
      "descripcion": "La tendencia sobre [consulta] comenzó a ganar tracción..."
    }
  ]
}
```

---

## ✅ **CHECKLIST DE VERIFICACIÓN**

### **Frontend (ThePulse)**
- [ ] TrendSelector muestra dos tabs (Tendencias/Tweets)
- [ ] Botón "Seleccionar todas" funciona
- [ ] Se muestran últimos 50 tweets en tab correspondiente
- [ ] Console muestra logs de debugging completos
- [ ] Nuevos gráficos aparecen en sección "Advanced Analytics"

### **Backend (ExtractorW)**
- [ ] Servidor corriendo en puerto 8080
- [ ] Endpoint `/api/sondeo` responde correctamente
- [ ] ChatGPT genera campos `evolucion_sentimiento` y `cronologia_eventos`
- [ ] Datos se guardan correctamente en tabla `sondeos`

### **Gráficos**
- [ ] SentimentAreaChart renderiza con gradientes
- [ ] StorytellingChart muestra timeline expandible
- [ ] Tooltips funcionan correctamente
- [ ] Colores se adaptan según contexto (política, economía, etc.)

---

## 🚀 **PRÓXIMOS PASOS**

1. **Probar con diferentes contextos**: noticias, codex, monitoreos
2. **Verificar rendimiento**: tiempo de respuesta y calidad de datos
3. **Ajustar prompts**: mejorar precisión de datos generados por IA
4. **Expandir funcionalidad**: más tipos de gráficos y análisis

---

## 📞 **SOPORTE**

Si encuentras problemas:

1. **Revisar logs** en DevTools Console
2. **Verificar que ExtractorW esté corriendo**
3. **Comprobar datos en Network tab**
4. **Verificar que tienes créditos y autenticación**

¡Los nuevos gráficos están listos para usar con datos reales! 🎉 