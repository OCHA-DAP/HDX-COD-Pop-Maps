let colourSchemes = [
	['#BBDEFB','#90CAF9','#42A5F5','#1E88E5','#1565C0','#0D47A1'],
	['#B2DFDB','#80CBC4','#26A69A','#00897B','#00695C','#004D40'],
	['#FFE0B2','#FFCC80','#FFA726','#FB8C00','#EF6C00','#E65100'],
];

let adminRef = ['admin1name_en','admin1name_es','admin1name_fr'];




function init(countryCode,level,pop){
	let tempCountry = getQueryVariable('iso3');
	if(tempCountry ==false){
		$('#countryselectbox').show();
	} else {
		$('#countryselectbox').hide();
		countryCode=tempCountry.toUpperCase();
	}
	let countryCodeList = createCountrCodeList();
	$('#countryselect').on('change',function(){
		console.log('country change');
		updateMapMenu($(this).val().toUpperCase());
	});
	createCountryMenu(countryCodeList);
	updateMapMenu(countryCode);
	loadData(countryCode,level,pop);

	$('.mapchoice').on('change',function(){
		updateMap();
	});
}

function getName(properties){
	let name = undefined;
	adminRef.forEach(function(ref){
		if(properties[ref]!=undefined)
			name = properties[ref]
			return name
	});
	return name
}

function updateMap(){
	let countryCode = $('#countryselect').val().toUpperCase();
	let pop = $('#mapselect').val().toLowerCase();
	let level = $('#levelselect').val();
	let tempCountry = getQueryVariable('iso3');
	if(tempCountry ==false){
		$('#countryselectbox').show();
	} else {
		$('#countryselectbox').hide();
		countryCode=tempCountry.toUpperCase();
	}
	console.log(countryCode);
	console.log(pop);
	console.log(level);
	removeExistingMap();
	loadData(countryCode,level,pop);
}

function removeExistingMap() {
    if (map != null) {
        map.remove();
        map = null;
    }
}

function updateMapMenu(code){
	let country = getCountry(code);
	$('#levelselect').html('');
	console.log(country);
	console.log(country['Max level covered']);
	for(i=1;i<=country['Max level covered'];i++){
		$('#levelselect').append('<option>'+i+'</option>');
	}
}

function getCountry(code){
	let output = {};
	coverage.forEach(function(country){
		if(country['country code'].toUpperCase()==code){
			output = country;
		}
	});
	return output;
}

function createMap(countryCode,data,level,pop){

	let pcodeAtt = 'admin'+level+'pcode';

	let colourIndex = {'total':0,'female':1,'male':2}
	colourIndex = colourIndex[pop];
	
	var basemap =  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	        maxZoom: 19,
	        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
	      });

	var CODVectorLayer = L.vectorGrid.protobuf('https://apps.itos.uga.edu/CODV2API/api/v1/Themes/cod-ab/locations/'+countryCode+'/versions/current/'+level+'/{z}/{x}/{y}.pbf', {
	  maxZoom: 14,
	  maxNativeZoom: 16,
	  rendererFactory: L.canvas.tile,
	  vectorTileLayerStyles: {
		    PROJ_LIB:function(properties) {

		    let dataRow = data[properties[pcodeAtt]];
		    if(dataRow!=undefined){
						let value = dataRow[pop];
			    	mapColor = colourSchemes[colourIndex][0]
			    	if(value == undefined){
			    		console.log(data);
			    		console.log(properties[pcodeAtt]);
			    	}

			    	if(value>50000){
			    		mapColor = colourSchemes[colourIndex][1]
			    	}
			    	if(value>100000){
			    		mapColor = colourSchemes[colourIndex][2]
			    	}
			    	if(value>250000){
			    		mapColor = colourSchemes[colourIndex][3]
			    	}
			    	if(value>500000){
			    		mapColor = colourSchemes[colourIndex][4]
			    	}
			    	if(value>1000000){
			    		mapColor = colourSchemes[colourIndex][5]
			    	}
		    } else {
		    		console.log(properties[pcodeAtt]);
		    		console.log(data);
		    		console.log(properties);
		    		mapColor = '#999999';
		    }

	    	return {
		        weight: 2,
		        fill: mapColor,
		        color:mapColor,
		        dashArray: '3',
		        fillOpacity: 0.7,
		        stroke: '#ffffff',
		        strokeWidth:1
		    }
	    }
	  },
	  interactive: true,
	  getFeatureId: function(f) {
	    return f.properties[pcodeAtt];
	  }
	});


	let country = getCountry(countryCode);


	map = L.map('map', {
	  layers: [basemap],
	  center: [country.lng, country.lat],
	  maxZoom: 18,
	  zoom: country.zoom
	});
	var refname = L.control();

	refname.onAdd = function (map) {
	    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
	    this.update();
	    return this._div;
	};

	// method that we will use to update the control based on feature properties passed
	refname.update = function (props) {
			let name
			if(props!=undefined){
				name = getName(props);
			}
	    this._div.innerHTML = '<h4>Population</h4>' +  (props ?
	        '<p>'+name+'</p><p>'+pop+ ': ' + data[props[pcodeAtt]][pop] + '</p><p>PCode: ' + props[pcodeAtt] +'</p>'
	        : 'Hover over a unit');
	};

	refname.addTo(map);
	CODVectorLayer.on({
		'mouseover':function(e) {refname.update(e.layer.properties)},
		'mouseout':function(e) {refname.update()}

	})


	map.addLayer(CODVectorLayer);

	var legend = L.control({position: 'bottomright'});

	legend.onAdd = function (map) {

		   var div = L.DomUtil.create('div', 'info legend'),
		        grades = [0, 50000, 100000, 250000, 500000, 1000000],
		        labels = [];
		  div.innerHTML += '<h4>Population</h4>'
		   for (var i = 0; i < grades.length; i++) {
		        div.innerHTML +=
		            '<p><i style="background:' + colourSchemes[colourIndex][i] + '"></i> ' +
		            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '</p>' : '+');
		  	}

		    return div;
		};

legend.addTo(map);
}

function processData(data,level){
	output = {}
	let pcodeAtt = 'ADM'+level+'_PCODE'
	data.forEach(function(row){
		output[row[pcodeAtt]] = {'total':row['T_TL'],'male':row['M_TL'],'female':row['F_TL']}
	});
	return output
}

function loadData(countryCode,level,pop){
	let dataURL = 'https://beta.itos.uga.edu/CODV2API/api/v1/themes/cod-ps/lookup/Get/'+level+'/aa/'+countryCode
	console.log(dataURL);
	$.ajax({ 
	    type: 'GET', 
	    url: dataURL,
	    dataType: 'json',
	    success:function(response){
	    	console.log(response[0].Data);
	    	data = processData(response[0].Data,level);
	    	createMap(countryCode,data,level,pop);
	    }
	});
}

function createCountrCodeList(){
	let countryCodeList = []
	coverage.forEach(function(country){
		countryCodeList.push(country['country code'])
	})
	return countryCodeList;
}

function createCountryMenu(countryList){
	countryList.forEach(function(country){
		$('#countryselect').append('<option>'+country+'</option>')
	});
}

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

//inits
let countryCode = 'COL';
let pop = 'total';
let level = 1;
let map
init(countryCode,level,pop);

