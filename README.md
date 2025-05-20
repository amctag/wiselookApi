Wise API structure

npm init -y
npm install express pg dotenv cors express-validator
npm install --save-dev nodemon

vs_wise/
├── .env
└── src/
    ├── app.js
    ├── config/
    │   └── db.js
    └── api/
        ├── controllers/
        ├── models/
        └── routes/
            └── v1/