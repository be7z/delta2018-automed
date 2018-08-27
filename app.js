var express = require('express')
var path = require('path')
var bodyParser = require('body-parser')
var sql = require('mssql');

// SQL Config
var config = {
  user: 'dbadmin',
  password: 'dbadmin',
  server: 'localhost',
  database: 'automed-db',
  options: {
    encrypt: false
  }
}

//var store = require('./store').myfun()

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// set public
app.use(express.static('bootstrap_expt/'))

// alow res, req
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

// site directory
app.get('/', getLogin)
app.post('/', getRedictToDash)
app.get('/dash/:id/', getDash)
app.get('/dash/:id/tx/:txid/', getTX)
app.post('/dash/:id/tx/:reportID/', getTxEdit)
app.get('/dash/:id/addTx/', getAdd)
app.post('/dash/:id/addTx/', getTxAdd)
app.post('/dash/:id/addAppt/', getApptAdd)

/*
app.get('/add', getjAdd)
app.post('/add', getjAddq)
app.get('/delete/:id/', getjDel)
app.post('/update', getjUpdate)
app.get('/login/', getjLogin)
*/

// set localhost:port
app.listen(7555, () => {
  console.log('Server running on http://localhost:7555')
})

function strQ(str) {
  return '\'' + str + '\''
}

/* GET Login page. */
function getLogin(req, res, next) {
  res.render('login', {
    route: 'login'
  })
}

/* GET GoEdit page. */
async function getRedictToDash(req, res, next) {
  const pool = new sql.ConnectionPool(config)
  try {
    if (req.body.userID == '') throw '#ID_NOTFOUND'
    await pool.connect()
    let result = await pool.request()
      .query('SELECT userHash FROM [UserDB]' + 'WHERE [userID]=' + req.body.userID)
    console.log(result.rowsAffected[0])
    if (result.rowsAffected[0] == 0) throw '#ID_NOTFOUND'
    res.redirect('/dash/' + req.body.userID + '/')
  } catch (err) {
    res.redirect(err)
  } finally {
    pool.close()
  }
}

/* GET Add page.
function getjAdd(req, res, next) {
  res.render('add', {
    route: 'add'
  })
}

function getjAddq(req, res, next) {
  const pool = new sql.ConnectionPool(config, err => {
    pool.request()
      .query('INSERT INTO [UserDB] ([ID],[NameF])' +
        'VALUES (' + req.body.PatientID + ',' +
        strQ(req.body.PatientFirstname) + ')',
        (err, result) => {
          //console.dir(result)
          res.redirect('/')
        })
  })
}
*/

/* GET Del page.
function getjDel(req, res, next) {
  const pool = new sql.ConnectionPool(config, err => {
    pool.request()
      .query('DELETE FROM [UserDB]' +
        'WHERE [ID]=' + req.params.id,
        (err, result) => {
          //console.dir(result)
          res.redirect('/')
        })
  })
}
*/

async function getDash(req, res, next) {
  const pool = new sql.ConnectionPool(config)
  try {
    await pool.connect()

    let userRec = await pool.request()
      .query('SELECT * FROM [UserDB] ' + 'WHERE [userID]=' + req.params.id)

    if (userRec.recordset[0].userType == 'Patient')
      queryType = 'physicsID WHERE [patientID]='
    if (userRec.recordset[0].userType == 'Physician')
      queryType = 'patientID WHERE [physicsID]='

    // Patient Req
    console.log('userRec.recordset[0].userID')
    let apptRec = await pool.request().query(
      'SELECT AppointmentDB.*, UserDB.nameTitle, UserDB.nameFirst ' +
      'FROM UserDB INNER JOIN AppointmentDB ' +
      'ON UserDB.userID = AppointmentDB.' +
      queryType + req.params.id
    )
    let txRec = await pool.request().query(
      'SELECT TransactionDB.*, UserDB.nameTitle, UserDB.nameFirst ' +
      'FROM UserDB INNER JOIN  TransactionDB ' +
      'ON UserDB.userID = TransactionDB.' +
      queryType + req.params.id
    )
    /*
        // Physics Req
        let apptRec = await pool.request().query(
          'SELECT AppointmentDB.*, UserDB.nameTitle, UserDB.nameFirst ' +
          'FROM UserDB INNER JOIN AppointmentDB ' +
          'ON UserDB.userID = AppointmentDB.patientID ' +
          'WHERE [physicsID]=' + req.params.id
        )
        let txRec = await pool.request().query(
          'SELECT TransactionDB.*, UserDB.nameTitle, UserDB.nameFirst ' +
          'FROM UserDB INNER JOIN  TransactionDB ' +
          'ON UserDB.userID = TransactionDB.patientID ' +
          'WHERE [physicsID]=' + req.params.id
        )*/


    // Checking Data
    console.log(userRec)
    console.log(apptRec)
    console.log(txRec)

    // Analyse Data
    var style = new Map()
    style.set('Pending', 'badge-warning')
    style.set('Done', 'badge-success')
    var d = new Date()
    userRec.recordset[0].age = d.getFullYear() - userRec.recordset[0].birthYear

    for (var i = 0; i < apptRec.rowsAffected[0]; i++) {
      var apptCreate = apptRec.recordset[i].date
      apptRec.recordset[i].date = apptCreate.toString().slice(4, 21)
    }
    for (var i = 0; i < txRec.rowsAffected[0]; i++) {
      var tempDate = txRec.recordset[i].dateCreate
      txRec.recordset[i].dateCreate = tempDate.toString().slice(4, 21)
      var tempStyle = txRec.recordset[i].reportStat
      txRec.recordset[i].reportStatStyle = style.get(tempStyle)
    }

    //Render
    res.render('dash', {
      route: 'dash',
      data: userRec.recordset[0],
      txData: txRec.recordset,
      txDataRows: txRec.rowsAffected[0],
      apptData: apptRec.recordset,
      apptDataRows: apptRec.rowsAffected[0]
    })
  } catch (err) {
    res.redirect('/#error02-ID' + req.params.id)
    console.log('****************************err ', err)
  } finally {
    pool.close()
  }
}


async function getTX(req, res, next) {
  const pool = new sql.ConnectionPool(config)
  try {
    await pool.connect()

    let userRec = await pool.request()
      .query('SELECT * FROM [UserDB] ' + 'WHERE [userID]=' + req.params.id)

    if (userRec.recordset[0].userType == 'Patient')
      queryType =
      'ON UserDB.userID = TransactionDB.physicsID ' +
      'WHERE [PatientID]=' + req.params.id +
      'and [reportID]=' + req.params.txid
    if (userRec.recordset[0].userType == 'Physician')
      queryType =
      'ON UserDB.userID = TransactionDB.patientID ' +
      'WHERE [physicsID]=' + req.params.id +
      'and [reportID]=' + req.params.txid

    let txRec = await pool.request().query(
      'SELECT TransactionDB.*, UserDB.nameTitle, UserDB.nameFirst, UserDB.userType ' +
      'FROM UserDB INNER JOIN  TransactionDB ' +
      queryType
    )

    var diagStyle = new Map()
    diagStyle.set('normal', 'badge-success')
    diagStyle.set('abnormal', 'badge-danger')
    diagStyle.set('high', 'badge-danger')
    diagStyle.set('low', 'badge-danger')

    // Checking Data
    //console.log(txRec)

    //Render
    res.render('tx', {
      route: 'tx',
      txData: txRec.recordset[0],
      styleHR: diagStyle.get(txRec.recordset[0].diagHR),
      styleBP: diagStyle.get(txRec.recordset[0].diagBP),
      styleTemp: diagStyle.get(txRec.recordset[0].diagTemp),
      userID: userRec.recordset[0].userID
    })
  } catch (err) {
    res.redirect('/#error03-ID' + req.params.id)
    console.log('****************************err ', err)
  } finally {
    pool.close()
  }
}

async function getTxEdit(req, res, next) {
  const pool = new sql.ConnectionPool(config)
  try {
    await pool.connect()

    let userRec = await pool.request()
      .query('UPDATE [dbo].[TransactionDB] ' +
        '   SET [dateConfirm] = GETDATE()' +
        ',[symptDetail] = ' + strQ(req.body.symptDetail) +
        ',[prescript] = ' + strQ(req.body.prescript) +
        ',[prescriptDone] = 0' +
        ',[specialNote] = ' + strQ(req.body.specialNote) +
        ' WHERE [reportID]=' + req.params.reportID
      )
    res.redirect('/dash/' + req.params.id + '/#')
  } catch (err) {
    res.redirect('/#errorTxEdit-' + err)
    console.log('****************************err ', err)
  } finally {
    pool.close()
  }
}

async function getAdd(req, res, next) {
  //Render
  res.render('add', {
    route: 'add',
    userID: req.params.id
  })
}

async function getTxAdd(req, res, next) {
  const pool = new sql.ConnectionPool(config)
  try {
    await pool.connect()
    //console.log('\n\n\n\n\n\n',strQ(req.body.patientID),strQ(req.params.id))
    let userRec = await pool.request()
      .query('INSERT [dbo].[TransactionDB] ' +
        '([dateCreate], [reportID], [reportStat], [reportTopic], [patientID], [physicsID], ' +
        '[PatientRoom], [age], [prescript], [specialNote], [symptDetail], ' +
        '[rawHR], [rawSys], [rawDia], [rawTemp], [MeasureTime], [prescriptDone]) ' +
        'VALUES (GETDATE(),' +
        strQ('78546') + ',' +
        strQ('Pending') + ',' +
        strQ(req.body.reportTopic) + ',' +
        strQ(req.body.patientID) + ',' +
        strQ(req.params.id) + ',' +
        strQ('501') + ',' +
        '20' + ',' +
        strQ(' ') + ',' +
        strQ(' ') + ',' +
        strQ(' ') + ',' +
        '0' + ',' +
        '0' + ',' +
        '0' + ',' +
        '0' + ',' +
        'GETDATE()' + ',1)'
      )
    res.redirect('/dash/' + req.params.id + '/#')
  } catch (err) {
    res.redirect('/#errorTxAdd-' + err)
    console.log('\n\n****************************err ', err)
  } finally {
    pool.close()
  }
}

async function getApptAdd(req, res, next) {
  const pool = new sql.ConnectionPool(config)
  try {
    await pool.connect()
    console.log('\n\n\n\n\n\n', strQ(req.body.patientID), strQ(req.params.id))
    let userRec = await pool.request()
      .query('INSERT [dbo].[TransactionDB] ' +
        '([dateCreate], [reportID], [reportStat], [reportTopic], [patientID], [physicsID]) ' +
        'VALUES (GETDATE(),' +
        strQ('78546') + ',' +
        strQ('Pending') + ',' +
        strQ(req.body.reportTopic) + ',' +
        strQ(req.body.patientID) + ',' +
        strQ(req.params.id) + ')'
      )
    res.redirect('/dash/' + req.params.id + '/#')
  } catch (err) {
    res.redirect('/#errorApptAdd-' + err)
    console.log('\n\n****************************err ', err)
  } finally {
    pool.close()
  }
}

/*
function getjUpdate(req, res, next) {
  const pool = new sql.ConnectionPool(config, err => {
    pool.request()
      .query('UPDATE [UserDB] ' +
        'SET [NameF] = ' + strQ(req.body.PatientFirstname) +
        'WHERE [ID] = ' + strQ(req.body.PatientID),
        (err, result) => {
          console.dir(result)
          res.redirect('/')
        })
  })
}*/
