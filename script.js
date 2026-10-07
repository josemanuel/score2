/**
 * Calculadora SCORE2 – Riesgo cardiovascular a 10 años
 * Implementación de las fórmulas del modelo SCORE2 (ESC 2021)
 * con calibración regional y recomendaciones terapéuticas.
 *
 * Basado en: SCORE2 Working Group & ESC Cardiovascular Risk Collaboration.
 * Eur Heart J. 2021.
 */

(function () {
  'use strict';

  // ─── Coeficientes del modelo SCORE2 ───────────────────────────────────────
  // Extraídos del Excel de referencia (coeficientes publicados).

  const COEF = {
    Hombre: {
      age: 0.3742,
      smoke: 0.6012,
      sbp: 0.2777,
      chol: 0.1458,
      hdl: -0.2698,
      ageSmoke: -0.0755,
      ageSbp: -0.0255,
      ageChol: -0.0281,
      ageHdl: 0.0426,
      baselineSurvival: 0.9605
    },
    Mujer: {
      age: 0.4648,
      smoke: 0.7744,
      sbp: 0.3131,
      chol: 0.1002,
      hdl: -0.2606,
      ageSmoke: -0.1088,
      ageSbp: -0.0277,
      ageChol: -0.0226,
      ageHdl: 0.0613,
      baselineSurvival: 0.9776
    }
  };

  // Parámetros de calibración regional (scale1, scale2) por sexo
  const CALIBRATION = {
    Low: {
      Hombre: { scale1: -0.5699, scale2: 0.7476 },
      Mujer:  { scale1: -0.7380, scale2: 0.7019 }
    },
    Moderate: {
      Hombre: { scale1: -0.1565, scale2: 0.8009 },
      Mujer:  { scale1: -0.3143, scale2: 0.7701 }
    },
    High: {
      Hombre: { scale1: 0.3207, scale2: 0.9360 },
      Mujer:  { scale1: 0.5710, scale2: 0.9369 }
    },
    'Very high': {
      Hombre: { scale1: 0.5836, scale2: 0.8294 },
      Mujer:  { scale1: 0.9412, scale2: 0.8329 }
    }
  };

  const REGION_LABELS = {
    Low: 'Bajo riesgo',
    Moderate: 'Riesgo moderado',
    High: 'Alto riesgo',
    'Very high': 'Muy alto riesgo'
  };

  // ─── Cálculo del linear predictor (LP) ────────────────────────────────────

  function linearPredictor(sexo, edad, fumador, pas, colTotal, hdl) {
    const c = COEF[sexo];
    const ageC = (edad - 60) / 5;
    const smoke = fumador === 'Sí' ? 1 : 0;
    const sbpC = (pas - 120) / 20;
    const cholC = colTotal - 6;
    const hdlC = (hdl - 1.3) / 0.5;

    return (
      c.age * ageC +
      c.smoke * smoke +
      c.sbp * sbpC +
      c.chol * cholC +
      c.hdl * hdlC +
      c.ageSmoke * ageC * smoke +
      c.ageSbp * ageC * sbpC +
      c.ageChol * ageC * cholC +
      c.ageHdl * ageC * hdlC
    );
  }

  // ─── Riesgo no calibrado ──────────────────────────────────────────────────

  function uncalibratedRisk(sexo, lp) {
    const s0 = COEF[sexo].baselineSurvival;
    return 1 - Math.pow(s0, Math.exp(lp));
  }

  // ─── SCORE2 calibrado ─────────────────────────────────────────────────────

  function calibratedScore2(sexo, region, uncalRisk) {
    if (uncalRisk <= 0) return 0;
    const cal = CALIBRATION[region][sexo];
    // 1 - exp( -exp( scale1 + scale2 * ln(-ln(1 - uncalRisk)) ) )
    const inner = Math.log(-Math.log(1 - uncalRisk));
    return 1 - Math.exp(-Math.exp(cal.scale1 + cal.scale2 * inner));
  }

  // ─── Categoría de riesgo (ESC 2021) ───────────────────────────────────────

  function riskCategory(edad, score2) {
    // score2 en proporción (0–1)
    if (edad < 50) {
      if (score2 < 0.025) return 'Bajo-moderado';
      if (score2 < 0.075) return 'Alto';
      return 'Muy alto';
    } else {
      if (score2 < 0.05) return 'Bajo-moderado';
      if (score2 < 0.10) return 'Alto';
      return 'Muy alto';
    }
  }

  // ─── Recomendaciones terapéuticas (ESC 2021 Prevention) ───────────────────

  function therapyRecommendation(category) {
    const map = {
      'Bajo-moderado': {
        text: 'Intervención sobre el estilo de vida (dejar de fumar, dieta mediterránea, actividad física regular, control del peso). Valorar tratamiento farmacológico si existen modificadores de riesgo o preferencia del paciente tras discusión compartida.',
        paso1: [
          'c-LDL < 3,0 mmol/L (< 116 mg/dL)',
          'PAS < 140 mmHg',
          'Cese del tabaquismo',
          'Estilo de vida saludable'
        ],
        paso2: [
          'Valorar intensificación individualizada',
          'c-LDL < 2,6 mmol/L (< 100 mg/dL) si se decide tratamiento'
        ]
      },
      'Alto': {
        text: 'Se recomienda tratamiento farmacológico (estatina de alta intensidad como primera línea) junto con intervención intensificada sobre el estilo de vida. Control estricto de la presión arterial.',
        paso1: [
          'c-LDL < 2,6 mmol/L (< 100 mg/dL)',
          'PAS < 140 mmHg (idealmente < 130 si tolerado)',
          'Cese del tabaquismo',
          'Estilo de vida intensificado'
        ],
        paso2: [
          'c-LDL < 1,8 mmol/L (< 70 mg/dL) y ≥ 50 % de reducción',
          'Añadir ezetimiba si no se alcanza objetivo',
          'Valorar anti-PCSK9 en casos seleccionados'
        ]
      },
      'Muy alto': {
        text: 'Tratamiento farmacológico intensivo obligatorio (estatina de alta intensidad ± ezetimiba). Objetivo de c-LDL muy estricto. Control agresivo de todos los factores de riesgo modificables.',
        paso1: [
          'c-LDL < 1,8 mmol/L (< 70 mg/dL) y ≥ 50 % de reducción',
          'PAS < 140 mmHg (idealmente < 130 si tolerado)',
          'Cese del tabaquismo',
          'Estilo de vida intensificado'
        ],
        paso2: [
          'c-LDL < 1,4 mmol/L (< 55 mg/dL) y ≥ 50 % de reducción',
          'Añadir ezetimiba y/o inhibidor PCSK9 si no se alcanza',
          'Considerar ácido bempedoico si intolerancia a estatinas'
        ]
      }
    };
    return map[category] || map['Bajo-moderado'];
  }

  // ─── Conversión de unidades ───────────────────────────────────────────────

  function toMmol(value, unit) {
    // mg/dL → mmol/L  (colesterol: / 38.67)
    if (unit === 'mg') return value / 38.67;
    return value;
  }

  // ─── Validación ───────────────────────────────────────────────────────────

  function validate(edad, pas, colTotal, hdl) {
    const errors = [];
    if (!edad || edad < 40 || edad > 69) {
      errors.push({ field: 'edad', msg: 'La edad debe estar entre 40 y 69 años.' });
    }
    if (!pas || pas < 90 || pas > 200) {
      errors.push({ field: 'pas', msg: 'La PAS debe estar entre 90 y 200 mmHg.' });
    }
    if (!colTotal || colTotal <= 0) {
      errors.push({ field: 'colTotal', msg: 'Introduzca un colesterol total válido.' });
    }
    if (!hdl || hdl <= 0) {
      errors.push({ field: 'hdl', msg: 'Introduzca un HDL válido.' });
    }
    return errors;
  }

  // ─── DOM helpers ──────────────────────────────────────────────────────────

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function clearInvalid() {
    $$('.invalid').forEach((el) => el.classList.remove('invalid'));
  }

  function showResults(data) {
    const results = $('#results');
    results.hidden = false;

    const pct = (data.score2 * 100).toFixed(1);
    $('#scoreValue').textContent = pct.replace('.', ',');

    const cat = data.category;
    const catClass =
      cat === 'Bajo-moderado' ? 'cat-bajo' :
      cat === 'Alto' ? 'cat-alto' : 'cat-muyalto';

    const circle = $('#scoreCircle');
    circle.className = 'score-circle ' + catClass;

    const catLabel = $('#categoryLabel');
    catLabel.textContent = cat;
    catLabel.className = 'category ' + catClass;

    $('#riesgoNoCalib').textContent =
      (data.uncalRisk * 100).toFixed(1).replace('.', ',') + ' %';
    $('#regionAplicada').textContent = REGION_LABELS[data.region];

    const therapy = therapyRecommendation(cat);
    $('#recomendacion').textContent = therapy.text;

    const ul1 = $('#objPaso1');
    ul1.innerHTML = therapy.paso1.map((t) => `<li>${t}</li>`).join('');

    const ul2 = $('#objPaso2');
    ul2.innerHTML = therapy.paso2.map((t) => `<li>${t}</li>`).join('');

    // Scroll suave al resultado en móvil
    if (window.innerWidth < 768) {
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ─── Event listeners ──────────────────────────────────────────────────────

  $('#score2-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearInvalid();

    const edad = parseInt($('#edad').value, 10);
    const sexo = document.querySelector('input[name="sexo"]:checked').value;
    const fumador = document.querySelector('input[name="fumador"]:checked').value;
    const pas = parseFloat($('#pas').value);
    const unitCol = $('#unitCol').value;
    const unitHdl = $('#unitHdl').value;
    let colTotal = parseFloat($('#colTotal').value);
    let hdl = parseFloat($('#hdl').value);
    const region = $('#region').value;

    // Convertir a mmol/L si es necesario
    colTotal = toMmol(colTotal, unitCol);
    hdl = toMmol(hdl, unitHdl);

    const errors = validate(edad, pas, colTotal, hdl);
    if (errors.length) {
      errors.forEach((err) => {
        const el = $('#' + err.field);
        if (el) el.classList.add('invalid');
      });
      alert(errors.map((e) => e.msg).join('\n'));
      return;
    }

    // Cálculo
    const lp = linearPredictor(sexo, edad, fumador, pas, colTotal, hdl);
    const uncalRisk = uncalibratedRisk(sexo, lp);
    const score2 = calibratedScore2(sexo, region, uncalRisk);
    const category = riskCategory(edad, score2);

    showResults({ score2, uncalRisk, category, region });
  });

  $('#btnLimpiar').addEventListener('click', function () {
    $('#score2-form').reset();
    // Restaurar unidades a mmol/L
    $('#unitCol').value = 'mmol';
    $('#unitHdl').value = 'mmol';
    clearInvalid();
    $('#results').hidden = true;
  });

  // Sincronizar unidades colesterol / HDL (opcional: si cambia una, cambiar la otra)
  $('#unitCol').addEventListener('change', function () {
    $('#unitHdl').value = this.value;
  });
  $('#unitHdl').addEventListener('change', function () {
    $('#unitCol').value = this.value;
  });
})();
