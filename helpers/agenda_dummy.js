var Agenda = require('agenda');
var connectionString = "mongodb+srv://mohamedali:Moemo124!@sera-outlook-edxbb.mongodb.net/test?retryWrites=true"
var agenda = new Agenda({
    db: {
        address: connectionString,
        collection: 'agenda'
    }
});


async function run() {
    await agenda.start();

    agenda.define('In five seconds', function (job, done) {
        console.log('hello world!');
        done();
    });

    agenda.schedule('in 5 seconds', 'Mohamed was here', {
        time: new Date()
    });
    // agenda.start();

    console.log('Wait 5 seconds...');

    const enc = encodeURIComponent('!')
    console.log('Encoded Value :', enc);
}

run();