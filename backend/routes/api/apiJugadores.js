"use strict";
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Jugador = require('../../models/jugador');

// Solo con el objetivo de enviar siempre una misma respuesta
function sendRes(res, cod, data, message, error) {
  res.status(cod);
  return res.json({ data, message, error });
}

function queryPage(req, res, next) {
  // en caso de no estar definido se fuersa a 10
  const skip = _.get(req, 'query.skip', 2) || 2;
  // en caso de no estar definido se fuersa a 10
  const limit = _.get(req, 'query.limit', 2) || 2;
  req.query.skip = skip;
  req.query.limit = limit;
  // Continuar con la consulta ala API
  next();
}

// Recupera todos los jugadores
// Buscar jugadores por nomnbre o apellido
// query parameter skip limit player
router.get('/jugadores',
  queryPage, // interceptor para completar el paginado
  function (req, res) {
    // Validar parámetro de la consulta
    const player = _.get(req, 'query.jugador', false) || false;

    if (player) {
      Jugador.find({
          $or: [
            { nombre: { $regex: player } },
            { apellido: { $regex: player } }
          ]
        })
        .sort('apellido')
        .skip(req.query.skip)
        .limit(req.query.limit)
        .exec(function (err, jugadores) {
          if (err) {
            // res, status, data, messager, error
            return sendRes(res, 500, null, "Ha ocurrido un error", err);
          } else {
            // res, status, data, messager, error
            return sendRes(res, 200, jugadores, "Success", null);
          }
        });
    } else {
      // res, status, data, messager, error
      return sendRes(res, 402, null, "Parametro 'jugador' es requerido", null);
    }
  });

router.get('/jugadores/:id',function(req,res){
  Jugador.findById({_id: req.params.id}).then(function(jugadores){
    res.status(200).send(jugadores)
  });
});

//Agrega un jugador a la bd
router.post('/jugadores',function(req,res,next){
  Jugador.create(req.body).then(function(jugadores){
    res.status(200).send(jugadores);
  }).catch(next);
});

//Modifica un jugador en la bd
router.put('/jugadores/:id',function(req,res){
  Jugador.findByIdAndUpdate({_id: req.params.id}, req.body).then(function(){
    Jugador.findOne({_id: req.params.id}).then(function(jugadores){
      res.status(200).send(jugadores);
    });
  });
});

//Borra un jugador de la bd
router.delete('/jugadores/:id',function(req,res){
  Jugador.findByIdAndRemove({_id: req.params.id}).then(function(jugadores){
    res.status(200).send(jugadores);
  });
});

module.exports = router;
