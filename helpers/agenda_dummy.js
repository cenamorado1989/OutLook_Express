var Agenda = require('agenda');
var connectionString = "mongodb+srv://mohamedali:Moemo124!@sera-outlook-edxbb.mongodb.net/test?retryWrites=true"
var agenda = new Agenda({
    db: {
        address: connectionString,
        collection: 'outboxes'
    }
});


async function run() {
    await agenda.start();

    agenda.define('hello world', function (job, done) {
        console.log('hello world!');
        done();
    });

    agenda.schedule('in 10 seconds', 'greet the world', {
        time: new Date()
    });
    agenda.start();

    console.log('Wait 10 seconds...');

    const enc = encodeURIComponent('!')
    console.log('Encoded Value :', enc);
}

run();