const express = require("express");
const {WebhookClient}=require("dialogflow-fulfillment");
const {Payload}=require("dialogflow-fulfillment");
const app=express();
const MongoClient=require('mongodb').MongoClient;
var url='mongodb://127.0.0.1:27017';
var randomstring=require("randomstring");
var user_name="";
app.post("/dialogflow",express.json(),(req,res)=>{
    const agent=new WebhookClient({
        request:req,response:res
    });
async function identify_user(agent)
{
    let phoneno=agent.parameters.phonenumber;
    const client =new MongoClient(url);
    await client.connect();
    const snap=await client.db("chatbot").collection("Users").findOne({phoneno:phoneno});
    if(snap==null)
    {
        await agent.add("Re-Enter phone number");
    }
    else{
        user_name=snap.uname;
        await agent.add("Welcome "+user_name+"!! \nHow may I help you");

    }
}
function report_issue(agent)
{
    var issue_value={1:"Internet Down",2:"Slow Internet",3:"Buffering Problem",4:"No Connectivity"}
    var intent_val=agent.parameters.number;
    var val=issue_value[intent_val];

    var trouble_ticket=randomstring.generate(7);

    MongoClient.connect(url,function(err,db)
    {
        if(err) throw err;

        var dbo=db.db("chatbot");

        var u_name=user_name;
        var issue_val=val;
        var status="pending";

        let ts=Date.now();
        let date_ob=new Date(ts);
        let date=date_ob.getDate();
        let month=date_ob.getMonth()+1;
        let year=date_ob.getFullYear();

        var time_date=year+"-"+month+"-"+date;

        var myobj={username:u_name,issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket};
        
        dbo.collection("Issues").insertOne(myobj, function(err,res)
        {
           if(err) throw err;
           db.close();
        });
    
    });
    agent.add("The issue reported is: "+ val +"\n The ticket number is: "+ trouble_ticket);
}
function custom_payload(agent)
{
    var payLoadData=
    {
        "richContent": [
        [
            {
                "type": "list",
                "title": "Internet Down",
                "subtitle": "Press 1 for Internet down",
                "event":
                {
                    "name": "",
                    "languageCode": "",
                    "parameters": {}
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "list",
                "title": "Slow Internet",
                "subtitle": "Press 2 for Slow Internet",
                "event":
                {
                    "name": "",
                    "languageCode": "",
                    "parameters": {}
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "list",
                "title": "Buffering Problem",
                "subtitle": "Press 3 for Buffering Problem",
                "event":
                {
                    "name": "",
                    "languageCode": "",
                    "parameters": {}
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "list",
                "title": "No Connectivity",
                "subtitle": "Press 4 for No connectivity",
                "event":
                {
                    "name": "",
                    "languageCode": "",
                    "parameters": {}
                }
            }
        ]
    ]}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData, {sendAsMessage:true, rawPayload:true }));
}

var intentMap=new Map();
intentMap.set("user", identify_user);
intentMap.set("token - issuenum", report_issue);
intentMap.set("token", custom_payload);

agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 3344);