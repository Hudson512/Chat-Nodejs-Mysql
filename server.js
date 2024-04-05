const express = require('express');
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path')
const cors = require("cors");


const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {}
});
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
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    /*
    db.query('SELECT COUNT(*) AS users from users',(err, results) => {
        if (err){
            res.json({err: "Erro na BD"});
        }
        res.json(results);
    });
    */
    res.sendFile(join(__dirname, "index.html"));
});

//----------------------------------------- Cadastro
app.post('/cadastro', (req, res) => {
    const { username, name, email, password, language } = req.body;


    // Verifica se o usuário já existe no banco de dados
    db.query('SELECT * FROM users WHERE username = ? AND email = ?', [username, email], (err, result) => {
        if (err) {
            res.status(500).json({ erro: 'Erro no banco de dados, tente novamente.' });
        }

        if (result.length > 0) {
            // Usuário já existe
            res.status(400).json({ erro: 'Nome de usuário ou email já está em uso no sistema.' });
        } else {
            // Inserir dados no banco de dados
            db.query('INSERT INTO users (username, name, email, password, language) VALUES (?, ?, ?, ?, ?)', [username, name, email, password, language], (err, result) => {
                if (err) {
                    res.status(500).json({ message: 'Erro no banco de dados, tente novamente.' });
                }
                res.json({ message: "Usuário criado com sucesso" });
            });

        }
    });
});

//----------------------------------------- Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Consulta ao banco de dados para verificar as credenciais de login
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, result) => {
        if (err) {
            res.status(500).json({ erro: 'Erro no banco de dados, tente novamente.' });
        }

        if (result.length > 0) {
            const id = result[0].pk_user_id;
            res.json({ user_id: id });
        } else {
            // Credenciais incorretas
            res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });
        }
    });
});

//----------------------------------------- Home
app.get('/home/:id', (req, res) => {
    const id = req.params.id;

    db.query(`SELECT * FROM users WHERE pk_user_id = ${id}`, (err, result) => {
        if (err) {
            res.status(500).json({ erro: 'Erro no banco de dados, tente novamente.' });
        }
        var dados_perfil = result;
        db.query(`SELECT * FROM users WHERE pk_user_id != ${id}`, (err, result) => {
            if (err) {
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

app.get("/home/messages/:senderId/:reveiverId", (req, res) => {

    db.query('SELECT msg FROM messages WHERE fk_sender_id = ? AND fk_reciever_id = ?', [req.params.senderId, req.params.reveiverId], (err, results) => {
        if (err) { socket.emit('chat message', "Erro ao apresentar as mensagens"); }
        if (results.length > 0) {
            res.json(results);
        } else {
            let arrobj = [];
            arrobj.push({ msg: "Não há mensagem nessa conversa" });
            res.json(arrobj)
        }

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

    db.query('SELECT * FROM users WHERE pk_user_id = ?', [id], (err, results) => {
        if (err) {
            res.status(500).json({ erro: 'Erro no banco de dados, tente novamente.' });
        }
        if (results.length > 0) {

            const existingUser = results[0];
            const newdata = {
                username: comp(username, existingUser.username),
                name: comp(name, existingUser.name),
                email: comp(email, existingUser.email),
                password: comp(password, existingUser.password),
                language: comp(language, existingUser.language)
            };
            //console.log(newdata.username, newdata.name, newdata.email, newdata.password, newdata.language, id)

            db.query('UPDATE users SET username = ?, name = ?, email = ?, password = ?, language = ? WHERE pk_user_id = ?', [newdata.username, newdata.name, newdata.email, newdata.password, newdata.language, id], (err, results) => {
                let arrobj = [];
                if (err) {
                    arrobj.push({msg: "Erro no banco de dados, tente novamente"})
                    res.status(500).json(arrobj);
                }
                arrobj.push({msg: "Usuário atualizado com sucesso!"})
                res.json(arrobj);
            });
            //res.json(newdata.username, newdata.name, newdata.email, newdata.password, newdata.language, id);
        } else {
            let arrobj = [];
            arrobj.push({msg: 'Usuário não encontrado'})
            res.status(400).json(arrobj);
        }

    });
});


//----------------------------------------- Excluir um cliente
app.delete('/user/:id/delete', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM users WHERE pk_user_id = ?', id, (err, results) => {
        let arrobj = [];
        if (err) {
            arrobj.push({msg: 'Erro no banco de dados, tente novamente.'})
            res.status(500).json(arrobj);
        }
        arrobj.push({msg: "Usuário eliminado com sucesso!"})
        res.json(arrobj);
    });
});

io.on('connection', async (socket) => {

    socket.on('chat message', async (msg, user_sender_id, user_reciever_id) => {
        try {
            if (msg.length !== 0) {
                db.query('INSERT INTO messages (fk_sender_id, fk_reciever_id, msg) VALUES (?, ?, ?)', [user_sender_id, user_reciever_id, msg], (err, results) => {
                    if (err) {
                      io.emit('chat message', msg, "Erro ao gravar a msg na base de dados");
                    }
                    global.msgSendId = results.insertId;
                    io.emit('chat message', msg, global.msgSendId);
                    console.log(global.msgSendId)
                });
            }
        } catch (e) {
            // TODO handle the failure
            return;
        }
        //console.log(global.msgSendId)
    });

    if (!socket.recovered) {
        // if the connection state recovery was not successful
        try {
            db.query('SELECT msg FROM messages WHERE pk_message_id = ?', [global.msgSendId], (err, results) => {
                if (err) { socket.emit('chat message', "Erro ao apresentar as mensagens"); }
                socket.emit('chat message', results, global.msgSendId);
            });
        } catch (e) {
            // something went wrong
            return;
        }
    }
});




// Iniciar o servidor
server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
});


