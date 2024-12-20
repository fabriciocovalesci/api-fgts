module.exports = {
    apps: [
      {
        name: 'nestjs-app',
        script: './dist/main.js',
        instances: 'max', 
        exec_mode: 'cluster',
        watch: false, 
        env: {
            PORT: 3000,
            AUTH_URL: 'https://bo-credit-maffezzolli-stg.auth.us-east-2.amazoncognito.com/oauth2/token',
            BASIC_AUTH_TOKEN: 'N2RybTE2YjJxbDhtZzM0aTdlMGtzNG10aWk6cWVjdDFsNWRlNDVsanVlM2MwNG1saG81ODRoMHM5N3BlYXBoMGI1OXIzZ2UwYWFoYmJp',
            BASE_URL: 'https://web-credit-api.azurewebsites.net',
            CONNECTION_STRING: 'mongodb+srv://fabcovalesci:TKxwuyR3rhiTS10P@cluster0.vi9qr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
            JWT_SECRET: 'secret123'
          },
      },
    ],
  };
  