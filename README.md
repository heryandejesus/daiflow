# 🌿 DaiFlow

DaiFlow es una aplicación web progresiva (PWA) diseñada para centralizar el seguimiento diario de alimentación, hidratación, entrenamiento y progreso personal.

La aplicación fue desarrollada a partir de un plan real de alimentación y entrenamiento, con el objetivo de reemplazar el seguimiento manual y la consulta constante de documentos por una experiencia simple, rápida y adaptada al celular.

🔗 **Demo:** https://daiflow.vercel.app

---

## ✨ Características

### 🍽️ Seguimiento de comidas

DaiFlow permite registrar el cumplimiento diario de:

- Desayuno
- Almuerzo
- Merienda
- Cena

Cada comida contiene los elementos definidos en el plan alimentario y puede marcarse progresivamente durante el día.

El estado queda persistido y se recupera automáticamente al volver a abrir la aplicación.

---

### 🥑 Guía de alimentos

La aplicación incluye una guía de consulta con los alimentos definidos en el plan, organizada por categorías:

- Vegetales A
- Vegetales B
- Vegetales C
- Frutas
- Legumbres
- Lácteos
- Huevos
- Carnes
- Frutos secos
- Semillas
- Cuerpos grasos
- Cereales y pseudocereales

La guía incluye:

- categorías plegables;
- cantidad de opciones por categoría;
- buscador de alimentos;
- búsqueda sin distinguir mayúsculas o tildes;
- búsqueda por alimento o por nombre de categoría.

Por ejemplo:

`papa` → Vegetales C  
`pollo` → Carnes  
`vegetales c` → muestra toda la categoría  
`arandanos` → encuentra Arándanos

---

### 💧 Seguimiento de hidratación

Permite registrar el consumo diario de agua mediante accesos rápidos.

- Objetivo diario configurable en código.
- Registro de cada consumo.
- Posibilidad de eliminar la última carga.
- Progreso diario visual.
- Persistencia en Supabase.

---

### 🏋️ Seguimiento de gimnasio

DaiFlow también integra una rutina completa de entrenamiento dividida en dos días.

Para cada ejercicio se pueden registrar:

- series;
- repeticiones realizadas;
- peso utilizado;
- notas de carga;
- series completadas.

Una sesión puede dejarse parcialmente completada y finalizarse posteriormente.

La aplicación reconstruye una sesión activa si se cierra y vuelve a abrir.

---

### 📊 Progreso semanal

La sección de progreso resume la actividad de la semana utilizando fechas locales.

Incluye:

- progreso promedio de alimentación;
- progreso de hidratación;
- gráfico semanal;
- resumen de comidas;
- promedio de agua;
- entrenamientos completados;
- series realizadas;
- progreso semanal de gimnasio;
- última sesión finalizada.

El progreso principal de alimentación e hidratación se mantiene separado del progreso del gimnasio.

---

### 🏠 Dashboard diario

La pantalla principal resume el estado del día:

- progreso general;
- comidas completadas;
- hidratación;
- acceso al gimnasio;
- consistencia diaria.

La aplicación detecta automáticamente el cambio de día sin necesidad de recargarla manualmente.

---

## 📱 Progressive Web App

DaiFlow funciona como una **PWA instalable**.

Puede agregarse a la pantalla de inicio de un teléfono y utilizarse con una experiencia similar a una aplicación nativa.

Incluye:

- modo `standalone`;
- iconos específicos para PWA;
- soporte para iOS;
- Apple Touch Icon;
- manifest;
- service worker;
- actualización automática;
- navegación adaptada a dispositivos móviles;
- safe areas para dispositivos con notch.

---

## 🛠️ Tecnologías

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Lucide React

### Backend / Persistencia

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)

### PWA

- vite-plugin-pwa
- Workbox

### Deploy

- Vercel
- GitHub

---

## 🔐 Autenticación y seguridad

DaiFlow utiliza Supabase Authentication mediante email y contraseña.

La base de datos utiliza **Row Level Security (RLS)** para que cada usuario solo pueda acceder a sus propios registros.

Además:

- no se utiliza `service_role` en el frontend;
- las credenciales administrativas no están incluidas en el repositorio;
- las variables de entorno están excluidas mediante `.gitignore`;
- las operaciones de base de datos respetan permisos específicos por tabla;
- los registros utilizan `auth.uid()` para asociar la información al usuario autenticado.

---

## 🗄️ Persistencia

La información almacenada incluye:

### Comidas

Registro diario de cada elemento del plan.

### Hidratación

Cada carga de agua se almacena individualmente con:

- fecha local;
- cantidad;
- fecha y hora del registro.

### Gimnasio

Se almacenan:

- sesiones;
- día de entrenamiento;
- series;
- repeticiones;
- peso;
- notas;
- estado de cada serie;
- fecha de finalización.

---

## 📅 Manejo de fechas locales

Una parte importante del proyecto fue evitar errores relacionados con UTC.

DaiFlow trabaja con la fecha local del dispositivo para determinar el día actual.

La aplicación también detecta automáticamente:

- cambio de día a medianoche;
- regreso desde segundo plano;
- cambio de pestaña;
- recuperación desde Safari bfcache;
- regreso del foco a la aplicación.

Esto permite que el seguimiento diario se actualice sin necesidad de cerrar sesión o recargar manualmente.

---

## 📂 Estructura principal

```text
src/
├── auth/
│   └── AuthProvider.tsx
│
├── components/
│   ├── dashboard/
│   ├── gym/
│   ├── layout/
│   ├── meals/
│   ├── navigation/
│   ├── progress/
│   └── water/
│
├── data/
│   ├── foodSelection.ts
│   ├── gymPlan.ts
│   └── mealPlan.ts
│
├── day/
│   └── LocalDayProvider.tsx
│
├── lib/
│   └── supabase.ts
│
├── pages/
│   ├── GymPage.tsx
│   ├── LoginPage.tsx
│   ├── MealsPage.tsx
│   ├── ProgressPage.tsx
│   ├── TodayPage.tsx
│   └── WaterPage.tsx
│
└── utils/