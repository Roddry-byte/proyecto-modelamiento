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
            this.guardarMiembro();
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
    // NAVEGACIÓN CORREGIDA
    // ============================================
    cambiarSeccion(seccionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        document.getElementById(seccionId).classList.add('active');
        document.querySelector(`[data-section="${seccionId}"]`).classList.add('active');

        // CORRECCIÓN: Forzar renderizado al entrar a la sección
        setTimeout(() => {
            switch (seccionId) {
                case 'citas':
                    this.renderizarCitas();
                    break;
                case 'medicamentos':
                    this.renderizarMedicamentos();
                    break;
                case 'examenes':
                    this.renderizarExamenes();
                    break;
                case 'familia':
                    this.renderizarFamilia();
                    break;
            }
        }, 50);
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
            const idFields = ['citaId', 'medId', 'examenId', 'miembroId'];
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
            'tituloModalExamen': 'Nuevo Examen Médico',
            'tituloModalMiembro': 'Agregar Miembro Familiar'
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
        if (!container) return;

        if (this.citas.length === 0) {
            container.innerHTML = `
              <div class="empty-state">
                <p>No hay citas registradas</p>
                <div style="margin-top: 12px;">
                  <button class="btn btn--primary" onclick="app.mostrarModal('modalCita')">+ Nueva Cita</button>
                </div>
              </div>`;
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
        if (!container) return;

        if (this.medicamentos.length === 0) {
            container.innerHTML = `
              <div class="empty-state">
                <p>No hay medicamentos registrados</p>
                <div style="margin-top: 12px;">
                  <button class="btn btn--primary" onclick="app.mostrarModal('modalMedicamento')">+ Nuevo Medicamento</button>
                </div>
              </div>`;
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
        if (!container) return;

        if (this.examenes.length === 0) {
            container.innerHTML = `
              <div class="empty-state">
                <p>No hay exámenes registrados</p>
                <div style="margin-top: 12px;">
                  <button class="btn btn--primary" onclick="app.mostrarModal('modalExamen')">+ Nuevo Examen</button>
                </div>
              </div>`;
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
    // GESTIÓN DE FAMILIA (CON EDICIÓN COMPLETA)
    // ============================================
    guardarMiembro() {
        const id = document.getElementById('miembroId').value;
        const miembroData = {
            nombre: document.getElementById('miembroNombre').value,
            parentesco: document.getElementById('miembroParentesco').value,
            fechaNacimiento: document.getElementById('miembroFechaNac').value,
            grupoSanguineo: document.getElementById('miembroGrupoSanguineo').value || '',
            esPrincipal: false
        };

        if (id) {
            // Editar miembro existente
            const index = this.familia.findIndex(m => m.id == id);
            if (index !== -1) {
                // Mantener propiedades importantes
                this.familia[index] = {
                    ...this.familia[index],
                    ...miembroData,
                    esPrincipal: this.familia[index].esPrincipal // Mantener estado principal
                };

                // Si es el usuario principal, actualizar también el nombre en la sesión
                if (this.familia[index].esPrincipal) {
                    this.usuarioActual.nombre = miembroData.nombre;
                    localStorage.setItem('usuarioActual', JSON.stringify(this.usuarioActual));
                    document.getElementById('userName').textContent = this.usuarioActual.nombre;

                    // Actualizar también en la lista de usuarios
                    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
                    const indexUsuario = usuarios.findIndex(u => u.id === this.usuarioActual.id);
                    if (indexUsuario !== -1) {
                        usuarios[indexUsuario].nombre = miembroData.nombre;
                        localStorage.setItem('usuarios', JSON.stringify(usuarios));
                    }
                }

                this.mostrarNotificacion('Datos actualizados correctamente');
            }
        } else {
            // Nuevo miembro
            this.familia.push({ id: Date.now(), ...miembroData });
            this.mostrarNotificacion('Miembro agregado correctamente');
        }

        this.guardarDatos();
        this.actualizarVistas();
        this.cerrarModal('modalMiembro');
    },

    editarMiembro(id) {
        const miembro = this.familia.find(m => m.id === id);
        if (!miembro) return;

        document.getElementById('miembroId').value = miembro.id;
        document.getElementById('miembroNombre').value = miembro.nombre;
        document.getElementById('miembroParentesco').value = miembro.parentesco;
        document.getElementById('miembroFechaNac').value = miembro.fechaNacimiento;
        document.getElementById('miembroGrupoSanguineo').value = miembro.grupoSanguineo || '';

        const titulo = miembro.esPrincipal ? 'Editar Mis Datos' : 'Editar Miembro Familiar';
        document.getElementById('tituloModalMiembro').textContent = titulo;

        // Cambiar texto del botón si está editando
        const submitBtn = document.querySelector('#formMiembro button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Guardar Cambios';

        this.mostrarModal('modalMiembro');
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
        if (!container) return;

        if (this.familia.length === 0) {
            container.innerHTML = `
              <div class="empty-state">
                <p>No hay miembros registrados</p>
                <div style="margin-top: 12px;">
                  <button class="btn btn--primary" onclick="app.mostrarModal('modalMiembro')">+ Agregar Miembro</button>
                </div>
              </div>`;
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
            <button class="btn btn--warning btn--sm" onclick="app.editarMiembro(${miembro.id})">✏️ Editar</button>
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

        const statCitas = document.getElementById('statCitas');
        const statMedicamentos = document.getElementById('statMedicamentos');
        const statExamenes = document.getElementById('statExamenes');
        const statFamilia = document.getElementById('statFamilia');

        if (statCitas) statCitas.textContent = citasProximas;
        if (statMedicamentos) statMedicamentos.textContent = medicamentosActivos;
        if (statExamenes) statExamenes.textContent = this.examenes.length;
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
        if (!container) return;

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
        if (!container) return;

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
    // GENERAR PDF PROFESIONAL COMO LA IMAGEN - CORREGIDO
    // ============================================
    descargarHistorial() {
        const ICONO_CARDIACO = 'data:image/png;base64,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';
        try {
            if (!window.jspdf) {
                this.mostrarNotificacion('No se pudo cargar el generador de PDF', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });

            // Configuración de diseño profesional médico
            const margin = 50;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let y = margin + 30;
            const lineHeight = 16;
            const sectionSpacing = 20;
            const titleColor = '#2563eb';  // Azul profesional
            const textColor = '#374151';   // Gris oscuro
            const lightGray = '#6b7280';   // Gris claro

            // Helper: verificar si necesita nueva página
            const needsNewPage = (additionalHeight) => {
                return y + additionalHeight > pageHeight - margin - 40;
            };

            // Helper: agregar nueva página
            const addNewPage = () => {
                doc.addPage();
                y = margin + 30;
            };

            const addMedicalIcon = (x, yPos) => {
                doc.addImage(
                    ICONO_CARDIACO, // tu dataURL aquí (asegúrate de que sea PNG, no SVG)
                    'PNG',
                    x+10,
                    yPos-7,
                    43, // ancho en puntos (ajusta si quieres)
                    43  // alto en puntos
                );
            };

            // ENCABEZADO PRINCIPAL COMO EN LA IMAGEN
            addMedicalIcon(margin, y - 10);

            // Título principal
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(titleColor);
            doc.text('MiSalud — Informe Médico Familiar', margin + 60, y + 15);

            y += 40;

            // Información del paciente y fecha
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(textColor);
            doc.text(`Paciente: ${this.usuarioActual.nombre}`, margin, y);

            const fechaActual = new Date().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            doc.text(`Fecha: ${fechaActual}`, margin, y + lineHeight);

            y += 40;

            // SECCIÓN RESUMEN (como en la imagen)
            if (needsNewPage(80)) addNewPage();

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(textColor);
            doc.text('Resumen', margin, y);
            y += 25;

            // Estadísticas del resumen
            const ahora = new Date();
            const citasFuturas = this.citas.filter(c => new Date(c.fecha) > ahora).length;
            const medicamentosActivos = this.medicamentos.filter(m => !m.fechaFin || new Date(m.fechaFin) >= ahora).length;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(`Familia: ${this.familia.length} miembros`, margin, y);
            doc.text(`Citas futuras: ${citasFuturas}`, margin, y + lineHeight);
            doc.text(`Medicamentos activos: ${medicamentosActivos}`, margin, y + lineHeight * 2);
            doc.text(`Exámenes: ${this.examenes.length}`, margin, y + lineHeight * 3);

            y += lineHeight * 4 + sectionSpacing;

            // GRUPO FAMILIAR (tabla como en la imagen)
            if (needsNewPage(100)) addNewPage();

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(textColor);
            doc.text('Grupo Familiar', margin, y);
            y += 25;

            if (this.familia.length > 0) {
                // Cabeceras de tabla
                const colWidths = [140, 120, 80, 100];
                const headers = ['Nombre', 'Parentesco', 'Edad', 'Grupo'];

                // Fondo gris para cabeceras
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y - 5, pageWidth - margin * 2, 25, 'F');

                // Línea superior
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(1);
                doc.line(margin, y - 5, pageWidth - margin, y - 5);

                // Texto de cabeceras
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(textColor);
                let x = margin + 5;
                headers.forEach((header, i) => {
                    doc.text(header, x, y + 8);
                    x += colWidths[i];
                });

                y += 20;

                // Línea separadora
                doc.line(margin, y, pageWidth - margin, y);
                y += 10;

                // Datos de familia
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(textColor);

                this.familia.forEach((miembro, index) => {
                    if (needsNewPage(25)) {
                        addNewPage();
                        // Repetir cabeceras si hay nueva página
                    }

                    const edad = miembro.fechaNacimiento ? `${this.calcularEdad(miembro.fechaNacimiento)} años` : 'N/A';
                    const datos = [
                        miembro.nombre,
                        miembro.parentesco,
                        edad,
                        miembro.grupoSanguineo || 'N/A'
                    ];

                    x = margin + 5;
                    datos.forEach((dato, i) => {
                        doc.text(String(dato), x, y);
                        x += colWidths[i];
                    });

                    y += lineHeight;

                    // Línea separadora sutil entre filas
                    if (index < this.familia.length - 1) {
                        doc.setDrawColor(240, 240, 240);
                        doc.line(margin, y + 2, pageWidth - margin, y + 2);
                    }
                });

                y += sectionSpacing;
            }

            // CITAS MÉDICAS
            if (this.citas.length > 0) {
                if (needsNewPage(100)) addNewPage();

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.setTextColor(textColor);
                doc.text('Citas Médicas', margin, y);
                y += 25;

                // Tabla de citas
                const citasColWidths = [90, 110, 100, 80, 100];
                const citasHeaders = ['Paciente', 'Especialidad', 'Médico', 'Fecha', 'Lugar'];

                // Cabeceras
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y - 5, pageWidth - margin * 2, 25, 'F');
                doc.setDrawColor(203, 213, 225);
                doc.line(margin, y - 5, pageWidth - margin, y - 5);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                let x = margin + 5;
                citasHeaders.forEach((header, i) => {
                    doc.text(header, x, y + 8);
                    x += citasColWidths[i];
                });

                y += 20;
                doc.line(margin, y, pageWidth - margin, y);
                y += 10;

                // Datos de citas ordenadas por fecha
                const citasOrdenadas = [...this.citas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

                doc.setFont('helvetica', 'normal');
                citasOrdenadas.forEach(cita => {
                    if (needsNewPage(20)) addNewPage();

                    const datosCita = [
                        cita.miembroNombre,
                        cita.especialidad,
                        cita.medico,
                        this.formatearFechaSolo(cita.fecha),
                        cita.lugar
                    ];

                    x = margin + 5;
                    datosCita.forEach((dato, i) => {
                        const texto = String(dato);
                        const maxWidth = citasColWidths[i] - 10;
                        const lineas = doc.splitTextToSize(texto, maxWidth);
                        doc.text(lineas[0] || '', x, y); // Solo primera línea para mantener formato tabular
                        x += citasColWidths[i];
                    });

                    y += lineHeight;
                });

                y += sectionSpacing;
            }

            // MEDICAMENTOS
            if (this.medicamentos.length > 0) {
                if (needsNewPage(100)) addNewPage();

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text('Medicamentos', margin, y);
                y += 25;

                // Tabla de medicamentos con formato similar
                const medColWidths = [90, 120, 80, 90, 100];
                const medHeaders = ['Paciente', 'Medicamento', 'Dosis', 'Horarios', 'Vigencia'];

                // Cabeceras
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y - 5, pageWidth - margin * 2, 25, 'F');
                doc.setDrawColor(203, 213, 225);
                doc.line(margin, y - 5, pageWidth - margin, y - 5);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                let x = margin + 5;
                medHeaders.forEach((header, i) => {
                    doc.text(header, x, y + 8);
                    x += medColWidths[i];
                });

                y += 20;
                doc.line(margin, y, pageWidth - margin, y);
                y += 10;

                doc.setFont('helvetica', 'normal');
                this.medicamentos.forEach(med => {
                    if (needsNewPage(20)) addNewPage();

                    const vigencia = `${this.formatearFechaSolo(med.fechaInicio)}${med.fechaFin ? ' - ' + this.formatearFechaSolo(med.fechaFin) : ''}`;
                    const datosMed = [
                        med.miembroNombre,
                        med.nombre,
                        med.dosis,
                        med.horarios.join(', '),
                        vigencia
                    ];

                    x = margin + 5;
                    datosMed.forEach((dato, i) => {
                        const texto = String(dato);
                        const maxWidth = medColWidths[i] - 10;
                        const lineas = doc.splitTextToSize(texto, maxWidth);
                        doc.text(lineas[0] || '', x, y);
                        x += medColWidths[i];
                    });

                    y += lineHeight;
                });

                y += sectionSpacing;
            }

            // EXÁMENES
            if (this.examenes.length > 0) {
                if (needsNewPage(100)) addNewPage();

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text('Exámenes', margin, y);
                y += 25;

                const examColWidths = [90, 110, 80, 90, 110];
                const examHeaders = ['Paciente', 'Examen', 'Fecha', 'Lugar', 'Resultados'];

                // Cabeceras
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y - 5, pageWidth - margin * 2, 25, 'F');
                doc.setDrawColor(203, 213, 225);
                doc.line(margin, y - 5, pageWidth - margin, y - 5);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                let x = margin + 5;
                examHeaders.forEach((header, i) => {
                    doc.text(header, x, y + 8);
                    x += examColWidths[i];
                });

                y += 20;
                doc.line(margin, y, pageWidth - margin, y);
                y += 10;

                const examenesOrdenados = [...this.examenes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

                doc.setFont('helvetica', 'normal');
                examenesOrdenados.forEach(examen => {
                    if (needsNewPage(20)) addNewPage();

                    const resultado = examen.resultados ?
                        (examen.resultados.length > 50 ? examen.resultados.substring(0, 47) + '...' : examen.resultados) :
                        'Pendiente';

                    const datosExamen = [
                        examen.miembroNombre,
                        examen.tipo,
                        this.formatearFechaSolo(examen.fecha),
                        examen.lugar,
                        resultado
                    ];

                    x = margin + 5;
                    datosExamen.forEach((dato, i) => {
                        const texto = String(dato);
                        const maxWidth = examColWidths[i] - 10;
                        const lineas = doc.splitTextToSize(texto, maxWidth);
                        doc.text(lineas[0] || '', x, y);
                        x += examColWidths[i];
                    });

                    y += lineHeight;
                });
            }

            // PIE DE PÁGINA CON NUMERACIÓN
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(lightGray);
                doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 60, pageHeight - 20);
                doc.text('MiSalud — Sistema de Gestión Médica', margin, pageHeight - 20);
            }

            // Descargar con nombre descriptivo
            const fechaArchivo = new Date().toISOString().slice(0, 10);
            doc.save(`MiSalud_${this.usuarioActual.nombre.replace(/\s+/g, '_')}_${fechaArchivo}.pdf`);
            this.mostrarNotificacion('PDF generado correctamente');
        } catch (error) {
            console.error('Error generando PDF:', error);
            this.mostrarNotificacion('Error al generar el PDF. Por favor inténtalo de nuevo.', 'error');
        }
    },

    // ============================================
    // UTILIDADES
    // ============================================
    mostrarNotificacion(mensaje, tipo = 'success') {
        const notif = document.getElementById('notificacion');
        if (!notif) return;

        notif.textContent = mensaje;

        if (tipo === 'error') {
            notif.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        } else {
            notif.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        }

        notif.classList.add('show');

        setTimeout(() => {
            notif.classList.remove('show');
        }, 4000);
    },

    formatearFecha(fechaStr) {
        if (!fechaStr) return 'Fecha no válida';
        try {
            const fecha = new Date(fechaStr);
            if (isNaN(fecha.getTime())) return 'Fecha no válida';

            const opciones = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return fecha.toLocaleDateString('es-ES', opciones);
        } catch (error) {
            return 'Fecha no válida';
        }
    },

    formatearFechaSolo(fechaStr) {
        if (!fechaStr) return 'Fecha no válida';
        try {
            const fecha = new Date(fechaStr + 'T00:00:00');
            if (isNaN(fecha.getTime())) return 'Fecha no válida';

            const opciones = {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            };
            return fecha.toLocaleDateString('es-ES', opciones);
        } catch (error) {
            return 'Fecha no válida';
        }
    }
};

// ============================================
// INICIALIZAR APLICACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});