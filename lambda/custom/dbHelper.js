const AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-1"
});
const tableName ="Vault";
var dbHelper = function(){};
var docClient = new AWS.DynamoDB.DocumentClient();

dbHelper.prototype.addPass = (password, username, userID) => {
    return new Promise((resolve, reject) => {
        var params = {
            TableName : tableName,
            KeyConditionExpression: "#un = :username and #uid = :userID",
            ExpressionAttributeNames:{
                "#un": "username",
                "#uid": "userID"
            },
            ExpressionAttributeValues: {
                ":username": username,
                ":userID": userID
            }
        };
        docClient.query(params, function(err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
    return new Promise((resolve, reject) => {
        const params ={
            TableName: tableName,
            Item:{
                'password': password,
                'username': username,
                'userID': userID
            }
        };
        docClient.put(params,(err, data) => {
            if(err){
                console.log("Unable to Insert =>", JSON.stringify(err));
                return reject("Unable to Insert");
            }
            console.log("Saved the data, ", JSON.stringify(data));
            resolve(data);
        })
    })
}
});
});
}
dbHelper.prototype.getPass = (username, userID) => {
    return new Promise((resolve, reject) => {
        const params ={
            TableName: tableName,
            Key:{
                'username': username,
                'userID': userID
            },
        
            ConditionExpression: "attribue_exists(username)"
        };
        docClient.get(params,(err, data) => {
            if(err){
                console.log("Unable to get the password =>", JSON.stringify(err));
                return reject("Unable to get the password ");
            }
            console.log("Here is the password , ", JSON.stringify(data.Item.password));
            resolve(data.Item.password);
        });
    });
}
dbHelper.prototype.updatePass = (password, username, userID) => {
    return new Promise((resolve, reject) => {
        const params ={
            TableName: tableName,
            Item:{
                'password': password,
                'username': username,
                'userID': userID
            }
        };
        docClient.update(params,(err, data) => {
            if(err){
                console.log("Unable to Update =>", JSON.stringify(err));
                return reject("Unable to Update");
            }
            console.log("Updated the data, ", JSON.stringify(data));
            resolve(data);
        });
    });
}
dbHelper.prototype.findQuery = (username, userID) => {
    return new Promise((resolve,reject) => {
        var params = {
            TableName : tableName,
            KeyConditionExpression: "#un = :username and #uid = :userID",
            ExpressionAttributeNames:{
                "#un": "username",
                "#uid": "userID"
            },
            ExpressionAttributeValues: {
                ":username": username,
                ":userID": userID
            }
        };
        
        docClient.query(params, function(err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                console.log("Query succeeded.");
                console.log(JSON.stringify(data.Items.password));
                resolve(data.Items.password);
            }
        });
    })
}
dbHelper.prototype.removePass = (username, userID) => {
    return new Promise((resolve, reject) => {
        const params ={
            TableName: tableName,
            Key:{
                'username': username,
                'userID': userID
            },
            ConditionExpression: "attribue_exists(username)"
        };
        docClient.delete(params,(err, data) => {
            if(err){
                console.log("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2))
                return reject(JSON.stringify(err, null, 2));
            }
            console.log(JSON.stringify(err));
            console.log("Deleted Item", JSON.stringify(data, null, 2));
            resolve();
        });
    });
}

module.exports = new dbHelper();