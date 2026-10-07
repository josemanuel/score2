# Calculadora SCORE2 + SCORE2-Diabetes

Calculadora web profesional del **SCORE2** y **SCORE2-Diabetes** según las guías de la Sociedad Europea de Cardiología.

Estima el riesgo de eventos cardiovasculares **fatales y no fatales** (infarto de miocardio, ictus o muerte cardiovascular) a 10 años.

Calibrada para las **4 regiones de riesgo europeas**, con España en la región de **bajo riesgo**.

---

## Modelos incluidos

| Modelo | Población | Edad | Variables extra |
|--------|-----------|------|-----------------|
| **SCORE2** | Sin diabetes ni ECV establecida | 40–69 | — |
| **SCORE2-Diabetes** | Diabetes tipo 2 sin ECV ni daño grave de órgano diana | 40–69 | HbA1c, eGFR, edad al diagnóstico |

---

## Características

- Cálculo exacto con coeficientes publicados (SCORE2 2021 y SCORE2-Diabetes 2023)
- Calibración regional (Low / Moderate / High / Very high)
- Categorías de riesgo según umbrales ESC correspondientes a cada modelo
- Recomendaciones terapéuticas y objetivos de tratamiento (Paso 1 y Paso 2)
- Soporte de unidades mmol/L ↔ mg/dL y HbA1c mmol/mol ↔ %
- Diseño responsive, accesible y orientado a uso clínico
- 100 % client-side (sin servidor ni dependencias externas)

---

## Categorías de riesgo

### SCORE2 (ESC 2021)

| Categoría | &lt; 50 años | 50–69 años |
|-----------|-------------|------------|
| Bajo-moderado | &lt; 2,5 % | &lt; 5 % |
| Alto | 2,5 – &lt; 7,5 % | 5 – &lt; 10 % |
| Muy alto | ≥ 7,5 % | ≥ 10 % |

### SCORE2-Diabetes (ESC 2023)

| Categoría | Riesgo a 10 años | Objetivo c-LDL |
|-----------|------------------|----------------|
| Bajo | &lt; 5 % | &lt; 2,6 mmol/L |
| Moderado | 5 – &lt; 10 % | &lt; 2,6 mmol/L |
| Alto | 10 – &lt; 20 % | &lt; 1,8 mmol/L + ≥50 % ↓ |
| Muy alto | ≥ 20 % | &lt; 1,4 mmol/L + ≥50 % ↓ |

---

## Despliegue en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube los archivos a la raíz:
   ```
   index.html
   styles.css
   script.js
   README.md
   ```
3. **Settings → Pages** → Source: rama `main`, carpeta `/ (root)`.
4. Disponible en `https://<usuario>.github.io/<repo>/`

También funciona abriendo `index.html` directamente en el navegador.

---

## Referencias

- SCORE2 Working Group and ESC CRC. *SCORE2 risk prediction algorithms.* Eur Heart J. 2021;42(25):2439-2454.
- SCORE2-Diabetes Working Group and ESC CRC. *SCORE2-Diabetes: 10-year cardiovascular risk prediction in type 2 diabetes.* Eur Heart J. 2023;44(28):2544-2556.
- Visseren FLJ, et al. *2021 ESC Guidelines on CVD prevention.* Eur Heart J. 2021.
- Marx N, et al. *2023 ESC Guidelines for the management of CVD in patients with diabetes.* Eur Heart J. 2023.

---

## Aviso legal

Herramienta destinada **exclusivamente a profesionales sanitarios**.  
No sustituye el juicio clínico.  
SCORE2-Diabetes **no es aplicable** a diabetes tipo 1 ni a pacientes con enfermedad cardiovascular aterosclerótica establecida.

MIT License · Uso libre con atribución
