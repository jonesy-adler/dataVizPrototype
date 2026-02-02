/* ~~~ HTMLsetup.js ~~~
 *
 * Author: Jonesy
 * Project: Exhibit Data Visualization
 * Last updated: 1/29/2026
 * 
 * This file contains functions for interactive html elements and sets up the initial page layout for data visualization.
 * 
 */


import Exhibit from 'http://alkaid.adlerplanetarium.org/usageTracking/exhibitClass.js';

Chart.defaults.font.family = "Montserrat-Regular";
Chart.defaults.font.size = 18;
Chart.defaults.color = '#000';

const chartCanvas = document.getElementById('chartCanvas'); //Canvas holding main data chart

// closePopout clears the popout window elements and returns to the normal chart view
function closePopout(){
	$('#chartDiv').css('opacity', 1).css('background-color', 'white');
	$('#overviewDiv').css('opacity', 1).css('background-color', 'white');
	$('#popoutDiv').css('display', 'none');
	$('#grayoutDiv').css('display', 'none');
	$('#YoYButton').css('visibility', 'hidden'); 
}
            
// The next few functions are used by the interactive HTML elements to change the currently viewed chart.

// The changeGallery function is responsible for actually pulling exhibit and table data from the servers. This is async because fetching the required json files is promise based.
async function changeGallery(gallery){
		current.gallery = gallery;
		if (mainChart){
        	mainChart.destroy();
    	}
		$('#backgroundText').html('Loading data...');
    	await fetch(`http://alkaid.adlerplanetarium.org/usageTracking/JSON/${gallery}Config.json`) // Fetch the entire config json file for the associated gallery.
			.then(response => {
        		if (!response.ok) {
                	console.error(`Error fetching gallery data: ${response.status}`);
                	return;
            	}
            	return response.json(); // Get the json file from the response.
			})
			.then(async JSON => { // Process each element in the json array into an exhibit class object.
				const galleryJSON = JSON;
				const exhibitPromises = []; // Create an array to hold the promises created by fetching the exhibit data.
				exhibits = new Array(galleryJSON.length); //Exhibits is defined in the 'globals.js' file for reference across multiple scripts. Here it is set to an empty array for the exhibit objects to be stored in.
				for (const [exhibitIndex, exhibitJSON] of galleryJSON.entries()){
					const exhibit = new Exhibit(exhibitJSON.ID, "Data Visualization"); // Create an exhibit object for each exhibit ID in the json file. This is passed the string 'Data Visualization' to note that any errors come from this page and not that actual exhibit.
				
					const exhibitPromise = exhibit.fetchExhibitData(galleryJSON) // Pull the exhibit properties from the JSON array.
						.then(() => exhibit.fetchTypeData()) // Once exhibit data is retrieved, pull the data for its exhibit types.
						.then(async () => { // Once type data is retrieved, pull data from the SQL tables and organize them into table objects. This must be async to wait for all the table fetches to resolve.
							if(exhibit.errorLog()){
								return;
							}
							const tableData = {}; // Create an empty object to hold table data.
							const tablePromises = []; // Create an array to hold the promises created by fetching table data.
               				for (const table of exhibit.tables){
				    			const tablePromise = exhibit.fetchTableData(table) // Fetch the table data.
									.then(data => { // Pass the retrieved data to the tableData object.
										tableData[table] = data;
									});
								tablePromises.push(tablePromise);
                			}
							await Promise.all(tablePromises); // Wait for all of the promises from fetching table data to resolve. Table data will be pulled asynchronously but we will not move on until all the data is pulled.

							exhibit.table = new Table(tableData, exhibit); // Create a table class object with all of the data pulled from SQL and bind it to the exhibit.
							exhibit.startingYear = exhibit.table.startingYear;
							exhibit.startingMonth = exhibit.table.startingMonth;
					
							exhibits[exhibitIndex] = exhibit; // Store the exhibit in the exhibits array. The index is passed so that exhibits will be displayed in the order that they are in the JSON file, -not- the order that the fetch calls finish in.
						});
					exhibitPromises.push(exhibitPromise);
				}
			
				await Promise.all(exhibitPromises); // Wait for all of the promises from gathering exhibit data to resolve. Exhibit data will be pulled asynchronously but we will not move on until all the data is pulled.

				// Set some properties based on the first exhibit:
				current.exhibit = [exhibits[0]];
				current.data = [current.exhibit[0].stats[0]];
    			const firstTable = current.exhibit[0].table;
   				[current.year, current.month, exhibits.endingYear, exhibits.endingMonth] = [firstTable.startingYear, Number(firstTable.startingMonth), firstTable.endingYear, firstTable.endingMonth];

				$('#selectExhibit').empty();

				// Create a list of exhibits for the selectExhibit menu:
				for (const exhibit of exhibits){
					let option = document.createElement("option");
					option.value = exhibits.indexOf(exhibit);
					option.text = exhibit.name;
					$('#selectExhibit').append(option);
				}

				$('#backgroundText').html('');
				changeExhibit(0);
			})
		/*	.catch(error => {
				console.error(`Error fetching gallery data: ${error}`);
			});*/
}

// Change the currently displayed exhibit. Handles updating the data categories to be displayed.
function changeExhibit(exhibitIndex){
	if (exhibitIndex == 'all'){ // If the compare exhibits button is clicked, the index passed will be 'all', and all exhibits of the group will be shown.
		$('#selectExhibit').val('');
		current.exhibit = exhibits.filter(exhibit => exhibit.group == current.exhibit[0].group);
	} else {
		current.exhibit = [exhibits[exhibitIndex]];
	}

	if (!current.exhibit[0].stats.includes(current.data[0])){
		changeData(current.exhibit[0].stats[0])
	}

	$('#selectData').empty();

	let option;
	
	for (const stat of current.exhibit[0].stats){
		if (stat.includes('Choice') && !(stat in stats)){

			stats[stat] = {name: camelSplit(stat).replace('Data', ''), unit: '# Times chosen'};
		}
		option = document.createElement("option");
		option.value = stat;
		option.text = stats[stat].name;
		$('#selectData').append(option);
	}

	$('#selectData').val(current.data[0]);

	if (current.exhibit[0].type == 'dwellVideo'){
		option = document.createElement("option");
		option.value = 'activationRatio';
		option.text = 'Activation vs Dwell Time';
    	$('#selectData').append(option);
	}

	if (current.year < current.exhibit[0].startingYear){
		current.year = current.exhibit[0].startingYear;
		current.month = current.exhibit[0].startingMonth;
	}
	else if (current.year == current.exhibit[0].startingYear && current.month < current.exhibit[0].startingMonth){
		current.month = current.exhibit[0].startingMonth;
	}

	const buttonVis = current.exhibit[0].group && exhibitIndex != 'all';
	$('#compareButton').css('visibility', buttonVis ? 'visible' : 'hidden');

	changeMonth();

	generateChart();
}

function changeChart(chart){
	current.chart = chart;
	generateChart();
}  

function changeData(data){
        if (data == 'activationRatio'){
            current.data = ['totalActivation', 'totalDwell'];
        } 
                    
        else {
		    current.data = [data];
        }
	    generateChart();
}

function changeDay(day){
	current.day = day;
	generateChart();
}

function changeMonth(direction = null){
	if (direction == "previous"){
		if (current.year == current.exhibit[0].startingYear && current.month == current.exhibit[0].startingMonth){
			return;
		}
		current.month--;

		if (current.month == 0){
			current.month = 12;
			current.year--;
		}
	} else if (direction == "next"){
		if (current.year == exhibits.endingYear && current.month == exhibits.endingMonth){
			return;
		}
		current.month++;
		if (current.month == 13){
			current.month = 1;
			current.year++;
		}
	}
    if (current.year == current.exhibit[0].startingYear && current.month == current.exhibit[0].startingMonth){
		$('#leftMonthArrow').css('opacity', 0.25);
	} else {
		$('#leftMonthArrow').css('opacity', 1);
	}

	if (current.year == exhibits.endingYear && current.month == exhibits.endingMonth){
		$('#rightMonthArrow').css('opacity', 0.25);
	} else {
		$('#rightMonthArrow').css('opacity', 1);
	}   
				
	$('#monthDisplay').html(`${current.month}-${current.year}`);

	generateChart();
}



for (const gallery of galleryList){
	let option = document.createElement("option");
	option.value = gallery.id;
	option.text = gallery.name;
	$('#selectGallery').append(option);
}

$('#selectGallery').change(() => {
	changeGallery($('#selectGallery').val());
})

await changeGallery(galleryList[0].id);

$('#selectExhibit').change(() => {
	changeExhibit($('#selectExhibit').val());
});

$('#selectData').change(() => {
	changeData($('#selectData').val());
});

for (const day of dayNames){
	let option = document.createElement("option");
	option.value = day;
	option.text = day;
	$('#selectDay').append(option);
}

$('#selectDay').change(() => {
	changeDay($('#selectDay').val());
});


$('#selectChart').change(() => {
	if ($('#selectChart').val() == 'dayAndHour'){
		$('#selectDay').css('visibility', 'visible');
		$('#dayLabel').css('visibility', 'visible');
	} else {
		$('#selectDay').css('visibility', 'hidden');
		$('#dayLabel').css('visibility', 'hidden');
	}
	changeChart($('#selectChart').val());
});

$('#monthDisplay').html(`${current.month}-${current.year}`);

$('#monthFilter').change(() => {
	current.monthView = $('#monthFilter').is(":checked");
	$('#monthSelectDisplay').css('visibility', current.monthView ? 'visible' : 'hidden');
	generateChart();
});

    
$('#leftMonthArrow').click(() => {
	changeMonth('previous');
});

$('#rightMonthArrow').click(() => {
	changeMonth('next');
});

$('#compareButton').click(() => {
	changeExhibit('all');
})

// Clicking on the chart on one of the bars will bring up a popup menu with full information about the selected timeframe.
chartCanvas.onclick = (event => { generatePopout(event)});

// Clicking on the 'date over year' button will display a new chart comparing the selected date over every year represented in the data.
$('#YoYButton').click(() => {
	closePopout();
	current.monthView = false;
	$('#selectChart').val('');
	changeChart('dateOverYear');
	current.monthView = $('#monthFilter').is(":checked");
});
           
//Clicking the 'X' in the corner of the popout will close it and bring back the main chart.
$('#closePopout').click(closePopout);
