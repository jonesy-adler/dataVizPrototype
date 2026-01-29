const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

export function sortByDate(data){
				let currentDate = '';
				const arrayByDate = {};
				data.forEach(entry => {
					if (entry.date != currentDate){
						currentDate = entry.date;
						arrayByDate[currentDate] = [];
					}
					
					arrayByDate[currentDate].push(entry);
				});
				return arrayByDate;
			}

			export function sortByDay(data){
				const arrayByDay = {};
				dayNames.forEach(day => {
					arrayByDay[day] = [];
				});

				data.forEach(entry => {
					let day = new Date(entry.date).getDay();
					arrayByDay[dayNames[day]].push(entry);
				});
				return arrayByDay;
			}

			export function sortByHour(data){
				const arrayByHour = {}
				hours.forEach(hour => {
					arrayByHour[hour] = [];
				});

				data.forEach(entry => {
					let hour = entry.time.split(':')[0];
					if (hour >=9 && hour <= 21){
						arrayByHour[`${hour}:00`].push(entry);
					}

				});
				return arrayByHour;
			}

			function filterByMonth(data){
				const monthData = {};
				for (const category in data){
					monthData[category] = [];
					data[category].forEach((entry, index) => {
						if (data[category][index].date.split('-')[0] == current.year && data[category][index].date.split('-')[1] == current.month){
							monthData[category].push(entry);
						}
					});
					if (monthData[category].length == 0){
						delete monthData[category];
					}
				}
				return monthData;
			}

			function getData(exhibit, table, axis='left', backgroundColor='rgba(0, 0, 255, 1)'){
				const label = `${exhibit} ${table}`;
				let data;
				let dataCount;
				let max;
				if (current.chart == 'byDayAndHour'){
					data = exhibitData[exhibit][table][currentDay].byHour;
					dataCount = Object.values(data).map(item=>item.length);

					const dayMax = [];

					dayNames.forEach(day => {
						let datacheck = exhibitData[exhibit][table][day].byHour;
						dayMax.push(Math.max(...Object.values(datacheck).map(item=>item.length)));
					});

					max = Math.max(...dayMax);

				} else {
					data = exhibitData[exhibit][table][current.chart];
					dataCount = Object.values(data).map(item=>item.length);
					max = Math.max(...dataCount);
				}


				if (monthView){
					data = filterByMonth(data);
					dataCount = Object.values(data).map(item=>item.length);
				}

				let dataset = {label: label, data: dataCount, backgroundColor: backgroundColor, yAxisID: `${axis}Axis`};

				return {labels: Object.keys(data), set: dataset, max: max};
			}

			export function generateChart(){
				let data = getData(current.exhibit, currentTable);
				const datasets = [data.set]; 

				let leftMax = data.max;
				let rightMax = 0;

				if (allExhibits){
					exhibitNames.slice(1).forEach((exhibit, index) => {
						let data = getData(exhibit, currentTable, 'left', `rgba(${50 + index * 100}, ${100 + index*50}, 255)`)
						datasets.push(data.set);
						if (data.max > leftMax){
							leftMax = data.max;
						}
					});
					
					if (doubleChart){
						exhibitNames.forEach((exhibit, index) => {
							let data = getData(exhibit, tableNames[1], 'right', `rgba(255, ${230 - index * 50}, ${index * 100})`);
							datasets.push(data.set);
							if (data.max > rightMax){
								rightMax = data.max;
							}
						});
					}
				}

				else if (doubleChart){
					data = getData(current.exhibit, tableNames[1], 'right', 'rgba(255, 230, 1)');
					datasets.push(data.set);
					rightMax = data.max;
				}
				

				if (chart){
					chart.destroy();
				}


				chart = new Chart(canvas, {
					type: 'bar',
					data: {
						labels: data.labels,
						datasets: datasets,
					},
					options: {
						scales: {
							'leftAxis': {
								type: 'linear',
								position: 'left',
								beginAtZero: true,
								suggestedMax: leftMax
							},
							'rightAxis': {
								type: 'linear',
								position: 'right',
								beginAtZero: true,
								display: false,
								suggestedMax: rightMax,
								grid: {
									drawOnChartArea: false,
								}
							}
						},
						plugins: {
							title: {
								display: true,
								text: (monthView) ? `${current.month}-${current.year}` : ""
							}
						}
					}
				});

				if (doubleChart){
					chart.options.scales['rightAxis'].display = true;
					chart.update();
				}

			}