const fs = require("fs");
const csv = require("csv-parser");

var a = 0;

fs.createReadStream('schedule2.csv')
  .pipe(csv())
  .on('data', function (data) {
  	if (data.blockTitle) {
  		//a = data.blockTitle;
  		console.log(data.blockTitle);
  	}
    //console.log(data);
  })

  console.log("A " + a);

