/* ~~~ globals.js ~~~
 * 
 * Author: Jonesy
 * Project: Exhibit Data Visualization
 * Last updated: 1/29/2026
 * 
 * This file contains global variables for reference for the exhibit data visualization project.
 * 
 */


const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']; // Array of names of days for indexing and iterating through
const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']; // Array of museum open hours for indexing and iterating through

const stats = { //Axis labels and unit names for each data type
    'count': {name: 'Activation Count', unit: '# Activations'}, 
    'totalActivation': {name: 'Total Activation Time', unit: 'Time (seconds)'}, 
    'totalDwell': {name: 'Total Dwell Time', unit: 'Time (seconds)'}, 
    'avgDwell': {name: 'Average Dwell Time', unit: 'Time (seconds)'}, 
    'maxDwell': {name: 'Maximum Dwell Time', unit: 'Time (seconds)'},
    'avgDuration': {name: 'Average Session Duration', unit: 'Time (seconds)'},
    'maxDuration': {name: 'Max Session Duration', unit: 'Time (seconds)'},
    'completion': {name: 'Sessions Completed', unit: '# Sessions'}
};


const galleryList = [ // List of galleries represented in the data by ID and full name
    {id: 'OW', name: 'Other Worlds'},
    {id: 'PXP', name: 'PXP'}, 
    {id: 'WTST', name: 'Walk Through Space and Time'}, 
    {id: 'TS', name: 'Telescopes'},
    {id: 'MM', name: 'Mission Moon'}
]; 

const colors = ['#ffce34', '#bfd730', '#4C1720']; //Iteratable colors for graphs

let mainChart, popoutChart; //Holds the main and popout charts for reference


let exhibits; //Array holding exhibit class objects
const overviewData = {}; //Object holding overview data for side panel

const current = { //Stores information about the currently displayed chart
	chart: 'date', //Current time division time is displayed over
	day: 'Monday', //Current day of week for dayAndHour display
	monthView: false, //Boolean value determining if data is filtered by month
}; 
    