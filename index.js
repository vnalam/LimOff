var express = require('express');
var router = express.Router();
var Sequelize = require('sequelize');
var cacher = require('sequelize-redis-cache');
var redis = require('redis');
var rc = redis.createClient(6379, 'localhost');
var sequelize = new Sequelize('vinay', 'root', 'vinayraj4', 
	{
		host: "127.0.0.1",
		port: 3306,
		maxConcurrentQueries: 1000,
		dialect: 'mariadb'
	})
var User = sequelize.define('home', 
	{
		eName:Sequelize.STRING,
		eEmail: Sequelize.STRING,
		salary: Sequelize.INTEGER
	});
var cacheObj = cacher(sequelize, rc)
		.model('home')
		.ttl(1000);
		
		
//Insert API

router.post('/api/insert', function(req, res, next) 
	{
		var name=req.body.ename;
		var email=req.body.email;
		var salary=req.body.salary;
		console.log(name+""+email+""+salary)
		User.create(
		{
			"eName":name,
			"eEmail":email,
			"salary":salary	
		}).then(function(vin) 
		{
			res.json(vin);
		},function(error)
			{
				res.send(error);
			});
	});


//Defining salfunction

	
var salfunction=function(empdata, next, callback)
	{
		console.log(JSON.stringify(empdata))
		var str=empdata.str
		console.log("str"+str);
		var salary=empdata.salary
		console.log("salary"+salary)
		var off=empdata.a;
		console.log("offset"+off)
		var lim=empdata.b;
		console.log("limit"+lim);
		var myarray=[];

		if(str==undefined)
		{
			myarray.push("eName","id");
		}
		else
		{
			myarray = str.split(',');
			for(var i = 0; i < myarray.length; i++)
			{
				console.log(myarray[i]);
			}
		}

		cacheObj.findAll(
		{ 
			where: { salary:salary },
			offset:off,
			limit:lim,
			order: [['eName', 'DESC']],
			attributes:myarray
		}).then(function(user) 
		{
			console.log(user); // sequelize db object 
			console.log(cacheObj.cacheHit); // true or false
			console.log("output"+JSON.stringify(user))
			callback({"resultset":user})	
		}).catch(next);
	}
	
	
//Retrieve API

router.get('/api/retrieve/:salary', function(req, res,next) 
	{
		var salary = req.param('salary');
		var lim = req.query.limit
		var off= req.query.offset
		console.log("Limit"+lim+"  "+"offset"+off)
		var str = req.query.data;
		console.log(str);
		var c=0;
		if(lim==undefined && off==undefined)
		{
			console.log("No limit and no offset")
			var a=0;
			cacheObj.findAll(
			{
				where: { salary:salary }
			}).then(function(mani) 
			{	
				var c=parseInt(mani.length)
				console.log("Count"+mani.length);
				var empdata=
				{
					salary:salary,
					str:str,
					a:a,
					b:c
				}
				salfunction(empdata,next,function(responsedata)
				{
					res.json(responsedata);
				})
			})	
		}
		//main else
		else
		{ 
			console.log("else")
			var c=0;
			cacheObj.findAll(
			{
				where: { salary:salary }
			}).then(function(mani) 
			{
				c=parseInt(mani.length)
				console.log("Count"+mani.length);
				if(lim==undefined)
				{
					if(off==undefined)
					{
						var a=0;
						var empdata=
						{
							salary:salary,
							str:str,
							a:a,
							b:c
						}
						salfunction(empdata,next,function(callback)
						{
							res.json(callback);
						})
			
					}
					else
					{
						var a=parseInt(off)
						if(c>a)
						{
							var empdata=
							{
								salary:salary,
								str:str,
								a:a,
								b:c
							}
							salfunction(empdata,next,function(callback)
							{
								res.json(callback);
							})
						}
						else
						{
							res.send({"error":"Check offset range"})
						}
					}
				}
				else
				{
					if(off==undefined)
					{
						var b=parseInt(lim)
						var empdata=
						{
							salary:salary,
							str:str,
							a:0,
							b:b
						}
						salfunction(empdata,next,function(callback)
						{
							res.json(callback);
						})
					}
					else
					{
						var a=parseInt(lim)
						var b=parseInt(off)
						if(c>b)
						{
							var empdata=
							{
								salary:salary,
								str:str,
								a:b,
								b:a
							}
							salfunction(empdata,next,function(callback)
							{
								res.json(callback);
							})
						}
						else
						{
							res.send({"developerMessage":"Please set exact range to offset",
										"status":"400",
										"errorCode":"offset error",
										"moreInfo":"provide offset range by comparing count"
									})
						}
					}
				}
			})	
		}

	})		
			
			
		
		
//update API		

router.post('/api/update', function(req, res) 
	{
		var email=req.body.email;
		var name=req.body.name;
		var salary=req.body.salary;
			User.find({where:{salary:salary}}).then(function(upd){
				if(upd){
					upd.update({
						eName:name,
						eEmail:email,
						salary:salary
					}).then(function(){
						console.log('update success')
					})
					
				}
			
			});
	});	
	
module.exports = router;
