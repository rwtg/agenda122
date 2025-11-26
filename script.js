// Configurações da API
const API_BASE = 'http://localhost/eduplanner/api';

// Elementos da página
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const tasksPage = document.getElementById('tasksPage');

// Botões e elementos de formulário
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const addTaskBtn = document.getElementById('addTaskBtn');
const logoutBtn = document.getElementById('logoutBtn');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');

// Usuário atual
let currentUser = null;

// Função para fazer requisições API
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro na requisição');
        }
        
        return data;
    } catch (error) {
        console.error('Erro API:', error);
        throw error;
    }
}

// Função para alternar entre páginas
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// Função de cadastro
async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const messageDiv = document.getElementById('registerMessage');

    try {
        if (!name || !email || !password) {
            throw new Error('Por favor, preencha todos os campos.');
        }

        await apiRequest('register.php', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });

        messageDiv.textContent = 'Cadastro realizado com sucesso!';
        messageDiv.className = 'success-message';

        // Limpar formulário
        document.getElementById('registerForm').reset();

        // Redirecionar para login após 1 segundo
        setTimeout(() => {
            showPage('loginPage');
            messageDiv.textContent = '';
        }, 1000);

    } catch (error) {
        messageDiv.textContent = error.message;
        messageDiv.className = 'error-message';
    }
}

// Função de login
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');

    try {
        if (!email || !password) {
            throw new Error('Por favor, preencha todos os campos.');
        }

        const data = await apiRequest('login.php', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        currentUser = data.user;
        localStorage.setItem('eduplanner_currentUser', JSON.stringify(currentUser));
        
        messageDiv.textContent = '';
        showPage('tasksPage');
        await loadTasks();

    } catch (error) {
        messageDiv.textContent = error.message;
        messageDiv.className = 'error-message';
    }
}

// Função de logout
function logout() {
    currentUser = null;
    localStorage.removeItem('eduplanner_currentUser');
    showPage('loginPage');
    document.getElementById('loginForm').reset();
}

// Função para adicionar tarefa
async function addTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;

    try {
        if (!title) {
            throw new Error('Por favor, insira um título para a tarefa.');
        }

        if (!currentUser) {
            throw new Error('Usuário não autenticado.');
        }

        await apiRequest('tasks.php', {
            method: 'POST',
            body: JSON.stringify({
                user_id: currentUser.id,
                title,
                description,
                due_date: null,
                priority: 'medium'
            })
        });

        // Limpar formulário
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';

        // Atualizar lista de tarefas
        await loadTasks();

    } catch (error) {
        alert(error.message);
    }
}

// Função para carregar tarefas
async function loadTasks() {
    if (!currentUser) return;

    try {
        const data = await apiRequest(`tasks.php?user_id=${currentUser.id}`);
        const tasks = data.tasks || [];
        
        const pendingTasks = tasks.filter(task => !task.completed);
        const completedTasks = tasks.filter(task => task.completed);

        // Atualizar contadores
        document.getElementById('pendingCount').textContent = pendingTasks.length;
        document.getElementById('completedCount').textContent = completedTasks.length;

        // Renderizar tarefas pendentes
        const pendingContainer = document.getElementById('pendingTasks');
        if (pendingTasks.length === 0) {
            pendingContainer.innerHTML = '<div class="empty-message">Nenhuma tarefa pendente. Mãos à obra!</div>';
        } else {
            pendingContainer.innerHTML = pendingTasks.map(task => `
                <div class="task-item">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-description">${task.description || ''}</div>
                        ${task.due_date ? `<div class="task-due">Vence: ${new Date(task.due_date).toLocaleDateString('pt-BR')}</div>` : ''}
                        <div class="task-priority ${task.priority}">Prioridade: ${task.priority}</div>
                    </div>
                    <div class="task-actions">
                        <button onclick="completeTask(${task.id})">Concluir</button>
                        <button class="secondary-btn" onclick="deleteTask(${task.id})">Excluir</button>
                    </div>
                </div>
            `).join('');
        }

        // Renderizar tarefas concluídas
        const completedContainer = document.getElementById('completedTasks');
        if (completedTasks.length === 0) {
            completedContainer.innerHTML = '<div class="empty-message">Nenhuma tarefa concluída ainda. Comece a marcar!</div>';
        } else {
            completedContainer.innerHTML = completedTasks.map(task => `
                <div class="task-item completed">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-description">${task.description || ''}</div>
                    </div>
                    <div class="task-actions">
                        <button onclick="uncompleteTask(${task.id})">Reabrir</button>
                        <button class="secondary-btn" onclick="deleteTask(${task.id})">Excluir</button>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
    }
}

// Função para marcar tarefa como concluída
async function completeTask(taskId) {
    try {
        await apiRequest('tasks.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: taskId,
                user_id: currentUser.id,
                completed: true
            })
        });
        await loadTasks();
    } catch (error) {
        alert('Erro ao concluir tarefa: ' + error.message);
    }
}

// Função para reabrir tarefa
async function uncompleteTask(taskId) {
    try {
        await apiRequest('tasks.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: taskId,
                user_id: currentUser.id,
                completed: false
            })
        });
        await loadTasks();
    } catch (error) {
        alert('Erro ao reabrir tarefa: ' + error.message);
    }
}

// Função para excluir tarefa
async function deleteTask(taskId) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        try {
            await apiRequest('tasks.php', {
                method: 'DELETE',
                body: JSON.stringify({
                    id: taskId,
                    user_id: currentUser.id
                })
            });
            await loadTasks();
        } catch (error) {
            alert('Erro ao excluir tarefa: ' + error.message);
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se há usuário logado ao carregar a página
    const savedUser = localStorage.getItem('eduplanner_currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showPage('tasksPage');
        loadTasks();
    }

    // Adicionar event listeners
    loginBtn.addEventListener('click', login);
    registerBtn.addEventListener('click', register);
    addTaskBtn.addEventListener('click', addTask);
    logoutBtn.addEventListener('click', logout);
    showRegister.addEventListener('click', () => showPage('registerPage'));
    showLogin.addEventListener('click', () => showPage('loginPage'));

    // Permitir enviar formulários com Enter
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });

    document.getElementById('taskTitle').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
    });
});