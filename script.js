/**
 * Calculadora SCORE2 + SCORE2-Diabetes
 * Riesgo cardiovascular a 10 años — ESC 2021 / 2023
 *
 * SCORE2: Eur Heart J 2021;42:2439-2454
 * SCORE2-Diabetes: Eur Heart J 2023;44:2544-2556
 */

(function () {
  'use strict';

  // ─── Estado ───────────────────────────────────────────────────────────────
  let currentModel = 'score2'; // 'score2' | 'diabetes'

  // ─── Coeficientes SCORE2 (sin diabetes) ───────────────────────────────────
  const COEF_SCORE2 = {
    Hombre: {
      age: 0.3742, smoke: 0.6012, sbp: 0.2777, chol: 0.1458, hdl: -0.2698,
      ageSmoke: -0.0755, ageSbp: -0.0255, ageChol: -0.0281, ageHdl: 0.0426,
      baselineSurvival: 0.9605
    },
    Mujer: {
      age: 0.4648, smoke: 0.7744, sbp: 0.3131, chol: 0.1002, hdl: -0.2606,
      ageSmoke: -0.1088, ageSbp: -0.0277, ageChol: -0.0226, ageHdl: 0.0613,
      baselineSurvival: 0.9776
    }
  };

  // ─── Coeficientes SCORE2-Diabetes ─────────────────────────────────────────
  // Diabetes siempre = 1. Coeficientes re-estimados para población diabética.
  const COEF_DM = {
    Hombre: {
      age: 0.5368, smoke: 0.4774, sbp: 0.1322, diabetes: 0.6457,
      chol: 0.1102, hdl: -0.1087,
      ageSmoke: -0.0672, ageSbp: -0.0268, ageDiabetes: -0.0983,
      ageChol: -0.0181, ageHdl: 0.0095,
      // Variables específicas DM
      ageDx: -0.0998,          // cagediab = (edadDx - 50)/5
      hba1c: 0.0955,           // (HbA1c - 31)/9.34
      lnegfr: -0.0591,         // (ln(eGFR) - 4.5)/0.15
      lnegfr2: 0.0058,         // quadratic
      ageHba1c: -0.0134,       // interaction
      ageLnegfr: 0.0115,       // interaction
      baselineSurvival: 0.9605
    },
    Mujer: {
      age: 0.6624, smoke: 0.6139, sbp: 0.1421, diabetes: 0.8096,
      chol: 0.1127, hdl: -0.1568,
      ageSmoke: -0.1122, ageSbp: -0.0167, ageDiabetes: -0.1272,
      ageChol: -0.0200, ageHdl: 0.0186,
      ageDx: -0.118,
      hba1c: 0.1173,
      lnegfr: -0.0640,
      lnegfr2: 0.0062,
      ageHba1c: -0.0196,
      ageLnegfr: 0.0169,
      baselineSurvival: 0.9776
    }
  };

  // Calibración regional (misma para ambos modelos)
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

  // ─── Cálculos SCORE2 ──────────────────────────────────────────────────────

  function lpScore2(sexo, edad, fumador, pas, colTotal, hdl) {
    const c = COEF_SCORE2[sexo];
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

  // ─── Cálculos SCORE2-Diabetes ─────────────────────────────────────────────

  function lpDiabetes(sexo, edad, fumador, pas, colTotal, hdl, edadDx, hba1c, egfr) {
    const c = COEF_DM[sexo];
    const ageC = (edad - 60) / 5;
    const smoke = fumador === 'Sí' ? 1 : 0;
    const sbpC = (pas - 120) / 20;
    const cholC = colTotal - 6;
    const hdlC = (hdl - 1.3) / 0.5;
    const diab = 1; // siempre diabetes
    const ageDxC = (edadDx - 50) / 5;
    const hba1cC = (hba1c - 31) / 9.34;
    const lnegfrC = (Math.log(egfr) - 4.5) / 0.15;

    return (
      // Variables base (re-estimadas para DM)
      c.age * ageC +
      c.smoke * smoke +
      c.sbp * sbpC +
      c.diabetes * diab +
      c.chol * cholC +
      c.hdl * hdlC +
      c.ageSmoke * ageC * smoke +
      c.ageSbp * ageC * sbpC +
      c.ageDiabetes * ageC * diab +
      c.ageChol * ageC * cholC +
      c.ageHdl * ageC * hdlC +
      // Variables específicas DM
      c.ageDx * diab * ageDxC +
      c.hba1c * hba1cC +
      c.lnegfr * lnegfrC +
      c.lnegfr2 * lnegfrC * lnegfrC +
      c.ageHba1c * hba1cC * ageC +
      c.ageLnegfr * lnegfrC * ageC
    );
  }

  // ─── Riesgo no calibrado y calibrado (común) ──────────────────────────────

  function uncalibratedRisk(baselineSurvival, lp) {
    return 1 - Math.pow(baselineSurvival, Math.exp(lp));
  }

  function calibratedRisk(sexo, region, uncalRisk) {
    if (uncalRisk <= 0) return 0;
    if (uncalRisk >= 1) return 1;
    const cal = CALIBRATION[region][sexo];
    const inner = Math.log(-Math.log(1 - uncalRisk));
    return 1 - Math.exp(-Math.exp(cal.scale1 + cal.scale2 * inner));
  }

  // ─── Categorías ───────────────────────────────────────────────────────────

  function categoryScore2(edad, score) {
    if (edad < 50) {
      if (score < 0.025) return 'Bajo-moderado';
      if (score < 0.075) return 'Alto';
      return 'Muy alto';
    } else {
      if (score < 0.05) return 'Bajo-moderado';
      if (score < 0.10) return 'Alto';
      return 'Muy alto';
    }
  }

  function categoryDiabetes(score) {
    // ESC 2023 Diabetes Guidelines
    if (score < 0.05) return 'Bajo';
    if (score < 0.10) return 'Moderado';
    if (score < 0.20) return 'Alto';
    return 'Muy alto';
  }

  // ─── Recomendaciones ──────────────────────────────────────────────────────

  function therapyScore2(category) {
    const map = {
      'Bajo-moderado': {
        text: 'Intervención sobre el estilo de vida (dejar de fumar, dieta mediterránea, actividad física regular, control del peso). Valorar tratamiento farmacológico si existen modificadores de riesgo o preferencia del paciente tras discusión compartida.',
        paso1: ['c-LDL < 3,0 mmol/L (< 116 mg/dL)', 'PAS < 140 mmHg', 'Cese del tabaquismo', 'Estilo de vida saludable'],
        paso2: ['Valorar intensificación individualizada', 'c-LDL < 2,6 mmol/L (< 100 mg/dL) si se decide tratamiento']
      },
      'Alto': {
        text: 'Se recomienda tratamiento farmacológico (estatina de alta intensidad como primera línea) junto con intervención intensificada sobre el estilo de vida. Control estricto de la presión arterial.',
        paso1: ['c-LDL < 2,6 mmol/L (< 100 mg/dL)', 'PAS < 140 mmHg (idealmente < 130 si tolerado)', 'Cese del tabaquismo', 'Estilo de vida intensificado'],
        paso2: ['c-LDL < 1,8 mmol/L (< 70 mg/dL) y ≥ 50 % de reducción', 'Añadir ezetimiba si no se alcanza objetivo', 'Valorar anti-PCSK9 en casos seleccionados']
      },
      'Muy alto': {
        text: 'Tratamiento farmacológico intensivo obligatorio (estatina de alta intensidad ± ezetimiba). Objetivo de c-LDL muy estricto. Control agresivo de todos los factores de riesgo modificables.',
        paso1: ['c-LDL < 1,8 mmol/L (< 70 mg/dL) y ≥ 50 % de reducción', 'PAS < 140 mmHg (idealmente < 130 si tolerado)', 'Cese del tabaquismo', 'Estilo de vida intensificado'],
        paso2: ['c-LDL < 1,4 mmol/L (< 55 mg/dL) y ≥ 50 % de reducción', 'Añadir ezetimiba y/o inhibidor PCSK9 si no se alcanza', 'Considerar ácido bempedoico si intolerancia a estatinas']
      }
    };
    return map[category] || map['Bajo-moderado'];
  }

  function therapyDiabetes(category) {
    const map = {
      'Bajo': {
        text: 'Estilo de vida intensificado. Estatina de moderada-alta intensidad recomendada en la mayoría de pacientes con DM2 >40 años. Control glucémico individualizado (HbA1c habitualmente < 7 %).',
        paso1: ['c-LDL < 2,6 mmol/L (< 100 mg/dL)', 'PAS < 140 mmHg (idealmente < 130)', 'HbA1c individualizado (habitualmente < 7 %)', 'Cese del tabaquismo'],
        paso2: ['Valorar c-LDL < 1,8 mmol/L si modificadores de riesgo', 'iSGLT2 o aGLP-1 si indicados por beneficio CV']
      },
      'Moderado': {
        text: 'Estatina de alta intensidad + estilo de vida. Considerar iSGLT2 o agonistas GLP-1 con beneficio cardiovascular demostrado. Control estricto de PAS y glucemia.',
        paso1: ['c-LDL < 2,6 mmol/L (< 100 mg/dL)', 'PAS < 130 mmHg si tolerado', 'HbA1c individualizado', 'Valorar iSGLT2 / aGLP-1'],
        paso2: ['c-LDL < 1,8 mmol/L (< 70 mg/dL) y ≥ 50 % de reducción', 'Añadir ezetimiba si preciso']
      },
      'Alto': {
        text: 'Tratamiento intensivo: estatina de alta intensidad ± ezetimiba. iSGLT2 y/o aGLP-1 con beneficio CV demostrados están indicados. Objetivo de c-LDL estricto.',
        paso1: ['c-LDL < 1,8 mmol/L (< 70 mg/dL) y ≥ 50 % de reducción', 'PAS < 130 mmHg si tolerado', 'iSGLT2 y/o aGLP-1 indicados', 'HbA1c individualizado'],
        paso2: ['c-LDL < 1,4 mmol/L (< 55 mg/dL)', 'Añadir ezetimiba / anti-PCSK9 si no se alcanza', 'Optimizar tratamiento antidiabético con beneficio CV']
      },
      'Muy alto': {
        text: 'Riesgo muy alto: tratamiento hipolipemiante máximo tolerado (estatina alta intensidad + ezetimiba ± anti-PCSK9). iSGLT2 y aGLP-1 prioritarios. Control agresivo de todos los factores de riesgo.',
        paso1: ['c-LDL < 1,4 mmol/L (< 55 mg/dL) y ≥ 50 % de reducción', 'PAS < 130 mmHg si tolerado', 'iSGLT2 + aGLP-1 prioritarios', 'HbA1c individualizado'],
        paso2: ['c-LDL < 1,0 mmol/L (< 40 mg/dL) puede considerarse', 'Anti-PCSK9 si no se alcanza objetivo', 'Valorar ácido bempedoico / inclisirán']
      }
    };
    return map[category] || map['Moderado'];
  }

  // ─── Unidades ─────────────────────────────────────────────────────────────

  function toMmol(value, unit) {
    if (unit === 'mg') return value / 38.67;
    return value;
  }

  function toHba1cMmol(value, unit) {
    // % DCCT → mmol/mol: (value - 2.15) / 0.0915
    if (unit === 'percent') return (value - 2.15) / 0.0915;
    return value;
  }

  // ─── Validación ───────────────────────────────────────────────────────────

  function validate(data) {
    const errors = [];
    if (!data.edad || data.edad < 40 || data.edad > 69)
      errors.push({ field: 'edad', msg: 'La edad debe estar entre 40 y 69 años.' });
    if (!data.pas || data.pas < 90 || data.pas > 200)
      errors.push({ field: 'pas', msg: 'La PAS debe estar entre 90 y 200 mmHg.' });
    if (!data.colTotal || data.colTotal <= 0)
      errors.push({ field: 'colTotal', msg: 'Introduzca un colesterol total válido.' });
    if (!data.hdl || data.hdl <= 0)
      errors.push({ field: 'hdl', msg: 'Introduzca un HDL válido.' });

    if (currentModel === 'diabetes') {
      if (!data.edadDx || data.edadDx < 10 || data.edadDx > data.edad)
        errors.push({ field: 'edadDx', msg: 'La edad al diagnóstico debe ser ≤ edad actual y ≥ 10 años.' });
      if (!data.hba1c || data.hba1c <= 0)
        errors.push({ field: 'hba1c', msg: 'Introduzca un valor de HbA1c válido.' });
      if (!data.egfr || data.egfr < 15 || data.egfr > 150)
        errors.push({ field: 'egfr', msg: 'El eGFR debe estar entre 15 y 150 mL/min/1,73 m².' });
    }
    return errors;
  }

  // ─── DOM ──────────────────────────────────────────────────────────────────

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function clearInvalid() {
    $$('.invalid').forEach((el) => el.classList.remove('invalid'));
  }

  function setModel(model) {
    currentModel = model;
    const isDM = model === 'diabetes';

    // Tabs
    $$('.tab').forEach((t) => {
      const active = t.dataset.model === model;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });

    // Campos diabetes
    $$('.diabetes-only').forEach((el) => {
      el.hidden = !isDM;
      // Required solo en modo diabetes
      el.querySelectorAll('input').forEach((inp) => {
        if (isDM) inp.setAttribute('required', '');
        else inp.removeAttribute('required');
      });
    });

    // Info tables
    $('#infoTableScore2').hidden = isDM;
    $('#infoTableDiabetes').hidden = !isDM;
    $('#infoTitle').textContent = isDM
      ? 'Categorías de riesgo — SCORE2-Diabetes (ESC 2023)'
      : 'Categorías de riesgo — SCORE2 (ESC 2021)';
    $('#infoNote').textContent = isDM
      ? 'SCORE2-Diabetes incorpora HbA1c, edad al diagnóstico y eGFR sobre el modelo SCORE2. Categorías según guía ESC 2023 de diabetes. No aplicable a diabetes tipo 1.'
      : 'SCORE2 estima el riesgo de infarto de miocardio, ictus o muerte cardiovascular a 10 años. La calibración regional corrige el riesgo basal según la mortalidad CV de cada zona europea.';

    // Ocultar resultados al cambiar de modelo
    $('#results').hidden = true;
  }

  function showResults(data) {
    const results = $('#results');
    results.hidden = false;

    const pct = (data.score * 100).toFixed(1);
    $('#scoreValue').textContent = pct.replace('.', ',');
    $('#modelTag').textContent = data.modelLabel;

    const cat = data.category;
    let catClass;
    if (cat === 'Bajo-moderado' || cat === 'Bajo') catClass = 'cat-bajo';
    else if (cat === 'Moderado') catClass = 'cat-alto'; // naranja intermedio
    else if (cat === 'Alto') catClass = 'cat-alto';
    else catClass = 'cat-muyalto';

    $('#scoreCircle').className = 'score-circle ' + catClass;
    const catLabel = $('#categoryLabel');
    catLabel.textContent = cat;
    catLabel.className = 'category ' + catClass;

    $('#riesgoNoCalib').textContent =
      (data.uncalRisk * 100).toFixed(1).replace('.', ',') + ' %';
    $('#regionAplicada').textContent = REGION_LABELS[data.region];

    const therapy = data.therapy;
    $('#recomendacion').textContent = therapy.text;
    $('#objPaso1').innerHTML = therapy.paso1.map((t) => `<li>${t}</li>`).join('');
    $('#objPaso2').innerHTML = therapy.paso2.map((t) => `<li>${t}</li>`).join('');

    $('#footnote').textContent = data.footnote;

    if (window.innerWidth < 768) {
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ─── Eventos ──────────────────────────────────────────────────────────────

  // Tabs
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => setModel(tab.dataset.model));
  });

  // Submit
  $('#score2-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearInvalid();

    const edad = parseInt($('#edad').value, 10);
    const sexo = document.querySelector('input[name="sexo"]:checked').value;
    const fumador = document.querySelector('input[name="fumador"]:checked').value;
    const pas = parseFloat($('#pas').value);
    let colTotal = toMmol(parseFloat($('#colTotal').value), $('#unitCol').value);
    let hdl = toMmol(parseFloat($('#hdl').value), $('#unitHdl').value);
    const region = $('#region').value;

    let edadDx, hba1c, egfr;
    if (currentModel === 'diabetes') {
      edadDx = parseInt($('#edadDx').value, 10);
      hba1c = toHba1cMmol(parseFloat($('#hba1c').value), $('#unitHba1c').value);
      egfr = parseFloat($('#egfr').value);
    }

    const errors = validate({ edad, pas, colTotal, hdl, edadDx, hba1c, egfr });
    if (errors.length) {
      errors.forEach((err) => {
        const el = $('#' + err.field);
        if (el) el.classList.add('invalid');
      });
      alert(errors.map((e) => e.msg).join('\n'));
      return;
    }

    let lp, baseline, uncalRisk, score, category, therapy, modelLabel, footnote;

    if (currentModel === 'score2') {
      lp = lpScore2(sexo, edad, fumador, pas, colTotal, hdl);
      baseline = COEF_SCORE2[sexo].baselineSurvival;
      uncalRisk = uncalibratedRisk(baseline, lp);
      score = calibratedRisk(sexo, region, uncalRisk);
      category = categoryScore2(edad, score);
      therapy = therapyScore2(category);
      modelLabel = 'SCORE2';
      footnote = 'Categorías según ESC 2021 Prevention Guidelines. Umbrales diferenciados por edad (<50 vs ≥50 años).';
    } else {
      lp = lpDiabetes(sexo, edad, fumador, pas, colTotal, hdl, edadDx, hba1c, egfr);
      baseline = COEF_DM[sexo].baselineSurvival;
      uncalRisk = uncalibratedRisk(baseline, lp);
      score = calibratedRisk(sexo, region, uncalRisk);
      category = categoryDiabetes(score);
      therapy = therapyDiabetes(category);
      modelLabel = 'SCORE2-Diabetes';
      footnote = 'Categorías según ESC 2023 Guidelines on CVD in diabetes. No aplicable a diabetes tipo 1 ni a pacientes con ECV establecida.';
    }

    showResults({ score, uncalRisk, category, region, therapy, modelLabel, footnote });
  });

  // Limpiar
  $('#btnLimpiar').addEventListener('click', function () {
    $('#score2-form').reset();
    $('#unitCol').value = 'mmol';
    $('#unitHdl').value = 'mmol';
    $('#unitHba1c').value = 'mmol';
    clearInvalid();
    $('#results').hidden = true;
  });

  // Sincronizar unidades colesterol
  $('#unitCol').addEventListener('change', function () {
    $('#unitHdl').value = this.value;
  });
  $('#unitHdl').addEventListener('change', function () {
    $('#unitCol').value = this.value;
  });
})();
