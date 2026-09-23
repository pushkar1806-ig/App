import React, { useMemo, useState } from 'react';
import "./App.css";

export default function BeamLoaderApp() {
  // Apparatus span: Fixed 80 cm scale
  const L = 80;
  const g = 9.81;

  // Active laboratory tuning parameters
  const [m1, setM1] = useState(1.5); // kg
  const [a, setA] = useState(25);   // cm
  const [m2, setM2] = useState(2.0); // kg
  const [b, setB] = useState(60);   // cm
  const [readings, setReadings] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  // Analytical Statics Calculations
  const calc = useMemo(() => {
    const W1_N = m1 * g;
    const W2_N = m2 * g;
    const totalW_N = W1_N + W2_N;

    // Moments about Left Knife-edge Support 1: Σ M1 = 0
    // (R2 * L) - (W1 * a) - (W2 * b) = 0
    const moment1 = W1_N * a;
    const moment2 = W2_N * b;
    const totalMoment = moment1 + moment2;

    const R2_N = totalMoment / L;
    const R1_N = totalW_N - R2_N;

    // Units in kgf (lab spring-balance equivalent readings)
    const R1_kgf = R1_N / g;
    const R2_kgf = R2_N / g;
    const total_kgf = m1 + m2;

    // Bending moments at point loads in N·m (distances converted from cm to m)
    const Ma = R1_N * (a / 100);
    const Mb = R2_N * ((L - b) / 100);
    const maxBM = Math.max(Ma, Mb);

    // Shear force regions (N)
    const V_0_to_a = R1_N;
    const V_a_to_b = R1_N - W1_N;
    const V_b_to_L = -R2_N;

    return {
      W1_N: W1_N.toFixed(2),
      W2_N: W2_N.toFixed(2),
      totalW_N: totalW_N.toFixed(2),
      moment1: moment1.toFixed(2),
      moment2: moment2.toFixed(2),
      totalMoment: totalMoment.toFixed(2),
      R1_N: R1_N.toFixed(2),
      R2_N: R2_N.toFixed(2),
      R1_kgf: R1_kgf.toFixed(2),
      R2_kgf: R2_kgf.toFixed(2),
      total_kgf: total_kgf.toFixed(2),
      Ma: Ma.toFixed(2),
      Mb: Mb.toFixed(2),
      maxBM: maxBM.toFixed(2),
      V_0_to_a: V_0_to_a.toFixed(2),
      V_a_to_b: V_a_to_b.toFixed(2),
      V_b_to_L: V_b_to_L.toFixed(2),
    };
  }, [m1, m2, a, b]);

  // Log reading into observation state
  const logReading = () => {
    const entry = {
      id: Date.now(),
      m1,
      a,
      m2,
      b,
      W1: calc.W1_N,
      W2: calc.W2_N,
      R1: calc.R1_N,
      R2: calc.R2_N,
      R1_kgf: calc.R1_kgf,
      R2_kgf: calc.R2_kgf,
    };
    setReadings((prev) => [entry, ...prev]);
  };

  // Export observations to CSV file
  const exportCSV = () => {
    if (readings.length === 0) return;
    const headers = "Trial,m1(kg),a(cm),m2(kg),b(cm),W1(N),W2(N),R1(N),R2(N),R1(kgf),R2(kgf)\n";
    const rows = readings
      .map((r, i) => `${i + 1},${r.m1},${r.a},${r.m2},${r.b},${r.W1},${r.W2},${r.R1},${r.R2},${r.R1_kgf},${r.R2_kgf}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Beam_Reactions_Experiment_Data.csv";
    link.click();
  };

  // SVG Geometry Dimensions
  const svgWidth = 840;
  const beamY = 160;
  const padX = 80;
  const spanPx = svgWidth - 2 * padX;

  const toPx = (distCm) => padX + (distCm / L) * spanPx;
  const xA = toPx(a);
  const xB = toPx(b);

  // Dynamic deflection sag (max under heavier load)
  const maxSagY = beamY + Math.min(18, (m1 + m2) * 2.8);

  // Spring dial needle rotation mapping (0 to 5 kgf mapped from -135deg to +135deg)
  const getDialAngle = (kgf) => {
    const clamped = Math.min(Math.max(parseFloat(kgf) || 0, 0), 5);
    return -135 + (clamped / 5) * 270;
  };

  const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

  return (
    <div className="lab-container">
      <div className="lab-wrapper">
        
        {/* Header Section */}
        <header className="lab-header">
          <div className="lab-badge">
            <span className="status-dot"></span>
            <span className="badge-text">APPLIED MECHANICS LABORATORY · EXPERIMENT 03</span>
          </div>
          <h1 className="lab-title">Beam Reaction & Parallel Force Apparatus</h1>
          <p className="lab-subtitle">
            Experimental determination and analytical verification of support reactions (R₁, R₂), internal shear force (V), and bending moment (M) across an <strong>80 cm standard scale beam</strong>.
          </p>
        </header>

        {/* 1. Real-Time Telemetry & Analog Dial Meters */}
        <div className="metrics-row">
          {/* Dial 1 (R1) */}
          <div className="metric-card">
            <svg width="70" height="70" viewBox="0 0 70 70" className="dial-gauge">
              <circle cx="35" cy="35" r="30" className="track" />
              <path d="M 14 52 A 25 25 0 1 1 56 52" className="arc" />
              <g style={{ transform: `rotate(${getDialAngle(calc.R1_kgf)}deg)` }} className="dial-needle">
                <line x1="35" y1="35" x2="35" y2="14" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="35" cy="35" r="4" fill="#38bdf8" />
              </g>
            </svg>
            <div className="metric-info">
              <span className="metric-title">Balance 1 (R₁)</span>
              <span className="metric-value">{calc.R1_N} <small className="metric-unit">N</small></span>
              <span className="metric-sub">{calc.R1_kgf} kgf</span>
            </div>
          </div>

          {/* Dial 2 (R2) */}
          <div className="metric-card">
            <svg width="70" height="70" viewBox="0 0 70 70" className="dial-gauge">
              <circle cx="35" cy="35" r="30" className="track" />
              <path d="M 14 52 A 25 25 0 1 1 56 52" className="arc" />
              <g style={{ transform: `rotate(${getDialAngle(calc.R2_kgf)}deg)` }} className="dial-needle">
                <line x1="35" y1="35" x2="35" y2="14" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="35" cy="35" r="4" fill="#38bdf8" />
              </g>
            </svg>
            <div className="metric-info">
              <span className="metric-title">Balance 2 (R₂)</span>
              <span className="metric-value">{calc.R2_N} <small className="metric-unit">N</small></span>
              <span className="metric-sub">{calc.R2_kgf} kgf</span>
            </div>
          </div>

          {/* Equilibrium Check */}
          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-title">Vertical Equilibrium (Σ Fy)</span>
              <span className="metric-value emerald">0.00 N</span>
              <span className="metric-sub">Total Load = {calc.totalW_N} N ({calc.total_kgf} kgf)</span>
            </div>
          </div>

          {/* Max Bending Moment */}
          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-title">Peak Moment (M_max)</span>
              <span className="metric-value amber">{calc.maxBM} <small className="metric-unit">N·m</small></span>
              <span className="metric-sub">At x = {parseFloat(calc.Ma) >= parseFloat(calc.Mb) ? `${a} cm (a)` : `${b} cm (b)`}</span>
            </div>
          </div>
        </div>

        {/* 2. Interactive SVG Apparatus Stage */}
        <div className="stage-card">
          <div className="stage-topbar">
            <div className="stage-heading">
              <span className="status-dot"></span>
              Laboratory Free-Body Diagram (Span L = {L} cm)
            </div>
            <button onClick={logReading} className="record-btn">
              + Record to Observation Log
            </button>
          </div>

          <svg viewBox={`0 0 ${svgWidth} 265`} className="rig-svg">
            <defs>
              <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto"><path d="M0,0 L3,6 L6,0 Z" fill="#ef4444" /></marker>
              <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto"><path d="M0,0 L3,6 L6,0 Z" fill="#f59e0b" /></marker>
              <marker id="arrowCyan" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto"><path d="M0,6 L3,0 L6,6 Z" fill="#38bdf8" /></marker>
              
              <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Dimension Reference Line */}
            <line x1={padX} y1={beamY - 95} x2={padX + spanPx} y2={beamY - 95} className="dimension-line" />
            <line x1={padX} y1={beamY - 102} x2={padX} y2={beamY - 88} className="dimension-cap" />
            <line x1={padX + spanPx} y1={beamY - 102} x2={padX + spanPx} y2={beamY - 88} className="dimension-cap" />
            <text x={padX + spanPx / 2} y={beamY - 102} className="dimension-text">
              Total Distance Between Supports L = 80 cm
            </text>

            {/* Dynamic Deflection Schematic Curve */}
            <path
              d={`M ${padX} ${beamY} Q ${(padX + spanPx) / 2} ${maxSagY} ${padX + spanPx} ${beamY}`}
              className="deflection-curve"
            />

            {/* Beam Body */}
            <rect x={padX} y={beamY - 8} width={spanPx} height={16} fill="url(#beamGradient)" className="beam-rect" />

            {/* Scale Graduations (every 10cm, marked every 20cm) */}
            {Array.from({ length: 9 }).map((_, i) => {
              const val = i * 10;
              const xPos = toPx(val);
              const isMajor = val % 20 === 0;
              return (
                <g key={val}>
                  <line x1={xPos} y1={beamY + 8} x2={xPos} y2={beamY + (isMajor ? 18 : 14)} strokeWidth={isMajor ? 1.5 : 1} className="scale-tick-line" />
                  {isMajor && (
                    <text x={xPos} y={beamY + 30} className="scale-tick-text">
                      {val}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Support 1 (R1) */}
            <polygon points={`${padX},${beamY + 8} ${padX - 14},${beamY + 34} ${padX + 14},${beamY + 34}`} className="support-triangle" />
            <line x1={padX - 22} y1={beamY + 34} x2={padX + 22} y2={beamY + 34} className="support-base-line" />
            <line x1={padX} y1={beamY + 85} x2={padX} y2={beamY + 40} markerEnd="url(#arrowCyan)" className="support-reaction-line" />
            <text x={padX} y={beamY + 104} className="reaction-text-main">
              R₁ = {calc.R1_N} N
            </text>
            <text x={padX} y={beamY + 118} className="reaction-text-sub">
              ({calc.R1_kgf} kgf)
            </text>

            {/* Support 2 (R2) */}
            <polygon points={`${padX + spanPx},${beamY + 8} ${padX + spanPx - 14},${beamY + 34} ${padX + spanPx + 14},${beamY + 34}`} className="support-triangle" />
            <line x1={padX + spanPx - 22} y1={beamY + 34} x2={padX + spanPx + 22} y2={beamY + 34} className="support-base-line" />
            <line x1={padX + spanPx} y1={beamY + 85} x2={padX + spanPx} y2={beamY + 40} markerEnd="url(#arrowCyan)" className="support-reaction-line" />
            <text x={padX + spanPx} y={beamY + 104} className="reaction-text-main">
              R₂ = {calc.R2_N} N
            </text>
            <text x={padX + spanPx} y={beamY + 118} className="reaction-text-sub">
              ({calc.R2_kgf} kgf)
            </text>

            {/* Load 1 Vector */}
            <g className="load-vector-1">
              <line x1={xA} y1={beamY - 70} x2={xA} y2={beamY - 12} markerEnd="url(#arrowRed)" className="load-line" />
              <rect x={xA - 24} y={beamY - 84} width="48" height="20" className="load-badge-rect-1" />
              <text x={xA} y={beamY - 70} className="load-badge-text-1">
                {calc.W1_N} N
              </text>
            </g>
            <text x={xA} y={beamY - 16} className="load-pos-label-1">
              a={a}cm
            </text>

            {/* Load 2 Vector */}
            <g className="load-vector-2">
              <line x1={xB} y1={beamY - 70} x2={xB} y2={beamY - 12} markerEnd="url(#arrowAmber)" className="load-line" />
              <rect x={xB - 24} y={beamY - 84} width="48" height="20" className="load-badge-rect-2" />
              <text x={xB} y={beamY - 70} className="load-badge-text-2">
                {calc.W2_N} N
              </text>
            </g>
            <text x={xB} y={beamY - 16} className="load-pos-label-2">
              b={b}cm
            </text>
          </svg>
        </div>

        {/* 3. Slider Tuning Console */}
        <div className="tuning-card">
          <div className="tuning-header">Slotted Weight & Position Tuning Controls</div>
          <div className="tuning-grid">
            
            {/* Mass 1 */}
            <div className="control-item">
              <div className="control-labels">
                <span>Hanger Mass 1 (m₁)</span>
                <span className="control-tag red">{m1.toFixed(1)} kg ({calc.W1_N} N)</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="5.0"
                step="0.1"
                value={m1}
                onChange={(e) => setM1(parseFloat(e.target.value))}
                className="lab-slider red"
              />
            </div>

            {/* Distance a */}
            <div className="control-item">
              <div className="control-labels">
                <span>Distance a (from R₁)</span>
                <span className="control-tag red">{a} cm</span>
              </div>
              <input
                type="range"
                min="2"
                max={b - 2}
                step="1"
                value={a}
                onChange={(e) => setA(parseInt(e.target.value))}
                className="lab-slider red"
              />
            </div>

            {/* Mass 2 */}
            <div className="control-item">
              <div className="control-labels">
                <span>Hanger Mass 2 (m₂)</span>
                <span className="control-tag amber">{m2.toFixed(1)} kg ({calc.W2_N} N)</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="5.0"
                step="0.1"
                value={m2}
                onChange={(e) => setM2(parseFloat(e.target.value))}
                className="lab-slider amber"
              />
            </div>

            {/* Distance b */}
            <div className="control-item">
              <div className="control-labels">
                <span>Distance b (from R₁)</span>
                <span className="control-tag amber">{b} cm</span>
              </div>
              <input
                type="range"
                min={a + 2}
                max={L - 2}
                step="1"
                value={b}
                onChange={(e) => setB(parseInt(e.target.value))}
                className="lab-slider amber"
              />
            </div>

          </div>
        </div>

        {/* 4. Real-time Shear Force & Bending Moment Diagrams */}
        <div className="diagrams-card">
          <div className="diagram-header">Internal Force Diagrams (SFD & BMD Distribution)</div>
          <svg viewBox={`0 0 ${svgWidth} 190`} className="rig-svg">
            {/* SFD Baseline */}
            <line x1={padX} y1="60" x2={padX + spanPx} y2="60" className="axis-line" />
            <text x={padX - 10} y="64" className="axis-label">V = 0</text>
            <text x={padX + spanPx + 10} y="64" className="axis-title-sfd">SFD (N)</text>

            {/* SFD Path */}
            <path
              d={`
                M ${padX} 60 
                L ${padX} ${60 - Math.min(45, (parseFloat(calc.V_0_to_a) / 50) * 45)} 
                L ${xA} ${60 - Math.min(45, (parseFloat(calc.V_0_to_a) / 50) * 45)} 
                L ${xA} ${60 - Math.max(-45, Math.min(45, (parseFloat(calc.V_a_to_b) / 50) * 45))} 
                L ${xB} ${60 - Math.max(-45, Math.min(45, (parseFloat(calc.V_a_to_b) / 50) * 45))} 
                L ${xB} ${60 - Math.max(-45, (parseFloat(calc.V_b_to_L) / 50) * 45)} 
                L ${padX + spanPx} ${60 - Math.max(-45, (parseFloat(calc.V_b_to_L) / 50) * 45)} 
                L ${padX + spanPx} 60 Z
              `}
              className="sfd-path"
            />
            <text x={(padX + xA) / 2} y="38" className="sfd-value-1">+{calc.V_0_to_a}N</text>
            <text x={(xA + xB) / 2} y="55" className="sfd-value-2">{calc.V_a_to_b}N</text>
            <text x={(xB + padX + spanPx) / 2} y="82" className="sfd-value-3">{calc.V_b_to_L}N</text>

            {/* BMD Baseline */}
            <line x1={padX} y1="145" x2={padX + spanPx} y2="145" className="axis-line" />
            <text x={padX - 10} y="149" className="axis-label">M = 0</text>
            <text x={padX + spanPx + 10} y="149" className="axis-title-bmd">BMD (N·m)</text>

            {/* BMD Triangular Curve Path */}
            <path
              d={`
                M ${padX} 145 
                L ${xA} ${145 - Math.min(50, (parseFloat(calc.Ma) / 10) * 45)} 
                L ${xB} ${145 - Math.min(50, (parseFloat(calc.Mb) / 10) * 45)} 
                L ${padX + spanPx} 145 Z
              `}
              className="bmd-path"
            />
            <text x={xA} y={135 - Math.min(50, (parseFloat(calc.Ma) / 10) * 45)} className="bmd-val-text">
              M_a = {calc.Ma} N·m
            </text>
            <text x={xB} y={135 - Math.min(50, (parseFloat(calc.Mb) / 10) * 45)} className="bmd-val-text">
              M_b = {calc.Mb} N·m
            </text>
          </svg>
        </div>

        {/* 5. Analytical Step-by-Step Breakdown */}
        <div className="analytical-grid">
          <div className="step-card">
            <h4 className="step-title">Step 1: Moment Equilibrium (Σ M₁ = 0)</h4>
            <p className="step-desc">
              Taking clockwise moments about Left Knife Edge Support (R₁):
            </p>
            <div className="step-code">
              W₁ = m₁ × g = {m1} × 9.81 = {calc.W1_N} N<br />
              W₂ = m₂ × g = {m2} × 9.81 = {calc.W2_N} N<br /><br />
              (R₂ × L) - (W₁ × a) - (W₂ × b) = 0<br />
              R₂ × {L} = ({calc.W1_N} × {a}) + ({calc.W2_N} × {b})<br />
              R₂ × {L} = {calc.moment1} + {calc.moment2}<br />
              R₂ × {L} = {calc.totalMoment} N·cm<br />
              R₂ = {calc.totalMoment} / {L}<br />
              <strong className="highlight-cyan">R₂ = {calc.R2_N} N ({calc.R2_kgf} kgf)</strong>
            </div>
          </div>

          <div className="step-card">
            <h4 className="step-title">Step 2: Force Equilibrium (Σ Fy = 0)</h4>
            <p className="step-desc">
              Vertical translation balance of support reactions vs point loads:
            </p>
            <div className="step-code">
              R₁ + R₂ = W₁ + W₂<br />
              R₁ + {calc.R2_N} = {calc.W1_N} + {calc.W2_N}<br />
              R₁ + {calc.R2_N} = {calc.totalW_N} N<br />
              R₁ = {calc.totalW_N} - {calc.R2_N}<br /><br />
              <strong className="highlight-cyan">R₁ = {calc.R1_N} N ({calc.R1_kgf} kgf)</strong><br /><br />
              Static Check: {(parseFloat(calc.R1_N) + parseFloat(calc.R2_N)).toFixed(2)} N == {calc.totalW_N} N
            </div>
          </div>
        </div>

         {/* 6. Extensive Technical Theory & Laboratory Manual (Long-Scroll) */}
        <div className="info-section-container">
          {/* Theory Module 1 */}
          <section className="info-card">
            <h2>1. Fundamental Governing Laws of Coplanar Statics</h2>
            <p>
              In applied engineering mechanics, a <strong>beam</strong> is a structural member designed primarily to support transverse loads that produce internal shear stresses and bending moments. When all applied forces and support reactions reside in a single two-dimensional plane, the system constitutes a <strong>coplanar force system</strong>.
            </p>
            <p>
              Because the applied gravitational point loads (W₁ and W₂) act strictly downward parallel to the local vertical axis, the system simplifies to a <strong>parallel non-concurrent coplanar system</strong>. For the member to remain in rigid body static equilibrium without translation or rotation, it must satisfy Newton's First Law and d'Alembert's conditions:
            </p>
            
            <div className="theory-callout-grid">
              <div className="callout-box">
                <strong>First Equilibrium Condition (Σ Fy = 0)</strong>
                <p>
                  The algebraic sum of all vertical forces must be zero. Upward normal support forces (R₁ and R₂) must exactly counterbalance the downward gravitational pull of the suspended slotted masses (W₁ + W₂).
                </p>
              </div>

              <div className="callout-box">
                <strong>Second Equilibrium Condition (Σ M_O = 0)</strong>
                <p>
                  The algebraic sum of the moments of all forces about any arbitrary point O must vanish. By Varignon's Theorem, the moment of the resultant force about any pivot equals the sum of moments of individual components.
                </p>
              </div>

              <div className="callout-box">
                <strong>Horizontal Restraint (Σ Fx = 0)</strong>
                <p>
                  Since all active point loads are perpendicular to the beam axis with zero longitudinal component, horizontal reactions at both supports remain identically zero: H₁ = H₂ = 0.
                </p>
              </div>
            </div>
          </section>

          {/* Theory Module 2 */}
          <section className="info-card">
            <h2>2. Differential Relationships: Load, Shear, & Bending Moment</h2>
            <p>
              The structural response across the span L is mathematically characterized by continuous differential relationships connecting distributed load intensity w(x), internal shear force V(x), and bending moment M(x):
            </p>
            <div className="step-code">
              {"dV/dx = -w(x)    and    dM/dx = V(x)"}
            </div>
            <p>
              For point loads W₁ and W₂, the distributed intensity w(x) = 0 everywhere except at singular load application points x = a and x = b, yielding the following structural behaviors:
            </p>
            <ul className="info-list">
              <li>
                <strong>Shear Force Step Discontinuities:</strong> The shear diagram remains horizontal and constant between loads (dV/dx = 0), but exhibits an instantaneous vertical step drop equal to W₁ at x = a, and W₂ at x = b.
              </li>
              <li>
                <strong>Bending Moment Slope Transitions:</strong> Because dM/dx = V, the slope of the bending moment diagram at any section is equal to the shear force value. Where shear force is positive (0 ≤ x &lt; a), moment increases with a constant positive slope R₁. Where shear changes sign, the bending moment reaches its maximum value.
              </li>
              <li>
                <strong>Peak Moment Location:</strong> In simply supported beams under downward point loads, the maximum bending moment always occurs directly beneath one of the point loads (either at x = a or x = b), never in between.
              </li>
            </ul>
          </section>

          {/* Theory Module 3 */}
          <section className="info-card">
            <h2>3. Laboratory Apparatus Architecture & Step-by-Step Procedure</h2>
            <p>
              The physical experiment is performed on a standard mechanical bench apparatus consisting of:
            </p>
            <ul className="info-list">
              <li>
                <strong>Graduated Prismatic Scale:</strong> A rigid, seasoned hardwood or extruded aluminum bar with millimeter markings, providing a standard effective span of L = 80 cm.
              </li>
              <li>
                <strong>Spring Dial Balances:</strong> Compression/tension spring dynamometers calibrated in both Newtons (N) and kilograms-force (kgf) supporting both ends via hardened steel knife-edge stirrups.
              </li>
              <li>
                <strong>Slotted Weights & Stirrup Hangers:</strong> Calibrated iron or brass weights suspended from movable knife-edge hooks sliding along the graduated scale.
              </li>
            </ul>

            <h3>Experimental Procedure:</h3>
            <ol className="info-list">
              <li>Ensure the graduated beam rests horizontally on both support knife-edges with no suspended weights.</li>
              <li>Record the initial unloaded zero-error (tare dead weight of the beam) displayed on both dial balances: r₀₁ and r₀₂.</li>
              <li>Slide Stirrup 1 to distance a (measured from the left support) and suspend mass m₁.</li>
              <li>Slide Stirrup 2 to distance b and suspend mass m₂.</li>
              <li>Gently tap both dial balances to overcome internal static needle friction.</li>
              <li>Read and record physical balances R₁,obs and R₂,obs, subtracting the initial tare zero offsets.</li>
              <li>Compare experimental readings against the analytical values computed via the equilibrium equations.</li>
            </ol>
          </section>

          {/* Theory Module 4 */}
          <section className="info-card">
            <h2>4. Systematic Error Analysis & Experimental Uncertainty</h2>
            <p>
              In practical laboratory evaluations, observed spring readings will exhibit small discrepancies compared to pure analytical predictions. Engineering reports evaluate this using systematic error metrics:
            </p>
            <div className="theory-callout-grid">
              <div className="callout-box">
                <strong>Percentage Deviation Formula</strong>
                <p>
                  {"% Error = (|R_analytical - R_experimental| / R_analytical) * 100"}
                </p>
              </div>
              <div className="callout-box">
                <strong>Beam Tare Dead Load Compensation</strong>
                <p>
                  A uniform beam of weight W_beam distributes half its mass to each support: R_tare = W_beam / 2. This must be subtracted from raw balance readings.
                </p>
              </div>
              <div className="callout-box">
                <strong>Knife-Edge Frictional Hysteresis</strong>
                <p>
                  Spring dynamometer rack-and-pinion guides introduce mechanical friction. Gently tapping the dial case releases residual friction and centers the pointer.
                </p>
              </div>
            </div>
          </section>

          {/* Theory Module 5: Frequently Asked Questions & Viva Voce */}
          <section className="info-card">
            <h2>5. Technical Viva Voce & Conceptual FAQ</h2>
            <div className="faq-container">
              {[
                {
                  q: "What defines a 'simply supported' beam in real engineering structures?",
                  a: "A simply supported beam rests on a pin support at one end (restraining horizontal and vertical motion) and a roller support at the other (restraining only vertical motion while permitting longitudinal thermal expansion or rotation). This prevents axial stresses from developing due to temperature shifts.",
                },
                {
                  q: "Why is moment taken about one of the support points rather than an arbitrary point?",
                  a: "Taking moments about one unknown reaction (e.g., Support 1) eliminates its moment arm (distance = 0), reducing the equation to a single unknown (R₂). While taking moments about any point on the beam is physically valid, choosing a support point simplifies the algebra.",
                },
                {
                  q: "What is the difference between Newtons (N) and kilograms-force (kgf)?",
                  a: "The Newton (N) is the SI unit of force derived from F = m·a (1 N = 1 kg·m/s²). The kilogram-force (kgf) is a gravitational metric unit representing the force exerted by gravity on a 1 kg mass at standard Earth gravity (1 kgf = 9.80665 N ≈ 9.81 N).",
                },
                {
                  q: "Where does the maximum bending moment occur under two point loads?",
                  a: "The maximum bending moment always occurs directly under one of the applied point loads (either at x = a or x = b), precisely where the shear force diagram crosses the zero axis or changes algebraic sign.",
                },
              ].map((item, idx) => (
                <div key={idx} className="faq-item">
                  <div className="faq-question" onClick={() => toggleFaq(idx)}>
                    <span>{item.q}</span>
                    <span>{openFaq === idx ? "−" : "+"}</span>
                  </div>
                  {openFaq === idx && <div className="faq-answer">{item.a}</div>}
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* 7. Interactive Observation Log Table with CSV Export */}
        <div className="table-panel">
          <div className="table-topbar">
            <div>
              <h3 className="table-title">Experimental Observation Journal</h3>
              <p className="table-subtitle">
                Total Readings Logged: {readings.length} | Fixed Scale Span: 80 cm
              </p>
            </div>
            {readings.length > 0 && (
              <div className="table-actions">
                <button onClick={exportCSV} className="action-btn export">
                  ⬇ Download CSV
                </button>
                <button onClick={() => setReadings([])} className="action-btn clear">
                  Clear All
                </button>
              </div>
            )}
          </div>

          {readings.length === 0 ? (
            <div className="obs-empty">
              No observations recorded yet. Adjust the masses and positions in the <strong>Workbench</strong> above and click <strong>+ Record to Observation Log</strong>.
            </div>
          ) : (
            <div className="obs-table-container">
              <table className="obs-table">
                <thead>
                  <tr>
                    <th>Trial #</th>
                    <th>m₁ (kg)</th>
                    <th>a (cm)</th>
                    <th>m₂ (kg)</th>
                    <th>b (cm)</th>
                    <th>W₁ (N)</th>
                    <th>W₂ (N)</th>
                    <th>Calc R₁ (N / kgf)</th>
                    <th>Calc R₂ (N / kgf)</th>
                    <th>Check (R₁+R₂)</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="table-cell-dim">{readings.length - idx}</td>
                      <td>{row.m1}</td>
                      <td>{row.a}</td>
                      <td>{row.m2}</td>
                      <td>{row.b}</td>
                      <td>{row.W1}</td>
                      <td>{row.W2}</td>
                      <td className="table-cell-cyan">{row.R1} N ({row.R1_kgf})</td>
                      <td className="table-cell-cyan">{row.R2} N ({row.R2_kgf})</td>
                      <td className="table-cell-emerald">
                        {(parseFloat(row.R1) + parseFloat(row.R2)).toFixed(2)} N
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}