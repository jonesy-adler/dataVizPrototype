/* ~~~ tableClass.js ~~~
 *
 * Author: Jonesy
 * Project: Exhibit Data Visualization
 * Last updated: 1/29/2026
 * 
 * Table class definition:
 * 
 * A Table object is generated for each exhibit. This contains all data drawn from the SQL tables,
 * and various methods for sorting the data in different ways. Each time a table is filtered into a given time frame, 
 * a new Table object will also be created holding data in that time frame.
 * 
 */

class Table {
    constructor(data, exhibit){ //The constructor method is run when the table object is created and will assign some basic properties.
        this.exhibit = exhibit;
        this.tables = [];
        for (let table in data){
            this.tables.push(table);
            this[table] = {
                data: data[table],
                count: data[table].length, //The number of entries in the data.
            } 

            if (this[table].count){ 
                this.startingMonth = this[table].data[0].date.split('-')[1]; //The first month of the first year represented in the data.
                this.startingYear = this[table].data[0].date.split('-')[0]; //The first year represented in the data.
                this.endingMonth = this[table].data[this[table].count - 1].date.split('-')[1]; //The last month of the last year represented in the data.
			    this.endingYear = this[table].data[this[table].count - 1].date.split('-')[0]; //The last year represented in the data.
            }
		}

        for (const type of exhibit.types){
            this[`${type}Data`](); //Each exhibit type has a Data method associated with it to calculate the various statistics specific to that exhibit.
        }
    }


	// The filterTable method returns a new table object with all entries in the given time range.
	// The first parameter is the timeframe to be filtered for, the second parameter is the type of timeframe, with a default from the 'current' object.
	filterTable(timeframe, type = current.chart){
        const data = {};
        
		if (type == 'date' || type == 'dateOverYear'){
            for (const table of this.tables){
                data[table] = this[table].data.filter(entry => entry.date == timeframe);
            }
			return new Table(data, this.exhibit);
		}

		else if (type == 'day'){
            for (const table of this.tables){
                data[table] = this[table].data.filter(entry => dayNames[new Date(entry.date).getDay()] == timeframe);
            }
			return new Table(data, this.exhibit);
		}
        
		else if (type == 'hour'){
            for (const table of this.tables){
                data[table] = this[table].data.filter(entry => `${entry.time.split(':')[0]}:00` == timeframe);
            }
			return new Table(data, this.exhibit);
		}

		else if (type == 'month'){
            for (const table of this.tables){
                data[table] = this[table].data.filter(entry => entry.date.split('-')[0] == timeframe[0] && entry.date.split('-')[1] == String(timeframe[1]).padStart(2, '0'));
            }
			return new Table(data, this.exhibit);
		}
        
		else if (type == 'dayAndHour'){
			return this.filterTable(timeframe[0], 'day').filterTable(timeframe[1], 'hour');
        }
	}

	// The dayCount method returns the number of unique days represented in the table.
	dayCount(){
		let currentDay;
		let count = 0;
		for (const entry of this[this.tables[0]].data){
			if(entry.date == currentDay){
				continue;
			}
			currentDay = entry.date;
			count++;
		}
		return count;
	}

    // Data methods:
    // A data method is defined for each exhibit type. These methods will handle doing calculations on the table data to obtain the various statistics actually displayed in the visualization.

    // basicData calculates the total number of sessions in the table, as well as average, total, and max session duration. If the exhibit is completable, the amount of completed sessions will be calculated as well.
    basicData(){
        this.count = this['sessionData'].count;
		this.maxDuration = 0;
		this.totalActivation = this['sessionData'].data.reduce((total, entry) => {
			if (entry.duration > this.maxDuration){
				this.maxDuration = entry.duration;
			}
			return total + entry.duration;
		}, 0);

		this.avgDuration = (this.count == 0) ? 0 : parseFloat((this.totalActivation / this.count).toFixed(2));

        if (this.exhibit.completable){
            this.completion = this['sessionData'].data.filter(entry => entry.completed).length;
        }
        
    }

				
	// dwellData calculates and assigns statistics about dwell video exhibits. It will calculate number of sessions in the table, as well as average, total, and max session duration.
    dwellVideoData(){
        this.count = this['videoActivationDwells'].count;
        this.totalActivation = this.exhibit.videoLength * this.count;

        let dwellLength = 5; //The sensor first sends a signal after it is active for five seconds, so the minimum dwell length is five.
		let dwellStart, dwellDate;
		let previousDwellTime;

        const dwellData = [];

        // Parse the allDwells table into sessions by finding the time interval between each entry, and adding them together if they are within ten seconds.
                    
		for (const entry of this['allDwells'].data){
			if (!dwellStart){
				dwellStart = entry.time;
                dwellDate = entry.date;
            }

			let currentDwellTime = timeInSeconds(entry.time);
			if (previousDwellTime){
				let dwellInterval = currentDwellTime - previousDwellTime;
				if (dwellInterval < 10 && entry.date == dwellDate){
					dwellLength += dwellInterval;
				} 

                else {
                    dwellData.push(dwellLength);
                    dwellStart = entry.time;
                    dwellLength = 5;
                    dwellDate = (entry.date != dwellDate) ? entry.date : undefined;
                } 

			}

			previousDwellTime = currentDwellTime;
		}

        const noDwell = (dwellData.length == 0); //If there is no dwell data, the dwell statistics will all be set to 0.
                    
        this.totalDwell = noDwell ? 0 : getTotal(dwellData); //Total dwell time over the time period of the table.
        this.avgDwell = noDwell ? 0 : parseFloat((this.totalDwell/ dwellData.length).toFixed(2)); //Average dwell time over the time period of the table.
        this.maxDwell = noDwell ? 0 : Math.max(...dwellData); //Maximum dwell time over the time period of the table.
    }

    engagementData(){
        for (const engagementType of this.exhibit.engagement){
            if (!this.exhibit.stats.includes(`${engagementType.stat}Engagement`)){
                this.exhibit.stats.push(`${engagementType.stat}Engagement`);
            }
            if (!(engagementType.stat in stats)){
                stats[`${engagementType.stat}Engagement`] = {name: 'Average ' + camelSplit(engagementType.stat), unit: engagementType.unit}
            }

            const engagementData = this['engagement'].data.map(entry => entry[engagementType.stat]);
            this[`${engagementType.stat}Engagement`] = (engagementData.length == 0) ? 0 : parseFloat((getTotal(engagementData) / engagementData.length).toFixed(2));
        }
    }

    // choiceData creates an object property of the table for each choice defined for the exhibit in its json config file. It will find all choice options and calculate how many times each was chosen in the table data.
	choiceData(){
        for (const choice of this.exhibit.choices){
            this[`${choice}ChoiceData`] = {};
            if(!this.exhibit[`${choice}ChoiceDataOptions`]){ // If the associated exhibit does not have an array of options for this choice, create it.
                this.exhibit[`${choice}ChoiceDataOptions`] = [];
            }
            for (const entry of this[`${choice}Choice`].data){
                if(!this.exhibit[`${choice}ChoiceDataOptions`].includes(entry[choice])){ // If the chosen option does not exist in the array associated with the choice for this exhibit, add it. 
                    this.exhibit[`${choice}ChoiceDataOptions`].push(entry[choice]);
                }
                if (!this[`${choice}ChoiceData`][entry[choice]]){ // If this option has not been chosen yet in the data, set its counter to 0.
                    this[`${choice}ChoiceData`][entry[choice]] = 0;
                }
                this[`${choice}ChoiceData`][entry[choice]]++; // Add to the option's counter every time it is chosen.
            }
            this.exhibit[`${choice}ChoiceDataOptions`].sort(); // Sort the options alphabetically so they always are presented in the same order.

            this[`top${choice}ChoiceDataCount`] = Math.max(...Object.values(this[`${choice}ChoiceData`])); // Find the count of the highest chosen option.

            this[`top${choice}ChoiceData`] = this.exhibit[`${choice}ChoiceDataOptions`].find(choiceType => this.exhibit[`${choice}ChoiceDataOptions`][choiceType] == this[`top${choice}Count`]); // Find the option that matches the highest choice.
        }
	}
	

	// The sort method will sort the data into different time categories (ie days of the week, hours of the day).
	// The method will return an object containing an array of the data in each category and the timeframe each entry in the data array corresponds to.
    sort(){
        const sortedData = {data: [], timeframe: []};

        const data = (current.monthView && current.chart != 'dateOverYear') ? this.filterTable([current.year, current.month], 'month') : this;

        if (current.chart == 'date'){
            for (let year = this.startingYear; year <= this.endingYear; year++){
                for (let month = 1; month <= 12; month++){
					if (year == this.endingYear && month > this.endingMonth){
						break;
					}
                    if (!current.monthView || current.month == month){
                        for (let day = 1; day <= daysInMonth(year, month); day++){
                            let date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            sortedData.timeframe.push(date);
                            sortedData.data.push(data.filterTable(date));
                        }
                    }
                }
            }

            for (const [index, date] of sortedData.data.entries()){
                if (date.count != 0){
                    sortedData.timeframe = sortedData.timeframe.slice(index);
                    sortedData.data = sortedData.data.slice(index);
                    break;
                }
            }
        } 

        else if (current.chart == 'day'){
            for (const day of dayNames){
                sortedData.timeframe.push(day);
                sortedData.data.push(data.filterTable(day));
            }
        } 

        else if (current.chart == 'hour'){
        for (const hour of hours){
                sortedData.timeframe.push(hour);
                sortedData.data.push(data.filterTable(hour));                        
            }
        } 

        else if (current.chart == 'dayAndHour'){
            for (const [index, hour] of hours.entries()){
                if (current.day == 'Wednesday' && index < 7){
                    continue;
                }
                if (current.day != 'Wednesday' && index > 6){
                    break;
                }
                sortedData.timeframe.push([current.day, hour]);
                sortedData.data.push(data.filterTable([current.day, hour]));
            }
        }

		else if (current.chart == 'dateOverYear'){
			for (let year = this.startingYear; year <= this.endingYear; year++){
				let yearData = data.filterTable(`${year}-${current.date}`);
				if (yearData.count){
					sortedData.timeframe.push(year);
					sortedData.data.push(yearData);
				}
			}
		}

		if (current.monthView){ // If we are in month view, create a property of the sorted data containing the current year and month
			sortedData.monthframe = [current.year, current.month];
		}

        return sortedData;
    }
}