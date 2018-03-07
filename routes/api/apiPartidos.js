"use strict";
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const util = require('../utilities');
const queryPage = util.queryPage;
const sendRes = util.sendRes;
const passport = require('passport');

const Partido = require('../../models/partido');
const Marcador = require('../../models/marcador');
const Equipo = require('../../models/equipo');
const TipoEvento = require('../../models/tipoEvento.js');

// Recupera todos los partidos
// http://localhost:3000/api/partido/?skip=1&limit=1&torneos=['nombreTorneo']
router.get('/partidos',
  queryPage, // interceptor para completar el paginado
  function (req, res) {
    Partido.find({})
      .populate({
        path: 'equipoA',
        select: 'nombre escudoURL',
        model: Equipo
      })
      .populate({
        path: 'equipoB',
        select: 'nombre escudoURL',
        model: Equipo
      })
      .populate({
        path: 'marcador',
        model: Marcador
      })
      .sort('fechaInicio')
      .skip(req.query.skip)
      .limit(req.query.limit)
      .exec(function (err, partidos) {
        if (err || !partidos) {
          // res, status, data, messager, error
          return sendRes(res, 500, [], "Ha ocurrido un error", err);
        } else {
          // res, status, data, messager, error
          return sendRes(res, 200, partidos, "Success", null);
        }
      });
  });

// Recupera un partido
router.get('/partidos/:id', function (req, res) {
  // Validar parámetro de la consulta
    Partido.findById(req.params.id)
      .populate({
        path: 'equipoA',
        select: 'nombre escudoURL',
        model: Equipo
      })
      .populate({
        path: 'equipoB',
        select: 'nombre escudoURL',
        model: Equipo
      })
      .populate({
        path: 'marcador',
        model: Marcador
      })
      // .populate('eventos') // api/eventos-por-partido/:idPartido
      .then(function (partido) {
        // res, status, data, messager, error
        return sendRes(res, 200, partido || [], "Success", null);
      })
      .catch(function (err) {
        // res, status, data, messager, error
        return sendRes(res, 500, null, "Ha ocurrido un error", err);
      });
});

// Listado de eventos por partido
// buscar partido con el id
// filtrar solos los evento
// ordenar con fechaYhora
// usar paginado para obtener una lista controlablee
router.get('/eventos-por-partido/:idPartido',
  queryPage, // interceptor para completar el paginado
  function (req, res) {
    // Validar parámetro de la consulta
    const id = _.get(req, 'params.idPartido', false) || false;
    if (id) {
      Partido.findById(id)
        .populate({
          path: 'eventos.evento',
          model: TipoEvento
        })
        .select('eventos')
        .skip(req.query.skip)
        .limit(req.query.limit)
        .then(function (partido) {
          // res, status, data, messager, error
          return sendRes(res, 200, partido.eventos, "Success", null);
        })
        .catch(function (err) {
          // res, status, data, messager, error
          return sendRes(res, 500, null, "Ha ocurrido un error", err);
        });
    } else {
      // res, status, data, messager, error
      return sendRes(res, 402, null, "Parametro ID del partido es requerido", null);
    }
  });


//Agrega un partido a la bd
router.post('/partidos',
passport.authenticate('jwt', { session: false }),
function (req, res) {
    const equipoA = _.get(req,'body.partido.equipoA',false) || false;
    const equipoB = _.get(req,'body.partido.equipoB',false) || false;
    const fechaInicio = _.get(req,'body.partidofechaInicio',false) || false;
    const estadio = _.get(req,'body.partido.estadio',false) || false;
    const categoria = _.get(req,'body.partido.categoria',false) || false;
    const destacado = _.get(req,'body.partido.destacado',false) || false;

    if(equipoA && equipoB && fechaInicio && estadio && categoria && destacado){
      const marcador = new Marcador({
        golesEquipoA: 0,
        golesEquipoB: 0
      });
      marcador.save(function (err, marcador_db) {
        if (err || !marcador_db) { return console.error(err); }
        console.log(req.body);
        const partido = new Partido({
          equipoA: req.body.equipoA,
          equipoB: req.body.equipoB,
          marcador: marcador_db,
          estado: 'Programado',
          eventos: [],
          fechaInicio: req.body.fechaInicio,
          fechaDescanso: null,
          estadio: req.body.estadio,
          categoria: req.body.categoria,
          arbitros: [],
          destacado: req.body.destacado
      });
      partido.save((err,partido_db)=>{
        if (err || !partido_db) {
          return sendRes(res, 500, null, 'Error', err || "No pudimos crear el partido :(");
        }else{
          return sendRes(res, 200, partido_db, "Success", null);
        }
      });
    });
  }else{
    return sendRes(res, 402, null, "Parametros requeridos: equipoA, equipoB, fechaInicio, estadio, categoria, destacado", null);
  }
});

//Modifica un partido en la bd
router.put('/partidos/:id',
passport.authenticate('jwt', { session: false }),
function (req, res) {
  const equipoA = _.get(req,'body.partido.equipoA',false) || false;
  const equipoB = _.get(req,'body.partido.equipoB',false) || false;
  const fechaInicio = _.get(req,'body.partidofechaInicio',false) || false;
  const estadio = _.get(req,'body.partido.estadio',false) || false;
  const categoria = _.get(req,'body.partido.categoria',false) || false;
  const destacado = _.get(req,'body.partido.destacado',false) || false;
  if(equipoA && equipoB && fechaInicio && estadio && categoria && destacado){
      Partido
        .findOne(req.params.id)
        .exec(function (err, partido) {
          if (err || !partido) {
            return sendRes(res, 500, null, 'Error', err || "No pudimos encontrar el partido :(");
          } else {
            partido.equipoA = equipoA;
            partido.equipoB = equipoB;
            partido.fechaInicio = fechaInicio;
            partido.estadio = estadio;
            partido.categoria = categoria;
            partido.destacado = destacado;
            partido.save(function (err, partido_db) {
              if (err || !partido_db) {
                return sendRes(res, 500, null, 'Error', err || "No pudimos actualizar el torneo :(");
              } else {
                return sendRes(res, 200, partido, "Success", null);
              }
            });
          }
        });
  }else{
    return sendRes(res, 402, null, "Parametros requeridos: equipoA, equipoB, fechaInicio, estadio, categoria, destacado", null);
  }
});

//Borra un partido de la bd
router.delete('/partidos/:id',
passport.authenticate('jwt', { session: false }),
function (req, res) {
    Partido.deleteOne({ _id: req.params.id }, function(err,partido_db){
      if (err || !partido_db) {
        return sendRes(res, 500, null, 'Error', err || "No pudimos borrar el partido :(");
      } else {
        return sendRes(res, 200, partido_db, "Success", null);
      }
    });
});

module.exports = router;