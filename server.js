const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path')
const cors = require("cors");


const app = express();
const port = 3000;

// Configuração do MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conectado ao banco de dados MySQL');
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    db.query('SELECT COUNT(*) from users',(err, results) => {
        if (err){
            res.json({err: "Erro na BD"});
        }
        res.json(results);
    });
});

//----------------------------------------- Cadastro
app.post('/cadastro', (req, res) => {
    const { username, name, email, password, language} = req.body;


    // Verifica se o usuário já existe no banco de dados
    db.query('SELECT * FROM users WHERE username = ? AND email = ?', [username, email], (err, result) => {
        if (err) {
            res.status(500).json({erro: 'Erro no banco de dados, tente novamente.'});
        }

        if (result.length > 0) {
            // Usuário já existe
            res.status(400).json({erro: 'Nome de usuário ou email já está em uso no sistema.'});
        } else {
            // Inserir dados no banco de dados
            db.query('INSERT INTO users (username, name, email, password, language) VALUES (?, ?, ?, ?, ?)', [username, name, email, password, language], (err, result) => {
                if (err) {
                    res.status(500).json({message: 'Erro no banco de dados, tente novamente.'});
                }
                res.json({message: "Usuário criado com sucesso"});
            });
           
        }
    });
});

//----------------------------------------- Login
app.post('/login', (req, res) => {
    const {email, password} = req.body;

    // Consulta ao banco de dados para verificar as credenciais de login
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, result) => {
        if (err) {
            res.status(500).json({erro: 'Erro no banco de dados, tente novamente.'});
        }
        
        if (result.length > 0) {
            const id = result[0].pk_user_id;
            res.json({user_id: id});
        } else {
            // Credenciais incorretas
            res.status(401).json({message: 'Nome de usuário ou senha incorretos'});
        }
    });
});

//----------------------------------------- Home
app.get('/home/:id', (req, res) => {
    const id = req.params.id;

    db.query(`SELECT * FROM users WHERE pk_user_id = ${id}`, (err, result) => {
        if (err){
            res.status(500).json({erro: 'Erro no banco de dados, tente novamente.'});
        }
        var dados_perfil = result;
        db.query(`SELECT * FROM users WHERE pk_user_id != ${id}`, (err, result) => {
            if (err){
                throw err;
            }
            let lista_de_users = result;
            res.json({ 
                dados_perfil: dados_perfil,
                lista_contactos: lista_de_users
            });
            
        })
    });
    
    
});

//----------------------------------------- Atualizar um cliente existente
app.put('/user/:id/update', (req, res) => {
    const id = req.params.id;
    const { username, name, email, password, language } = req.body;

    function comp(value1, value2) {
        if (value1 === null || value1 === undefined || value1 === '') {
            return value2;
        }
        if (value1 !== value2) {
            return value1;
        } else {
            return value2;
        }
    }

    db.query('SELECT * FROM users WHERE pk_user_id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).json({erro: 'Erro no banco de dados, tente novamente.'});
        }
        if (result.length > 0) {
            const existingUser = result[0];
            const newdata = {
                username: comp(username, existingUser.username),
                name: comp(name, existingUser.name),
                email: comp(email, existingUser.email),
                password: comp(password, existingUser.password),
                language: comp(language, existingUser.language)
            };

            db.query('UPDATE users SET username = ?, name = ?, email = ?, password = ?, language = ? WHERE pk_user_id = ?', [newdata.username, newdata.name, newdata.email, newdata.password, newdata.language, id], (err, result) => {
                if (err) {
                    res.status(500).json({erro: 'Erro no banco de dados, tente novamente.'});
                }
                res.json({ message: "Usuário atualizado com sucesso!"});
            });
        } else {
            res.status(400).json({ message: 'Usuário não encontrado' });
        }
    });
});

//----------------------------------------- Excluir um cliente
app.delete('/user/:id/delete', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM users WHERE pk_user_id = ?', id, (err, result) => {
        if (err) {
            res.status(500).json({erro: 'Erro no banco de dados, tente novamente.'});
        }
        res.json({ message: "Usuário eliminado com sucesso!",});
    });
});




// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});


