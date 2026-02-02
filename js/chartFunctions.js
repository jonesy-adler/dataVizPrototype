/* ~~~ chartFunctions.js ~~~
 *
 * Author: Jonesy
 * Project: Exhibit Data Visualization
 * Last updated: 1/29/2026
 * 
 * This file contains functions for generating the various charts used for data visualization.
 * 
 */

// generateChart creates and displays a data chart for a given time range and data type
function generateChart(){
    const datasets = []; // This will contain an object for each timeframe represented in the chart, containing the data and the timeframe.
	current.sortedData = []; // This will contain the sorted data for each chart, for reference in the popout data.
    let labels; 

	// Iterate over all the exhibits and all the data types to be represented in the chart.
    for (const [exhibitIndex, exhibit] of current.exhibit.entries()){ 
		// The overviewData object (defined in globals.js) will hold the data to be displayed in the overview section on the right of the chart. 
		overviewData[exhibit.ID] = {};	// Each exhibit in the chart will get its own property of overviewData that is its own object.

        for (const [typeIndex, type] of current.data.entries()){
        	let dataTable = exhibit.table; // Find the table object associated with the current exhibit containing all of the data from the SQL tables.

            if (current.monthView){ // If we are looking at month view, filter out all the data outside of the current month.
                dataTable = dataTable.filterTable([current.year, current.month], 'month');
            }

			const borderWidth = (current.chart == 'date' && !current.monthView) ? 0 : 1; // Remove the border around each bar when in full date view (the bars are mostly border otherwise.)

        	const sortedData = dataTable.sort(); // Sort the full data table into timeframes depending on the current chart view. This returns an object with one array of data tables and another array with the matching timeframes.
			current.sortedData.push(sortedData); // Push the sorted data into an array for later reference.
       		labels = sortedData.timeframe; // The timeframe array from the sorted data becomes labels for the bars.

			// Now we access the data from the tables and prep it to be displayed as bars.
			
            if (type.includes('Choice')){ // Choice data will be displayed as stacked bars.
                const choiceData = {}; // This will hold data for each choice option

                for (const [choiceIndex, choice] of exhibit[`${type}Options`].entries()){ // For each option associated with this choice, create a dataset to be stacked in the chart:
                    const chartData = sortedData.data.map(data => data[type][choice]);
                    const graphLabel = `${exhibit.name}: ${choice} Chosen`;
                    const dataColor = colors[exhibitIndex] + (255 - choiceIndex * 250/(exhibit[`${type}Options`].length)).toString(16);
                    datasets.push({label: graphLabel, data: chartData, borderWidth: borderWidth, borderColor: '#000000', backgroundColor: dataColor, stack: `Stack ${exhibitIndex}`});
                    choiceData[choice] = chartData;
                }

                let choiceMax = 0; 
                let choiceMaxEntry;
                let choiceTotal = 0;
				const choiceCounts = {};

				// Find the total number of choices, the timeframe with the max number of choices, and the highest chosen option in the chart:

                for (const entry of sortedData.data){
                    let entryTotal = 0;
                    for (const choice in entry[type]){
						if (!choiceCounts[choice]){
							choiceCounts[choice] = 0;
						}
						choiceCounts[choice] += entry[type][choice];
                        entryTotal += entry[type][choice];
                    }
                    if (entryTotal > choiceMax){
                        choiceMaxEntry = sortedData.timeframe[sortedData.data.indexOf(entry)];
                        choiceMax = entryTotal;
                    }
                    choiceTotal += entryTotal;
                }
				
				const maxChoiceCount = Math.max(...Object.values(choiceCounts));
				const maxChoiceType = Object.keys(choiceCounts).find(choice => choiceCounts[choice] == maxChoiceCount);

				// Create the overview data object for this exhibit and data type:

                overviewData[exhibit.ID][type] = {
                    max: choiceMax,
                    maxEntry: choiceMaxEntry,
                    total: choiceTotal,
                    get avg() {
					    return parseFloat((this.total / sortedData.data.length).toFixed(2));
				    },
					maxChoiceCount: maxChoiceCount, 
					maxChoiceType: maxChoiceType,
                    color: datasets[0].dataColor
                }
				current.stacks = exhibit[`${type}Options`].length;

            } else { // For any data type other than choice data, the data will be displayed as single bars.

        	    const chartData = sortedData.data.map(data => data[type]);
                const graphLabel = `${exhibit.name}: ${stats[type].name}`;
			    const dataColor = colors[exhibitIndex] + (typeIndex > 0 ? '55' : 'ff');
				
				// Create the overview data object for this exhibit and data type:

			    overviewData[exhibit.ID][type] = {
				    max: Math.max(...chartData),
				    get maxEntry() {
					    return sortedData.timeframe[chartData.indexOf(this.max)];
				    },

				    total: getTotal(chartData),
				    get avg() {
					    return parseFloat((this.total / chartData.length).toFixed(2));
				    },
				    color: dataColor
			    }


				// Create a dataset to be displayed in the chart:
        	    datasets.push({label: graphLabel, data: chartData, borderWidth: borderWidth, borderColor: '#000000', backgroundColor: dataColor, stack: `Stack ${exhibitIndex}`});
				
				current.stacks = 1;

				// If the data type is 'completion', a second stacked bar will be created showing the incomplete sessions:

				if (type == 'completion'){
					const nonCompletionData = sortedData.data.map(data => data.count - data.completion);
                	const nonCompletionLabel = `${exhibit.name}: Sessions Incomplete`;
			   	 	const nonCompletionColor = colors[exhibitIndex] + '55';
					datasets.push({label: nonCompletionLabel, data: nonCompletionData, borderWidth: borderWidth, borderColor: '#000000', backgroundColor: nonCompletionColor, stack: `Stack ${exhibitIndex}`});
					overviewData[exhibit.ID][type].completionRate = (getTotal(chartData) / (getTotal(chartData) + getTotal(nonCompletionData))).toFixed(4) * 100;

					current.stacks = 2;
				}
            }
        }
    }

	// Create the overview data panel for the current chart:
	generateOverview(current.exhibit[0], current.data[0]);

	// Build out the title text:

	let titleText1 = nameList(current.data, stats); // List the full name of all data types in the chart
	let titleText2 = nameList(current.exhibit); // List the full name of all exhibits in the chart
	let titleText3 = '';

	if (current.chart == 'dayAndHour'){
		titleText3 = `hour on ${current.day}`;
	} else if (current.chart == 'dateOverYear'){
		titleText3 = `year on ${current.date}`;
	} else {
		titleText3 = current.chart;
	}

	if (current.monthView){
		titleText3 += `     ${current.month}-${current.year}`;
	}

    if (mainChart){ // Clear the chart:
        mainChart.destroy();
    }

	// Here we build the chart. Chart is an object class from the chart.js library that takes two parameters: the canvas the chart will be drawn on, and an object containing various configuration options for the chart.

	mainChart = new Chart(chartCanvas, {
		type: 'bar',
		data: { // The data to be displayed in the chart. Labels are the timeframes of the data (days of week, hours of day, etc, and the datasets are constructed from the sorted data tables produced in the beginning of this function.)
			labels: labels,
			datasets: datasets,
		},
		options: { // Various configuration options for the chart.
			scales: {
                x: {
                    stacked: (current.data[0].includes('Choice') || current.data[0].includes('completion')) // Enables stacking the bars for choice data and completion data.
                },
				y: {
					type: 'linear',
					position: 'left',
					beginAtZero: true, // Starts the chart at zero rather than the minimum of the dataset
					suggestedMax: 10, // The chart axis will be at minimum 10 units 
                    stacked: (current.data[0].includes('Choice') || current.data[0].includes('completion')) , // Enables stacking the bars for choice data and completion data.
					title: { // Options for the y-axis title
						display: true, 
						text: stats[current.data[0]].unit,
						padding: {
							bottom: 15
						}
					}
				}
			},
			plugins: { // Configuration options for other parts of the chart
				title: { // Options for the chart title
					display: true,
					text: `${titleText1} of ${titleText2} by ${titleText3}`,
					padding: {
						bottom: 20
					}
				},
				legend: { // Options for the chart legend
					position: 'bottom'
				}
			},
			mantainAspectRatio: false
		}
	});
}
           
// generateOverview creates the side panel data based on the overviewData object created in generateChart. If more than one chart is being shown butons will be made visible to cycle through them.
function generateOverview(exhibit, type){
	const overviewSet = overviewData[exhibit.ID][type]; // Get the overview data set for the current exhibit and data.

	//Convert the max, total, and average data into seconds, minutes, or hours:
	const max = reduceUnit(overviewSet.max, cleanUnit(type));
	const total = reduceUnit(overviewSet.total, cleanUnit(type));
	const avg = reduceUnit(overviewSet.avg, cleanUnit(type));

	// Display the current exhibit name (or nickname, if there is one) and data type
	$('#overviewExhibit').html(exhibit.nickname ? exhibit.nickname : exhibit.name);
	$('#overviewType').html(stats[type].name.replace('imum', '').replace('Total ', '').replace('Session ', ''));

	// Create buttons to cycle through the exhibits and data types currently displayed in the chart, if there is more than one:
	$('#overviewExhibitButton').css('visibility', current.exhibit.length > 1 ? 'visible' : 'hidden');
	$('#overviewExhibitButton').off('click');
	$('#overviewExhibitButton').click(() => {generateOverview(current.exhibit[(current.exhibit.indexOf(exhibit) + 1) % current.exhibit.length], type)});

	$('#overviewTypeButton').css('visibility', current.data.length > 1 ? 'visible' : 'hidden');
	$('#overviewTypeButton').off('click');
	$('#overviewTypeButton').click(() => {generateOverview(exhibit, current.data[(current.data.indexOf(type) + 1) % current.data.length])});

	// Build the text to be displayed in the overview: 
	let dataText = `<b>Maximum:</b><br>${overviewSet.maxEntry}<br>${max.data} ${max.unit}
	                <br><br>
	                <b>Average:</b><br>${avg.data} ${avg.unit}<br><br>`;
	if (type != 'avgDwell' && type != 'maxDwell' && type != 'avgDuration' && type != 'maxDuration' && !type.includes('Engagement')){ // Exclude 'total' data from types that it does not make sense for (e.g. total average is meaningless).
		dataText += `<b>Total:</b><br>${total.data} ${total.unit}<br><br>`;
	}
	if (type.includes('Choice')){ // If the current data type is choice data, build that text.
		dataText += `<b>Top Choice:</b><br>${overviewSet.maxChoiceType}<br>${overviewSet.maxChoiceCount} choices<br><br>`
	} 
	if (type == 'completion'){ // If the current data type is choice data, build that text.
		dataText += `<b>Completion Rate:</b><br>${overviewSet.completionRate}%<br><br>`
	}
			
	$('#overviewData').html(dataText);
}

// generatePopout creates the chart and text for the popout when clicking on a bar.

function generatePopout(event){
	// Get the response from clicking on the chart and confirm that a bar was clicked on:
		const response = mainChart.getElementsAtEventForMode( 
    		event,
   			'nearest',
    		{ intersect: true },
    		true
  		);

  		if (response.length == 0) { //The chart was clicked outside of one of the bars, so the popup will not come up.
    		return;
  		}

		const clickedBar = response[0];

		clickedBar.datasetIndex /= current.stacks;
		clickedBar.datasetIndex = Math.floor(clickedBar.datasetIndex);


		// Set css styles to gray out the background:

		$('#chartDiv').css('opacity', 0.5).css('background-color', '#7a7b7e'); 
		$('#overviewDiv').css('opacity', 0.5).css('background-color', '#7a7b7e'); 
		$('#popoutDiv').css('display', 'block');
		$('#grayoutDiv').css('display', 'block');

		// Get the timeframe of the clicked bar:
		let timeframe = current.sortedData[clickedBar.datasetIndex].timeframe[clickedBar.index];
		if (current.chart == 'dateOverYear'){//Timeframe for the date over year graph is only given as a year, so the date must be appended.
			timeframe += `-${current.date}`;
		}

		// Get the month and year if we are in month view:
		let monthframe;
		if (current.monthView){
			monthframe = current.sortedData[clickedBar.datasetIndex].monthframe;
		}

		// Determine the exhibit that was clicked on:
		const clickedExhibit = Math.floor(clickedBar.datasetIndex / current.data.length);
		const exhibit = current.exhibit[clickedExhibit];

		// Build title text for the popout:
		let popoutTitle = `Full data for ${exhibit.name} during ${timeframe}`;
		if (current.monthView && current.chart != 'date'){
			popoutTitle += ` in ${current.month}-${current.year}`;
		}

		// Get the table with the data for the selected timeframe:
		let popoutTable = exhibit.table.filterTable(timeframe);
		if (current.monthView){
			popoutTable = popoutTable.filterTable(monthframe, 'month');
		}

		// Calculate total and active time in the selected timeframe:
		const totalTime = secondsInTimeframe(timeframe) * popoutTable.dayCount();
		const activeTime = popoutTable['totalActivation'];
		const idleTime = totalTime - activeTime;

		const idlePercent = Math.round(idleTime/totalTime * 100);
		const activePercent = Math.round(activeTime/totalTime * 100);

		let data; // Holds data for the popout chart.

		if (exhibit.types.includes('dwellVideo')){ // For dwell video exhibits, we can calculate the time the exhibit was active but no one was in front of it:
			const dwellTime = popoutTable['totalDwell'];
			const activeNonDwell = activeTime - dwellTime;
			const dwellPercent = Math.round(dwellTime/totalTime * 100); 
			const nonDwellPercent = Math.round(activeNonDwell/totalTime * 100);
			data = {labels: [`Dwell Time (${dwellPercent}%)` , `Active Non-Dwell Time (${nonDwellPercent}%)`, `Idle Time (${idlePercent}%)`], datasets: [{data:[dwellTime, activeNonDwell, idleTime], backgroundColor: [colors[0], colors[1], '#7a7b7e']}]};
		}

		else {
			data = {labels: [`Active Time (${activePercent}%)`, `Idle Time (${idlePercent}%)`], datasets: [{data:[activeTime, idleTime], backgroundColor: [colors[0], '#7a7b7e']}]};
		}

		$('#popoutTitle').html(popoutTitle); 

		if (popoutChart){ // Clear the popout chart.
			popoutChart.destroy();
		}


		// Here we create the popout chart:
		popoutChart = new Chart(popoutCanvas, {
			type: 'pie',
			data: data,
			options: {
				plugins: {
					tooltip: {
						callbacks: { // Change the tooltip to show the time for each portion:
							label: function(tooltipItem){
								let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.dataIndex];
								value = reduceUnit(value, 'seconds');
										
								return `${value.data} ${value.unit}`;
							}
						}
					}
				}
			}
		});

		// Build the text to be displayed in the popout:
		let dataText = '';
		console.log(exhibit.stats)
		for (const data of exhibit.stats){
			if (data.includes('Choice')){
				const choiceString = data.replace(/([a-z])([A-Z])/g, '$1 $2');
				const choiceStringArray = choiceString.split(' ');
				choiceStringArray.pop();
				dataText += `Top ${choiceStringArray.map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ')}: ${popoutTable[`top${data}`]} (${popoutTable[`top${data}Count`]} choices)<br><br>`;
			} else {
				let dataUnit = cleanUnit(data);
				let reducedUnits = reduceUnit(popoutTable[data], dataUnit)
				
				dataText += `${stats[data].name}: ${reducedUnits.data} ${reducedUnits.unit}<br><br>`;
			}
		}

		$('#popoutData').html(dataText);

		
		if (current.chart == 'date'){ //Displays a button for date over year chart if popout is for a date
			current.date = `${timeframe.split('-')[1]}-${timeframe.split('-')[2]}`;
			$('#YoYButton').css('visibility', 'visible');
		}
	}