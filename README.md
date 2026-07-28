# 🧘 HolisticMaster

Una aplicación móvil multi-plataforma que te ayuda a descubrir y localizar spas y centros de bienestar cercanos. Con **HolisticMaster**, puedes explorar opciones de relajación y wellness en tu zona de forma sencilla e intuitiva.

## ✨ Características

- **Mapas Interactivos**: Visualiza spas y centros de bienestar en tiempo real usando mapas georreferenciados
- **Ubicación Cercana**: Encuentra spas próximos a tu ubicación actual con radio de búsqueda configurable
- **Multi-plataforma**: Disponible en iOS, Android y Web
- **Interfaz Intuitiva**: Diseño limpio y temático (modo claro/oscuro)
- **Gestión de Configuración**: Personaliza tu experiencia en la pestaña de configuración

## 🚀 Comenzar

1. Instalar dependencias

   ```bash
   npm install
   ```

2. Iniciar la aplicación

   ```bash
   npx expo start
   ```

   Selecciona una opción para abrir la app en:
   - [build de desarrollo](https://docs.expo.dev/develop/development-builds/introduction/)
   - [emulador Android](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [simulador iOS](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go)

## 📱 Estructura del Proyecto

Este proyecto utiliza [Expo Router](https://docs.expo.dev/router/introduction/) para enrutamiento basado en archivos:

- **`src/app/`** - Pantallas principales (inicio, exploración, configuración)
- **`src/components/`** - Componentes reutilizables (mapas, temas, iconos)
- **`src/lib/`** - Utilidades (cálculo de distancias, integración con APIs)
- **`src/hooks/`** - Hooks personalizados (tema, esquema de colores)

## ⚙️ Configuración del Proyecto

Este proyecto está construido con:
- **[Expo](https://expo.dev/)** - Framework para apps React Native multiplataforma
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - Enrutamiento basado en archivos
- **[Expo Maps](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/)** - Visualización de mapas interactivos
- **[Expo Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/)** - Acceso a geolocalización
- **TypeScript** - Tipado estático para mayor confiabilidad
- **React Native** - Framework de UI multiplataforma

## 🧪 Pruebas y Validación

Este proyecto incluye un pipeline completo de validación automatizada:

- **Linting**: Ejecuta `npm run lint` para verificar la calidad del código con ESLint
- **Pruebas Unitarias**: Ejecuta `npm run test` para correr las pruebas con Jest
- **Property-based Testing**: Se incluye `fast-check` para generar cientos de casos de prueba aleatorios
- **Pipeline Unificado**: Ejecuta `npm run validate` para lint + tests en una sola orden
- **Cobertura de Código**: Ejecuta `npm run test:coverage` para verificar la cobertura (con umbrales mínimos)
- **Validación Completa**: Ejecuta `npm run validate:coverage` para lint + tests + coverage juntos

## 📚 Recursos Útiles

Para aprender más sobre Expo y desarrollo de la aplicación:

- [Documentación de Expo](https://docs.expo.dev/versions/v57.0.0/) - Documentación oficial versión v57.0.0
- [Expo Router Guide](https://docs.expo.dev/router/introduction/) - Guía de enrutamiento
- [Expo Maps API](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/) - Integración de mapas
- [Expo Location API](https://docs.expo.dev/versions/v57.0.0/sdk/location/) - Geolocalización
- [TypeScript en Expo](https://docs.expo.dev/guides/typescript/) - Guía de TypeScript

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 💬 Comunidad

Únete a la comunidad de Expo para preguntas y soporte:

- [Expo en GitHub](https://github.com/expo/expo) - Plataforma open source
- [Comunidad Discord](https://chat.expo.dev) - Chat y soporte
