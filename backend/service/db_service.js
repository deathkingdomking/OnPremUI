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
                "auto.offset.reset": "earliest",
                "auto.commit.enable": "true",
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
    let res = await rp(consumerOption)
    return res.map((msg) => msg.value)
}

function create_table(cb){
    db.run("CREATE TABLE IF NOT EXISTS recognition (source TEXT, location TEXT, titile TEXT, id TEXT, timestamp INTEGER, behaviors TEXT)", cb)
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
function formatBehaviours(row){
    let behaves = new Set();
    if(row.result.behaviors !== undefined) {
        row.result.behaviors.forEach((beh) => {
             if(beh != "") {
                 beh.split(";").forEach((b) => {
                     behaves.add(b)
                 })
             }
        });
        return  [...behaves].join(",");
    }
    else {
        return "";
    }
}
function insert_data(data, cb) {
    let stmt = db.prepare("INSERT INTO recognition VALUES (?, ?, ?, ?, ?, ?)");
    data.forEach((row) => {
        stmt.run([row.result.source, "CNZH", row.description, row.id, row.ec_event_time, formatBehaviours(row)])
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
async function init(cb){
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
                let outputFile = fs.createWriteStream(`./public/images/${msg.ec_event_time}.png`);
                readable.pipe(outputFile);
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
}
init(() => console.log("a"));
module.exports = {
    consume: init,
    query: readRows,
};


