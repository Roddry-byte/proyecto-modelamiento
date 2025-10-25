// ============================================
// APLICACIÓN DE HISTORIAL MÉDICO PERSONAL
// ============================================

const app = {
    // Estado de la aplicación
    usuarioActual: null,
    citas: [],
    medicamentos: [],
    examenes: [],
    familia: [],

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    init() {
        this.verificarSesion();
        this.configurarEventos();
        this.iniciarVerificacionRecordatorios();
    },

    // Verificar si hay sesión activa
    verificarSesion() {
        const usuario = JSON.parse(localStorage.getItem('usuarioActual'));
        if (usuario) {
            this.usuarioActual = usuario;
            this.cargarDatos();
            this.mostrarApp();
            this.actualizarVistas();
        } else {
            this.mostrarAuth();
        }
    },

    // Mostrar pantalla de autenticación
    mostrarAuth() {
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('appScreen').style.display = 'none';
    },

    // Mostrar aplicación
    mostrarApp() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        document.getElementById('userName').textContent = this.usuarioActual.nombre;
    },

    // ============================================
    // AUTENTICACIÓN
    // ============================================
    mostrarLogin() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    },

    mostrarRegistro() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    },

    registrarUsuario(nombre, email, password, rol) {
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

        if (usuarios.find(u => u.email === email)) {
            this.mostrarNotificacion('El email ya está registrado', 'error');
            return false;
        }

        const nuevoUsuario = {
            id: Date.now(),
            nombre,
            email,
            password,
            rol,
            fechaRegistro: new Date().toISOString()
        };

        usuarios.push(nuevoUsuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));

        this.mostrarNotificacion('Cuenta creada exitosamente');
        this.mostrarLogin();
        return true;
    },

    iniciarSesion(email, password) {
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const usuario = usuarios.find(u => u.email === email && u.password === password);

        if (usuario) {
            this.usuarioActual = usuario;
            localStorage.setItem('usuarioActual', JSON.stringify(usuario));
            this.cargarDatos();
            this.mostrarApp();
            this.actualizarVistas();
            this.mostrarNotificacion('Bienvenido ' + usuario.nombre);
        } else {
            this.mostrarNotificacion('Email o contraseña incorrectos', 'error');
        }
    },

    cerrarSesion() {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            localStorage.removeItem('usuarioActual');
            this.usuarioActual = null;
            this.citas = [];
            this.medicamentos = [];
            this.examenes = [];
            this.familia = [];
            this.mostrarAuth();
            this.mostrarNotificacion('Sesión cerrada');
        }
    },

    // ============================================
    // GESTIÓN DE DATOS
    // ============================================
    cargarDatos() {
        const userId = this.usuarioActual.id;
        this.citas = JSON.parse(localStorage.getItem(`citas_${userId}`)) || [];
        this.medicamentos = JSON.parse(localStorage.getItem(`medicamentos_${userId}`)) || [];
        this.examenes = JSON.parse(localStorage.getItem(`examenes_${userId}`)) || [];
        this.familia = JSON.parse(localStorage.getItem(`familia_${userId}`)) || [];

        if (this.familia.length === 0) {
            this.familia.push({
                id: Date.now(),
                nombre: this.usuarioActual.nombre,
                parentesco: 'Usuario Principal',
                fechaNacimiento: '',
                grupoSanguineo: '',
                esPrincipal: true
            });
            this.guardarDatos();
        }
    },

    guardarDatos() {
        const userId = this.usuarioActual.id;
        localStorage.setItem(`citas_${userId}`, JSON.stringify(this.citas));
        localStorage.setItem(`medicamentos_${userId}`, JSON.stringify(this.medicamentos));
        localStorage.setItem(`examenes_${userId}`, JSON.stringify(this.examenes));
        localStorage.setItem(`familia_${userId}`, JSON.stringify(this.familia));
    },

    // ============================================
    // CONFIGURACIÓN DE EVENTOS
    // ============================================
    configurarEventos() {
        // Navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.cambiarSeccion(section);
            });
        });

        // Formulario de login
        document.getElementById('formLogin').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            this.iniciarSesion(email, password);
        });

        // Formulario de registro
        document.getElementById('formRegister').addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('registerNombre').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const rol = document.getElementById('registerRol').value;

            if (password.length < 6) {
                this.mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }

            this.registrarUsuario(nombre, email, password, rol);
        });

        // Formulario de citas
        document.getElementById('formCita').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarCita();
        });

        // Formulario de medicamentos
        document.getElementById('formMedicamento').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarMedicamento();
        });

        // Formulario de exámenes
        document.getElementById('formExamen').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarExamen();
        });

        // Formulario de miembros familiares
        document.getElementById('formMiembro').addEventListener('submit', (e) => {
            e.preventDefault();
            this.agregarMiembro();
        });

        // Cerrar modal al hacer clic fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.cerrarModal(modal.id);
                }
            });
        });
    },

    // ============================================
    // NAVEGACIÓN
    // ============================================
    cambiarSeccion(seccionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        document.getElementById(seccionId).classList.add('active');
        document.querySelector(`[data-section="${seccionId}"]`).classList.add('active');
    },

    // ============================================
    // MODALES
    // ============================================
    mostrarModal(modalId) {
        this.actualizarSelectoresMiembros();
        document.getElementById(modalId).classList.add('active');
    },

    cerrarModal(modalId) {
        document.getElementById(modalId).classList.remove('active');

        const formIds = {
            'modalCita': 'formCita',
            'modalMedicamento': 'formMedicamento',
            'modalExamen': 'formExamen',
            'modalMiembro': 'formMiembro'
        };

        if (formIds[modalId]) {
            document.getElementById(formIds[modalId]).reset();
            // Limpiar campos ocultos de ID
            const idFields = ['citaId', 'medId', 'examenId'];
            idFields.forEach(field => {
                const input = document.getElementById(field);
                if (input) input.value = '';
            });
            // Restaurar títulos
            this.restaurarTitulosModales();
        }
    },

    restaurarTitulosModales() {
        const titulos = {
            'tituloModalCita': 'Nueva Cita Médica',
            'tituloModalMedicamento': 'Nuevo Medicamento',
            'tituloModalExamen': 'Nuevo Examen Médico'
        };

        Object.entries(titulos).forEach(([id, texto]) => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.textContent = texto;
        });
    },

    actualizarSelectoresMiembros() {
        const selectores = ['citaMiembro', 'medMiembro', 'examenMiembro'];

        selectores.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (select) {
                select.innerHTML = '<option value="">Seleccionar...</option>';
                this.familia.forEach(miembro => {
                    const option = document.createElement('option');
                    option.value = miembro.id;
                    option.textContent = `${miembro.nombre} (${miembro.parentesco})`;
                    select.appendChild(option);
                });
            }
        });
    },

    // ============================================
    // GESTIÓN DE CITAS (CON EDICIÓN)
    // ============================================
    guardarCita() {
        const id = document.getElementById('citaId').value;
        const citaData = {
            miembroId: document.getElementById('citaMiembro').value,
            miembroNombre: this.obtenerNombreMiembro(document.getElementById('citaMiembro').value),
            especialidad: document.getElementById('citaEspecialidad').value,
            medico: document.getElementById('citaMedico').value,
            fecha: document.getElementById('citaFecha').value,
            lugar: document.getElementById('citaLugar').value,
            diagnostico: document.getElementById('citaDiagnostico').value || ''
        };

        if (id) {
            // Editar cita existente
            const index = this.citas.findIndex(c => c.id == id);
            if (index !== -1) {
                this.citas[index] = { ...this.citas[index], ...citaData };
                this.mostrarNotificacion('Cita actualizada correctamente');
            }
        } else {
            // Nueva cita
            this.citas.push({ id: Date.now(), ...citaData });
            this.mostrarNotificacion('Cita agregada correctamente');
        }

        this.guardarDatos();
        this.actualizarVistas();
        this.cerrarModal('modalCita');
    },

    editarCita(id) {
        const cita = this.citas.find(c => c.id === id);
        if (!cita) return;

        document.getElementById('citaId').value = cita.id;
        document.getElementById('citaMiembro').value = cita.miembroId;
        document.getElementById('citaEspecialidad').value = cita.especialidad;
        document.getElementById('citaMedico').value = cita.medico;
        document.getElementById('citaFecha').value = cita.fecha;
        document.getElementById('citaLugar').value = cita.lugar;
        document.getElementById('citaDiagnostico').value = cita.diagnostico || '';

        document.getElementById('tituloModalCita').textContent = 'Editar Cita Médica';
        this.mostrarModal('modalCita');
    },

    eliminarCita(id) {
        if (confirm('¿Estás seguro de eliminar esta cita?')) {
            this.citas = this.citas.filter(c => c.id !== id);
            this.guardarDatos();
            this.actualizarVistas();
            this.mostrarNotificacion('Cita eliminada');
        }
    },

    renderizarCitas() {
        const container = document.getElementById('listaCitas');

        if (this.citas.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay citas registradas</div>';
            return;
        }

        const citasOrdenadas = [...this.citas].sort((a, b) =>
            new Date(b.fecha) - new Date(a.fecha)
        );

        container.innerHTML = citasOrdenadas.map(cita => `
      <div class="list-item">
        <div class="list-item-content">
          <h4>${cita.especialidad}</h4>
          <p><strong>Paciente:</strong> ${cita.miembroNombre}</p>
          <p><strong>Médico:</strong> ${cita.medico}</p>
          <p><strong>Fecha:</strong> ${this.formatearFecha(cita.fecha)}</p>
          <p><strong>Lugar:</strong> ${cita.lugar}</p>
          ${cita.diagnostico ? `<p><strong>Diagnóstico:</strong> ${cita.diagnostico}</p>` : ''}
        </div>
        <div class="list-item-actions">
          <button class="btn btn--warning btn--sm" onclick="app.editarCita(${cita.id})">✏️ Editar</button>
          <button class="btn btn--danger btn--sm" onclick="app.eliminarCita(${cita.id})">🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');
    },

    // ============================================
    // GESTIÓN DE MEDICAMENTOS (CON EDICIÓN)
    // ============================================
    guardarMedicamento() {
        const id = document.getElementById('medId').value;
        const horariosTexto = document.getElementById('medHorarios').value;
        const horarios = horariosTexto.split(',').map(h => h.trim());

        const medData = {
            miembroId: document.getElementById('medMiembro').value,
            miembroNombre: this.obtenerNombreMiembro(document.getElementById('medMiembro').value),
            nombre: document.getElementById('medNombre').value,
            dosis: document.getElementById('medDosis').value,
            horarios: horarios,
            fechaInicio: document.getElementById('medFechaInicio').value,
            fechaFin: document.getElementById('medFechaFin').value || null
        };

        if (id) {
            // Editar medicamento existente
            const index = this.medicamentos.findIndex(m => m.id == id);
            if (index !== -1) {
                this.medicamentos[index] = { ...this.medicamentos[index], ...medData };
                this.mostrarNotificacion('Medicamento actualizado correctamente');
            }
        } else {
            // Nuevo medicamento
            this.medicamentos.push({ id: Date.now(), ...medData });
            this.mostrarNotificacion('Medicamento agregado correctamente');
        }

        this.guardarDatos();
        this.actualizarVistas();
        this.cerrarModal('modalMedicamento');
    },

    editarMedicamento(id) {
        const med = this.medicamentos.find(m => m.id === id);
        if (!med) return;

        document.getElementById('medId').value = med.id;
        document.getElementById('medMiembro').value = med.miembroId;
        document.getElementById('medNombre').value = med.nombre;
        document.getElementById('medDosis').value = med.dosis;
        document.getElementById('medHorarios').value = med.horarios.join(', ');
        document.getElementById('medFechaInicio').value = med.fechaInicio;
        document.getElementById('medFechaFin').value = med.fechaFin || '';

        document.getElementById('tituloModalMedicamento').textContent = 'Editar Medicamento';
        this.mostrarModal('modalMedicamento');
    },

    eliminarMedicamento(id) {
        if (confirm('¿Estás seguro de eliminar este medicamento?')) {
            this.medicamentos = this.medicamentos.filter(m => m.id !== id);
            this.guardarDatos();
            this.actualizarVistas();
            this.mostrarNotificacion('Medicamento eliminado');
        }
    },

    renderizarMedicamentos() {
        const container = document.getElementById('listaMedicamentos');

        if (this.medicamentos.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay medicamentos registrados</div>';
            return;
        }

        container.innerHTML = this.medicamentos.map(med => `
      <div class="list-item">
        <div class="list-item-content">
          <h4>${med.nombre}</h4>
          <p><strong>Paciente:</strong> ${med.miembroNombre}</p>
          <p><strong>Dosis:</strong> ${med.dosis}</p>
          <p><strong>Horarios:</strong> ${med.horarios.join(', ')}</p>
          <p><strong>Inicio:</strong> ${this.formatearFechaSolo(med.fechaInicio)}</p>
          ${med.fechaFin ? `<p><strong>Fin:</strong> ${this.formatearFechaSolo(med.fechaFin)}</p>` : ''}
        </div>
        <div class="list-item-actions">
          <button class="btn btn--warning btn--sm" onclick="app.editarMedicamento(${med.id})">✏️ Editar</button>
          <button class="btn btn--danger btn--sm" onclick="app.eliminarMedicamento(${med.id})">🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');
    },

    // ============================================
    // GESTIÓN DE EXÁMENES (CON EDICIÓN)
    // ============================================
    guardarExamen() {
        const id = document.getElementById('examenId').value;
        const examenData = {
            miembroId: document.getElementById('examenMiembro').value,
            miembroNombre: this.obtenerNombreMiembro(document.getElementById('examenMiembro').value),
            tipo: document.getElementById('examenTipo').value,
            fecha: document.getElementById('examenFecha').value,
            lugar: document.getElementById('examenLugar').value,
            resultados: document.getElementById('examenResultados').value || ''
        };

        if (id) {
            // Editar examen existente
            const index = this.examenes.findIndex(e => e.id == id);
            if (index !== -1) {
                this.examenes[index] = { ...this.examenes[index], ...examenData };
                this.mostrarNotificacion('Examen actualizado correctamente');
            }
        } else {
            // Nuevo examen
            this.examenes.push({ id: Date.now(), ...examenData });
            this.mostrarNotificacion('Examen agregado correctamente');
        }

        this.guardarDatos();
        this.actualizarVistas();
        this.cerrarModal('modalExamen');
    },

    editarExamen(id) {
        const examen = this.examenes.find(e => e.id === id);
        if (!examen) return;

        document.getElementById('examenId').value = examen.id;
        document.getElementById('examenMiembro').value = examen.miembroId;
        document.getElementById('examenTipo').value = examen.tipo;
        document.getElementById('examenFecha').value = examen.fecha;
        document.getElementById('examenLugar').value = examen.lugar;
        document.getElementById('examenResultados').value = examen.resultados || '';

        document.getElementById('tituloModalExamen').textContent = 'Editar Examen Médico';
        this.mostrarModal('modalExamen');
    },

    eliminarExamen(id) {
        if (confirm('¿Estás seguro de eliminar este examen?')) {
            this.examenes = this.examenes.filter(e => e.id !== id);
            this.guardarDatos();
            this.actualizarVistas();
            this.mostrarNotificacion('Examen eliminado');
        }
    },

    renderizarExamenes() {
        const container = document.getElementById('listaExamenes');

        if (this.examenes.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay exámenes registrados</div>';
            return;
        }

        const examenesOrdenados = [...this.examenes].sort((a, b) =>
            new Date(b.fecha) - new Date(a.fecha)
        );

        container.innerHTML = examenesOrdenados.map(examen => `
      <div class="list-item">
        <div class="list-item-content">
          <h4>${examen.tipo}</h4>
          <p><strong>Paciente:</strong> ${examen.miembroNombre}</p>
          <p><strong>Fecha:</strong> ${this.formatearFechaSolo(examen.fecha)}</p>
          <p><strong>Lugar:</strong> ${examen.lugar}</p>
          ${examen.resultados ? `<p><strong>Resultados:</strong> ${examen.resultados}</p>` : ''}
        </div>
        <div class="list-item-actions">
          <button class="btn btn--warning btn--sm" onclick="app.editarExamen(${examen.id})">✏️ Editar</button>
          <button class="btn btn--danger btn--sm" onclick="app.eliminarExamen(${examen.id})">🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');
    },

    // ============================================
    // GESTIÓN DE FAMILIA
    // ============================================
    agregarMiembro() {
        const miembro = {
            id: Date.now(),
            nombre: document.getElementById('miembroNombre').value,
            parentesco: document.getElementById('miembroParentesco').value,
            fechaNacimiento: document.getElementById('miembroFechaNac').value,
            grupoSanguineo: document.getElementById('miembroGrupoSanguineo').value || '',
            esPrincipal: false
        };

        this.familia.push(miembro);
        this.guardarDatos();
        this.actualizarVistas();
        this.cerrarModal('modalMiembro');
        this.mostrarNotificacion('Miembro agregado correctamente');
    },

    eliminarMiembro(id) {
        const miembro = this.familia.find(m => m.id === id);

        if (miembro && miembro.esPrincipal) {
            this.mostrarNotificacion('No puedes eliminar el usuario principal', 'error');
            return;
        }

        if (confirm('¿Estás seguro de eliminar este miembro?')) {
            this.familia = this.familia.filter(m => m.id !== id);
            this.guardarDatos();
            this.actualizarVistas();
            this.mostrarNotificacion('Miembro eliminado');
        }
    },

    renderizarFamilia() {
        const container = document.getElementById('listaFamilia');

        if (this.familia.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay miembros registrados</div>';
            return;
        }

        container.innerHTML = this.familia.map(miembro => {
            const edad = miembro.fechaNacimiento ? this.calcularEdad(miembro.fechaNacimiento) : '';

            return `
        <div class="list-item">
          <div class="list-item-content">
            <h4>${miembro.nombre} ${miembro.esPrincipal ? '⭐' : ''}</h4>
            <p><strong>Parentesco:</strong> ${miembro.parentesco}</p>
            ${edad ? `<p><strong>Edad:</strong> ${edad} años</p>` : ''}
            ${miembro.grupoSanguineo ? `<p><strong>Grupo Sanguíneo:</strong> ${miembro.grupoSanguineo}</p>` : ''}
            ${miembro.esPrincipal ? '<span class="member-badge">Usuario Principal</span>' : ''}
          </div>
          <div class="list-item-actions">
            ${!miembro.esPrincipal ? `<button class="btn btn--danger btn--sm" onclick="app.eliminarMiembro(${miembro.id})">🗑️ Eliminar</button>` : ''}
          </div>
        </div>
      `;
        }).join('');
    },

    calcularEdad(fechaNacimiento) {
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    },

    obtenerNombreMiembro(miembroId) {
        const miembro = this.familia.find(m => m.id == miembroId);
        return miembro ? miembro.nombre : 'Desconocido';
    },

    // ============================================
    // CARDS CLICKEABLES CON MODAL DE DETALLE
    // ============================================
    verDetalleCard(tipo) {
        let titulo = '';
        let contenido = '';

        switch (tipo) {
            case 'citas':
                titulo = 'Todas las Citas Médicas';
                const ahora = new Date();
                const citasProximas = this.citas.filter(c => new Date(c.fecha) > ahora)
                    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

                if (citasProximas.length === 0) {
                    contenido = '<div class="empty-state">No hay citas próximas programadas</div>';
                } else {
                    contenido = citasProximas.map(cita => `
            <div class="recordatorio-item">
              <div class="recordatorio-icon">📅</div>
              <div class="recordatorio-content">
                <strong>${cita.especialidad}</strong>
                <p>${cita.miembroNombre} - Dr. ${cita.medico}</p>
                <p><small>${this.formatearFecha(cita.fecha)}</small></p>
                <p><small>📍 ${cita.lugar}</small></p>
              </div>
            </div>
          `).join('');
                }
                break;

            case 'medicamentos':
                titulo = 'Medicamentos Activos';
                const medicamentosActivos = this.medicamentos.filter(m => {
                    if (!m.fechaFin) return true;
                    return new Date(m.fechaFin) >= new Date();
                });

                if (medicamentosActivos.length === 0) {
                    contenido = '<div class="empty-state">No hay medicamentos activos</div>';
                } else {
                    contenido = medicamentosActivos.map(med => `
            <div class="recordatorio-item">
              <div class="recordatorio-icon">💊</div>
              <div class="recordatorio-content">
                <strong>${med.nombre}</strong>
                <p>${med.miembroNombre}</p>
                <p><small>💉 ${med.dosis}</small></p>
                <p><small>🕐 ${med.horarios.join(', ')}</small></p>
              </div>
            </div>
          `).join('');
                }
                break;

            case 'examenes':
                titulo = 'Exámenes Médicos';
                const examenesRecientes = [...this.examenes]
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .slice(0, 10);

                if (examenesRecientes.length === 0) {
                    contenido = '<div class="empty-state">No hay exámenes registrados</div>';
                } else {
                    contenido = examenesRecientes.map(examen => `
            <div class="recordatorio-item">
              <div class="recordatorio-icon">🔬</div>
              <div class="recordatorio-content">
                <strong>${examen.tipo}</strong>
                <p>${examen.miembroNombre}</p>
                <p><small>📅 ${this.formatearFechaSolo(examen.fecha)}</small></p>
                <p><small>📍 ${examen.lugar}</small></p>
                ${examen.resultados ? `<p><small>📋 ${examen.resultados}</small></p>` : ''}
              </div>
            </div>
          `).join('');
                }
                break;

            case 'familia':
                titulo = 'Grupo Familiar';
                contenido = this.familia.map(miembro => {
                    const edad = miembro.fechaNacimiento ? this.calcularEdad(miembro.fechaNacimiento) : '';
                    return `
            <div class="recordatorio-item">
              <div class="recordatorio-icon">👤</div>
              <div class="recordatorio-content">
                <strong>${miembro.nombre} ${miembro.esPrincipal ? '⭐' : ''}</strong>
                <p>${miembro.parentesco}</p>
                ${edad ? `<p><small>🎂 ${edad} años</small></p>` : ''}
                ${miembro.grupoSanguineo ? `<p><small>🩸 ${miembro.grupoSanguineo}</small></p>` : ''}
              </div>
            </div>
          `;
                }).join('');
                break;
        }

        document.getElementById('tituloDetalleCard').textContent = titulo;
        document.getElementById('contenidoDetalleCard').innerHTML = contenido;
        this.mostrarModal('modalDetalleCard');
    },

    // ============================================
    // ACTUALIZACIÓN DE VISTAS
    // ============================================
    actualizarVistas() {
        this.actualizarEstadisticas();
        this.renderizarCitas();
        this.renderizarMedicamentos();
        this.renderizarExamenes();
        this.renderizarFamilia();
        this.renderizarRecordatoriosHoy();
        this.renderizarProximasCitas();
    },

    actualizarEstadisticas() {
        const ahora = new Date();
        const citasProximas = this.citas.filter(c => new Date(c.fecha) > ahora).length;
        const medicamentosActivos = this.medicamentos.filter(m => {
            if (!m.fechaFin) return true;
            return new Date(m.fechaFin) >= ahora;
        }).length;
        const recordatoriosHoy = this.obtenerRecordatoriosHoy().length;

        document.getElementById('statCitas').textContent = citasProximas;
        document.getElementById('statMedicamentos').textContent = medicamentosActivos;
        document.getElementById('statRecordatorios').textContent = recordatoriosHoy;

        const statExamenes = document.getElementById('statExamenes');
        if (statExamenes) statExamenes.textContent = this.examenes.length;

        const statFamilia = document.getElementById('statFamilia');
        if (statFamilia) statFamilia.textContent = this.familia.length;
    },

    // ============================================
    // RECORDATORIOS
    // ============================================
    obtenerRecordatoriosHoy() {
        const ahora = new Date();
        const recordatorios = [];

        this.medicamentos.forEach(med => {
            if (med.fechaFin && new Date(med.fechaFin) < ahora) return;
            if (new Date(med.fechaInicio) > ahora) return;

            med.horarios.forEach(horario => {
                const [hora, minuto] = horario.split(':');
                const fechaHora = new Date(ahora);
                fechaHora.setHours(parseInt(hora), parseInt(minuto), 0, 0);

                recordatorios.push({
                    medicamento: med.nombre,
                    paciente: med.miembroNombre,
                    hora: horario,
                    fechaHora: fechaHora,
                    activo: this.estaEnRangoRecordatorio(fechaHora)
                });
            });
        });

        return recordatorios.sort((a, b) => a.fechaHora - b.fechaHora);
    },

    estaEnRangoRecordatorio(fechaHora) {
        const ahora = new Date();
        const diferencia = Math.abs(ahora - fechaHora) / 1000 / 60;
        return diferencia <= 15;
    },

    renderizarRecordatoriosHoy() {
        const container = document.getElementById('recordatoriosHoy');
        const recordatorios = this.obtenerRecordatoriosHoy();

        if (recordatorios.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay recordatorios para hoy</div>';
            return;
        }

        container.innerHTML = recordatorios.map(rec => `
      <div class="recordatorio-item ${rec.activo ? 'activo' : ''}">
        <div class="recordatorio-icon">💊</div>
        <div class="recordatorio-content">
          <strong>${rec.medicamento}</strong>
          <p>${rec.paciente} - ${rec.hora} ${rec.activo ? '- ¡Es hora de tomar el medicamento!' : ''}</p>
        </div>
      </div>
    `).join('');
    },

    renderizarProximasCitas() {
        const container = document.getElementById('proximasCitas');
        const ahora = new Date();
        const proximasCitas = this.citas
            .filter(c => new Date(c.fecha) > ahora)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .slice(0, 5);

        if (proximasCitas.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay próximas citas</div>';
            return;
        }

        container.innerHTML = proximasCitas.map(cita => `
      <div class="recordatorio-item">
        <div class="recordatorio-icon">📅</div>
        <div class="recordatorio-content">
          <strong>${cita.especialidad}</strong>
          <p>${cita.miembroNombre} - ${this.formatearFecha(cita.fecha)}</p>
        </div>
      </div>
    `).join('');
    },

    iniciarVerificacionRecordatorios() {
        setInterval(() => {
            this.verificarRecordatorios();
        }, 60000);
        this.verificarRecordatorios();
    },

    verificarRecordatorios() {
        if (!this.usuarioActual) return;

        const recordatorios = this.obtenerRecordatoriosHoy();
        const activos = recordatorios.filter(r => r.activo);

        if (activos.length > 0) {
            this.actualizarVistas();
        }
    },

    // ============================================
    // DESCARGAR HISTORIAL
    // ============================================
    descargarHistorial() {
        const historial = {
            usuario: this.usuarioActual.nombre,
            fechaExportacion: new Date().toISOString(),
            familia: this.familia,
            citas: this.citas,
            medicamentos: this.medicamentos,
            examenes: this.examenes
        };

        const dataStr = JSON.stringify(historial, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historial_medico_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.mostrarNotificacion('Historial descargado correctamente');
    },

    // ============================================
    // UTILIDADES
    // ============================================
    mostrarNotificacion(mensaje, tipo = 'success') {
        const notif = document.getElementById('notificacion');
        notif.textContent = mensaje;

        if (tipo === 'error') {
            notif.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        } else {
            notif.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        }

        notif.classList.add('show');

        setTimeout(() => {
            notif.classList.remove('show');
        }, 3000);
    },

    formatearFecha(fechaStr) {
        const fecha = new Date(fechaStr);
        const opciones = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return fecha.toLocaleDateString('es-ES', opciones);
    },

    formatearFechaSolo(fechaStr) {
        const fecha = new Date(fechaStr + 'T00:00:00');
        const opciones = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return fecha.toLocaleDateString('es-ES', opciones);
    }
};

// ============================================
// INICIALIZAR APLICACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
