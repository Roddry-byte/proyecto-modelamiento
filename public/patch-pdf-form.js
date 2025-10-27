// Patch fino de PDF y formularios
// - Tipografía forzada a Standard fonts (Helvetica) sin UTF-8 extraño
// - Normaliza texto a ASCII básico cuando el renderer no soporte tildes
// - Aumenta padding y líneas para evitar micro-solapamientos
// - Fecha y hora en campos separados y time en HH:mm

(function patchApp(){
  if (!window.app) return;
  const original = app.descargarHistorial.bind(app);

  // Utilidad: normalizar caracteres para evitar símbolos raros en algunos visores PDF
  const normalize = (txt) => {
    if (txt == null) return '';
    try { return String(txt).normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch(e){ return String(txt); }
  };

  app.descargarHistorial = function(){
    if (!window.jspdf) { this.mostrarNotificacion('No se pudo cargar el generador de PDF', 'error'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // Configuración visual
    const margin = 44;
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = margin + 14;
    const lineH = 16; // un poco más alto para evitar roce visual

    const needs = (h)=> y + h > H - margin - 24;
    const newPage = ()=>{ doc.addPage(); y = margin + 14; };

    const hr = ()=>{ doc.setDrawColor(210,210,210); doc.line(margin, y, W-margin, y); y += 12; };
    const title = (t)=>{ if(needs(34)) newPage(); doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(normalize(t), margin, y); y+=20; hr(); };
    const subtitle = (t)=>{ if(needs(26)) newPage(); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(normalize(t), margin, y); y+= lineH; };
    const text = (t)=>{ doc.setFont('helvetica','normal'); doc.setFontSize(10); const lines = doc.splitTextToSize(normalize(t), W - 2*margin); lines.forEach(l=>{ if(needs(lineH)) newPage(); doc.text(l, margin, y); y += lineH; }); };

    const table = (headers, rows, widths)=>{
      if(!rows.length) return;
      // header
      if(needs(30)) newPage();
      doc.setFont('helvetica','bold'); doc.setFontSize(9);
      let x = margin; headers.forEach((h,i)=>{ doc.text(normalize(h), x+3, y); x += widths[i]; }); y += lineH; hr();
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      rows.forEach((row,ri)=>{
        // calcular alto
        let maxLines = 1;
        row.forEach((cell,i)=>{ const w = widths[i]-8; const ls = doc.splitTextToSize(normalize(cell??''), w); maxLines = Math.max(maxLines, ls.length); });
        const rowH = maxLines*lineH + 4;
        if(needs(rowH+8)) { newPage(); // repetir header
          doc.setFont('helvetica','bold'); doc.setFontSize(9);
          let hx = margin; headers.forEach((h,i)=>{ doc.text(normalize(h), hx+3, y); hx += widths[i]; }); y += lineH; hr();
          doc.setFont('helvetica','normal'); doc.setFontSize(9);
        }
        x = margin; const startY = y;
        row.forEach((cell,i)=>{ const w = widths[i]-8; const ls = doc.splitTextToSize(normalize(cell??''), w); ls.forEach((ln,j)=>{ doc.text(ln, x+3, startY + j*lineH); }); x += widths[i]; });
        y += rowH; doc.setDrawColor(240,240,240); doc.line(margin, y-2, W-margin, y-2); y += 2;
      });
      y += 6;
    };

    // Contenido
    title('MiHistorial — Informe Medico Familiar');
    text(`Paciente: ${normalize(this.usuarioActual?.nombre||'')}`);
    text(`Fecha: ${new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}`);
    y += 6;

    subtitle('Resumen');
    const ahora = new Date();
    const citasFuturas = this.citas.filter(c=> new Date(c.fecha) > ahora).length;
    const medsAct = this.medicamentos.filter(m=> !m.fechaFin || new Date(m.fechaFin) >= ahora).length;
    text(`Familia: ${this.familia.length} miembros`);
    text(`Citas futuras: ${citasFuturas}`);
    text(`Medicamentos activos: ${medsAct}`);
    text(`Examenes: ${this.examenes.length}`);

    subtitle('Grupo Familiar');
    table(['Nombre','Parentesco','Edad','Grupo'],
      this.familia.map(m=>[
        m.nombre,
        m.parentesco,
        m.fechaNacimiento? this.calcularEdad(m.fechaNacimiento)+' años':'N/A',
        m.grupoSanguineo||'N/A'
      ]),
      [160,130,80,80]
    );

    subtitle('Citas Medicas');
    const citasData = [...this.citas].sort((a,b)=> new Date(b.fecha)-new Date(a.fecha)).map(c=>[
      c.miembroNombre,
      c.especialidad,
      `Dr. ${c.medico}`,
      this.formatearFechaSolo(c.fecha),
      c.lugar
    ]);
    table(['Paciente','Especialidad','Medico','Fecha','Lugar'], citasData, [120,140,110,90,120]);

    subtitle('Medicamentos');
    const medsData = this.medicamentos.map(m=>[
      m.miembroNombre,
      m.nombre,
      m.dosis,
      (m.horarios||[]).join(', '),
      `${this.formatearFechaSolo(m.fechaInicio)}${m.fechaFin? ' - '+this.formatearFechaSolo(m.fechaFin): ''}`
    ]);
    table(['Paciente','Medicamento','Dosis','Horarios','Vigencia'], medsData, [120,140,100,120,120]);

    subtitle('Examenes');
    const exData = [...this.examenes].sort((a,b)=> new Date(b.fecha)-new Date(a.fecha)).map(e=>[
      e.miembroNombre,
      e.tipo,
      this.formatearFechaSolo(e.fecha),
      e.lugar,
      (e.resultados||'').slice(0,140)
    ]);
    table(['Paciente','Tipo','Fecha','Lugar','Resultados'], exData, [120,120,90,120,140]);

    // Footer paginacion
    const pages = doc.internal.getNumberOfPages();
    for(let i=1;i<=pages;i++){
      doc.setPage(i); doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(`Pagina ${i} de ${pages}`, W - margin - 60, H - 18);
    }

    doc.save(`MiHistorial_${new Date().toISOString().slice(0,10)}.pdf`);
    this.mostrarNotificacion('PDF generado');
  };

  // Campos de fecha/hora separados y time en HH:mm
  const fechaCita = document.getElementById('citaFecha');
  if (fechaCita) {
    // Reemplazar input datetime-local por date + time si existiera
    const parent = fechaCita.parentElement;
    if (fechaCita.type === 'datetime-local') {
      const wrapper = document.createElement('div');
      wrapper.className = 'grid-2';
      const dateI = document.createElement('input'); dateI.type = 'date'; dateI.className='form-control'; dateI.id='citaFechaDia';
      const timeI = document.createElement('input'); timeI.type = 'time'; timeI.step = '60'; timeI.className='form-control'; timeI.id='citaHora';
      wrapper.appendChild(dateI); wrapper.appendChild(timeI);
      parent.replaceChild(wrapper, fechaCita);
    }
  }

  // Guardado de cita usando los nuevos campos si existen
  const originalGuardarCita = app.guardarCita.bind(app);
  app.guardarCita = function(){
    const dia = document.getElementById('citaFechaDia');
    const hora = document.getElementById('citaHora');
    if (dia && hora) {
      const fechaISO = `${dia.value}T${hora.value}:00`;
      const hidden = document.createElement('input'); hidden.type='hidden'; hidden.id='citaFecha'; hidden.value = fechaISO;
      document.getElementById('formCita').appendChild(hidden);
    }
    originalGuardarCita();
  };

})();
