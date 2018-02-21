require ('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const db = require('./models');
const employeeRoutes = require('./controllers/employees_controller');

const app = express();
const port = process.env.PORT || 8080;

const passport = require('passport');
const flash = require('connect-flash');

require('./config/passport')(passport); // pass passport for configuration

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(session({
  secret: 'testingsecret',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); //Persistent login sessions
app.use(flash());

db.users.sync();
db.employees.sync();

//Setup Database relationships
db.employees.belongsTo(db.users);

app.use(employeeRoutes);
require('./routes/login')(app, passport); // load our routes and pass in our app and fully configured passport


app.listen(port);