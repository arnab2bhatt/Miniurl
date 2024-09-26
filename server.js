const express = require('express');
const authRoutes = require('./routes/authroute');
const linkRoutes = require('./routes/linkroute')
const cookieParser = require('cookie-parser');

const app = express();
const port = 3000;

app.use(express.json());

app.use(cookieParser('secretKey'));
app.use('/authroute', authRoutes);
app.use('/linkroute', linkRoutes);


app.listen(port, () => {
    console.log('Server running at http://localhost:${port}');
});