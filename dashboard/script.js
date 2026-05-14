function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('show');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}

(function initTopbar() {
    const dateEl  = document.getElementById('topDate');
    const greetEl = document.getElementById('topGreet');
    if (!dateEl || !greetEl) return;

    const now  = new Date();
    const h    = now.getHours();
    const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['enero','febrero','marzo','abril','mayo','junio',
                   'julio','agosto','septiembre','octubre','noviembre','diciembre'];

    const greeting = h < 12 ? 'Buenos días'
                   : h < 19 ? 'Buenas tardes'
                   :           'Buenas noches';

    dateEl.textContent  = `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]}`;
    greetEl.textContent = `${greeting}, Juan`;
})();
