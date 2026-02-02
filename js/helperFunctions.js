/* ~~~ helperFunctions.js ~~~
 *
 * Author: Jonesy
 * Project: Exhibit Data Visualization
 * Last updated: 1/29/2026
 * 
 * This file contains miscellaneous functions for use in other scripts for data visualization.
 * 
 */


// cleanUnit takes a data type and returns a shortened version of its full name
function cleanUnit(type){
	return stats[type].unit.replace('(', '').replace(')', '').replace('Time ', '').replace('# ', '').replace('Times chosen', 'choices').replace('Sessions', 'completions');
}

function camelSplit(string){
	const stringSplit = string.replace(/([a-z])([A-Z])/g, '$1 $2');
	const stringArray = stringSplit.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1));
	return stringArray.join(' ');
}

// timeInSeconds takes the 'time' property of a data element as an input and returns that time in seconds, for ease of comparison.
// the time is in the format HH:MM:SS and must be split first.
function timeInSeconds(time){
	const timeSplit = time.split(':').map(num => Number(num));
	return timeSplit[0] * 3600 + (timeSplit[1] * 60) + timeSplit[2];
}

// daysInMonth returns the number of days in a given month.
function daysInMonth(year, month){
    return new Date(year, month, 0).getDate();
}

// secondsIntimeFrame takes a timeframe (day, date, etc) and returns the total amount of seconds in that timeframe.
function secondsInTimeframe(timeframe){
	let seconds;

	if (current.chart == 'date' || current.chart == 'dateOverYear'){
		const day = dayNames[new Date(timeframe).getDay()];
		seconds = 60 * 60 * ((day == 'Wednesday') ? 6 : 8);
	}
	else if (current.chart == 'day'){
		seconds = 60 * 60 * ((timeframe == 'Wednesday') ? 6 : 8);
	}
	else if (current.chart == 'hour' || current.chart == 'dayAndHour'){
		seconds = 60 * 60;
	}

	return seconds;
}

// getTotal sums the values in an array
function getTotal(array){
	return array.reduce((arrayCounter, arrayTotal) => arrayCounter + arrayTotal, 0);
}

// reduceUnit takes a data value and its associated unit. If it is in seconds and greater than 120, it will be converted to minutes. This is repeated for minutes to hours.
function reduceUnit(data, unit){
	if (unit == 'seconds' && data > 120){
			data /= 60;
			data = parseFloat(data.toFixed(2));
			unit = 'minutes';
		}

	if (unit == 'minutes' && data > 120){
		data /= 60;
		data = parseFloat(data.toFixed(2));
		unit = 'hours';
	}
	return {data: data, unit: unit} //The new value is returned as an object with data and unit properties.
}
			
// nameList takes an array of values and returns the full names of those values in a list for display in titles.
function nameList(array, object = null){
	let text = '';
	for (const [index, entry] of array.entries()){
		if (index != 0 && index != array.length - 1){
			text += ', ';
		}
		if (array.length != 1 && index == array.length - 1){
			text += ' and ';
		}
		let name;
		if (!object){
			name = entry.name;
		} else {
			name = object[entry].name
		}
		text += name;
	}
	return text;
}


