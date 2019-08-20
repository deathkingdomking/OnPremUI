const sqlite3 = require("sqlite3").verbose();
const rp = require('request-promise');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const { Readable} = require('stream');


const process = require('process');
const sharp = require('sharp');

process.env.UV_THREADPOOL_SIZE=128;
const BASE_URL="https://kafka.luoxinshe.cn/consumers/recognized-test-group";
const commonHeader = {
    "Content-Type": "application/vnd.kafka.v2+json",
    "Accept": "application/vnd.kafka.avro.v2+json",
};
const DB = "./dbsql";
async function getConsumerEndPoint(){
    try{
        const createConsumerOption = {
         method: "POST",
         uri: `${BASE_URL}`,
         json: true,
         body: {
             "name": "my-consumer",
             "format": "avro",
             "auto.offset.reset": "latest",
             "auto.commit.enable": "false",
         },
         headers: commonHeader
     };
        let consumers = await rp(createConsumerOption);
        const subscriptionOption = {
        method: "POST",
        uri: `${BASE_URL}/instances/${consumers.instance_id}/subscription`,
        headers: commonHeader,
        json: true,
        body:{
            "topics": ["eventcollector.local.science.recognize-test"]
        },
    };
        await rp(subscriptionOption);
        return `${BASE_URL}/instances/${consumers.instance_id}`;
    } catch (e) {
        console.error(e);
        return `${BASE_URL}/instances/my-consumer`;
    }
}

async function  consume(endpoint){
    const consumerOption  = {
        method: "GET",
        uri: `${endpoint}/records?timeout=1000&max_bytes=102400`,
        headers: commonHeader,
        json: true,
    };
    return (await rp(consumerOption)).map((msg) => msg.value)
}

function create_table(cb){
     db.run("CREATE TABLE IF NOT EXISTS recognition (source TEXT, location TEXT, floor TEXT, title TEXT, id TEXT, timestamp INTEGER)", cb)
}
function readRows(params, cb) {
    let query = "SELECT * FROM recognition";
    if(Object.keys(params).length > 0) {
        query += " where ";
        if("floor" in params) {
            query += ` floor=${params.floor} and`
        }
        if("building" in params) {
            query += ` building=${params.building} and`
        }
        if("startTime" in params) {
            query += ` timestamp > ${params.startTime} and`
        }
        if("endTime" in params) {
            query += ` timestamp < ${params.endTime} and`
        }
        query += ' 1=1';
    }
    db.all(query, function(err, rows) {
        if(err) cb({
            status: -1,
            msg: err.toString()
        });
        else {
            cb(rows);
        }
    });
}
function insert_data(data, cb) {
    let stmt = db.prepare("INSERT INTO recognition VALUES (?, ?, ?, ?, ?, ?)");
    data.forEach((row) => {
        row_rec = [row.result.source, row.object.Displayname, row.object.area.displayName, row.description, row.id, row.ec_event_time]
        console.log(`insertion of ${row_rec} into db`)
        stmt.run([row.result.source, row.object.Displayname, row.object.area.displayName, row.description, row.id, row.ec_event_time])
    });
    stmt.finalize(cb);
}

function drawRectangle(msg, readable){
    let rects = msg.result.positions.map((coordinate) => {
        let rect = Buffer.from(
            `<svg><rect x="0" y="0" width="${coordinate.w}" height="${coordinate.h}"
               style="stroke: #009900;
                stroke-width: 3;
                fill: none;
                "
            /></svg>`
        );
        return {
            input: rect,
            blend: 'atop',
            left: coordinate.x,
            top: coordinate.y
        }
    });
    const rectComposition= sharp()
            .composite(rects)
            .png();
    let outputFile = fs.createWriteStream(`./public/images/${msg.ec_event_time}.png`);
    readable
        .pipe(rectComposition)
        .pipe(outputFile);
}

/*async function init(cb){
    db = new sqlite3.Database(DB);
    create_table();
    let endpoint = await getConsumerEndPoint();
    setInterval(async () => {
        try{
            let msgs = await consume(endpoint);
            await Promise.all(msgs.map((msg) => (async () => {
                let buf = await rp.get({
                    url: msg.result.source,
                    encoding: null,
                });
                const readable = new Readable();
                readable._read = () => {} ;
                readable.push(buf);
                readable.push(null);
                drawRectangle(msg, readable);
            })()));
            msgs.forEach((msg) => {
                msg.result.source = `/public/images/${msg.ec_event_time}.png`;
                msg.id = uuidv4();
            });
            insert_data(msgs, () => {
                console.log(`insertion of ${msgs.length} size data finished`)
            });
            if(cb) cb(msgs);
        } catch (e) {
            console.error(e)
        }
    }, 1000)
}*/

function process_stream_and_do_insert(filename) {
    if (filename.search('json') != -1 && filename.search('kafka') != -1 && fs.existsSync('/public/images/' + filename)) {
        var kafkaString = fs.readFileSync('/public/images/' + filename, 'utf8')            
        var obj = JSON.parse(kafkaString);

        fs.copyFile('/public/images/' + obj.result.source, './public/images/' + obj.result.source, (err) => {
            if (err) throw err;
            console.log('image was copied');
        });

        obj.result.source = '/public/images/' + obj.result.source
        obj.ec_event_time = obj.ec_event_time * 1000
        console.log(obj)
        obj.id = uuidv4()  

        insert_data([obj], () => {
            console.log(`insertion of new data finished`)
        });
    }   
}


async function init(cb){
    console.log('init db!!!')
    db = new sqlite3.Database(DB);
    create_table();
    // let endpoint = await getConsumerEndPoint();

    fs.readdir('/public/images/', function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            console.log(file); 
            process_stream_and_do_insert(file)
        });
    });
        

    /*chokidar.watch('/public/images/',  {ignored: /(^|[\/\\])\../}).on('add', (eventType, filename) => {
        console.log(eventType);
        console.log(filename);  
        process_stream_and_do_insert(filename)
    })*/

    fs.watch('/public/images/', (eventType, filename) => {
        console.log(eventType);
        console.log(filename);
        process_stream_and_do_insert(filename)
    })
}

module.exports = {
    consume: init,
    query: readRows,
};


