var app = app || {},
db;
var fileName = window.location.pathname.split('/').pop();

var map;
var markers = [];

var data = data || {};

(function(app, data, $) {

	var defaults = {
		dbName: "specialistNow",
		dbVersion: 1,
		dbDesc: "",
		dbSize: 2 * 1024 * 1024
	};

	app.init = function (options) {

		options = options || {};
		options = $.extend({}, defaults, options);

		db = openDatabase(options.dbName, options.dbVersion, options.dbDesc, options.dbSize);
		db.transaction(function (tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS Users (login TEXT PRIMARY KEY NOT NULL, password TEXT, dob TEXT, name TEXT, phone TEXT)');
			tx.executeSql('INSERT INTO Users VALUES ("admin@admin.com", "password" ,"01/01/1980", "John Smith", "2143534435")');
		});
		db.transaction(function (tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS Doctors (name TEXT PRIMARY KEY NOT NULL, type TEXT, address TEXT, time TEXT, latitude TEXT, longitude TEXT, cbd TEXT, bulk_billed TEXT)');
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Martin Wu','Podiatrist','250 George St Before King St Sydney 2000','16:00','-33.868225','151.209192',1,1)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Smith John','Podiatrist','2/365-377 Kent St, Sydney NSW 2000','8:00',-33.869531,151.204623,1,0)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Alfred Dilbert','Podiatrist','241/238 Pyrmont St,Ultimo NSW 2007','10:00',-33.873001,151.196863,0,0)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Adam Conely','Psychologist','6 Distillery Dr Pyrmont NSW 2009','18:00',-33.868401,151.189765,0,1)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. John Wong','Psychologist','3 Olivia Ln Surry Hills NSW 2010','16:00',-33.889817,151.216124,0,1)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Tim cook','Psychologist','29 Walker St Redfern NSW 2016','18:00',-33.891652,151.208978,0,1)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Robert Fico','Immunologist','The Goods Line Ultimo Pedestrian Network, Ultimo  NSW 2007','10:00',-33.879706,151.201345,0,0)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Gilbert Smith','Immunologist','22 Hickson Rd Millers Point NSW 2000','8:00',-33.857072,151.204256,1,1)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Mel Gibbson','Immunologist','63 Miller St, Pyrmont NSW 2009','10:00',-33.870328,151.192877,0,1)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Aly G','Dermatologist','10/2-10 Quarry Master Dr Pyrmont NSW 2009','18:00',-33.86912,151.18986,0,1)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Paul Yan','Dermatologist','20 Wellington St Chippendale NSW 2008','16:00',-33.886404,151.200508,0,0)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Wu Tang','Dermatologist','184 Chalmers St Surry Hills NSW 2010','8:00',-33.888691,151.206744,0,1)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Alex Neil','Dermatologist','40 Sir John Young Cres, Woolloomooloo NSW 2011','16:00',-33.870939,151.217324,0,0)");
			tx.executeSql("INSERT INTO Doctors VALUES ('Dr. Howard Rip','Dermatologist','2 College St, Sydney NSW 2000','18:00',-33.87281,151.213108,1,1)");
		});

		$('#logout').click(function(){
			app.logout()
		})

		app.checkLogin()

		app.checkBooked()



	};

	app.initMap = function() {
		map = new google.maps.Map(document.getElementById('map'), {
			zoom: 11,
			center: {lat:-33.8666, lng:151.1957}
		});
	}

	var addMarkerToMap = function(position, tooltip, id) {
		if(id){
			var content = "<div>" + tooltip +"<br><a class='btn btn-lg btn-primary' href='confirmation.html?id=" + id + "'>Book now</a></div>";
		}else{
			var content = "<div>" + tooltip + "</div>";
		}
		var infoWindow = new google.maps.InfoWindow({
			content: content,
			maxWidth: 200
		});
		var marker = new google.maps.Marker({
			position: position,
			map: map,
			title: tooltip
		});

		if(!id){
			marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
		}

		marker.addListener('click', function() {
			infoWindow.open(map, marker);
		});
		markers.push(marker);
	}



	app.searchFormSubmitted = function(options, position){
		navigator.geolocation.getCurrentPosition(function(position) {
			
			var myPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)

			var sql = "SELECT rowid,* FROM Doctors WHERE type='"+options.type+"'";
			if(options.bulk_billed){
				sql = sql + " AND bulk_billed = "+ options.bulk_billed;
			}
			if(options.cbd){
				sql = sql + " AND cbd = "+ options.cbd;
			}


			$('#list').empty();

			for (var i = 0; i < markers.length; i++) {
				markers[i].setMap(null);
			}

			markers = [];

			addMarkerToMap(myPosition, 'Your position');

			db.transaction(function (tx) {
				tx.executeSql (sql, [], function (tx, results) {
					var rows = results.rows.length;
					if (rows <= 0) {
						  // alert("Invalid Username Password combination");
						}
						else {
							$.each(results.rows, function(key, value){
								var markerLocation = {lat: parseFloat(value.latitude), lng: parseFloat(value.longitude)}
								var distance = google.maps.geometry.spherical.computeDistanceBetween(myPosition, new google.maps.LatLng(markerLocation))
								generateElement($('#list'),value, distance)
								var tooltip = value.name + " " + value.address;
								addMarkerToMap(markerLocation, tooltip, value.rowid)

							})

						}
					}, null);
			});  


		});      
		
		
	}

	app.initUserForm = function(userId) {
		var sql;

		sql = "SELECT * FROM Users WHERE login='"+userId+"'";

		db.transaction(function (tx) {
			tx.executeSql (sql, [], function (tx, results) {
				var rows = results.rows.length;
			   // console.log("rows returned ="+rows);
			   if (rows <= 0) {
					// alert("Invalid Username Password combination");
				}
				else {
					$.each(results.rows, function(key, value){
						$.each(value, function(k, v){
							k = k.toLowerCase().replace(/\b[a-z]/g, function(k) {
								return k.toUpperCase();
							})
						// console.log(v)
						// console.log($('#input' + k).val('asda'))
						$('#input' + k).val(v)
						// console.log('#input' + k)
					});
					})
					
				}
			}, null);
		});
	}

	app.updateUser = function(options, id) {
		var sql;

		sql = "UPDATE Users SET ";
		var length = Object.keys(options).length;
		var i = 1;
		$.each(options, function(key, value){
			i++;
			sql = sql + key + "='" + value + "'";

			if(i <= length){
				sql = sql + ","
			}

		});
		sql = sql + " WHERE login = '" + id + "'";
		console.log(sql)

		var a = db.transaction(function (tx) {
			tx.executeSql (sql)
		});
	window.location.assign("search.html");}

	app.signUp = function(options, email) {
		var sql;

		sql = "INSERT INTO Users VALUES('"+options.join('\',\'')+"')";

		var a = db.transaction(function (tx) {
			tx.executeSql (sql)
			sessionStorage.setItem("UserID", email)
			window.location.assign("search.html");
		});
	}

	app.login = function(options) {
		var sql;
		
		sql = "SELECT * FROM Users WHERE login='"+options.login+"'";

		db.transaction(function (tx) {
			tx.executeSql (sql, [], function (tx, results) {
				var rows = results.rows.length;
			   // console.log("rows returned ="+rows);
			   if (rows <= 0) {
			   	alert("Invalid Username Password combination");
			   }
			   else {
			   	record = results.rows.item(0);
				// console.log(record)
				if (record['password'] != options.password) {
					alert("Invalid Username Password combination");
				}
				else {
					sessionStorage.setItem("UserID", record.login)
					window.location.assign("search.html");
				}

			}
		}, null);
		});       

	}

	app.initBooked = function (){
		// console.log(sessionStorage.getItem("BookedID"))
		var sql = "SELECT rowid,* FROM Doctors WHERE rowid='"+sessionStorage.getItem("BookedID")+"'";
		$('#list').empty()

		db.transaction(function (tx) {
			tx.executeSql (sql, [], function (tx, results) {
				var rows = results.rows.length;
			   // console.log("rows returned ="+rows);
			   if (rows <= 0) {
					// alert("Invalid Username Password combination");
				}
				else {
					$.each(results.rows, function(key, value){
						generateBookedNow($('#list'),value)
					})
					
				}
			}, null);
		});    
	}

	app.initConfirmation = function (id){
		// console.log(sessionStorage.getItem("BookedID"))
		var sql = "SELECT rowid,* FROM Doctors WHERE rowid='"+id+"'";
		$('#list').empty()

		db.transaction(function (tx) {
			tx.executeSql (sql, [], function (tx, results) {
				var rows = results.rows.length;
			   // console.log("rows returned ="+rows);
			   if (rows <= 0) {
					// alert("Invalid Username Password combination");
				}
				else {
					$.each(results.rows, function(key, value){
						generateConfirmation($('#list'),value)
					})
					
				}
			}, null);
		});    
	}

	app.bookNow = function(rowId){
		sessionStorage.setItem("BookedID", rowId);
		app.checkBooked()
	}

	app.checkBooked = function(){
		if(app.isBooked() && fileName != 'booked.html'){
			window.location.assign("booked.html");
		} 
	}

	app.checkLogin = function(){
		if(fileName == 'sign-up.html'){
			return;
		}
		if(!app.isLoggedIn() && fileName != 'index.html'){
			window.location.assign("index.html");
		} else if(app.isLoggedIn() && fileName == 'index.html'){
			window.location.assign("search.html");
		}
	}

	app.logout = function(){
		sessionStorage.removeItem("UserID");
		sessionStorage.removeItem("BookedID");
		app.checkLogin()
	}

	app.isBooked = function(){
		return sessionStorage.getItem("BookedID") ? true : false;
	}

	app.isLoggedIn = function(){
		return sessionStorage.getItem("UserID") !== null ? true : false;
	}

	// Add Task
	var generateElement = function(parent, params, distance){
		var parent = parent,
		wrapper;

		if (!parent) {
			return;
		}

		wrapper = $("<div />", {
			// "data" : params.id
		}).appendTo(parent);

		$("<div />", {
			"text": params.name
		}).appendTo(wrapper);

		$("<div />", {
			"text": params.address
		}).appendTo(wrapper);

		$("<div />", {
			"text": params.time
		}).appendTo(wrapper);

		$("<div />", {
			"text": parseFloat(distance/1000).toFixed(2) + "km"
		}).appendTo(wrapper);

		$("<a />", {
			// "class" : defaults.todoDescription,
			"href": "confirmation.html?id=" + params.rowid,
			"class": 'bookNow btn',
			"id" : 'book-' + params.rowid,
			"text": "Book now"
		}).appendTo(wrapper);

	};

	var generateConfirmation = function(parent, params){
		var parent = parent,
		wrapper;

		if (!parent) {
			return;
		}

		wrapper = $("<div />", {
		}).appendTo(parent);

		$("<div />", {
			"text": params.name
		}).appendTo(wrapper);

		$("<div />", {
			"text": params.address
		}).appendTo(wrapper);

		$("<div />", {
			"text": params.time
		}).appendTo(wrapper);        

		$("<button />", {
			// "class" : defaults.todoDescription,
			"class": 'bookNow',
			"id" : 'book-' + params.rowid,
			"text": "Book now"
		}).appendTo(wrapper);
	};

	var generateBookedNow = function(parent, params){
		var parent = parent,
		wrapper;

		if (!parent) {
			return;
		}

		wrapper = $("<div />", {
		}).appendTo(parent);

		$("<div />", {
			"text": params.name
		}).appendTo(wrapper);

		$("<div />", {
			"text": params.address
		}).appendTo(wrapper);

		$("<div />", {
			"text": params.time
		}).appendTo(wrapper);
	};
})(app, data, jQuery);