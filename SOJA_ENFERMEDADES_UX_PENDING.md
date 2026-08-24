# UX pendiente — enfermedades de soja

No se modifica el frontend en esta tarea. El backend ahora puede devolver reglas individuales; una futura capa de presentación debería agruparlas por `categoria_nombre` (`foliar`, `fin_ciclo`, `raiz`, `raiz_tallo`, `tallo`, `bacteriosis`) y listar dentro las enfermedades compatibles, sin sumar tarjetas ni pesos.

Datos necesarios por señal: clave y nombre visible, categoría, estado, modo, evaluabilidad, etiqueta, explicación, recomendación, ventana, observados con cobertura, limitaciones, versión y fuente. Mostrar siempre: “Esta señal se basa en condiciones ambientales y no constituye un diagnóstico de presencia de enfermedad.” No mostrar reglas `NO_EVALUABLE` como señales activas.

Las reglas `ESTABLE` pueden formar parte de las señales públicas y del estado general. Las reglas `EXPERIMENTAL` se evalúan y conservan para admin, logs y QA, pero no deben mostrarse como alerta pública estándar ni modificar el estado general. Un futuro modo experimental podrá mostrarlas separadas con badge `Experimental`, sin mezclarlas con las señales estables.
