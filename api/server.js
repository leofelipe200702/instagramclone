var express = require('express'),
    bodyParser = require('body-parser'),
    multiparty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectId = require('mongodb').ObjectId,
    fs = require('fs');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);

    next();

});


app.listen(8080);

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
);

console.log('servidor ON');

app.get('/', (req, res) => {
    res.send({ msg: 'Olá Postman!' })
});

app.post('/api', (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    var date = new Date();
    var timeStamp = date.getTime();
    var url_imagem = timeStamp + '_' + req.files.arquivo.originalFilename;

    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;

    fs.rename(path_origem, path_destino, (err) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }

        var dados = {
            titulo: req.body.titulo,
            url_imagem: url_imagem
        };

        db.open((err, mongoclient) => {
            mongoclient.collection('postagens', (err, collection) => {
                collection.insert(dados, (err, records) => {
                    if (err) {
                        res.json({ status: 'erro gravando arquivo' });
                    } else {
                        res.json({ status: 'Inclusão realizada com sucesso' });
                    }
                    mongoclient.close();
                });
            });
        });
    });
});

app.get('/api', (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');

    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) => {
            collection.find().toArray((err, results) => {
                if (err) {
                    res.send(err);
                } else {
                    res.send(results);
                }
                mongoclient.close();
            });
        });
    });
});

//rota de busca de imagens na pasta upload
app.get('/images/:imagem', (req, res) => {

    var img = req.params.imagem;

    fs.readFile('./uploads/' + img, (err, content) => {

        if (err) {
            res.status(400).json(err);
            return;
        }

        res.writeHead(200, { 'content-type': 'image/jpg' });
        res.end(content);

    });


});



app.get('/api/:id', (req, res) => {
    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) => {
            collection.find(objectId(req.params.id)).toArray((err, results) => {
                if (err) {
                    res.send(err);
                } else {
                    res.send(results);
                }
                mongoclient.close();
            });
        });
    });
});

app.put('/api/:id', (req, res) => {

    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) => {
            collection.update(
                { _id: objectId(req.params.id) },
                { $push: { comentarios: {
                    id_comentario: new objectId(),
                    comentario: req.body.comentario
                } } },
                {},
                (err, results) => {
                    if (err) {
                        res.send(err);
                    } else {
                        res.send(results);
                    }
                    mongoclient.close();
                }
            );
        });
    });
});

app.delete('/api/:id', (req, res) => {
        
    db.open((err, mongoclient) => {
        mongoclient.collection('postagens', (err, collection) => {
            collection.update(
                {},//query
                {$pull:{comentarios: {//comando
                    id_comentario: objectId(req.params.id)
                }}},
                {multi: true},
                 (err, records) => {
                    if (err) {
                        res.send(err);
                    } else {
                        res.send(records);
                    }
                    mongoclient.close();
            });
        });
    });
});
