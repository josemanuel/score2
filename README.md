# Calculadora SCORE2 · Riesgo Cardiovascular a 10 años

Calculadora web profesional del **SCORE2** (Systematic Coronary Risk Evaluation 2) según las guías de la Sociedad Europea de Cardiología (ESC 2021).

Estima el riesgo de eventos cardiovasculares **fatales y no fatales** (infarto de miocardio, ictus o muerte cardiovascular) a 10 años en personas aparentemente sanas de **40–69 años**.

Calibrada para las **4 regiones de riesgo europeas**, con España en la región de **bajo riesgo**.

---

## Características

- Cálculo exacto del linear predictor y riesgo no calibrado según coeficientes publicados del SCORE2
- Calibración regional (Low / Moderate / High / Very high)
- Categorías de riesgo según umbrales ESC 2021 diferenciados por edad (&lt;50 vs ≥50 años)
- Recomendaciones terapéuticas y objetivos de tratamiento (Paso 1 y Paso 2)
- Soporte de unidades mmol/L y mg/dL
- Diseño responsive, accesible y orientado a uso clínico
- 100 % client-side (sin servidor ni dependencias externas de runtime)

---

## Uso clínico

| Variable              | Rango / valores                          |
|-----------------------|------------------------------------------|
| Edad                  | 40 – 69 años                             |
| Sexo                  | Hombre / Mujer                           |
| Fumador actual        | Sí / No                                  |
| PAS                   | mmHg                                     |
| Colesterol total      | mmol/L o mg/dL                           |
| Colesterol HDL        | mmol/L o mg/dL                           |
| Región de riesgo      | Bajo (España), Moderado, Alto, Muy alto  |

### Categorías de riesgo (ESC 2021)

| Categoría       | &lt; 50 años       | 50–69 años      |
|-----------------|------------------|-----------------|
| Bajo-moderado   | &lt; 2,5 %         | &lt; 5 %          |
| Alto            | 2,5 – &lt; 7,5 %   | 5 – &lt; 10 %     |
| Muy alto        | ≥ 7,5 %          | ≥ 10 %          |

---

## Despliegue en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `score2-calculator`).
2. Sube los tres archivos de este proyecto a la raíz del repositorio:
   ```
   index.html
   styles.css
   script.js
   README.md
   ```
3. Ve a **Settings → Pages**.
4. En *Source* selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
5. Guarda. En unos minutos la calculadora estará disponible en:
   ```
   https://<tu-usuario>.github.io/score2-calculator/
   ```

### Alternativa: despliegue local

Abre `index.html` directamente en el navegador. No requiere servidor.

---

## Estructura del proyecto

```
score2-calculator/
├── index.html      # Estructura y formularios
├── styles.css      # Estilos (diseño médico profesional)
├── script.js       # Lógica de cálculo SCORE2
└── README.md       # Este archivo
```

---

## Referencias

- SCORE2 Working Group and ESC Cardiovascular Risk Collaboration. *SCORE2 risk prediction algorithms: new models to estimate 10-year risk of cardiovascular disease in Europe.* Eur Heart J. 2021;42(25):2439-2454.
- Visseren FLJ, et al. *2021 ESC Guidelines on cardiovascular disease prevention in clinical practice.* Eur Heart J. 2021;42(34):3227-3337.
- ESC/EAS Guidelines for the management of dyslipidaemias (actualizaciones posteriores).

---

## Aviso legal

Esta herramienta está destinada **exclusivamente a profesionales sanitarios**.  
No sustituye el juicio clínico ni la valoración individualizada del paciente.  
No debe utilizarse en personas con enfermedad cardiovascular aterosclerótica establecida, diabetes mellitus, enfermedad renal crónica grave ni trastornos lipídicos genéticos raros (para los que existen otras herramientas: SCORE2-Diabetes, SCORE2-OP, etc.).

---

MIT License · Uso libre con atribución
