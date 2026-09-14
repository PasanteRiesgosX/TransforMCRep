# 🧪 Guía de Pruebas de Endpoints de Autenticación (Fase 2) - TransformMC AI

Esta guía contiene la documentación y los payloads JSON listos para probar la API desde herramientas como **Postman**, **Thunder Client** (extensión de VS Code) o comandos **cURL**.

---

## 🚀 1. Iniciar el Servidor Backend

Asegúrate de tener el contenedor de la base de datos **SQL Server** encendido y luego inicia el servidor en modo desarrollo:

```bash
cd backend
npm run start:dev
```

El servidor iniciará en: `http://localhost:3000`

---

## 📬 2. Endpoints y Payloads de Prueba (JSON)

### 🔹 Endpoint 1: Registro de Usuarios
- **Método:** `POST`
- **URL:** `http://localhost:3000/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "email": "carlos.mendoza@institucion.edu.co",
  "password": "Password123!",
  "fullName": "Carlos Alberto Mendoza",
  "area": "Facultad de Ingeniería",
  "role": "DOCENTE"
}
```
- **Respuesta esperada (HTTP 201 Created):**
```json
{
  "statusCode": 201,
  "message": "Usuario registrado exitosamente. Procede al inicio de sesión para verificar tu acceso.",
  "user": {
    "id": "c1f7b8e2-...",
    "email": "carlos.mendoza@institucion.edu.co",
    "fullName": "Carlos Alberto Mendoza",
    "area": "Facultad de Ingeniería",
    "role": "DOCENTE",
    "isVerified": false,
    "createdAt": "2026-08-31T...",
    "updatedAt": "2026-08-31T..."
  }
}
```
> **Comprobación:** El usuario queda registrado en la base de datos con `isVerified: false`. Si intentas registrar el mismo correo nuevamente, retornará un error `409 Conflict`.

---

### 🔹 Endpoint 2: Inicio de Sesión - Paso 1 (Validar Credenciales y Enviar Código 2FA)
- **Método:** `POST`
- **URL:** `http://localhost:3000/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "email": "carlos.mendoza@institucion.edu.co",
  "password": "Password123!"
}
```
- **Respuesta esperada (HTTP 200 OK):**
```json
{
  "statusCode": 200,
  "message": "Credenciales válidas. Se ha enviado un código de 6 dígitos a tu correo electrónico.",
  "email": "carlos.mendoza@institucion.edu.co",
  "expiresInMinutes": 15
}
```
> **Comprobación:** Revisa la consola/terminal donde se está ejecutando `npm run start:dev`. Verás una caja en los logs con el código generado:
> ```text
> [CÓDIGO DE VERIFICACIÓN 2FA]
> Destinatario: carlos.mendoza@institucion.edu.co
> Código de 6 dígitos: 849201
> Validez: 15 minutos
> ```

---

### 🔹 Endpoint 3: Inicio de Sesión - Paso 2 (Verificar Código y Obtener JWT)
- **Método:** `POST`
- **URL:** `http://localhost:3000/auth/verify-code`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):** *(Reemplaza `"849201"` por el código impreso en tu consola)*
```json
{
  "email": "carlos.mendoza@institucion.edu.co",
  "code": "849201"
}
```

- **Respuesta esperada (HTTP 200 OK):**
```json
{
  "statusCode": 200,
  "message": "Verificación exitosa. Inicio de sesión concedido.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c1f7b8e2-...",
    "email": "carlos.mendoza@institucion.edu.co",
    "fullName": "Carlos Alberto Mendoza",
    "area": "Facultad de Ingeniería",
    "role": "DOCENTE",
    "isVerified": true
  }
}
```
> **Comprobación:** `isVerified` pasa a ser `true`, se elimina el código usado de la tabla `EmailVerification` y se recibe el token JWT `accessToken`. Si ingresas un código falso o caducado (más de 15 min), responderá con error `400 Bad Request`.

---

### 🔹 Endpoint 4: Reenviar Código de Verificación
- **Método:** `POST`
- **URL:** `http://localhost:3000/auth/resend-code`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "email": "carlos.mendoza@institucion.edu.co"
}
```
- **Respuesta esperada (HTTP 200 OK):**
```json
{
  "statusCode": 200,
  "message": "Se ha enviado un nuevo código de verificación a tu correo. El código anterior ha quedado anulado.",
  "email": "carlos.mendoza@institucion.edu.co",
  "expiresInMinutes": 15
}
```
> **Comprobación:** El código anterior queda inhabilitado en la base de datos y se genera y muestra un código totalmente nuevo en la consola.





