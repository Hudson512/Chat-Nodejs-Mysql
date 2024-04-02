const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path')
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' })

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
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send("Ola...");
});

/**
 * 
 *  CADASTRO
 * 
 */
app.post('/cadastro',upload.single('imagem'), (req, res) => {
    const { username, name, email, password, language} = req.body;
    const { filename, path } = req.file;


    // Verifica se o usuário já existe no banco de dados
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
        if (err) {
            throw err;
        }

        if (result.length > 0) {
            // Usuário já existe
            res.status(400).json({message: 'Nome de usuário já está em uso'});
        } else {
            // Inserir dados no banco de dados
            const timestamp = Date.now();
            const novoNomeArquivo = `${timestamp}_${filename}`;
            db.query('INSERT INTO users (username, name, email, password, language, profilepic, pathpic) VALUES (?, ?, ?, ?, ?, ?, ?)', [username, name, email, password, language, novoNomeArquivo, path], (err, result) => {
                if (err) {
                    throw err;
                }
                console.log('Usuario add com sucesso!');
                const id = result.insertId;
                console.log(`New-id: ${id}`);
                res.status(301).redirect(`/home/${id}`);
            });
           
        }
    });
});

/**
 * 
 *  LOGIN
 * 
 */
app.post('/login', (req, res) => {
    const {email, password} = req.body;

    // Consulta ao banco de dados para verificar as credenciais de login
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, result) => {
        if (err) {
            throw err;
        }
        
        if (result.length > 0) {
            // Credenciais corretas
            //res.status(301).redirect(`/home/${id}`);
            const id = result[0].pk_user_id;
            res.json({message: `/home/${id}`});
        } else {
            // Credenciais incorretas
            res.status(401).json({message: 'Nome de usuário ou senha incorretos'});
        }
    });
});

/**
 * HOME
 * 
 */
app.get('/home/:id', (req, res) => {
    const id = req.params.id;

    db.query(`SELECT * FROM users WHERE pk_user_id = ${id}`, (err, result) => {
        if (err){
            throw err;
        }
        var dados_perfil = result;
        db.query(`SELECT * FROM users WHERE pk_user_id != ${id}`, (err, result) => {
            if (err){
                throw err;
            }
            let lista_de_users = result;
            res.json({ 
                dados_perfil: dados_perfil,
                lista_de_users: lista_de_users
            });
            
        })
    });
    
    
});

//Rota para acessar imagem pelo front
//Ex: ler o ficheiro notas.txt
app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    res.sendFile(path.join(__dirname, 'uploads', filename));
});

// Atualizar um cliente existente
app.put('/home/update/:id', (req, res) => {
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
            throw err;
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
                    throw err;
                }
                res.json({ message: "Usuário atualizado com sucesso!", info: result });
            });
        } else {
            res.status(400).json({ message: 'Usuário não encontrado' });
        }
    });
});

// Excluir um cliente
app.delete('/home/delete/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM users WHERE pk_user_id = ?', id, (err, result) => {
        if (err) {
            throw err;
        }
        console.log(`Usuario ${id}, eliminado com sucesso!`);
        res.json({ 
            message: "Usuário excluído com sucesso!",
            info: result
        });
    });
});




// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});


