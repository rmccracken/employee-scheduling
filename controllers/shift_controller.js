const express = require('express');
const router = express.Router();
const db = require('../models');
const moment = require('moment-timezone');
const mailer = require('./mail_controller');

router.get('/editShift/:shiftId', isLoggedIn, (req, res) => {
  db.employees.findAll({where: {userId: req.user.id}}).then(employees => {
    let parsedEmployees = employees.map(employee => employee.dataValues);
    db.shifts.findOne({where: {id: req.params.shiftId}}).then((shift) => {
      res.render('scheduling', 
        {
          user: req.user,
          employees: parsedEmployees, 
          message: req.flash('entryError') + req.flash('shiftMessage'),
          employeeName: req.flash('employeeName'),
          employeePhone: req.flash('employeePhone'),
          employeeEmail: req.flash('employeeEmail'),
          showEditShift: true,
          shiftId: shift.id,
          shiftStart: moment.utc(shift.start_date).tz('America/New_York').format('YYYY-MM-DDTHH:mm'),
          shiftEnd: moment.utc(shift.end_date).tz('America/New_York').format('YYYY-MM-DDTHH:mm'),
          shiftTitle: shift.shift_title,
          currentDate: moment.utc(shift.start_date).tz('America/New_York').format('YYYY-MM-DD')
        });
    });
  }); 
});

router.get('/shifts/:month/:day/:year', isLoggedIn, function(req, res) {
  db.employees.findAll({where: {userId: req.user.id}}).then((employees) => {
    let employeesShiftPromises = employees.map(employee => {
      return employee.getShifts();
    });
    let requestedDate = moment(`${req.params.year}-${req.params.month}-${req.params.day}`, 'YYYY-MM-DD');
    Promise.all(employeesShiftPromises).then(shifts => {
      let shiftData = [];
      
      shifts.forEach(shiftArr => {
        shiftArr.map(shift => {
          let shiftDate2 = moment.utc(shift.start_date);
          if (shiftDate2.tz('America/New_York').format('YYYY MM DD') === requestedDate.format('YYYY MM DD')) {
            //Matched, need to convert timezones
            let convertedShift = {
              id: shift.id,
              start_date: moment.utc(shift.start_date).tz('America/New_York').format(),
              end_date: moment.utc(shift.end_date).tz('America/New_York').format(),
              shift_title: shift.shift_title,
              employeeId: shift.employeeId
            };

            shiftData.push(convertedShift);
          }
        });
      });
      res.send(shiftData);
    });
  });
}); 



router.delete('/shifts', isLoggedIn, (req, res) => {
  db.shifts.destroy({where: {id: req.body.id}}).then(() =>{
    res.end();
  });
});

router.post('/shifts', isLoggedIn, (req, res) =>{
  db.employees.findOne({where: {id: req.body.employee}}).then(employee => {
    let startDate = moment.tz(req.body.start_date, 'America/New_York');
    let endDate = moment.tz(req.body.end_date, 'America/New_York'); 

    if (!endDate.isAfter(startDate)) {
      req.flash('shiftMessage', 'Ending date/time must be after start time/date');
      res.redirect('/scheduling');
      return;
    }

    db.shifts.create({
      start_date: startDate.tz('UTC').format(), 
      end_date: endDate.tz('UTC').format(),
      shift_title: req.body.shift_title
    }).then(shift => {
      if (employee) {
        employee.addShift(shift);
        req.flash('currentDate', moment.utc(shift.start_date).tz('America/New_York').format('YYYY-MM-DD'));
        res.redirect('/scheduling');
      }
    });
  });
});

router.post('/emailSchedule', isLoggedIn, (req, res) => {
  for(let key in req.body) {
    if (req.body.hasOwnProperty(key)) {
      mailer.sendScheduleEmails(req.body[key].email, req.body[key].shifts);
    }
  }
  req.flash('shiftMessage', 'Schedules emailed to employees.');
  res.redirect('/scheduling');
});

router.put('/shifts', isLoggedIn, (req, res) => {
  console.log('put hit');
  db.shifts.findOne({where: {id : req.body.id}}).then(shift => {
    if (shift) {
      let startDate = moment.tz(req.body.start_date, 'America/New_York');
      let endDate = moment.tz(req.body.end_date, 'America/New_York');
      shift.updateAttributes({
        start_date: startDate.tz('UTC').format(),
        end_date: endDate.tz('UTC').format(),
        shift_title: req.body.shift_title
      });
      res.redirect('/scheduling');
    }
  });
});


function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/');
}

module.exports = router;