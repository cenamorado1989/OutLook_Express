const report = new SERA({
                receivedDateTime: result.value[0].receivedDateTime,

                sentDateTime: result.value[1].sentDateTime
                //
            });
            //to push everything
            // report.insertMany(result.value)
            // save stores into database
            report.save().then(result => {
                    console.log(result)
                })
                // error checking
                // promise
                .catch((err) => console.log(err))

            res.status(201).json({
                message: "Handling post request to /api/report",
                createdReport: report
            });