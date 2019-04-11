var my_json = {

    '@odata.context': "https://graph.microsoft.com/v1.0/$metadata#users('92cf84e2-fa6b-4ac7-b26a-621262b878a9')/mailFolders('inbox')/messages(subject,from,receivedDateTime,isRead,sentDateTime)",
    '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/mailfolders/inbox/messages?$search=+%22from%3a%40student.gsu.edu%22&$top=5&$select=subject%2cfrom%2creceivedDateTime%2cisRead%2csentDateTime&$count=true&$skiptoken=MSZZVlF4YUUxSFRUUlBWRVYzV1hrd2VrOVVWWGxNVkZFMVdtcE5kRmxxV214T1F6QTBUbFJGZUU1WFRYcGFWRUV5VDBScmJXTjZNREU9',
    value: [{
            '@odata.etag': 'W/"CQAAAA=="',
            id: 'AAMkADg4MTBkNmRiLTAwNzQtNDE1Ny1hNjlkLWVjNzE5N2M1MGEwMgBGAAAAAAA9yT6uaq2hTrV0L6GqHQ_CBwALVVFnK27cQ4tC6FzqOc3cAAAAAAEMAAALVVFnK27cQ4tC6FzqOc3cAANuNGz-AAA=',
            receivedDateTime: '2019-03-09T03:45:45Z',
            sentDateTime: '2019-03-09T03:45:44Z',
            subject: 'Re: hw3',
            isRead: true,
            from: JSON.stringify({
                emailAddress: {
                    name: 'Qing Su',
                    address: 'qsu3@student.gsu.edu'
                }
            })
        },
        {
            '@odata.etag': 'W/"CQAAAA=="',
            id: 'AAMkADg4MTBkNmRiLTAwNzQtNDE1Ny1hNjlkLWVjNzE5N2M1MGEwMgBGAAAAAAA9yT6uaq2hTrV0L6GqHQ_CBwALVVFnK27cQ4tC6FzqOc3cAAAAAAEMAAALVVFnK27cQ4tC6FzqOc3cAANqc1QaAAA=',
            receivedDateTime: '2019-03-04T12:54:04Z',
            sentDateTime: '2019-03-04T12:52:51Z',
            subject: 'resume',
            isRead: true,
            from: JSON.stringify({
                emailAddress: {
                    name: 'Mohamed A Ali',
                    address: 'mali30@student.gsu.edu'
                }
            })
        },
        {
            '@odata.etag': 'W/"CQAAAA=="',
            id: 'AAMkADg4MTBkNmRiLTAwNzQtNDE1Ny1hNjlkLWVjNzE5N2M1MGEwMgBGAAAAAAA9yT6uaq2hTrV0L6GqHQ_CBwALVVFnK27cQ4tC6FzqOc3cAAAAAAEMAAALVVFnK27cQ4tC6FzqOc3cAANmFSAyAAA=',
            receivedDateTime: '2019-03-01T17:49:13Z',
            sentDateTime: '2019-03-01T17:49:11Z',
            subject: 'test',
            isRead: true,
            from: JSON.stringify({
                emailAddress: {
                    name: 'Mohamed A Ali',
                    address: 'mali30@student.gsu.edu'
                }
            })
        },
        {
            '@odata.etag': 'W/"CQAAAA=="',
            id: 'AAMkADg4MTBkNmRiLTAwNzQtNDE1Ny1hNjlkLWVjNzE5N2M1MGEwMgBGAAAAAAA9yT6uaq2hTrV0L6GqHQ_CBwALVVFnK27cQ4tC6FzqOc3cAAAAAAEMAAALVVFnK27cQ4tC6FzqOc3cAANmFSAgAAA=',
            receivedDateTime: '2019-02-28T22:10:55Z',
            sentDateTime: '2019-02-28T22:10:01Z',
            subject: '',
            isRead: true,
            from: JSON.stringify({
                emailAddress: {
                    name: 'Mohamed A Ali',
                    address: 'mali30@student.gsu.edu'
                }
            })
        },
        {
            '@odata.etag': 'W/"CQAAAA=="',
            id: 'AAMkADg4MTBkNmRiLTAwNzQtNDE1Ny1hNjlkLWVjNzE5N2M1MGEwMgBGAAAAAAA9yT6uaq2hTrV0L6GqHQ_CBwALVVFnK27cQ4tC6FzqOc3cAAAAAAEMAAALVVFnK27cQ4tC6FzqOc3cAANmFR-iAAA=',
            receivedDateTime: '2019-02-26T22:28:21Z',
            sentDateTime: '2019-02-26T22:22:42Z',
            subject: '',
            isRead: true,
            from: JSON.stringify({
                emailAddress: {
                    name: 'Mohamed A Ali',
                    address: 'mali30@student.gsu.edu'
                }
            })
        }
    ]
}

// function getProperty(json, path) {
//     var tokens = path.split(".");
//     var obj = json;
//     for (var i = 0; i < tokens.length; i++) {
//         obj = obj[tokens[i]];
//     }
//     return obj;
// }

// var fields = ["id", "subject", "isRead"];

// for (var i = 0; i < fields.length; i++) {
//     var value = getProperty(my_json, fields[i]);
//     console.log(fields[i] + "=" + value);
// }

// how to access in the json
console.log(my_json.value[0].id)

console.log(my_json.value[0].from.name)